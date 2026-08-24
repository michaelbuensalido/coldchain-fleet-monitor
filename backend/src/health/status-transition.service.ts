import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import {
  computeIncidentDurationSeconds,
  formatIncidentRange,
  isMinorSelfResolved,
} from './incident-duration';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'status_change' | 'temperature_excursion' | 'connectivity_loss';

@Injectable()
export class StatusTransitionService {
  constructor(
    private prisma: PrismaService,
    private alerts: AlertsService,
  ) {}

  async recordTransition(params: {
    vehicleId: string;
    vehicleName: string;
    fromStatus: string;
    toStatus: string;
    reason: string;
    alertSeverity?: AlertSeverity;
    alertType?: AlertType;
  }) {
    const now = new Date();
    const isRecovery =
      params.toStatus === 'online' &&
      (params.fromStatus === 'degraded' || params.fromStatus === 'offline');
    const isAlertWorthy = params.toStatus === 'degraded' || params.toStatus === 'offline';

    let durationSeconds: number | null = null;
    let incidentStartedAt: Date | null = null;
    let minor = false;

    if (isRecovery) {
      const prior = await this.prisma.statusEvent.findFirst({
        where: {
          vehicleId: params.vehicleId,
          toStatus: { in: ['degraded', 'offline'] },
        },
        orderBy: { timestamp: 'desc' },
      });
      if (prior) {
        incidentStartedAt = prior.timestamp;
        durationSeconds = computeIncidentDurationSeconds(prior.timestamp, now);
        minor = isMinorSelfResolved(params.fromStatus, durationSeconds);
      }
    }

    const rangeLabel =
      isRecovery && incidentStartedAt && durationSeconds != null
        ? formatIncidentRange(params.fromStatus, incidentStartedAt, now, durationSeconds)
        : null;
    const reason = rangeLabel ? `${params.reason}. ${rangeLabel}` : params.reason;

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.statusEvent.create({
        data: {
          vehicleId: params.vehicleId,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          reason,
          timestamp: now,
          durationSeconds,
          acknowledged: !isAlertWorthy,
          acknowledgedBy: isAlertWorthy ? null : 'system',
          acknowledgedAt: isAlertWorthy ? null : now,
          minor,
        },
      });

      await tx.vehicle.update({
        where: { id: params.vehicleId },
        data: { status: params.toStatus },
      });

      return created;
    });

    if (isAlertWorthy) {
      await this.alerts.createAlert(
        params.vehicleId,
        params.alertSeverity || 'warning',
        params.alertType || 'status_change',
        `${params.vehicleName} status changed from ${params.fromStatus} to ${params.toStatus}: ${params.reason}`,
        event.id,
      );
    } else if (params.fromStatus === 'pending' && params.toStatus === 'online') {
      await this.alerts.createAlert(
        params.vehicleId,
        'info',
        'status_change',
        `${params.vehicleName} status changed from pending to online: ${params.reason}`,
      );
    }

    if (isRecovery) {
      await this.alerts.finalizeIncident(params.vehicleId, {
        durationSeconds,
        startedAt: incidentStartedAt,
        recoveredAt: now,
        minor,
        fromStatus: params.fromStatus,
        rangeLabel,
      });
    }

    return {
      event,
      durationSeconds,
      minor,
      rangeLabel,
      degradedSince: params.toStatus === 'degraded' ? now.toISOString() : null,
    };
  }
}
