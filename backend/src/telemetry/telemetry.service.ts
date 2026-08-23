import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis.service';
import { AlertsService } from '../alerts/alerts.service';
import { vehicleHealthMachine } from '../health/health.machine';
import { createActor } from 'xstate';

@Injectable()
export class TelemetryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private alerts: AlertsService,
  ) {}

  async ingestTelemetry(
    vehicleId: string,
    data: {
      temperature: number;
      latitude: number;
      longitude: number;
      doorOpen: boolean;
    },
  ) {
    // 1. Fetch vehicle status
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { configProfile: true },
    });

    if (!vehicle) {
      throw new BadRequestException('Vehicle not found');
    }

    // 2. Ingest telemetry reading
    const reading = await this.prisma.telemetryReading.create({
      data: {
        vehicleId,
        temperature: data.temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        doorOpen: data.doorOpen,
      },
    });

    const redisClient = this.redis.getClient();
    const now = Date.now().toString();

    // Store last seen timestamp
    await redisClient.set(`vehicle:${vehicleId}:lastSeen`, now);

    // Keep latest telemetry reading details cached in Redis for fast access
    await redisClient.set(
      `vehicle:${vehicleId}:latest`,
      JSON.stringify({
        temperature: data.temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        doorOpen: data.doorOpen,
        timestamp: now,
      }),
    );

    // Publish telemetry update event
    await redisClient.publish(
      'vehicle:telemetry',
      JSON.stringify({
        vehicleId,
        temperature: data.temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        doorOpen: data.doorOpen,
        timestamp: new Date().toISOString(),
      }),
    );

    // 3. Handle pending -> online status transition
    if (vehicle.status === 'pending') {
      const tempMin = vehicle.configProfile?.tempMin ?? 2.0;
      const tempMax = vehicle.configProfile?.tempMax ?? 8.0;
      const heartbeatIntervalMs = (vehicle.configProfile?.heartbeatIntervalSecs ?? 30) * 1000;

      const actor = createActor(vehicleHealthMachine, {
        input: {
          lastSeenDiffMs: 0,
          heartbeatIntervalMs,
          temperature: data.temperature,
          tempMin,
          tempMax,
        },
        state: vehicleHealthMachine.resolveState({
          value: 'pending',
          context: {
            lastSeenDiffMs: 0,
            heartbeatIntervalMs,
            temperature: data.temperature,
            tempMin,
            tempMax,
          }
        })
      });

      actor.start();
      actor.send({ type: 'CHECK' });
      const newStatus = actor.getSnapshot().value as string;
      actor.stop();

      const reason = 'First check-in: Telemetry received';

      await this.prisma.$transaction([
        this.prisma.statusEvent.create({
          data: {
            vehicleId,
            fromStatus: 'pending',
            toStatus: newStatus,
            reason,
          },
        }),
        this.prisma.vehicle.update({
          where: { id: vehicleId },
          data: { status: newStatus },
        }),
      ]);

      await this.alerts.createAlert(
        vehicleId,
        'info',
        'status_change',
        `${vehicle.name} status changed from pending to ${newStatus}: ${reason}`,
      );

      await redisClient.publish(
        'vehicle:status',
        JSON.stringify({
          vehicleId,
          name: vehicle.name,
          fromStatus: 'pending',
          toStatus: newStatus,
          reason,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    return reading;
  }

  async getHistory(vehicleId: string, limit = 100) {
    return this.prisma.telemetryReading.findMany({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
