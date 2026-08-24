import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async createVehicle(name: string, currentRoute?: string) {
    const rawApiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const existing = await this.prisma.vehicle.findUnique({
      where: { name },
    });

    if (existing) {
      const updated = await this.prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          apiKeyHash,
          currentRoute: currentRoute !== undefined ? currentRoute : existing.currentRoute,
        },
      });
      return {
        vehicle: updated,
        apiKey: rawApiKey,
      };
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        name,
        apiKeyHash,
        currentRoute,
        status: 'pending', // Default state is pending until we ingest telemetry
      },
    });

    return {
      vehicle,
      apiKey: rawApiKey, // Returned exactly once on creation
    };
  }

  async listVehicles() {
    return this.prisma.vehicle.findMany({
      include: {
        configProfile: true,
        telemetry: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getVehicle(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        configProfile: true,
        statusEvents: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });
  }

  async updateVehicle(id: string, name?: string, currentRoute?: string, configProfileId?: string, active?: boolean) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name,
        currentRoute,
        configProfileId: configProfileId === null ? null : configProfileId,
        active,
      },
    });
  }

  async deleteVehicle(id: string) {
    // Delete related telemetry readings, status events, and alerts first
    await this.prisma.telemetryReading.deleteMany({ where: { vehicleId: id } });
    await this.prisma.alert.deleteMany({ where: { vehicleId: id } });
    await this.prisma.statusEvent.deleteMany({ where: { vehicleId: id } });
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }

  async getStatusEvents(vehicleId: string) {
    return this.prisma.statusEvent.findMany({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }
}
