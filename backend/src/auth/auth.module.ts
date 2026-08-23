import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminJwtGuard } from './admin-jwt.guard';
import { DeviceApiKeyGuard } from './device-key.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-replace-in-prod',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, AdminJwtGuard, DeviceApiKeyGuard],
  controllers: [AuthController],
  exports: [JwtModule, AdminJwtGuard, DeviceApiKeyGuard],
})
export class AuthModule {}
