# Sticky Session 内存缓存实现方案

> 使用内存缓存快速实现 Sticky Session，支持后续无缝切换到 Redis

## 📋 目录

- [设计理念](#设计理念)
- [架构设计](#架构设计)
- [核心实现](#核心实现)
- [使用示例](#使用示例)
- [后续升级到 Redis](#后续升级到-redis)

---

## 设计理念

### 核心原则

1. **接口抽象** - 定义统一的存储接口
2. **实现分离** - 内存和 Redis 实现互换
3. **零侵入** - 业务代码不感知底层存储
4. **易扩展** - 支持未来添加其他存储方式

### 架构优势

```
┌─────────────────────────────────┐
│   ClaudeChannelSelectorService  │  ← 业务层（不变）
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    ISessionStorageService       │  ← 接口层（不变）
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│MemoryStorage │  │ RedisStorage │  ← 实现层（可切换）
│  (现在用)     │  │  (将来用)     │
└──────────────┘  └──────────────┘
```

---

## 架构设计

### 模块结构

```
backend/src/modules/claude-relay/
├── services/
│   ├── session-hash.service.ts              # 会话哈希生成（不变）
│   ├── session-storage/
│   │   ├── session-storage.interface.ts     # 存储接口定义
│   │   ├── memory-session-storage.service.ts # 内存实现 ⭐
│   │   └── redis-session-storage.service.ts  # Redis 实现（将来）
│   ├── claude-channel-selector.service.ts   # 渠道选择（不变）
│   └── claude-relay.service.ts              # 主服务（不变）
└── claude-relay.module.ts                   # 模块配置
```

---

## 核心实现

### 1. 存储接口定义

```typescript
// src/modules/claude-relay/services/session-storage/session-storage.interface.ts

export interface SessionMapping {
  sessionHash: string;
  channelId: string;
  apiKeyId: string;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
  requestCount: number;
}

export interface SessionStats {
  totalSessions: number;
  avgRequestsPerSession: number;
}

/**
 * Session 存储接口
 * 支持内存和 Redis 等多种实现
 */
export interface ISessionStorageService {
  /**
   * 获取会话映射
   */
  getMapping(sessionHash: string): Promise<SessionMapping | null>;

  /**
   * 设置会话映射
   */
  setMapping(
    sessionHash: string,
    channelId: string,
    apiKeyId: string,
  ): Promise<SessionMapping>;

  /**
   * 更新会话映射（增加请求计数）
   */
  updateMapping(sessionHash: string): Promise<void>;

  /**
   * 续期会话
   */
  renewMapping(sessionHash: string): Promise<boolean>;

  /**
   * 删除会话映射
   */
  deleteMapping(sessionHash: string): Promise<void>;

  /**
   * 获取会话统计
   */
  getStats(): Promise<SessionStats>;

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): Promise<number>;
}
```

### 2. 内存存储实现

```typescript
// src/modules/claude-relay/services/session-storage/memory-session-storage.service.ts

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ISessionStorageService,
  SessionMapping,
  SessionStats,
} from './session-storage.interface';

/**
 * 基于内存的 Session 存储实现
 * 使用 Map 结构，支持 LRU 淘汰策略
 */
@Injectable()
export class MemorySessionStorageService
  implements ISessionStorageService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MemorySessionStorageService.name);

  // 内存缓存
  private readonly cache = new Map<string, SessionMapping>();

  // 配置
  private readonly ttlSeconds: number;
  private readonly renewThresholdSeconds: number;
  private readonly maxCacheSize: number;

  // 定时清理任务
  private cleanupInterval: NodeJS.Timer;

  constructor(private configService: ConfigService) {
    // 加载配置
    this.ttlSeconds = this.configService.get('SESSION_TTL_SECONDS', 3600);
    this.renewThresholdSeconds = this.configService.get(
      'SESSION_RENEW_THRESHOLD_SECONDS',
      300,
    );
    this.maxCacheSize = this.configService.get('SESSION_MAX_CACHE_SIZE', 10000);
  }

  onModuleInit() {
    this.logger.log('Memory session storage initialized');
    this.logger.log(`Max cache size: ${this.maxCacheSize}, TTL: ${this.ttlSeconds}s`);

    // 启动定时清理任务（每分钟）
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);
  }

  onModuleDestroy() {
    // 清理定时任务
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.logger.log('Memory session storage destroyed');
  }

  /**
   * 获取会话映射
   */
  async getMapping(sessionHash: string): Promise<SessionMapping | null> {
    const mapping = this.cache.get(sessionHash);

    if (!mapping) {
      return null;
    }

    // 检查是否过期
    if (new Date() > mapping.expiresAt) {
      this.cache.delete(sessionHash);
      this.logger.debug(`Session expired and removed: ${sessionHash}`);
      return null;
    }

    return mapping;
  }

  /**
   * 设置会话映射
   */
  async setMapping(
    sessionHash: string,
    channelId: string,
    apiKeyId: string,
  ): Promise<SessionMapping> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);

    const mapping: SessionMapping = {
      sessionHash,
      channelId,
      apiKeyId,
      createdAt: now,
      lastAccessAt: now,
      expiresAt,
      requestCount: 1,
    };

    // LRU 策略：如果缓存满了，删除最早的
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(sessionHash, mapping);

    this.logger.log(
      `Created session mapping: ${sessionHash} → ${channelId} (TTL: ${this.ttlSeconds}s)`,
    );

    return mapping;
  }

  /**
   * 更新会话映射
   */
  async updateMapping(sessionHash: string): Promise<void> {
    const mapping = this.cache.get(sessionHash);

    if (!mapping) {
      return;
    }

    // 检查是否过期
    if (new Date() > mapping.expiresAt) {
      this.cache.delete(sessionHash);
      return;
    }

    // 更新访问时间和请求计数
    mapping.lastAccessAt = new Date();
    mapping.requestCount += 1;

    this.cache.set(sessionHash, mapping);

    this.logger.debug(
      `Updated session mapping: ${sessionHash} (count: ${mapping.requestCount})`,
    );
  }

  /**
   * 续期会话
   */
  async renewMapping(sessionHash: string): Promise<boolean> {
    const mapping = this.cache.get(sessionHash);

    if (!mapping) {
      return false;
    }

    const now = new Date();
    const remainingMs = mapping.expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.floor(remainingMs / 1000);

    // 如果剩余时间小于续期阈值，则续期
    if (remainingSeconds < this.renewThresholdSeconds) {
      mapping.expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
      this.cache.set(sessionHash, mapping);

      this.logger.log(
        `Renewed session mapping: ${sessionHash} (was ${remainingSeconds}s, now ${this.ttlSeconds}s)`,
      );
      return true;
    }

    this.logger.debug(
      `Session mapping TTL sufficient: ${sessionHash} (${remainingSeconds}s remaining)`,
    );
    return false;
  }

  /**
   * 删除会话映射
   */
  async deleteMapping(sessionHash: string): Promise<void> {
    const deleted = this.cache.delete(sessionHash);
    if (deleted) {
      this.logger.log(`Deleted session mapping: ${sessionHash}`);
    }
  }

  /**
   * 获取会话统计
   */
  async getStats(): Promise<SessionStats> {
    const mappings = Array.from(this.cache.values());
    const totalRequests = mappings.reduce((sum, m) => sum + m.requestCount, 0);

    return {
      totalSessions: mappings.length,
      avgRequestsPerSession:
        mappings.length > 0 ? totalRequests / mappings.length : 0,
    };
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [hash, mapping] of this.cache.entries()) {
      if (now > mapping.expiresAt) {
        this.cache.delete(hash);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * LRU 淘汰：删除最早创建的会话
   */
  private evictOldest(): void {
    let oldestHash: string | null = null;
    let oldestTime = new Date();

    for (const [hash, mapping] of this.cache.entries()) {
      if (mapping.createdAt < oldestTime) {
        oldestTime = mapping.createdAt;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      this.cache.delete(oldestHash);
      this.logger.warn(`Evicted oldest session due to cache size limit: ${oldestHash}`);
    }
  }

  /**
   * 获取当前缓存大小（用于监控）
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 清空所有缓存（用于测试）
   */
  async clearAll(): Promise<void> {
    this.cache.clear();
    this.logger.log('Cleared all session mappings');
  }
}
```

### 3. Session Hash 服务（不变）

```typescript
// src/modules/claude-relay/services/session-hash.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface SessionHashOptions {
  messageCount?: number;
  includeSystemPrompt?: boolean;
}

@Injectable()
export class SessionHashService {
  private readonly HASH_ALGORITHM = 'sha256';
  private readonly HASH_LENGTH = 16;
  private readonly DEFAULT_MESSAGE_COUNT = 3;

  /**
   * 生成会话哈希
   */
  generateHash(
    messages: any[],
    options: SessionHashOptions = {},
  ): string {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('Messages array cannot be empty');
    }

    const {
      messageCount = this.DEFAULT_MESSAGE_COUNT,
      includeSystemPrompt = false,
    } = options;

    // 提取内容
    const content = this.extractHashContent(
      messages,
      messageCount,
      includeSystemPrompt,
    );

    // 生成哈希
    return this.computeHash(content);
  }

  /**
   * 提取用于生成哈希的内容
   */
  private extractHashContent(
    messages: any[],
    messageCount: number,
    includeSystemPrompt: boolean,
  ): string {
    // 过滤消息
    let filteredMessages = messages;

    if (!includeSystemPrompt) {
      filteredMessages = messages.filter((msg) => msg.role !== 'system');
    }

    // 取前 N 条消息
    const selectedMessages = filteredMessages.slice(0, messageCount);

    // 提取内容
    const contents = selectedMessages.map((msg) => {
      if (typeof msg.content === 'string') {
        return msg.content;
      } else if (Array.isArray(msg.content)) {
        // 处理多模态消息
        return msg.content
          .map((item) => {
            if (item.type === 'text') {
              return item.text;
            } else if (item.type === 'image') {
              return item.source?.data?.substring(0, 100) || '';
            }
            return '';
          })
          .join('|');
      }
      return '';
    });

    return contents.join('|||');
  }

  /**
   * 计算哈希值
   */
  private computeHash(content: string): string {
    const hash = crypto
      .createHash(this.HASH_ALGORITHM)
      .update(content)
      .digest('hex');

    return hash.substring(0, this.HASH_LENGTH);
  }

  /**
   * 验证会话哈希格式
   */
  validateHash(hash: string): boolean {
    if (typeof hash !== 'string') {
      return false;
    }

    if (hash.length !== this.HASH_LENGTH) {
      return false;
    }

    return /^[0-9a-f]+$/i.test(hash);
  }
}
```

### 4. 增强的渠道选择服务

```typescript
// src/modules/claude-relay/services/claude-channel-selector.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Channel, ChannelStatus } from '@prisma/client';
import { SessionHashService } from './session-hash.service';
import { ISessionStorageService } from './session-storage/session-storage.interface';

@Injectable()
export class ClaudeChannelSelectorService {
  private readonly logger = new Logger(ClaudeChannelSelectorService.name);

  constructor(
    private prisma: PrismaService,
    private sessionHashService: SessionHashService,
    private sessionStorage: ISessionStorageService, // 注入接口，不关心具体实现
  ) {}

  /**
   * 为 API Key 选择可用的 Claude 渠道（支持 Sticky Session）
   */
  async selectChannel(apiKey: any, requestBody: any): Promise<Channel> {
    // 1. 生成会话哈希
    const sessionHash = this.generateSessionHash(requestBody);

    // 2. 如果有会话哈希，尝试使用 Sticky Session
    if (sessionHash) {
      const stickyChannel = await this.tryGetStickyChannel(
        sessionHash,
        apiKey.id,
      );

      if (stickyChannel) {
        this.logger.log(
          `✅ Sticky session hit: ${sessionHash} → ${stickyChannel.name}`,
        );

        // 更新映射
        await this.sessionStorage.updateMapping(sessionHash);

        // 自动续期
        await this.sessionStorage.renewMapping(sessionHash);

        return stickyChannel;
      }
    }

    // 3. 选择新渠道
    const newChannel = await this.selectNewChannel(apiKey);

    // 4. 建立新的会话映射
    if (sessionHash) {
      await this.sessionStorage.setMapping(
        sessionHash,
        newChannel.id,
        apiKey.id,
      );
      this.logger.log(
        `🆕 Created sticky session: ${sessionHash} → ${newChannel.name}`,
      );
    }

    return newChannel;
  }

  /**
   * 生成会话哈希
   */
  private generateSessionHash(requestBody: any): string | null {
    try {
      if (!requestBody?.messages || requestBody.messages.length === 0) {
        return null;
      }

      return this.sessionHashService.generateHash(requestBody.messages);
    } catch (error) {
      this.logger.warn(`Failed to generate session hash: ${error.message}`);
      return null;
    }
  }

  /**
   * 尝试获取 Sticky Session 对应的渠道
   */
  private async tryGetStickyChannel(
    sessionHash: string,
    apiKeyId: string,
  ): Promise<Channel | null> {
    try {
      // 获取会话映射
      const mapping = await this.sessionStorage.getMapping(sessionHash);

      if (!mapping) {
        return null;
      }

      // 验证 API Key 是否匹配
      if (mapping.apiKeyId !== apiKeyId) {
        this.logger.warn(
          `⚠️ Session API Key mismatch: ${sessionHash}`,
        );
        return null;
      }

      // 检查渠道是否可用
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: mapping.channelId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!channel) {
        this.logger.warn(`⚠️ Mapped channel not found: ${mapping.channelId}`);
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      // 检查渠道状态
      if (channel.status !== ChannelStatus.ACTIVE) {
        this.logger.warn(
          `⚠️ Mapped channel not active: ${channel.name} (${channel.status})`,
        );

        // 如果是限流且已过期，尝试恢复
        if (
          channel.status === ChannelStatus.RATE_LIMITED &&
          channel.rateLimitEndAt &&
          new Date() > channel.rateLimitEndAt
        ) {
          await this.restoreChannel(channel.id);
          return channel;
        }

        // 删除映射
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      return channel;
    } catch (error) {
      this.logger.error(`❌ Failed to get sticky channel: ${error.message}`);
      return null;
    }
  }

  /**
   * 选择新渠道
   */
  private async selectNewChannel(apiKey: any): Promise<Channel> {
    // 如果 API Key 绑定了特定渠道
    if (apiKey.channelId) {
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: apiKey.channelId,
          isActive: true,
          status: ChannelStatus.ACTIVE,
          deletedAt: null,
        },
      });

      if (!channel) {
        throw new BadRequestException('Bound channel is not available');
      }

      return channel;
    }

    // 从共享渠道池中选择
    const availableChannels = await this.prisma.channel.findMany({
      where: {
        isActive: true,
        status: ChannelStatus.ACTIVE,
        deletedAt: null,
        OR: [
          { rateLimitEndAt: null },
          { rateLimitEndAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'asc' },
        { lastUsedAt: 'asc' },
      ],
    });

    if (availableChannels.length === 0) {
      throw new BadRequestException('No available Claude channels');
    }

    const selectedChannel = availableChannels[0];

    // 更新最后使用时间
    await this.prisma.channel.update({
      where: { id: selectedChannel.id },
      data: { lastUsedAt: new Date() },
    });

    return selectedChannel;
  }

  /**
   * 恢复渠道
   */
  async restoreChannel(channelId: string) {
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.ACTIVE,
        rateLimitEndAt: null,
      },
    });
  }

  /**
   * 获取会话统计（用于监控）
   */
  async getSessionStats() {
    return await this.sessionStorage.getStats();
  }
}
```

### 5. Module 配置

```typescript
// src/modules/claude-relay/claude-relay.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClaudeRelayController } from './claude-relay.controller';
import { ClaudeRelayService } from './services/claude-relay.service';
import { ClaudeChannelSelectorService } from './services/claude-channel-selector.service';
import { SessionHashService } from './services/session-hash.service';
import { MemorySessionStorageService } from './services/session-storage/memory-session-storage.service';
import { ISessionStorageService } from './services/session-storage/session-storage.interface';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ConfigModule, ApiKeysModule],
  controllers: [ClaudeRelayController],
  providers: [
    ClaudeRelayService,
    ClaudeChannelSelectorService,
    SessionHashService,
    // 🔑 关键：使用 useClass 注入内存实现
    {
      provide: 'ISessionStorageService',
      useClass: MemorySessionStorageService,
    },
    // 或者使用别名
    {
      provide: ISessionStorageService,
      useClass: MemorySessionStorageService,
    },
  ],
  exports: [ClaudeRelayService],
})
export class ClaudeRelayModule {}
```

---

## 使用示例

### 环境变量配置

```env
# .env

# Session 配置
SESSION_TTL_SECONDS=3600              # Session 过期时间（1小时）
SESSION_RENEW_THRESHOLD_SECONDS=300   # 续期阈值（5分钟）
SESSION_MAX_CACHE_SIZE=10000          # 最大缓存数量

# Session Hash 配置
SESSION_MESSAGE_COUNT=3               # 用于生成 hash 的消息数
SESSION_INCLUDE_SYSTEM_PROMPT=false   # 是否包含系统提示词
```

### Controller 使用（不变）

```typescript
// src/modules/claude-relay/claude-relay.controller.ts

@Controller()
@UseGuards(ApiKeyGuard)
export class ClaudeRelayController {
  constructor(private claudeRelayService: ClaudeRelayService) {}

  @Post('/v1/messages')
  async messages(@Req() req: Request, @Body() body: any) {
    const apiKey = (req as any).apiKey;
    return await this.claudeRelayService.relayRequest(apiKey, body);
  }
}
```

### 测试示例

```typescript
// test/memory-session-storage.spec.ts

describe('MemorySessionStorageService', () => {
  let service: MemorySessionStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemorySessionStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<MemorySessionStorageService>(
      MemorySessionStorageService,
    );
  });

  it('should set and get mapping', async () => {
    const mapping = await service.setMapping('hash123', 'channel1', 'key1');

    expect(mapping.sessionHash).toBe('hash123');
    expect(mapping.channelId).toBe('channel1');

    const retrieved = await service.getMapping('hash123');
    expect(retrieved).toBeTruthy();
    expect(retrieved.channelId).toBe('channel1');
  });

  it('should return null for expired mapping', async () => {
    // 设置一个很短的 TTL
    const mapping = await service.setMapping('hash456', 'channel2', 'key2');

    // 手动修改过期时间
    mapping.expiresAt = new Date(Date.now() - 1000);

    const retrieved = await service.getMapping('hash456');
    expect(retrieved).toBeNull();
  });
});
```

---

## 后续升级到 Redis

### 切换步骤（非常简单）

#### 1. 创建 Redis 实现

```typescript
// src/modules/claude-relay/services/session-storage/redis-session-storage.service.ts

import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ISessionStorageService, SessionMapping } from './session-storage.interface';

@Injectable()
export class RedisSessionStorageService implements ISessionStorageService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async getMapping(sessionHash: string): Promise<SessionMapping | null> {
    const data = await this.redis.get(`session:${sessionHash}`);
    return data ? JSON.parse(data) : null;
  }

  async setMapping(sessionHash: string, channelId: string, apiKeyId: string): Promise<SessionMapping> {
    // Redis 实现...
  }

  // ... 其他方法
}
```

#### 2. 修改 Module 配置（仅一行代码）

```typescript
// src/modules/claude-relay/claude-relay.module.ts

@Module({
  // ...
  providers: [
    // ...
    {
      provide: ISessionStorageService,
      // 只需要改这一行！
      useClass: RedisSessionStorageService, // 从 MemorySessionStorageService 改为 RedisSessionStorageService
    },
  ],
})
export class ClaudeRelayModule {}
```

#### 3. 业务代码完全不用改！✅

---

## 性能对比

| 维度 | 内存缓存 | Redis |
|------|---------|-------|
| **读取延迟** | <1ms | 1-3ms |
| **写入延迟** | <1ms | 1-3ms |
| **并发能力** | 10k+ ops/s | 100k+ ops/s |
| **持久化** | ❌ | ✅ |
| **分布式** | ❌ | ✅ |
| **适用场景** | 单实例、开发测试 | 生产环境、多实例 |

---

## 监控和调试

### 添加监控端点

```typescript
// src/modules/claude-relay/claude-relay.controller.ts

@Controller()
export class ClaudeRelayController {
  constructor(
    private claudeRelayService: ClaudeRelayService,
    private channelSelector: ClaudeChannelSelectorService,
  ) {}

  // ... 其他端点

  /**
   * 获取 Session 统计（用于监控）
   */
  @Get('/admin/session-stats')
  @UseGuards(AdminGuard)
  async getSessionStats() {
    const stats = await this.channelSelector.getSessionStats();

    // 如果是内存实现，可以获取更多信息
    const storage = this.channelSelector['sessionStorage'];
    if (storage instanceof MemorySessionStorageService) {
      return {
        ...stats,
        cacheSize: storage.getCacheSize(),
        storageType: 'memory',
      };
    }

    return { ...stats, storageType: 'redis' };
  }
}
```

### 日志输出

内存实现会自动输出关键日志：

```
[ClaudeChannelSelectorService] ✅ Sticky session hit: a3f5c8e9b2d1f4a7 → Channel A
[MemorySessionStorageService] Updated session mapping: a3f5c8e9b2d1f4a7 (count: 5)
[MemorySessionStorageService] Renewed session mapping: a3f5c8e9b2d1f4a7 (was 250s, now 3600s)
[MemorySessionStorageService] Cleaned up 15 expired sessions
```

---

## 总结

### ✅ 内存实现的优势

1. **零配置** - 无需安装 Redis
2. **快速验证** - 立即可用
3. **易调试** - 直接 console.log
4. **好扩展** - 接口抽象，随时切换

### 🎯 适用场景

- ✅ 开发环境
- ✅ 单实例部署
- ✅ 中小规模（< 10k sessions）
- ✅ 快速 MVP

### 🚀 升级时机

当出现以下情况时，考虑升级到 Redis：

1. 需要多实例部署
2. Session 数量 > 10k
3. 需要持久化
4. 需要跨服务共享

---

**文档版本**: 1.0.0
**最后更新**: 2024-01-15
**作者**: Claude Code Assistant
