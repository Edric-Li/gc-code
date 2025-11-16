import { Module } from '@nestjs/common';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersService } from './ai-providers.service';
import { PrismaModule } from '../../common/prisma.module';
import { LogModule } from '../logs/log.module';

@Module({
  imports: [PrismaModule, LogModule],
  controllers: [AiProvidersController],
  providers: [AiProvidersService],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}
