import { Controller, Get, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import {
  classifyEventType,
  EVENT_TYPE_LABELS,
  EventType,
  isVehicleStatus,
} from './event-type';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Controller('events')
@UseGuards(AdminJwtGuard)
export class EventsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getEvents(
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const parsedLimit = parseInt(limit || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
    const limitNum = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.StatusEventWhereInput = {};

    if (vehicleId && vehicleId !== 'all') {
      where.vehicleId = vehicleId;
    }

    this.applyStatusFilter(where, status);

    if (from || to) {
      const timestamp: Prisma.DateTimeFilter = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          timestamp.gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          timestamp.lte = toDate;
        }
      }
      if (timestamp.gte || timestamp.lte) {
        where.timestamp = timestamp;
      }
    }

    if (acknowledged === 'true') {
      where.acknowledged = true;
    } else if (acknowledged === 'false') {
      where.acknowledged = false;
    }

    const [rows, total] = await Promise.all([
      this.prisma.statusEvent.findMany({
        where,
        include: {
          vehicle: { select: { name: true } },
          alerts: { select: { type: true }, take: 1 },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.statusEvent.count({ where }),
    ]);

    const events = rows.map((event) => {
      const eventType = classifyEventType(
        event.fromStatus,
        event.toStatus,
        event.reason,
        event.alerts[0]?.type,
      );
      return {
        id: event.id,
        vehicleId: event.vehicleId,
        vehicle: event.vehicle,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        reason: event.reason,
        timestamp: event.timestamp,
        durationSeconds: event.durationSeconds,
        acknowledged: event.acknowledged,
        acknowledgedAt: event.acknowledgedAt,
        acknowledgedBy: event.acknowledgedBy,
        minor: event.minor,
        eventType,
        eventLabel: EVENT_TYPE_LABELS[eventType],
      };
    });

    return {
      events,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    };
  }

  @Put(':id/acknowledge')
  async acknowledgeEvent(
    @Param('id') id: string,
    @Req() req: { admin?: { email?: string } },
  ) {
    const now = new Date();
    const adminEmail = req.admin?.email || 'admin';

    const event = await this.prisma.statusEvent.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy: adminEmail,
      },
    });

    await this.prisma.alert.updateMany({
      where: { statusEventId: id, acknowledged: false },
      data: {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy: adminEmail,
      },
    });

    return event;
  }

  private applyStatusFilter(where: Prisma.StatusEventWhereInput, status?: string) {
    if (!status || status === 'all') return;

    if (isVehicleStatus(status)) {
      where.toStatus = status;
      return;
    }

    const eventType = status as EventType;
    if (eventType === 'recovered') {
      where.toStatus = 'online';
      where.fromStatus = { in: ['degraded', 'offline'] };
      return;
    }
    if (eventType === 'first_checkin') {
      where.fromStatus = 'pending';
      return;
    }
    if (eventType === 'temperature_excursion') {
      where.OR = [
        { alerts: { some: { type: 'temperature_excursion' } } },
        { reason: { contains: 'temperature', mode: 'insensitive' } },
        { reason: { contains: 'Temperature', mode: 'insensitive' } },
      ];
      where.toStatus = 'degraded';
      return;
    }
    if (eventType === 'connectivity_lost') {
      where.OR = [
        { toStatus: 'offline' },
        { alerts: { some: { type: 'connectivity_loss' } } },
        {
          AND: [
            { toStatus: 'degraded' },
            {
              OR: [
                { reason: { contains: 'heartbeat', mode: 'insensitive' } },
                { reason: { contains: 'connectivity', mode: 'insensitive' } },
              ],
            },
          ],
        },
      ];
      return;
    }
    if (eventType === 'status_change') {
      where.fromStatus = { not: 'pending' };
      where.NOT = {
        AND: [
          { toStatus: 'online' },
          { fromStatus: { in: ['degraded', 'offline'] } },
        ],
      };
    }
  }
}
