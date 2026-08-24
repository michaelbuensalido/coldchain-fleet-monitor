import { Module } from '@nestjs/common';
import { HealthSweepService } from './health.service';
import { StatusTransitionService } from './status-transition.service';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  providers: [HealthSweepService, StatusTransitionService],
  exports: [HealthSweepService, StatusTransitionService],
})
export class HealthModule {}
