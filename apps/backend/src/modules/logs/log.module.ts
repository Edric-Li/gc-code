import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { LogCleanupService } from './log-cleanup.service';
import { PrismaModule } from '../../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LogController],
  providers: [LogService, LogCleanupService],
  exports: [LogService],
})
export class LogModule {}
