import { Module } from '@nestjs/common';
import { IotHubConsumerService } from './iothub-consumer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, TelemetryModule, RealtimeModule],
  providers: [IotHubConsumerService],
  exports: [IotHubConsumerService],
})
export class IotHubModule {}
