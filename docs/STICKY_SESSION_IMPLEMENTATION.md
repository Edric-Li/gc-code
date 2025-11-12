# Sticky Session 实现方案

> Claude API 中继服务的会话粘性功能完整实现指南

## 📋 目录

- [功能概述](#功能概述)
- [架构设计](#架构设计)
- [数据模型](#数据模型)
- [核心实现](#核心实现)
- [配置说明](#配置说明)
- [测试方案](#测试方案)
- [部署指南](#部署指南)

---

## 功能概述

### 什么是 Sticky Session？

**Sticky Session（会话粘性）** 确保同一对话的所有请求都路由到同一个 Claude API 渠道。

### 核心价值

| 维度            | 说明                                     |
| --------------- | ---------------------------------------- |
| 🎯 **一致性**   | 同一对话使用相同渠道，避免切换带来的问题 |
| 💰 **成本可控** | 单个对话的费用集中在一个渠道，便于追踪   |
| 🔍 **易调试**   | 问题排查时，知道整个对话的完整请求路径   |
| ⚡ **性能优化** | 减少渠道切换开销，提高响应速度           |

### 工作流程

```
┌─────────────────┐
│ 用户第1次请求   │
│ "帮我写代码"    │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ 生成 Session Hash   │
│ hash_abc123          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 选择渠道: Channel A  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 保存映射             │
│ hash_abc123 → A      │
└──────────────────────┘

┌─────────────────┐
│ 用户第2次请求   │
│ "添加注释"      │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ 生成 Session Hash   │
│ hash_abc123          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 查询映射             │
│ hash_abc123 → A      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 复用 Channel A ✅    │
└──────────────────────┘
```

---

## 架构设计

### 模块结构

```
backend/src/modules/claude-relay/
├── services/
│   ├── session-hash.service.ts          # 会话哈希生成
│   ├── session-mapping.service.ts       # 会话映射存储（Redis）
│   ├── claude-channel-selector.service.ts  # 渠道选择（增强版）
│   └── claude-relay.service.ts          # 主服务（集成）
├── interfaces/
│   └── session.interface.ts             # Session 相关接口定义
└── constants/
    └── session.constants.ts             # Session 配置常量
```

### 技术选型

| 组件             | 技术                | 原因                             |
| ---------------- | ------------------- | -------------------------------- |
| **Session 存储** | Redis               | 高性能、支持过期时间、分布式友好 |
| **Hash 算法**    | SHA-256             | 安全、快速、碰撞率低             |
| **TTL 策略**     | 可配置（默认1小时） | 平衡内存使用和用户体验           |

---

## 数据模型

### Redis 数据结构

```typescript
// Key 格式
session:mapping:{sessionHash}

// Value 格式 (JSON)
{
  "sessionHash": "a3f5c8e9b2d1f4a7",
  "channelId": "channel-123",
  "apiKeyId": "key-456",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastAccessAt": "2024-01-15T10:35:00Z",
  "expiresAt": "2024-01-15T11:30:00Z",
  "requestCount": 5
}

// TTL: 3600 秒（1小时，可配置）
```

### Prisma Schema 扩展（可选）

如果需要持久化会话统计，可以添加：

```prisma
// prisma/schema.prisma

model SessionMapping {
  id            String   @id @default(cuid())
  sessionHash   String   @unique
  channelId     String
  apiKeyId      String

  // 统计信息
  requestCount  Int      @default(0)
  totalCost     Decimal  @default(0)

  // 时间信息
  createdAt     DateTime @default(now())
  lastAccessAt  DateTime @updatedAt
  expiresAt     DateTime

  // 关联
  channel       Channel  @relation(fields: [channelId], references: [id])
  apiKey        ApiKey   @relation(fields: [apiKeyId], references: [id])

  @@index([sessionHash])
  @@index([channelId])
  @@index([expiresAt])
}
```

---

## 核心实现

### 1. Session 接口定义

```typescript
// src/modules/claude-relay/interfaces/session.interface.ts

export interface SessionMapping {
  sessionHash: string;
  channelId: string;
  apiKeyId: string;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
  requestCount: number;
}

export interface SessionConfig {
  ttlSeconds: number; // Session TTL（默认 3600）
  renewThresholdSeconds: number; // 续期阈值（默认 300）
  hashAlgorithm: string; // Hash 算法（默认 sha256）
  hashLength: number; // Hash 长度（默认 16）
}

export interface SessionHashOptions {
  messageCount?: number; // 用于生成 hash 的消息数（默认 3）
  includeSystemPrompt?: boolean; // 是否包含系统提示词
}
```

### 2. Session 配置常量

```typescript
// src/modules/claude-relay/constants/session.constants.ts

export const SESSION_CONFIG = {
  // Redis Key 前缀
  REDIS_PREFIX: 'session:mapping:',

  // 默认 TTL（1小时）
  DEFAULT_TTL_SECONDS: 3600,

  // 续期阈值（5分钟）
  // 当剩余时间小于此值时，自动续期
  DEFAULT_RENEW_THRESHOLD_SECONDS: 300,

  // Hash 配置
  HASH_ALGORITHM: 'sha256',
  HASH_LENGTH: 16,

  // 用于生成 hash 的消息数
  DEFAULT_MESSAGE_COUNT: 3,

  // 是否包含系统提示词
  INCLUDE_SYSTEM_PROMPT: false,
} as const;

export const SESSION_ERRORS = {
  INVALID_MESSAGES: 'Invalid messages format for session hash generation',
  MAPPING_NOT_FOUND: 'Session mapping not found',
  CHANNEL_UNAVAILABLE: 'Mapped channel is no longer available',
  REDIS_ERROR: 'Redis operation failed',
} as const;
```

### 3. Session Hash 生成服务

```typescript
// src/modules/claude-relay/services/session-hash.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SESSION_CONFIG } from '../constants/session.constants';
import { SessionHashOptions } from '../interfaces/session.interface';

@Injectable()
export class SessionHashService {
  /**
   * 生成会话哈希
   */
  generateHash(messages: any[], options: SessionHashOptions = {}): string {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('Messages array cannot be empty');
    }

    const {
      messageCount = SESSION_CONFIG.DEFAULT_MESSAGE_COUNT,
      includeSystemPrompt = SESSION_CONFIG.INCLUDE_SYSTEM_PROMPT,
    } = options;

    // 提取用于生成哈希的内容
    const content = this.extractHashContent(messages, messageCount, includeSystemPrompt);

    // 生成哈希
    return this.computeHash(content);
  }

  /**
   * 提取用于生成哈希的内容
   */
  private extractHashContent(
    messages: any[],
    messageCount: number,
    includeSystemPrompt: boolean
  ): string {
    // 过滤消息
    let filteredMessages = messages;

    if (!includeSystemPrompt) {
      // 排除 system 角色的消息
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
              // 图片使用 source 的一部分
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
    const hash = crypto.createHash(SESSION_CONFIG.HASH_ALGORITHM).update(content).digest('hex');

    // 截取指定长度
    return hash.substring(0, SESSION_CONFIG.HASH_LENGTH);
  }

  /**
   * 验证会话哈希格式
   */
  validateHash(hash: string): boolean {
    if (typeof hash !== 'string') {
      return false;
    }

    // 检查长度
    if (hash.length !== SESSION_CONFIG.HASH_LENGTH) {
      return false;
    }

    // 检查是否为十六进制
    return /^[0-9a-f]+$/i.test(hash);
  }
}
```

### 4. Session 映射存储服务

```typescript
// src/modules/claude-relay/services/session-mapping.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SESSION_CONFIG, SESSION_ERRORS } from '../constants/session.constants';
import { SessionMapping } from '../interfaces/session.interface';

@Injectable()
export class SessionMappingService {
  private readonly logger = new Logger(SessionMappingService.name);
  private readonly redis: Redis;
  private readonly ttlSeconds: number;
  private readonly renewThresholdSeconds: number;

  constructor(private configService: ConfigService) {
    // 初始化 Redis 连接
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
    });

    // 加载配置
    this.ttlSeconds = this.configService.get(
      'SESSION_TTL_SECONDS',
      SESSION_CONFIG.DEFAULT_TTL_SECONDS
    );
    this.renewThresholdSeconds = this.configService.get(
      'SESSION_RENEW_THRESHOLD_SECONDS',
      SESSION_CONFIG.DEFAULT_RENEW_THRESHOLD_SECONDS
    );
  }

  /**
   * 获取 Redis Key
   */
  private getRedisKey(sessionHash: string): string {
    return `${SESSION_CONFIG.REDIS_PREFIX}${sessionHash}`;
  }

  /**
   * 获取会话映射
   */
  async getMapping(sessionHash: string): Promise<SessionMapping | null> {
    try {
      const key = this.getRedisKey(sessionHash);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const mapping = JSON.parse(data);

      // 转换日期字符串为 Date 对象
      mapping.createdAt = new Date(mapping.createdAt);
      mapping.lastAccessAt = new Date(mapping.lastAccessAt);
      mapping.expiresAt = new Date(mapping.expiresAt);

      return mapping;
    } catch (error) {
      this.logger.error(`Failed to get session mapping: ${error.message}`);
      return null;
    }
  }

  /**
   * 设置会话映射
   */
  async setMapping(
    sessionHash: string,
    channelId: string,
    apiKeyId: string
  ): Promise<SessionMapping> {
    try {
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

      const key = this.getRedisKey(sessionHash);
      await this.redis.setex(key, this.ttlSeconds, JSON.stringify(mapping));

      this.logger.log(
        `Created session mapping: ${sessionHash} → ${channelId} (TTL: ${this.ttlSeconds}s)`
      );

      return mapping;
    } catch (error) {
      this.logger.error(`Failed to set session mapping: ${error.message}`);
      throw new Error(SESSION_ERRORS.REDIS_ERROR);
    }
  }

  /**
   * 更新会话映射（增加请求计数、更新访问时间）
   */
  async updateMapping(sessionHash: string): Promise<void> {
    try {
      const mapping = await this.getMapping(sessionHash);

      if (!mapping) {
        return;
      }

      // 更新访问时间和请求计数
      mapping.lastAccessAt = new Date();
      mapping.requestCount += 1;

      const key = this.getRedisKey(sessionHash);

      // 获取剩余 TTL
      const ttl = await this.redis.ttl(key);

      // 更新数据，保持原有 TTL
      await this.redis.setex(
        key,
        Math.max(ttl, this.ttlSeconds), // 确保 TTL 不会减少
        JSON.stringify(mapping)
      );

      this.logger.debug(`Updated session mapping: ${sessionHash} (count: ${mapping.requestCount})`);
    } catch (error) {
      this.logger.error(`Failed to update session mapping: ${error.message}`);
    }
  }

  /**
   * 续期会话（延长过期时间）
   */
  async renewMapping(sessionHash: string): Promise<boolean> {
    try {
      const key = this.getRedisKey(sessionHash);

      // 获取剩余 TTL
      const remainingTtl = await this.redis.ttl(key);

      // 如果 key 不存在
      if (remainingTtl === -2) {
        this.logger.debug(`Session mapping not found for renewal: ${sessionHash}`);
        return false;
      }

      // 如果剩余时间小于续期阈值，则续期
      if (remainingTtl < this.renewThresholdSeconds) {
        await this.redis.expire(key, this.ttlSeconds);
        this.logger.log(
          `Renewed session mapping: ${sessionHash} (was ${remainingTtl}s, now ${this.ttlSeconds}s)`
        );
        return true;
      }

      this.logger.debug(
        `Session mapping TTL sufficient: ${sessionHash} (${remainingTtl}s remaining)`
      );
      return false;
    } catch (error) {
      this.logger.error(`Failed to renew session mapping: ${error.message}`);
      return false;
    }
  }

  /**
   * 删除会话映射
   */
  async deleteMapping(sessionHash: string): Promise<void> {
    try {
      const key = this.getRedisKey(sessionHash);
      await this.redis.del(key);
      this.logger.log(`Deleted session mapping: ${sessionHash}`);
    } catch (error) {
      this.logger.error(`Failed to delete session mapping: ${error.message}`);
    }
  }

  /**
   * 获取会话统计信息
   */
  async getStats(): Promise<{
    totalSessions: number;
    avgRequestsPerSession: number;
  }> {
    try {
      const pattern = `${SESSION_CONFIG.REDIS_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return { totalSessions: 0, avgRequestsPerSession: 0 };
      }

      // 获取所有映射数据
      const mappings = await Promise.all(
        keys.map(async (key) => {
          const data = await this.redis.get(key);
          return data ? JSON.parse(data) : null;
        })
      );

      const validMappings = mappings.filter((m) => m !== null);
      const totalRequests = validMappings.reduce((sum, m) => sum + m.requestCount, 0);

      return {
        totalSessions: validMappings.length,
        avgRequestsPerSession: validMappings.length > 0 ? totalRequests / validMappings.length : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get session stats: ${error.message}`);
      return { totalSessions: 0, avgRequestsPerSession: 0 };
    }
  }

  /**
   * 清理过期会话（手动清理，Redis 会自动清理）
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = `${SESSION_CONFIG.REDIS_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);

        // TTL = -1 表示永不过期（不应该出现）
        // TTL = -2 表示已经不存在
        if (ttl === -1) {
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired sessions: ${error.message}`);
      return 0;
    }
  }

  /**
   * 销毁服务时断开 Redis 连接
   */
  async onModuleDestroy() {
    await this.redis.quit();
  }
}
```

### 5. 增强的渠道选择服务

```typescript
// src/modules/claude-relay/services/claude-channel-selector.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Channel, ChannelStatus } from '@prisma/client';
import { SessionHashService } from './session-hash.service';
import { SessionMappingService } from './session-mapping.service';

@Injectable()
export class ClaudeChannelSelectorService {
  private readonly logger = new Logger(ClaudeChannelSelectorService.name);

  constructor(
    private prisma: PrismaService,
    private sessionHashService: SessionHashService,
    private sessionMappingService: SessionMappingService
  ) {}

  /**
   * 为 API Key 选择可用的 Claude 渠道（支持 Sticky Session）
   */
  async selectChannel(apiKey: any, requestBody: any): Promise<Channel> {
    // 1. 生成会话哈希
    const sessionHash = this.generateSessionHash(requestBody);

    // 2. 如果有会话哈希，尝试使用 Sticky Session
    if (sessionHash) {
      const stickyChannel = await this.tryGetStickyChannel(sessionHash, apiKey.id);

      if (stickyChannel) {
        this.logger.log(`Using sticky session: ${sessionHash} → ${stickyChannel.name}`);

        // 更新映射（增加请求计数）
        await this.sessionMappingService.updateMapping(sessionHash);

        // 自动续期
        await this.sessionMappingService.renewMapping(sessionHash);

        return stickyChannel;
      }
    }

    // 3. 没有 Sticky Session 或映射的渠道不可用，选择新渠道
    const newChannel = await this.selectNewChannel(apiKey);

    // 4. 建立新的会话映射
    if (sessionHash) {
      await this.sessionMappingService.setMapping(sessionHash, newChannel.id, apiKey.id);
      this.logger.log(`Created new sticky session: ${sessionHash} → ${newChannel.name}`);
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
    apiKeyId: string
  ): Promise<Channel | null> {
    try {
      // 获取会话映射
      const mapping = await this.sessionMappingService.getMapping(sessionHash);

      if (!mapping) {
        return null;
      }

      // 验证 API Key 是否匹配（防止跨用户使用）
      if (mapping.apiKeyId !== apiKeyId) {
        this.logger.warn(
          `Session API Key mismatch: ${sessionHash} (expected: ${apiKeyId}, got: ${mapping.apiKeyId})`
        );
        return null;
      }

      // 检查渠道是否仍然可用
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: mapping.channelId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!channel) {
        this.logger.warn(`Mapped channel not found or inactive: ${mapping.channelId}`);
        // 删除无效映射
        await this.sessionMappingService.deleteMapping(sessionHash);
        return null;
      }

      // 检查渠道状态
      if (channel.status !== ChannelStatus.ACTIVE) {
        this.logger.warn(
          `Mapped channel is not active: ${channel.name} (status: ${channel.status})`
        );

        // 如果是限流，保留映射，等待恢复
        if (channel.status === ChannelStatus.RATE_LIMITED) {
          // 检查是否已经恢复
          if (channel.rateLimitEndAt && new Date() > channel.rateLimitEndAt) {
            // 限流已过期，恢复渠道
            await this.restoreChannel(channel.id);
            return channel;
          }
        }

        // 删除映射，让用户使用其他渠道
        await this.sessionMappingService.deleteMapping(sessionHash);
        return null;
      }

      return channel;
    } catch (error) {
      this.logger.error(`Failed to get sticky channel: ${error.message}`);
      return null;
    }
  }

  /**
   * 选择新渠道（现有逻辑）
   */
  private async selectNewChannel(apiKey: any): Promise<Channel> {
    // 1. 如果 API Key 绑定了特定渠道,使用绑定的渠道
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

    // 2. 从共享渠道池中选择可用渠道
    const availableChannels = await this.prisma.channel.findMany({
      where: {
        isActive: true,
        status: ChannelStatus.ACTIVE,
        deletedAt: null,
        // 不在限流中
        OR: [{ rateLimitEndAt: null }, { rateLimitEndAt: { lte: new Date() } }],
      },
      orderBy: [
        { priority: 'asc' }, // 优先级排序
        { lastUsedAt: 'asc' }, // 最久未使用优先
      ],
    });

    if (availableChannels.length === 0) {
      throw new BadRequestException('No available Claude channels');
    }

    // 选择第一个渠道
    const selectedChannel = availableChannels[0];

    // 更新最后使用时间
    await this.prisma.channel.update({
      where: { id: selectedChannel.id },
      data: { lastUsedAt: new Date() },
    });

    return selectedChannel;
  }

  /**
   * 标记渠道为限流状态
   */
  async markChannelRateLimited(channelId: string, resetTimestamp?: number) {
    const resetTime = resetTimestamp ? new Date(resetTimestamp * 1000) : null;

    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.RATE_LIMITED,
        rateLimitEndAt: resetTime,
      },
    });
  }

  /**
   * 标记渠道为错误状态
   */
  async markChannelError(channelId: string) {
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.ERROR,
        lastErrorAt: new Date(),
      },
    });
  }

  /**
   * 恢复渠道为正常状态
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
}
```

---

## 配置说明

### 环境变量

在 `.env` 文件中添加：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Sticky Session 配置
SESSION_TTL_SECONDS=3600              # Session 过期时间（1小时）
SESSION_RENEW_THRESHOLD_SECONDS=300   # 续期阈值（5分钟）

# Session Hash 配置
SESSION_MESSAGE_COUNT=3               # 用于生成 hash 的消息数
SESSION_INCLUDE_SYSTEM_PROMPT=false   # 是否包含系统提示词
```

### Module 配置

```typescript
// src/modules/claude-relay/claude-relay.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClaudeRelayController } from './claude-relay.controller';
import { ClaudeRelayService } from './services/claude-relay.service';
import { ClaudeChannelSelectorService } from './services/claude-channel-selector.service';
import { SessionHashService } from './services/session-hash.service';
import { SessionMappingService } from './services/session-mapping.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ConfigModule, ApiKeysModule],
  controllers: [ClaudeRelayController],
  providers: [
    ClaudeRelayService,
    ClaudeChannelSelectorService,
    SessionHashService,
    SessionMappingService,
  ],
  exports: [ClaudeRelayService],
})
export class ClaudeRelayModule {}
```

---

## 测试方案

### 单元测试

```typescript
// src/modules/claude-relay/services/session-hash.service.spec.ts

describe('SessionHashService', () => {
  let service: SessionHashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionHashService],
    }).compile();

    service = module.get<SessionHashService>(SessionHashService);
  });

  describe('generateHash', () => {
    it('should generate same hash for same messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const hash1 = service.generateHash(messages);
      const hash2 = service.generateHash(messages);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hash for different messages', () => {
      const messages1 = [{ role: 'user', content: 'Hello' }];
      const messages2 = [{ role: 'user', content: 'Hi' }];

      const hash1 = service.generateHash(messages1);
      const hash2 = service.generateHash(messages2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle multimodal messages', () => {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' },
            { type: 'image', source: { data: 'base64data...' } },
          ],
        },
      ];

      const hash = service.generateHash(messages);
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(16);
    });

    it('should throw error for empty messages', () => {
      expect(() => service.generateHash([])).toThrow();
    });
  });

  describe('validateHash', () => {
    it('should validate correct hash', () => {
      const hash = 'a3f5c8e9b2d1f4a7';
      expect(service.validateHash(hash)).toBe(true);
    });

    it('should reject invalid hash length', () => {
      const hash = 'abc123';
      expect(service.validateHash(hash)).toBe(false);
    });

    it('should reject non-hex hash', () => {
      const hash = 'ghijklmnopqrstuv';
      expect(service.validateHash(hash)).toBe(false);
    });
  });
});
```

### 集成测试

```typescript
// src/modules/claude-relay/services/session-mapping.service.spec.ts

describe('SessionMappingService Integration', () => {
  let service: SessionMappingService;
  let redis: Redis;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [SessionMappingService],
    }).compile();

    service = module.get<SessionMappingService>(SessionMappingService);

    // 使用测试 Redis 数据库
    redis = new Redis({ db: 15 });
  });

  afterAll(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  afterEach(async () => {
    // 清理测试数据
    const keys = await redis.keys('session:mapping:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  describe('setMapping and getMapping', () => {
    it('should set and get mapping', async () => {
      const sessionHash = 'test123';
      const channelId = 'channel-456';
      const apiKeyId = 'key-789';

      const mapping = await service.setMapping(sessionHash, channelId, apiKeyId);

      expect(mapping.sessionHash).toBe(sessionHash);
      expect(mapping.channelId).toBe(channelId);
      expect(mapping.requestCount).toBe(1);

      const retrieved = await service.getMapping(sessionHash);
      expect(retrieved).toBeTruthy();
      expect(retrieved.channelId).toBe(channelId);
    });

    it('should return null for non-existent mapping', async () => {
      const mapping = await service.getMapping('nonexistent');
      expect(mapping).toBeNull();
    });
  });

  describe('updateMapping', () => {
    it('should update request count', async () => {
      const sessionHash = 'test456';
      await service.setMapping(sessionHash, 'ch-1', 'key-1');

      await service.updateMapping(sessionHash);
      await service.updateMapping(sessionHash);

      const mapping = await service.getMapping(sessionHash);
      expect(mapping.requestCount).toBe(3); // 1 + 2
    });
  });

  describe('renewMapping', () => {
    it('should renew mapping when TTL is low', async () => {
      const sessionHash = 'test789';
      await service.setMapping(sessionHash, 'ch-1', 'key-1');

      // 手动设置较短的 TTL
      const key = `session:mapping:${sessionHash}`;
      await redis.expire(key, 100); // 100 秒

      const renewed = await service.renewMapping(sessionHash);
      expect(renewed).toBe(true);

      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(3000); // 应该被续期到 3600 秒
    });
  });

  describe('deleteMapping', () => {
    it('should delete mapping', async () => {
      const sessionHash = 'test999';
      await service.setMapping(sessionHash, 'ch-1', 'key-1');

      await service.deleteMapping(sessionHash);

      const mapping = await service.getMapping(sessionHash);
      expect(mapping).toBeNull();
    });
  });
});
```

### E2E 测试

```typescript
// test/claude-relay-sticky-session.e2e-spec.ts

describe('Claude Relay Sticky Session E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should use same channel for conversation', async () => {
    const apiKey = 'test-api-key';

    // 第一次请求
    const res1 = await request(app.getHttpServer())
      .post('/v1/messages')
      .set('x-api-key', apiKey)
      .send({
        model: 'claude-sonnet-4-5-20250929',
        messages: [{ role: 'user', content: 'Hello' }],
      });

    expect(res1.status).toBe(200);
    const channelId1 = res1.body.channelId; // 假设返回了渠道ID

    // 第二次请求（继续对话）
    const res2 = await request(app.getHttpServer())
      .post('/v1/messages')
      .set('x-api-key', apiKey)
      .send({
        model: 'claude-sonnet-4-5-20250929',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      });

    expect(res2.status).toBe(200);
    const channelId2 = res2.body.channelId;

    // 应该使用相同渠道
    expect(channelId1).toBe(channelId2);
  });

  it('should switch channel when mapped channel is unavailable', async () => {
    // 创建会话并映射到渠道 A
    // 禁用渠道 A
    // 发送新请求
    // 应该自动切换到渠道 B
  });
});
```

---

## 部署指南

### 1. 安装 Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### 2. 安装依赖

```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 3. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
vim .env
```

### 4. 测试 Redis 连接

```typescript
// test-redis.ts
import Redis from 'ioredis';

const redis = new Redis();

redis.set('test', 'hello');
redis.get('test').then(console.log); // 输出: hello

redis.quit();
```

### 5. 运行应用

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 6. 监控和维护

#### 查看 Session 统计

```bash
# Redis CLI
redis-cli

# 查看所有 session keys
KEYS session:mapping:*

# 查看特定 session
GET session:mapping:a3f5c8e9b2d1f4a7

# 查看 TTL
TTL session:mapping:a3f5c8e9b2d1f4a7
```

#### 清理过期 Session

可以通过定时任务自动清理：

```typescript
// src/modules/claude-relay/tasks/session-cleanup.task.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionMappingService } from '../services/session-mapping.service';

@Injectable()
export class SessionCleanupTask {
  private readonly logger = new Logger(SessionCleanupTask.name);

  constructor(private sessionMappingService: SessionMappingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    this.logger.log('Starting session cleanup task');

    const cleanedCount = await this.sessionMappingService.cleanupExpiredSessions();

    this.logger.log(`Session cleanup completed: ${cleanedCount} sessions cleaned`);
  }
}
```

---

## 常见问题

### Q1: Session Hash 会冲突吗？

**A**: 使用 SHA-256 生成 16 位十六进制字符串，碰撞概率极低（约 1/2^64）。即使有 100 万个活跃会话，碰撞概率也小于 0.00001%。

### Q2: 为什么使用 Redis 而不是数据库？

**A**:

- ✅ 更快的读写速度
- ✅ 原生支持 TTL（自动过期）
- ✅ 更适合临时数据存储
- ✅ 支持分布式部署

### Q3: Session 过期后会怎样？

**A**: Session 过期后，Redis 会自动删除映射。下次请求会创建新的 Session 并选择新渠道。

### Q4: 如何调整 Session TTL？

**A**: 通过环境变量 `SESSION_TTL_SECONDS` 配置，建议：

- 短对话：600 秒（10分钟）
- 中等对话：3600 秒（1小时）
- 长对话：7200 秒（2小时）

### Q5: 渠道故障时如何处理？

**A**: 系统会自动删除映射并选择新渠道，用户体验无缝切换。

---

**文档版本**: 1.0.0
**最后更新**: 2024-01-15
**作者**: Claude Code Assistant
