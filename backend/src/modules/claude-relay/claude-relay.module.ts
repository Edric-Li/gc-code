import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SessionHashService } from './services/session-hash.service';
import { MemorySessionStorageService } from './services/session-storage/memory-session-storage.service';
import { ClaudeChannelSelectorService } from './services/claude-channel-selector.service';
import { ClaudeProxyService } from './services/claude-proxy.service';
import { ClaudeRelayController } from './claude-relay.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { PrismaService } from '../../common/prisma.service';
import { SESSION_STORAGE_SERVICE } from './constants';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 300000, // 5分钟超时
      maxRedirects: 5,
    }),
  ],
  controllers: [ClaudeRelayController],
  providers: [
    PrismaService,
    SessionHashService,
    // 🔑 关键：使用内存实现作为 Session 存储
    // 将来切换到 Redis 只需要改这一行
    {
      provide: SESSION_STORAGE_SERVICE,
      useClass: MemorySessionStorageService,
    },
    ClaudeChannelSelectorService,
    ClaudeProxyService,
    ApiKeyAuthGuard,
  ],
  exports: [
    SessionHashService,
    SESSION_STORAGE_SERVICE,
    ClaudeChannelSelectorService,
    ClaudeProxyService,
  ],
})
export class ClaudeRelayModule {}
