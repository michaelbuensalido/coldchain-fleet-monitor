import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createAlert(
    vehicleId: string,
    severity: 'info' | 'warning' | 'critical',
    type: 'status_change' | 'temperature_excursion' | 'connectivity_loss',
    message: string,
  ) {
    // Informational events are recorded as already resolved so they don't
    // inflate the unresolved banner (e.g. first check-in).
    const autoResolved = severity === 'info';

    const existing = await this.prisma.alert.findFirst({
      where: { vehicleId, type, acknowledged: false },
    });

    if (existing) {
      return this.prisma.alert.update({
        where: { id: existing.id },
        data: autoResolved
          ? {
              severity,
              message,
              acknowledged: true,
              acknowledgedAt: new Date(),
              acknowledgedBy: 'system',
            }
          : { severity, message },
        include: { vehicle: true },
      });
    }

    return this.prisma.alert.create({
      data: {
        vehicleId,
        severity,
        type,
        message,
        acknowledged: autoResolved,
        acknowledgedAt: autoResolved ? new Date() : null,
        acknowledgedBy: autoResolved ? 'system' : null,
      },
      include: {
        vehicle: true,
      },
    });
  }

  async listAlerts(limit = 50) {
    return this.prisma.alert.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async listUnacknowledgedAlerts() {
    return this.prisma.alert.findMany({
      where: { acknowledged: false },
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlert(id: string) {
    return this.prisma.alert.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string) {
    return this.prisma.alert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
  }

  async acknowledgeAll(acknowledgedBy: string) {
    return this.prisma.alert.updateMany({
      where: { acknowledged: false },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
  }

  async resolveOpenAlerts(
    vehicleId: string,
    types: Array<'status_change' | 'temperature_excursion' | 'connectivity_loss'>,
  ) {
    return this.prisma.alert.updateMany({
      where: {
        vehicleId,
        acknowledged: false,
        type: { in: types },
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: 'system',
      },
    });
  }
}
