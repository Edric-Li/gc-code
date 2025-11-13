import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClaudeProxyService } from './services/claude-proxy.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import {
  ClaudeMessagesRequest,
  ApiKeyInfo,
  ClaudeMessagesResponse,
} from './interfaces/claude-api.interface';
import { ApiKeyCacheService } from './services/api-key-cache.service';
import { ChannelPoolCacheService } from './services/channel-pool-cache.service';
import { UsageQueueService } from './services/usage-queue.service';

/**
 * Claude API 中继 Controller
 * 提供 Claude API 兼容的端点
 */
@Controller('v1')
@UseGuards(ApiKeyAuthGuard)
export class ClaudeRelayController {
  private readonly logger = new Logger(ClaudeRelayController.name);

  constructor(
    private proxyService: ClaudeProxyService,
    private usageTracking: UsageTrackingService,
    private apiKeyCache: ApiKeyCacheService,
    private channelPoolCache: ChannelPoolCacheService,
    private usageQueue: UsageQueueService
  ) {}

  /**
   * POST /v1/messages
   * Claude Messages API
   */
  @Post('messages')
  async createMessage(
    @Req() req: Request & { apiKey: ApiKeyInfo },
    @Res() res: Response,
    @Body() body: ClaudeMessagesRequest,
    @Headers() headers: Record<string, string>
  ) {
    const { apiKey } = req;

    this.logger.log(`Received request from API Key: ${apiKey.name} (${apiKey.id})`);

    try {
      // 检查是否是流式请求
      const isStream = body.stream === true;

      if (isStream) {
        // 流式响应
        return await this.handleStreamRequest(apiKey, body, headers, res);
      } else {
        // 普通响应
        return await this.handleNormalRequest(apiKey, body, headers, res);
      }
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`, error.stack);

      // 如果是 HTTP 异常，返回原始错误
      if (error.response && error.status) {
        return res.status(error.status).json(error.response);
      }

      // 其他错误
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        type: 'error',
        error: {
          type: 'api_error',
          message: error.message || 'Internal server error',
        },
      });
    }
  }

  /**
   * 处理普通（非流式）请求
   */
  private async handleNormalRequest(
    apiKey: ApiKeyInfo,
    body: ClaudeMessagesRequest,
    headers: Record<string, string>,
    res: Response
  ) {
    const result = await this.proxyService.proxyRequest(
      apiKey,
      'v1/messages',
      'POST',
      body,
      headers
    );

    // 转发响应头
    Object.entries(result.headers).forEach(([key, value]) => {
      if (this.shouldForwardHeader(key)) {
        res.setHeader(key, value as string);
      }
    });

    // 记录用量（异步，不阻塞响应）
    const success = result.status >= 200 && result.status < 300;
    if (success && result.data) {
      const responseData = result.data as ClaudeMessagesResponse;
      if (responseData.usage) {
        // 计算费用 (支持 Prompt Caching)
        const cost = this.usageTracking.calculateCost({
          model: body.model,
          inputTokens: responseData.usage.input_tokens,
          outputTokens: responseData.usage.output_tokens,
          cacheCreationTokens: responseData.usage.cache_creation_input_tokens,
          cacheReadTokens: responseData.usage.cache_read_input_tokens,
          cacheCreation: responseData.usage.cache_creation,
        });

        // 异步记录，不等待
        this.usageTracking
          .recordUsage({
            apiKeyId: apiKey.id,
            userId: apiKey.user.id,
            inputTokens: responseData.usage.input_tokens,
            outputTokens: responseData.usage.output_tokens,
            success: true,
            cost,
          })
          .catch((err) => {
            this.logger.error(`Failed to record usage: ${err.message}`);
          });
      }
    }

    // 返回响应
    return res.status(result.status).json(result.data);
  }

  /**
   * 处理流式请求
   */
  private async handleStreamRequest(
    apiKey: ApiKeyInfo,
    body: ClaudeMessagesRequest,
    headers: Record<string, string>,
    res: Response
  ) {
    const { channel, stream } = await this.proxyService.proxyStreamRequest(
      apiKey,
      'v1/messages',
      'POST',
      body,
      headers
    );

    this.logger.log(`Streaming response via channel: ${channel.name}`);

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 用量统计累加器
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalCacheReadTokens = 0;
    let cacheCreation:
      | { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number }
      | undefined;
    let isSuccess = true;

    // 拦截流数据以提取usage信息
    let buffer = '';
    stream.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      buffer += text;

      // 解析SSE事件
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        // 解析 data: {...} 行
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));

            // message_start事件包含input tokens (包括缓存)
            if (data.type === 'message_start' && data.message?.usage) {
              totalInputTokens = data.message.usage.input_tokens || 0;
              totalCacheCreationTokens = data.message.usage.cache_creation_input_tokens || 0;
              totalCacheReadTokens = data.message.usage.cache_read_input_tokens || 0;
              // Extended Prompt Caching
              if (data.message.usage.cache_creation) {
                cacheCreation = data.message.usage.cache_creation;
              }
            }

            // message_delta事件包含output tokens
            if (data.type === 'message_delta' && data.usage) {
              totalOutputTokens = data.usage.output_tokens || 0;
            }
          } catch (e) {
            // 忽略JSON解析错误
          }
        }
      }

      // 转发数据到客户端
      res.write(chunk);
    });

    // 处理错误
    stream.on('error', (error: Error) => {
      this.logger.error(`Stream error: ${error.message}`);
      isSuccess = false;
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          type: 'error',
          error: {
            type: 'api_error',
            message: error.message,
          },
        });
      }
    });

    // 流结束时记录usage
    stream.on('end', () => {
      this.logger.log('Stream completed');

      // 记录用量 (包括缓存)
      if (isSuccess && (totalInputTokens > 0 || totalOutputTokens > 0)) {
        const cost = this.usageTracking.calculateCost({
          model: body.model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cacheCreationTokens: totalCacheCreationTokens,
          cacheReadTokens: totalCacheReadTokens,
          cacheCreation,
        });

        this.usageTracking
          .recordUsage({
            apiKeyId: apiKey.id,
            userId: apiKey.user.id,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            success: true,
            cost,
          })
          .catch((err) => {
            this.logger.error(`Failed to record stream usage: ${err.message}`);
          });

        this.logger.debug(
          `Stream usage: ${totalInputTokens} input + ${totalOutputTokens} output + ` +
            `${totalCacheCreationTokens} cache_write + ${totalCacheReadTokens} cache_read tokens, ` +
            `cost: $${cost.toFixed(6)}`
        );
      }

      res.end();
    });
  }

  /**
   * 判断是否应该转发某个响应头
   */
  private shouldForwardHeader(headerName: string): boolean {
    const forwardHeaders = [
      'content-type',
      'x-request-id',
      'anthropic-ratelimit-requests-limit',
      'anthropic-ratelimit-requests-remaining',
      'anthropic-ratelimit-requests-reset',
      'anthropic-ratelimit-tokens-limit',
      'anthropic-ratelimit-tokens-remaining',
      'anthropic-ratelimit-tokens-reset',
    ];

    return forwardHeaders.includes(headerName.toLowerCase());
  }

  /**
   * GET /v1/stats
   * 获取缓存和队列统计信息（用于监控）
   * 公开端点，无需 API Key
   */
  @Get('stats')
  @SetMetadata('isPublic', true)
  async getStats() {
    return {
      timestamp: new Date().toISOString(),
      apiKeyCache: this.apiKeyCache.getStats(),
      channelPool: this.channelPoolCache.getStats(),
      usageQueue: this.usageQueue.getStats(),
    };
  }
}
