import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClaudeProxyService } from './services/claude-proxy.service';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';

/**
 * Claude API 中继 Controller
 * 提供 Claude API 兼容的端点
 */
@Controller('v1')
@UseGuards(ApiKeyAuthGuard)
export class ClaudeRelayController {
  private readonly logger = new Logger(ClaudeRelayController.name);

  constructor(private proxyService: ClaudeProxyService) {}

  /**
   * POST /v1/messages
   * Claude Messages API
   */
  @Post('messages')
  async createMessage(
    @Req() req: Request & { apiKey: any },
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    const { apiKey } = req;

    this.logger.log(
      `Received request from API Key: ${apiKey.name} (${apiKey.id})`,
    );

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
    apiKey: any,
    body: any,
    headers: Record<string, string>,
    res: Response,
  ) {
    const result = await this.proxyService.proxyRequest(
      apiKey,
      'v1/messages',
      'POST',
      body,
      headers,
    );

    // 转发响应头
    Object.entries(result.headers).forEach(([key, value]) => {
      if (this.shouldForwardHeader(key)) {
        res.setHeader(key, value as string);
      }
    });

    // 返回响应
    return res.status(result.status).json(result.data);
  }

  /**
   * 处理流式请求
   */
  private async handleStreamRequest(
    apiKey: any,
    body: any,
    headers: Record<string, string>,
    res: Response,
  ) {
    const { channel, stream } = await this.proxyService.proxyStreamRequest(
      apiKey,
      'v1/messages',
      'POST',
      body,
      headers,
    );

    this.logger.log(
      `Streaming response via channel: ${channel.name}`,
    );

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 管道流到响应
    stream.pipe(res);

    // 处理错误
    stream.on('error', (error: Error) => {
      this.logger.error(`Stream error: ${error.message}`);
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

    // 流结束时记录
    stream.on('end', () => {
      this.logger.log('Stream completed');
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
}
