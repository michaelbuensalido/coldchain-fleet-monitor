import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { DeviceApiKeyGuard } from '../auth/device-key.guard';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('telemetry')
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post()
  @UseGuards(DeviceApiKeyGuard)
  async ingest(@Request() req: any, @Body() body: { temperature: number; latitude: number; longitude: number; doorOpen: boolean }) {
    const vehicle = req.vehicle;
    return this.telemetryService.ingestTelemetry(vehicle.id, body);
  }

  @Get('history/:vehicleId')
  @UseGuards(AdminJwtGuard)
  async getHistory(@Param('vehicleId') vehicleId: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    return this.telemetryService.getHistory(vehicleId, parsedLimit);
  }
}
