import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('alerts')
@UseGuards(AdminJwtGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  async findAll() {
    return this.alertsService.listAlerts();
  }

  @Get('unacknowledged')
  async findUnacknowledged() {
    return this.alertsService.listUnacknowledgedAlerts();
  }

  @Put('acknowledge-all')
  async acknowledgeAll(@Body() body: { acknowledgedBy?: string }) {
    return this.alertsService.acknowledgeAll(body?.acknowledgedBy || 'admin');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertsService.getAlert(id);
  }

  @Put(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Body() body: { acknowledgedBy?: string },
  ) {
    return this.alertsService.acknowledgeAlert(id, body?.acknowledgedBy || 'admin');
  }
}
