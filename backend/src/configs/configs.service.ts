import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigsService {
  constructor(private prisma: PrismaService) {}

  async createProfile(name: string, tempMin: number, tempMax: number, heartbeatIntervalSecs: number) {
    return this.prisma.configProfile.create({
      data: {
        name,
        tempMin,
        tempMax,
        heartbeatIntervalSecs,
      },
    });
  }

  async listProfiles() {
    return this.prisma.configProfile.findMany();
  }

  async getProfile(id: string) {
    return this.prisma.configProfile.findUnique({
      where: { id },
    });
  }

  async updateProfile(id: string, name?: string, tempMin?: number, tempMax?: number, heartbeatIntervalSecs?: number) {
    return this.prisma.configProfile.update({
      where: { id },
      data: {
        name,
        tempMin,
        tempMax,
        heartbeatIntervalSecs,
      },
    });
  }

  async deleteProfile(id: string) {
    // Note: Vehicles referencing this will have their configProfileId set to null or fail if they are in the database.
    // In our schema, configProfileId is nullable and ConfigProfile has no ondelete cascade set, we should set vehicles referencing this to null first.
    await this.prisma.vehicle.updateMany({
      where: { configProfileId: id },
      data: { configProfileId: null },
    });
    return this.prisma.configProfile.delete({
      where: { id },
    });
  }

  async assignProfile(vehicleId: string, profileId: string | null) {
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        configProfileId: profileId,
      },
    });
  }
}
