import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionHashService } from './services/session-hash.service';
import { MemorySessionStorageService } from './services/session-storage/memory-session-storage.service';
import { ClaudeChannelSelectorService } from './services/claude-channel-selector.service';
import { ClaudeProxyService } from './services/claude-proxy.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { ClaudeRelayController } from './claude-relay.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { PrismaService } from '../../common/prisma.service';
import { SESSION_STORAGE_SERVICE } from './constants';
// 新增性能优化服务
import { ApiKeyCacheService } from './services/api-key-cache.service';
import { ChannelPoolCacheService } from './services/channel-pool-cache.service';
import { UsageQueueService } from './services/usage-queue.service';
import { RequestLogQueueService } from './services/request-log-queue.service';
import { RequestLogCleanupService } from './services/request-log-cleanup.service';
import { PricingService } from './services/pricing.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
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
    // 🚀 性能优化服务
    ApiKeyCacheService, // API Key 内存缓存
    ChannelPoolCacheService, // 渠道池内存缓存
    UsageQueueService, // 用量统计批量队列
    RequestLogQueueService, // 请求日志批量队列
    RequestLogCleanupService, // 请求日志定时清理服务
    PricingService, // 动态定价服务
    ClaudeChannelSelectorService,
    ClaudeProxyService,
    UsageTrackingService,
    ApiKeyAuthGuard,
  ],
  exports: [
    SessionHashService,
    SESSION_STORAGE_SERVICE,
    ClaudeChannelSelectorService,
    ClaudeProxyService,
    ApiKeyCacheService,
    ChannelPoolCacheService,
    UsageQueueService,
    RequestLogQueueService,
  ],
})
export class ClaudeRelayModule {}
