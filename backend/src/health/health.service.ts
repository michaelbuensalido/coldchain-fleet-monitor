import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis.service';
import { AlertsService } from '../alerts/alerts.service';
import { vehicleHealthMachine } from './health.machine';
import { createActor } from 'xstate';

@Injectable()
export class HealthSweepService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private alerts: AlertsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.runSweep(), 10000);
    void this.runSweep();
    console.log('Health Sweep worker started.');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runSweep() {
    try {
      const vehicles = await this.prisma.vehicle.findMany({
        include: { configProfile: true },
      });

      const redisClient = this.redis.getClient();

      for (const vehicle of vehicles) {
        if (vehicle.status === 'pending') {
          continue;
        }

        const lastSeenKey = `vehicle:${vehicle.id}:lastSeen`;
        const latestKey = `vehicle:${vehicle.id}:latest`;

        const lastSeenStr = await redisClient.get(lastSeenKey);
        const latestStr = await redisClient.get(latestKey);

        const now = Date.now();
        const lastSeenVal = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
        const lastSeenDiffMs = lastSeenVal > 0 ? now - lastSeenVal : Infinity;

        const tempMin = vehicle.configProfile?.tempMin ?? 2.0;
        const tempMax = vehicle.configProfile?.tempMax ?? 8.0;
        const heartbeatIntervalMs = (vehicle.configProfile?.heartbeatIntervalSecs ?? 30) * 1000;

        let temperature = (tempMin + tempMax) / 2;
        if (latestStr) {
          try {
            const telemetry = JSON.parse(latestStr);
            temperature = telemetry.temperature;
          } catch {}
        }

        // Initialize state machine actor with input context and configure the initial state
        const actor = createActor(vehicleHealthMachine, {
          input: {
            lastSeenDiffMs,
            heartbeatIntervalMs,
            temperature,
            tempMin,
            tempMax,
          },
          state: vehicleHealthMachine.resolveState({
            value: (vehicle.status === 'online' || vehicle.status === 'degraded' || vehicle.status === 'offline' || vehicle.status === 'pending') ? vehicle.status : 'offline',
            context: {
              lastSeenDiffMs,
              heartbeatIntervalMs,
              temperature,
              tempMin,
              tempMax,
            }
          })
        });

        actor.start();
        actor.send({ type: 'CHECK' });
        
        const nextState = actor.getSnapshot().value as string;
        actor.stop();

        if (nextState !== vehicle.status) {
          console.log(`[Health Sweep] Vehicle ${vehicle.name} (${vehicle.id}) transitioning ${vehicle.status} -> ${nextState}`);

          let reason = 'Normal telemetry check-in';
          let alertSeverity: 'info' | 'warning' | 'critical' = 'info';
          let alertType: 'status_change' | 'temperature_excursion' | 'connectivity_loss' = 'status_change';
          let durationSeconds: number | undefined = undefined;
          let isMinor = false;

          if (nextState === 'degraded') {
            if (lastSeenDiffMs > heartbeatIntervalMs) {
              reason = `Missed heartbeat interval. Last seen ${Math.round(lastSeenDiffMs / 1000)}s ago.`;
              alertSeverity = 'warning';
              alertType = 'connectivity_loss';
            } else {
              reason = `Temperature out of safe bounds: ${temperature}°C (Limit: ${tempMin}°C - ${tempMax}°C)`;
              alertSeverity = 'warning';
              alertType = 'temperature_excursion';
            }
          } else if (nextState === 'offline') {
            reason = `No heartbeat detected. Last seen ${lastSeenVal > 0 ? Math.round(lastSeenDiffMs / 1000) + 's ago' : 'never'}.`;
            alertSeverity = 'critical';
            alertType = 'connectivity_loss';

            // If transitioning from degraded to offline, clear the degraded alert
            // since offline is a more severe state
            if (vehicle.status === 'degraded') {
              await this.alerts.clearAlertsByType(vehicle.id, 'degraded');
            }
          } else if (nextState === 'online') {
            reason = 'Telemetry recovered within safe bounds';

            // Calculate duration if recovering from degraded
            if (vehicle.status === 'degraded') {
              const degradedEvent = await this.prisma.statusEvent.findFirst({
                where: {
                  vehicleId: vehicle.id,
                  toStatus: 'degraded',
                },
                orderBy: { timestamp: 'desc' },
              });

              if (degradedEvent) {
                durationSeconds = Math.floor(
                  (Date.now() - degradedEvent.timestamp.getTime()) / 1000,
                );

                // Auto-acknowledge short degraded periods (< 60s)
                if (durationSeconds < 60) {
                  isMinor = true;
                }
              }
            }

            // Also calculate duration if recovering from offline
            if (vehicle.status === 'offline') {
              const offlineEvent = await this.prisma.statusEvent.findFirst({
                where: {
                  vehicleId: vehicle.id,
                  toStatus: 'offline',
                },
                orderBy: { timestamp: 'desc' },
              });

              if (offlineEvent) {
                durationSeconds = Math.floor(
                  (Date.now() - offlineEvent.timestamp.getTime()) / 1000,
                );
              }
            }
          }

          const statusEvent = await this.prisma.statusEvent.create({
            data: {
              vehicleId: vehicle.id,
              fromStatus: vehicle.status,
              toStatus: nextState,
              reason,
              durationSeconds,
              minor: isMinor,
              acknowledged: isMinor, // Auto-acknowledge minor events
              acknowledgedAt: isMinor ? new Date() : null,
              acknowledgedBy: isMinor ? 'system' : null,
            },
          });

          await this.prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { status: nextState },
          });

          if (nextState !== 'online') {
            // Clear any existing unresolved alerts for this vehicle before creating new one
            await this.alerts.clearUnresolvedAlerts(vehicle.id);

            await this.alerts.createAlert(
              vehicle.id,
              alertSeverity,
              alertType,
              `${vehicle.name} status changed from ${vehicle.status} to ${nextState}: ${reason}`,
              statusEvent.id,
            );
          } else if (durationSeconds !== undefined && durationSeconds > 0) {
            // Update any open alerts with recovery info
            await this.alerts.markAlertsRecovered(
              vehicle.id,
              new Date(),
              durationSeconds,
              isMinor,
            );
          }

          await redisClient.publish(
            'vehicle:status',
            JSON.stringify({
              vehicleId: vehicle.id,
              name: vehicle.name,
              fromStatus: vehicle.status,
              toStatus: nextState,
              reason,
              durationSeconds,
              minor: isMinor,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }
    } catch (err: any) {
      console.error('[Health Sweep] Sweep error:', err?.message || 'Unknown error');
    }
  }
}
