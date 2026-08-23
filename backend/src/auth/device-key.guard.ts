import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { apiKeyHash: hashedKey },
    });

    if (!vehicle) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach vehicle to request for telemetry logic usage
    request.vehicle = vehicle;
    return true;
  }
}
