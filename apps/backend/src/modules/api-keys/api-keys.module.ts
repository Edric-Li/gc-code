import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { PrismaModule } from '../../common/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ClaudeRelayModule } from '../claude-relay/claude-relay.module';
import { LogModule } from '../logs/log.module';

@Module({
  imports: [PrismaModule, AuthModule, ClaudeRelayModule, LogModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
