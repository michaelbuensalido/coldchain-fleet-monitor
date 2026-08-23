import { Module } from '@nestjs/common';
import { HealthSweepService } from './health.service';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  providers: [HealthSweepService],
  exports: [HealthSweepService],
})
export class HealthModule {}
