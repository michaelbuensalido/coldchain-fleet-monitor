import { Module } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { ConfigsController } from './configs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ConfigsService],
  controllers: [ConfigsController],
  exports: [ConfigsService],
})
export class ConfigsModule {}
