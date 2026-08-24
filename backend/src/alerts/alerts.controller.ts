import { Controller, Get, Put, Param, Req, UseGuards } from '@nestjs/common';
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
  async acknowledgeAll(@Req() req: { admin?: { email?: string } }) {
    return this.alertsService.acknowledgeAll(req.admin?.email || 'admin');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertsService.getAlert(id);
  }

  @Put(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Req() req: { admin?: { email?: string } },
  ) {
    return this.alertsService.acknowledgeAlert(id, req.admin?.email || 'admin');
  }
}
