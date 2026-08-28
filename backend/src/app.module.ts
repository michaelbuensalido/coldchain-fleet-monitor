import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ConfigsModule } from './configs/configs.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { HealthModule } from './health/health.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AlertsModule } from './alerts/alerts.module';
import { IotHubModule } from './iothub/iothub.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    VehiclesModule,
    ConfigsModule,
    TelemetryModule,
    HealthModule,
    RealtimeModule,
    AlertsModule,
    IotHubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
