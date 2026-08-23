import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('vehicles')
@UseGuards(AdminJwtGuard)
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  async create(@Body() body: { name: string; currentRoute?: string }) {
    return this.vehiclesService.createVehicle(body.name, body.currentRoute);
  }

  @Get()
  async findAll() {
    return this.vehiclesService.listVehicles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.getVehicle(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; currentRoute?: string; configProfileId?: string; active?: boolean },
  ) {
    return this.vehiclesService.updateVehicle(id, body.name, body.currentRoute, body.configProfileId, body.active);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vehiclesService.deleteVehicle(id);
  }
}
