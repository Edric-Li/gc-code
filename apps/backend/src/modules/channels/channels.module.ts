import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { PrismaModule } from '../../common/prisma.module';
import { ClaudeRelayModule } from '../claude-relay/claude-relay.module';
import { LogModule } from '../logs/log.module';

@Module({
  imports: [PrismaModule, ClaudeRelayModule, LogModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
