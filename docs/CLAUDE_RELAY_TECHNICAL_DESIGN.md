# Claude API 中继服务技术方案

> 基于 claude-relay-service 分析，为当前 NestJS 项目设计的 Claude API 中继实现方案

## 目录

- [一、核心架构设计](#一核心架构设计)
- [二、数据模型设计](#二数据模型设计)
- [三、核心代码实现](#三核心代码实现)
- [四、关键特性说明](#四关键特性说明)
- [五、部署建议](#五部署建议)
- [六、与 claude-relay-service 的主要区别](#六与-claude-relay-service-的主要区别)
- [七、后续扩展方向](#七后续扩展方向)

---

## 一、核心架构设计

### 1.1 系统流程

```
Client Request → API Key 验证 → 渠道选择 → Claude API 请求转发 → 响应处理 → 使用统计记录
```

### 1.2 核心模块

```
backend/src/modules/
├── claude-relay/           # 新建 Claude 中继模块
│   ├── claude-relay.module.ts
│   ├── claude-relay.controller.ts     # 处理 /v1/messages 等 API 端点
│   ├── claude-relay.service.ts        # 核心转发逻辑
│   ├── claude-channel-selector.service.ts  # 渠道选择逻辑
│   ├── guards/
│   │   └── api-key.guard.ts           # API Key 验证守卫
│   └── dto/
│       ├── claude-request.dto.ts       # Claude API 请求格式
│       └── claude-response.dto.ts      # Claude API 响应格式
```

### 1.3 请求处理流程图

```
┌─────────────┐
│ Client      │
│ Request     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ API Key Guard   │  ← 验证 API Key 有效性
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Channel Selector │  ← 选择可用渠道
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│ Claude API      │  ← 转发请求
│ Request         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Response        │  ← 处理响应
│ Processing      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Usage           │  ← 记录统计
│ Recording       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Return to       │
│ Client          │
└─────────────────┘
```

---

## 二、数据模型设计

基于已有的 Prisma Schema，对 `Channel` 表进行扩展：

### 2.1 扩展 Channel 模型

```prisma
// prisma/schema.prisma

model Channel {
  id           String   @id @default(cuid())
  name         String
  providerId   String
  provider     AIProvider @relation(fields: [providerId], references: [id])

  // 认证信息
  apiKey       String   // Claude API Key
  baseUrl      String?  @default("https://api.anthropic.com")

  // 状态管理
  status       ChannelStatus @default(ACTIVE)
  isActive     Boolean  @default(true)
  priority     Int      @default(50)      // 优先级,数字越小优先级越高

  // 限流管理
  rateLimitEndAt  DateTime?             // 限流结束时间
  lastUsedAt      DateTime?             // 最后使用时间
  lastErrorAt     DateTime?             // 最后错误时间

  // 关联关系
  apiKeys      ApiKey[]
  usage        ChannelUsage[]          // 新建:渠道使用统计表

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  @@index([status, isActive, priority])
  @@index([rateLimitEndAt])
}

enum ChannelStatus {
  ACTIVE        // 正常
  RATE_LIMITED  // 限流中
  ERROR         // 错误
  DISABLED      // 禁用
}
```

### 2.2 新增 ChannelUsage 模型

```prisma
// 渠道使用统计表
model ChannelUsage {
  id              String   @id @default(cuid())
  channelId       String
  channel         Channel  @relation(fields: [channelId], references: [id])

  // 统计数据
  periodStart     DateTime
  periodEnd       DateTime
  requestCount    Int      @default(0)
  successCount    Int      @default(0)
  failureCount    Int      @default(0)

  // Token 使用
  inputTokens     Int      @default(0)
  outputTokens    Int      @default(0)
  cacheReadTokens Int      @default(0)
  cacheCreateTokens Int    @default(0)

  cost            Decimal  @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([channelId, periodStart])
  @@index([channelId, periodStart])
}
```

### 2.3 数据库迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name add_channel_relay_fields

# 应用迁移
npx prisma migrate deploy
```

---

## 三、核心代码实现

### 3.1 API Key 验证守卫

```typescript
// src/modules/claude-relay/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 从多种来源提取 API Key
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    try {
      // 验证 API Key
      const validation = await this.apiKeysService.validateKey(apiKey);

      // 将验证结果附加到请求对象
      request.apiKey = validation.apiKey;
      request.user = validation.user;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private extractApiKey(request: any): string | null {
    // 支持多种格式: x-api-key, Authorization Bearer
    const apiKey =
      request.headers['x-api-key'] || request.headers['authorization']?.replace(/^Bearer\s+/i, '');

    return apiKey || null;
  }
}
```

### 3.2 渠道选择服务

```typescript
// src/modules/claude-relay/claude-channel-selector.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Channel, ChannelStatus } from '@prisma/client';

@Injectable()
export class ClaudeChannelSelectorService {
  constructor(private prisma: PrismaService) {}

  /**
   * 为 API Key 选择可用的 Claude 渠道
   */
  async selectChannel(apiKey: any): Promise<Channel> {
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

### 3.3 Claude API 转发服务

```typescript
// src/modules/claude-relay/claude-relay.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ClaudeChannelSelectorService } from './claude-channel-selector.service';
import * as https from 'https';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClaudeRelayService {
  constructor(
    private prisma: PrismaService,
    private channelSelector: ClaudeChannelSelectorService
  ) {}

  /**
   * 转发请求到 Claude API (非流式)
   */
  async relayRequest(apiKey: any, requestBody: any): Promise<any> {
    // 1. 选择渠道
    const channel = await this.channelSelector.selectChannel(apiKey);

    try {
      // 2. 发送请求到 Claude API
      const response = await this.makeClaudeRequest(channel, requestBody);

      // 3. 请求成功,恢复渠道状态
      if (channel.status !== 'ACTIVE') {
        await this.channelSelector.restoreChannel(channel.id);
      }

      // 4. 记录使用统计
      await this.recordUsage(apiKey.id, channel.id, requestBody, response);

      return response;
    } catch (error) {
      // 处理错误
      await this.handleError(channel.id, error);
      throw error;
    }
  }

  /**
   * 转发流式请求到 Claude API
   */
  async relayStreamRequest(apiKey: any, requestBody: any, responseStream: any): Promise<void> {
    const channel = await this.channelSelector.selectChannel(apiKey);

    try {
      await this.makeClaudeStreamRequest(channel, requestBody, responseStream);

      if (channel.status !== 'ACTIVE') {
        await this.channelSelector.restoreChannel(channel.id);
      }
    } catch (error) {
      await this.handleError(channel.id, error);
      throw error;
    }
  }

  /**
   * 发送请求到 Claude API (非流式)
   */
  private async makeClaudeRequest(channel: any, body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(channel.baseUrl || 'https://api.anthropic.com');

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': channel.apiKey,
          'anthropic-version': '2023-06-01',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Failed to parse Claude API response'));
            }
          } else {
            reject(
              new HttpException(
                JSON.parse(data),
                res.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
              )
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * 发送流式请求到 Claude API
   */
  private async makeClaudeStreamRequest(
    channel: any,
    body: any,
    responseStream: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(channel.baseUrl || 'https://api.anthropic.com');

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': channel.apiKey,
          'anthropic-version': '2023-06-01',
        },
      };

      const req = https.request(options, (res) => {
        // 设置流式响应头
        responseStream.setHeader('Content-Type', 'text/event-stream');
        responseStream.setHeader('Cache-Control', 'no-cache');
        responseStream.setHeader('Connection', 'keep-alive');

        res.on('data', (chunk) => {
          responseStream.write(chunk);
        });

        res.on('end', () => {
          responseStream.end();
          resolve();
        });

        res.on('error', (error) => {
          reject(error);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * 处理错误
   */
  private async handleError(channelId: string, error: any) {
    if (error.status === 429) {
      // 限流错误
      const resetHeader = error.headers?.['anthropic-ratelimit-unified-reset'];
      const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) : null;
      await this.channelSelector.markChannelRateLimited(channelId, resetTimestamp);
    } else if (error.status === 401 || error.status === 403) {
      // 认证错误
      await this.channelSelector.markChannelError(channelId);
    }
  }

  /**
   * 记录使用统计
   */
  private async recordUsage(keyId: string, channelId: string, request: any, response: any) {
    const usage = response.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;
    const cacheCreateTokens = usage.cache_creation_input_tokens || 0;

    // 计算费用 (需要根据模型定价)
    const cost = this.calculateCost(request.model, usage);

    // 获取今天的使用记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 更新或创建使用记录
    await this.prisma.apiKeyUsage.upsert({
      where: {
        keyId_periodStart: {
          keyId,
          periodStart: today,
        },
      },
      update: {
        requestCount: { increment: 1 },
        successCount: { increment: 1 },
        tokensUsed: { increment: inputTokens + outputTokens },
        cost: { increment: cost },
      },
      create: {
        keyId,
        userId: (await this.prisma.apiKey.findUnique({ where: { id: keyId } }))!.userId,
        periodStart: today,
        periodEnd: tomorrow,
        requestCount: 1,
        successCount: 1,
        failureCount: 0,
        tokensUsed: inputTokens + outputTokens,
        cost,
      },
    });
  }

  /**
   * 计算费用
   */
  private calculateCost(model: string, usage: any): number {
    // 简化的定价逻辑,实际应从配置文件读取
    const pricing: Record<string, any> = {
      'claude-opus-4-20250514': {
        input: 15.0 / 1_000_000,
        output: 75.0 / 1_000_000,
        cacheWrite: 18.75 / 1_000_000,
        cacheRead: 1.5 / 1_000_000,
      },
      'claude-sonnet-4-5-20250929': {
        input: 3.0 / 1_000_000,
        output: 15.0 / 1_000_000,
        cacheWrite: 3.75 / 1_000_000,
        cacheRead: 0.3 / 1_000_000,
      },
    };

    const modelPricing = pricing[model] || pricing['claude-sonnet-4-5-20250929'];

    const cost =
      (usage.input_tokens || 0) * modelPricing.input +
      (usage.output_tokens || 0) * modelPricing.output +
      (usage.cache_creation_input_tokens || 0) * modelPricing.cacheWrite +
      (usage.cache_read_input_tokens || 0) * modelPricing.cacheRead;

    return cost;
  }
}
```

### 3.4 Controller 实现

```typescript
// src/modules/claude-relay/claude-relay.controller.ts
import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { ClaudeRelayService } from './claude-relay.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { Request, Response } from 'express';

@Controller()
@UseGuards(ApiKeyGuard)
export class ClaudeRelayController {
  constructor(private claudeRelayService: ClaudeRelayService) {}

  /**
   * Claude API 消息端点 (非流式)
   */
  @Post('/v1/messages')
  async messages(@Req() req: Request, @Body() body: any) {
    const apiKey = (req as any).apiKey;

    // 检查是否为流式请求
    if (body.stream) {
      throw new Error('Stream requests should use streaming endpoint');
    }

    return await this.claudeRelayService.relayRequest(apiKey, body);
  }

  /**
   * Claude API 流式消息端点
   */
  @Post('/v1/messages/stream')
  async messagesStream(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const apiKey = (req as any).apiKey;

    // 设置为流式请求
    body.stream = true;

    await this.claudeRelayService.relayStreamRequest(apiKey, body, res);
  }
}
```

### 3.5 Module 配置

```typescript
// src/modules/claude-relay/claude-relay.module.ts
import { Module } from '@nestjs/common';
import { ClaudeRelayController } from './claude-relay.controller';
import { ClaudeRelayService } from './claude-relay.service';
import { ClaudeChannelSelectorService } from './claude-channel-selector.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [ClaudeRelayController],
  providers: [ClaudeRelayService, ClaudeChannelSelectorService],
  exports: [ClaudeRelayService],
})
export class ClaudeRelayModule {}
```

---

## 四、关键特性说明

### 4.1 渠道选择策略

参考 claude-relay-service 的实现，支持：

#### 选择优先级

1. **绑定渠道优先**: 如果 API Key 绑定了特定渠道，优先使用
2. **优先级排序**: 按渠道优先级选择（priority 字段，数字越小优先级越高）
3. **负载均衡**: 选择最久未使用的渠道（lastUsedAt 字段）
4. **健康检查**: 自动排除限流和错误的渠道

#### 选择逻辑流程

```typescript
// 伪代码示例
if (apiKey.channelId) {
  // 使用绑定的渠道
  return boundChannel;
} else {
  // 从池中选择
  const channels = findAll({
    isActive: true,
    status: ACTIVE,
    rateLimitEndAt: null or expired
  });

  // 按优先级和最后使用时间排序
  channels.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.lastUsedAt - b.lastUsedAt;
  });

  return channels[0];
}
```

### 4.2 错误处理机制

#### 支持的错误类型

| 错误码 | 处理方式            | 说明                 |
| ------ | ------------------- | -------------------- |
| 429    | 标记为 RATE_LIMITED | 从响应头获取重置时间 |
| 401    | 标记为 ERROR        | API Key 无效         |
| 403    | 标记为 ERROR        | 权限不足             |
| 5xx    | 标记为 ERROR        | 服务器错误           |

#### 自动恢复机制

```typescript
// 请求成功后自动恢复渠道状态
if (response.statusCode === 200) {
  if (channel.status !== 'ACTIVE') {
    await restoreChannel(channel.id);
  }
}
```

### 4.3 使用统计

#### 统计维度

1. **Token 使用量**:
   - `input_tokens`: 输入 tokens
   - `output_tokens`: 输出 tokens
   - `cache_read_input_tokens`: 缓存读取 tokens
   - `cache_creation_input_tokens`: 缓存创建 tokens

2. **请求统计**:
   - `requestCount`: 总请求数
   - `successCount`: 成功请求数
   - `failureCount`: 失败请求数

3. **费用计算**:
   - 根据模型定价自动计算
   - 支持缓存定价

#### 聚合策略

使用 Prisma 的 `upsert` 模式，按天聚合统计数据：

```typescript
await prisma.apiKeyUsage.upsert({
  where: {
    keyId_periodStart: {
      keyId,
      periodStart: today,
    },
  },
  update: {
    requestCount: { increment: 1 },
    successCount: { increment: 1 },
    tokensUsed: { increment: inputTokens + outputTokens },
    cost: { increment: cost },
  },
  create: {
    // ... 创建新记录
  },
});
```

### 4.4 流式响应处理

支持 Server-Sent Events (SSE) 格式的流式响应：

```typescript
// 设置 SSE 响应头
responseStream.setHeader('Content-Type', 'text/event-stream');
responseStream.setHeader('Cache-Control', 'no-cache');
responseStream.setHeader('Connection', 'keep-alive');

// 直接转发 Claude API 的流式数据
claudeResponse.on('data', (chunk) => {
  responseStream.write(chunk);
});
```

---

## 五、部署建议

### 5.1 环境变量

在 `.env` 文件中添加：

```env
# Claude API 配置
CLAUDE_API_VERSION=2023-06-01
CLAUDE_DEFAULT_BASE_URL=https://api.anthropic.com

# 超时配置
CLAUDE_REQUEST_TIMEOUT=600000  # 10分钟 (毫秒)

# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

### 5.2 性能优化建议

#### 1. HTTP 连接池

```typescript
import * as https from 'https';

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

// 在请求时使用
const options = {
  // ...
  agent: httpsAgent,
};
```

#### 2. Redis 缓存

对于频繁查询的渠道信息，可以使用 Redis 缓存：

```typescript
// 缓存渠道列表
const cacheKey = `channels:available`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const channels = await prisma.channel.findMany(/* ... */);
await redis.setex(cacheKey, 60, JSON.stringify(channels)); // 缓存60秒

return channels;
```

#### 3. 并发控制

限制单个渠道的并发请求数：

```typescript
// Channel 模型添加字段
maxConcurrentRequests: Int @default(10)
currentConcurrentRequests: Int @default(0)

// 请求前检查
if (channel.currentConcurrentRequests >= channel.maxConcurrentRequests) {
  // 选择其他渠道
}

// 使用事务更新并发数
await prisma.$transaction([
  prisma.channel.update({
    where: { id: channelId },
    data: { currentConcurrentRequests: { increment: 1 } },
  }),
  // ... 发送请求
  prisma.channel.update({
    where: { id: channelId },
    data: { currentConcurrentRequests: { decrement: 1 } },
  }),
]);
```

### 5.3 监控和告警

#### 关键指标监控

1. **渠道健康度**:
   - 可用渠道数量
   - 限流渠道数量
   - 错误渠道数量

2. **性能指标**:
   - 平均响应时间
   - 请求成功率
   - Token 使用量

3. **成本监控**:
   - 每日总成本
   - 各渠道成本分布
   - 异常高成本预警

#### 日志记录

```typescript
import { Logger } from '@nestjs/common';

export class ClaudeRelayService {
  private readonly logger = new Logger(ClaudeRelayService.name);

  async relayRequest(apiKey: any, requestBody: any): Promise<any> {
    this.logger.log(`Processing request for API Key: ${apiKey.id}`);

    try {
      const channel = await this.channelSelector.selectChannel(apiKey);
      this.logger.log(`Selected channel: ${channel.id} (${channel.name})`);

      // ...
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

---

## 六、与 claude-relay-service 的主要区别

| 功能               | claude-relay-service | 本方案              | 说明                  |
| ------------------ | -------------------- | ------------------- | --------------------- |
| **多账户管理**     | 支持 (Redis)         | 简化版 (仅渠道)     | 不需要 OAuth 账户管理 |
| **Sticky Session** | 支持                 | 暂不支持            | 可后续扩展            |
| **多供应商**       | Claude/Gemini/OpenAI | 仅 Claude           | 聚焦 Claude           |
| **并发限制**       | 支持                 | 简化版              | API Key 级别          |
| **数据库**         | Redis                | PostgreSQL (Prisma) | 持久化存储            |
| **架构**           | Express.js           | NestJS              | 类型安全              |
| **用户管理**       | 无                   | 完整用户系统        | 支持多用户            |
| **统计分析**       | 基础                 | 完整                | 详细的使用统计        |

### 功能对比详情

#### 1. 账户管理

**claude-relay-service**:

- 支持多个 Claude OAuth 账户
- 需要管理 session token
- 复杂的账户状态同步

**本方案**:

- 只管理渠道（API Key）
- 更简单直接
- 适合企业使用场景

#### 2. 路由策略

**claude-relay-service**:

- 支持会话粘性（同一对话使用同一账户）
- 复杂的账户选择算法
- 支持账户分组

**本方案**:

- 简单的优先级+负载均衡
- 基于渠道的路由
- 后续可扩展 sticky session

#### 3. 数据持久化

**claude-relay-service**:

- 使用 Redis 存储所有数据
- 重启后数据丢失

**本方案**:

- 使用 PostgreSQL 持久化
- 完整的数据历史
- 支持复杂查询和统计

---

## 七、后续扩展方向

### 7.1 短期扩展（1-2周）

#### 1. Sticky Session 支持

为同一对话保持使用相同渠道：

```typescript
interface SessionMapping {
  sessionHash: string;  // 基于消息内容生成
  channelId: string;
  createdAt: Date;
  expiresAt: Date;
}

// 生成会话哈希
function generateSessionHash(messages: any[]): string {
  // 使用前几条消息生成哈希
  const content = messages.slice(0, 3).map(m => m.content).join('|');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 在渠道选择时检查
async selectChannel(apiKey: any, sessionHash?: string): Promise<Channel> {
  if (sessionHash) {
    const mapping = await this.getSessionMapping(sessionHash);
    if (mapping && await this.isChannelAvailable(mapping.channelId)) {
      return await this.getChannel(mapping.channelId);
    }
  }
  // ... 正常选择逻辑
}
```

#### 2. 并发限制增强

添加 API Key 级别的精确并发控制：

```typescript
// 使用 Redis 计数器
async acquireConcurrencySlot(keyId: string, limit: number): Promise<boolean> {
  const key = `concurrency:${keyId}`;
  const current = await redis.incr(key);

  if (current > limit) {
    await redis.decr(key);
    return false;
  }

  await redis.expire(key, 600); // 10分钟超时
  return true;
}

async releaseConcurrencySlot(keyId: string): Promise<void> {
  await redis.decr(`concurrency:${keyId}`);
}
```

### 7.2 中期扩展（1-2月）

#### 1. 多供应商支持

扩展支持 OpenAI、Gemini 等：

```typescript
interface ProviderAdapter {
  makeRequest(channel: Channel, body: any): Promise<any>;
  makeStreamRequest(channel: Channel, body: any, stream: any): Promise<void>;
  calculateCost(model: string, usage: any): number;
}

class ClaudeAdapter implements ProviderAdapter {
  // Claude 特定实现
}

class OpenAIAdapter implements ProviderAdapter {
  // OpenAI 特定实现
}

// 在服务中使用
const adapter = this.getAdapter(channel.provider.slug);
const response = await adapter.makeRequest(channel, requestBody);
```

#### 2. 智能路由

基于多种条件的智能选择：

```typescript
interface RouteStrategy {
  selectChannel(
    apiKey: any,
    request: any,
    options: {
      preferLowCost?: boolean;
      preferLowLatency?: boolean;
      preferHighQuota?: boolean;
    }
  ): Promise<Channel>;
}

// 成本优先策略
class CostOptimizedStrategy implements RouteStrategy {
  async selectChannel(apiKey, request, options) {
    const channels = await this.getAvailableChannels(apiKey);

    // 根据历史数据预估成本
    const channelsWithCost = await Promise.all(
      channels.map(async (ch) => ({
        channel: ch,
        estimatedCost: await this.estimateCost(ch, request.model),
      }))
    );

    // 选择成本最低的
    return channelsWithCost.sort((a, b) => a.estimatedCost - b.estimatedCost)[0].channel;
  }
}
```

### 7.3 长期扩展（3-6月）

#### 1. 实时监控面板

使用 WebSocket 实时推送监控数据：

```typescript
@WebSocketGateway()
export class MonitoringGateway {
  @WebSocketServer()
  server: Server;

  // 定时推送渠道状态
  @Cron('*/10 * * * * *') // 每10秒
  async pushChannelStats() {
    const stats = await this.getChannelStats();
    this.server.emit('channel-stats', stats);
  }

  private async getChannelStats() {
    return {
      total: await this.countChannels({ isActive: true }),
      active: await this.countChannels({ status: 'ACTIVE' }),
      rateLimited: await this.countChannels({ status: 'RATE_LIMITED' }),
      error: await this.countChannels({ status: 'ERROR' }),
    };
  }
}
```

#### 2. 高级分析

提供详细的使用分析和优化建议：

```typescript
interface UsageAnalytics {
  // 成本分析
  costBreakdown: {
    byModel: Record<string, number>;
    byChannel: Record<string, number>;
    byUser: Record<string, number>;
  };

  // 性能分析
  performanceMetrics: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    successRate: number;
  };

  // 优化建议
  recommendations: {
    overusedModels: string[];
    underutilizedChannels: string[];
    costSavingOpportunities: string[];
  };
}

export class AnalyticsService {
  async generateReport(
    userId: string,
    period: { start: Date; end: Date }
  ): Promise<UsageAnalytics> {
    // 复杂的聚合查询和分析逻辑
  }
}
```

#### 3. 自动化运维

智能化的渠道管理和优化：

```typescript
export class AutoOpsService {
  // 自动检测和恢复异常渠道
  @Cron('0 */5 * * * *') // 每5分钟
  async autoHealChannels() {
    const errorChannels = await this.getErrorChannels();

    for (const channel of errorChannels) {
      // 尝试健康检查
      if (await this.healthCheck(channel)) {
        await this.channelSelector.restoreChannel(channel.id);
        this.logger.log(`Auto-healed channel: ${channel.name}`);
      }
    }
  }

  // 自动调整渠道优先级
  @Cron('0 0 * * *') // 每天
  async optimizePriorities() {
    const channels = await this.getAllChannels();

    // 根据成功率、响应时间等指标自动调整优先级
    for (const channel of channels) {
      const metrics = await this.getChannelMetrics(channel.id);
      const newPriority = this.calculateOptimalPriority(metrics);

      if (newPriority !== channel.priority) {
        await this.updateChannelPriority(channel.id, newPriority);
      }
    }
  }

  private async healthCheck(channel: Channel): Promise<boolean> {
    try {
      // 发送测试请求
      const response = await this.makeTestRequest(channel);
      return response.statusCode === 200;
    } catch {
      return false;
    }
  }
}
```

---

## 八、测试策略

### 8.1 单元测试

```typescript
// claude-channel-selector.service.spec.ts
describe('ClaudeChannelSelectorService', () => {
  let service: ClaudeChannelSelectorService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaudeChannelSelectorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClaudeChannelSelectorService>(ClaudeChannelSelectorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should select bound channel when available', async () => {
    const apiKey = { channelId: 'channel-1' };
    const mockChannel = { id: 'channel-1', name: 'Test Channel' };

    jest.spyOn(prisma.channel, 'findFirst').mockResolvedValue(mockChannel);

    const result = await service.selectChannel(apiKey);

    expect(result).toEqual(mockChannel);
    expect(prisma.channel.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: 'channel-1',
        isActive: true,
        status: ChannelStatus.ACTIVE,
      }),
    });
  });

  it('should select from pool when no bound channel', async () => {
    const apiKey = { channelId: null };
    const mockChannels = [
      { id: 'channel-1', priority: 10, lastUsedAt: new Date('2024-01-01') },
      { id: 'channel-2', priority: 20, lastUsedAt: new Date('2024-01-02') },
    ];

    jest.spyOn(prisma.channel, 'findMany').mockResolvedValue(mockChannels);

    const result = await service.selectChannel(apiKey);

    expect(result.id).toBe('channel-1'); // 优先级最高的
  });
});
```

### 8.2 集成测试

```typescript
// claude-relay.service.integration.spec.ts
describe('ClaudeRelayService Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should relay request to Claude API', async () => {
    // 创建测试数据
    const user = await prisma.user.create({
      data: { username: 'test', email: 'test@test.com' },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Test Channel',
        apiKey: process.env.CLAUDE_TEST_API_KEY,
        providerId: 'provider-id',
      },
    });

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        channelId: channel.id,
        name: 'Test Key',
        key: 'sk-test-key',
      },
    });

    // 发送请求
    const response = await request(app.getHttpServer())
      .post('/v1/messages')
      .set('x-api-key', apiKey.key)
      .send({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Hello' }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('content');
    expect(response.body).toHaveProperty('usage');
  });
});
```

### 8.3 E2E 测试

```typescript
// claude-relay.e2e-spec.ts
describe('Claude Relay E2E', () => {
  it('should handle rate limit gracefully', async () => {
    // 模拟限流场景
    const channel = await createChannel({
      /* ... */
    });

    // 标记为限流
    await markChannelRateLimited(channel.id);

    const response = await request(app.getHttpServer())
      .post('/v1/messages')
      .set('x-api-key', testApiKey)
      .send(testRequest);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('No available Claude channels');
  });

  it('should auto-recover channel after successful request', async () => {
    const channel = await createChannel({ status: 'ERROR' });

    // 模拟成功的 Claude API 响应
    mockClaudeAPI.mockSuccessResponse();

    await request(app.getHttpServer())
      .post('/v1/messages')
      .set('x-api-key', testApiKey)
      .send(testRequest);

    const updatedChannel = await getChannel(channel.id);
    expect(updatedChannel.status).toBe('ACTIVE');
  });
});
```

---

## 九、常见问题 FAQ

### Q1: 如何添加新的 Claude 渠道？

**A**: 通过管理 API 创建新渠道：

```bash
POST /api/channels
{
  "name": "My Claude Channel",
  "providerId": "claude-provider-id",
  "apiKey": "sk-ant-api03-...",
  "baseUrl": "https://api.anthropic.com",
  "priority": 50,
  "isActive": true
}
```

### Q2: 渠道限流后多久会自动恢复？

**A**: 系统会根据 Claude API 返回的 `anthropic-ratelimit-unified-reset` 响应头自动设置恢复时间。如果没有该响应头，渠道会保持限流状态，需要手动恢复。

### Q3: 如何查看 API Key 的使用统计？

**A**: 使用统计 API：

```bash
GET /api/api-keys/{keyId}/usage?startDate=2024-01-01&endDate=2024-01-31
```

### Q4: 支持哪些 Claude 模型？

**A**: 支持所有 Claude 官方模型：

- claude-opus-4-20250514
- claude-sonnet-4-5-20250929
- claude-3-5-sonnet-20241022
- claude-haiku-3-5-20241022

### Q5: 如何处理 API Key 的每日费用限制？

**A**: 系统会在每次请求前检查 `dailyCostLimit`，如果超过限制会返回 429 错误。可以通过更新 API Key 来调整限制：

```bash
PATCH /api/api-keys/{keyId}
{
  "dailyCostLimit": 100.00
}
```

### Q6: 渠道优先级如何工作？

**A**: 优先级是一个整数值（默认 50），数字越小优先级越高。系统会优先选择优先级高的可用渠道。

### Q7: 如何启用流式响应？

**A**: 在请求体中设置 `stream: true`：

```bash
POST /v1/messages
{
  "model": "claude-sonnet-4-5-20250929",
  "stream": true,
  "messages": [...]
}
```

### Q8: 如何监控渠道健康状态？

**A**: 查询渠道列表 API：

```bash
GET /api/channels?status=ACTIVE
GET /api/channels?status=RATE_LIMITED
GET /api/channels?status=ERROR
```

---

## 十、附录

### 附录 A: Claude API 定价表

| 模型       | 输入 ($/1M tokens) | 输出 ($/1M tokens) | 缓存写入 | 缓存读取 |
| ---------- | ------------------ | ------------------ | -------- | -------- |
| Opus 4     | $15.00             | $75.00             | $18.75   | $1.50    |
| Sonnet 4.5 | $3.00              | $15.00             | $3.75    | $0.30    |
| Haiku 3.5  | $0.80              | $4.00              | $1.00    | $0.08    |

### 附录 B: 常用 API 端点

| 端点                       | 方法  | 说明                          |
| -------------------------- | ----- | ----------------------------- |
| `/v1/messages`             | POST  | Claude API 消息端点（非流式） |
| `/v1/messages/stream`      | POST  | Claude API 消息端点（流式）   |
| `/api/channels`            | GET   | 查询渠道列表                  |
| `/api/channels`            | POST  | 创建新渠道                    |
| `/api/channels/{id}`       | PATCH | 更新渠道                      |
| `/api/api-keys`            | GET   | 查询 API Key 列表             |
| `/api/api-keys/{id}/usage` | GET   | 查询使用统计                  |

### 附录 C: 错误代码说明

| 错误代码                | HTTP 状态 | 说明             |
| ----------------------- | --------- | ---------------- |
| `MISSING_API_KEY`       | 401       | 缺少 API Key     |
| `INVALID_API_KEY`       | 401       | API Key 无效     |
| `API_KEY_EXPIRED`       | 401       | API Key 已过期   |
| `API_KEY_REVOKED`       | 401       | API Key 已撤销   |
| `DAILY_LIMIT_EXCEEDED`  | 429       | 超过每日费用限制 |
| `NO_AVAILABLE_CHANNELS` | 400       | 没有可用渠道     |
| `CHANNEL_NOT_FOUND`     | 404       | 渠道不存在       |
| `CHANNEL_RATE_LIMITED`  | 429       | 渠道被限流       |

---

**文档版本**: 1.0.0
**最后更新**: 2024-01-15
**作者**: Claude Code Assistant
**维护者**: 项目团队
