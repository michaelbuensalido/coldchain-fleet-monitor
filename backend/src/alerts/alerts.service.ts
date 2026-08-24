import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  formatIncidentRange,
} from '../health/incident-duration';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async createAlert(
    vehicleId: string,
    severity: 'info' | 'warning' | 'critical',
    type: 'status_change' | 'temperature_excursion' | 'connectivity_loss',
    message: string,
    statusEventId?: string,
  ) {
    const autoResolved = severity === 'info';

    return this.prisma.alert.create({
      data: {
        vehicleId,
        statusEventId,
        severity,
        type,
        message,
        acknowledged: autoResolved,
        acknowledgedAt: autoResolved ? new Date() : null,
        acknowledgedBy: autoResolved ? 'system' : null,
      },
      include: {
        vehicle: true,
        statusEvent: true,
      },
    });
  }

  async markAlertsRecovered(
    vehicleId: string,
    recoveredAt: Date,
    durationSeconds: number,
    minor: boolean,
  ) {
    const openAlerts = await this.prisma.alert.findMany({
      where: {
        vehicleId,
        acknowledged: false,
        statusEvent: {
          toStatus: { in: ['degraded', 'offline'] },
        },
      },
      include: { statusEvent: true },
    });

    for (const alert of openAlerts) {
      await this.prisma.alert.update({
        where: { id: alert.id },
        data: {
          durationSeconds,
          recoveredAt,
          minor,
          acknowledged: minor,
          acknowledgedAt: minor ? recoveredAt : null,
          acknowledgedBy: minor ? 'system' : null,
        },
      });

      if (alert.statusEventId) {
        await this.prisma.statusEvent.update({
          where: { id: alert.statusEventId },
          data: {
            acknowledged: minor,
            acknowledgedAt: minor ? recoveredAt : null,
            acknowledgedBy: minor ? 'system' : null,
            minor,
            durationSeconds,
          },
        });
      }
    }
  }

  async finalizeIncident(
    vehicleId: string,
    params: {
      durationSeconds: number | null;
      startedAt: Date | null;
      recoveredAt: Date;
      minor: boolean;
      fromStatus: string;
      rangeLabel: string | null;
    },
  ) {
    const openAlert = await this.prisma.alert.findFirst({
      where: {
        vehicleId,
        acknowledged: false,
        statusEvent: {
          toStatus: { in: ['degraded', 'offline'] },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { statusEvent: true },
    });

    const rangeLabel =
      params.rangeLabel ||
      (params.startedAt && params.durationSeconds != null
        ? formatIncidentRange(params.fromStatus, params.startedAt, params.recoveredAt, params.durationSeconds)
        : null);

    const suffix = [
      rangeLabel,
      params.minor ? 'Minor, self-resolved' : null,
    ]
      .filter(Boolean)
      .join('. ');

    if (openAlert) {
      await this.prisma.alert.update({
        where: { id: openAlert.id },
        data: {
          durationSeconds: params.durationSeconds,
          recoveredAt: params.recoveredAt,
          minor: params.minor,
          message: suffix ? `${openAlert.message}. ${suffix}` : openAlert.message,
          acknowledged: params.minor,
          acknowledgedAt: params.minor ? params.recoveredAt : null,
          acknowledgedBy: params.minor ? 'system' : null,
        },
      });

      if (openAlert.statusEventId) {
        await this.prisma.statusEvent.update({
          where: { id: openAlert.statusEventId },
          data: {
            acknowledged: params.minor,
            acknowledgedAt: params.minor ? params.recoveredAt : null,
            acknowledgedBy: params.minor ? 'system' : null,
            minor: params.minor,
            durationSeconds: params.durationSeconds,
          },
        });
      }
    }
  }

  async listAlerts(limit = 50) {
    return this.prisma.alert.findMany({
      include: {
        vehicle: true,
        statusEvent: true,
      },
      orderBy: [{ acknowledged: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async listUnacknowledgedAlerts() {
    return this.prisma.alert.findMany({
      where: { acknowledged: false },
      include: {
        vehicle: true,
        statusEvent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlert(id: string) {
    return this.prisma.alert.findUnique({
      where: { id },
      include: {
        vehicle: true,
        statusEvent: true,
      },
    });
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string) {
    const now = new Date();
    const alert = await this.prisma.alert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy,
      },
      include: {
        vehicle: true,
        statusEvent: true,
      },
    });

    if (alert.statusEventId) {
      await this.prisma.statusEvent.update({
        where: { id: alert.statusEventId },
        data: {
          acknowledged: true,
          acknowledgedAt: now,
          acknowledgedBy,
        },
      });
    }

    return alert;
  }

  async acknowledgeAll(acknowledgedBy: string) {
    const now = new Date();
    const open = await this.prisma.alert.findMany({
      where: { acknowledged: false },
      select: { id: true, statusEventId: true },
    });

    await this.prisma.alert.updateMany({
      where: { acknowledged: false },
      data: {
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy,
      },
    });

    const eventIds = open
      .map((row) => row.statusEventId)
      .filter((id): id is string => Boolean(id));

    if (eventIds.length > 0) {
      await this.prisma.statusEvent.updateMany({
        where: { id: { in: eventIds } },
        data: {
          acknowledged: true,
          acknowledgedAt: now,
          acknowledgedBy,
        },
      });
    }

    return { count: open.length };
  }

  async clearAlertsByType(
    vehicleId: string,
    statusType: 'degraded' | 'offline',
  ) {
    // Find alerts associated with the specified status type
    const alertsToClear = await this.prisma.alert.findMany({
      where: {
        vehicleId,
        acknowledged: false,
        statusEvent: {
          toStatus: statusType,
        },
      },
      include: { statusEvent: true },
    });

    // Delete these alerts since a more severe state has taken over
    for (const alert of alertsToClear) {
      await this.prisma.alert.delete({
        where: { id: alert.id },
      });
    }

    return { count: alertsToClear.length };
  }

  async clearUnresolvedAlerts(vehicleId: string) {
    // Find all unresolved alerts for this vehicle
    const alertsToClear = await this.prisma.alert.findMany({
      where: {
        vehicleId,
        acknowledged: false,
      },
    });

    // Delete these alerts to prevent duplicates when status changes
    for (const alert of alertsToClear) {
      await this.prisma.alert.delete({
        where: { id: alert.id },
      });
    }

    return { count: alertsToClear.length };
  }
}
