import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('configs')
@UseGuards(AdminJwtGuard)
export class ConfigsController {
  constructor(private configsService: ConfigsService) {}

  @Post()
  async create(
    @Body() body: { name: string; tempMin: number; tempMax: number; heartbeatIntervalSecs: number },
  ) {
    return this.configsService.createProfile(body.name, body.tempMin, body.tempMax, body.heartbeatIntervalSecs);
  }

  @Get()
  async findAll() {
    return this.configsService.listProfiles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.configsService.getProfile(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; tempMin?: number; tempMax?: number; heartbeatIntervalSecs?: number },
  ) {
    return this.configsService.updateProfile(id, body.name, body.tempMin, body.tempMax, body.heartbeatIntervalSecs);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.configsService.deleteProfile(id);
  }

  @Post('assign')
  async assign(@Body() body: { vehicleId: string; configProfileId: string | null }) {
    return this.configsService.assignProfile(body.vehicleId, body.configProfileId);
  }
}
