import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Channel } from '@prisma/client';
import { ClaudeChannelSelectorService } from './claude-channel-selector.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  ApiKeyInfo,
  ClaudeMessagesRequest,
  ClaudeMessagesResponse,
  ClaudeErrorResponse,
} from '../interfaces/claude-api.interface';
import { ProxyResponse, StreamProxyResponse } from '../interfaces/proxy.interface';

/**
 * Claude API 请求代理服务
 * 负责转发请求到选定的渠道
 */
@Injectable()
export class ClaudeProxyService {
  private readonly logger = new Logger(ClaudeProxyService.name);

  constructor(
    private httpService: HttpService,
    private channelSelector: ClaudeChannelSelectorService,
  ) {}

  /**
   * 转发 Claude API 请求
   */
  async proxyRequest(
    apiKey: ApiKeyInfo,
    path: string,
    method: string,
    requestBody: ClaudeMessagesRequest,
    headers: Record<string, string>,
  ): Promise<ProxyResponse> {
    // 1. 选择渠道（支持 Sticky Session）
    const channel = await this.channelSelector.selectChannel(apiKey, requestBody);

    this.logger.log(
      `Proxying ${method} ${path} via channel: ${channel.name} (${channel.id})`,
    );

    // 2. 构建目标 URL
    const targetUrl = this.buildTargetUrl(channel, path);

    // 3. 准备请求头
    const proxyHeaders = this.buildProxyHeaders(channel, headers);

    try {
      // 4. 转发请求
      const startTime = Date.now();
      const response = await this.forwardRequest(
        method,
        targetUrl,
        requestBody,
        proxyHeaders,
      );
      const duration = Date.now() - startTime;

      this.logger.log(
        `Request completed in ${duration}ms, status: ${response.status}`,
      );

      // 5. 更新渠道使用时间
      await this.channelSelector.selectChannel(apiKey, requestBody);

      return {
        status: response.status,
        headers: response.headers as Record<string, string | string[]>,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        `Request failed via channel ${channel.name}: ${error.message}`,
      );

      // 处理错误
      await this.handleChannelError(channel, error);

      throw error;
    }
  }

  /**
   * 转发流式请求
   */
  async proxyStreamRequest(
    apiKey: ApiKeyInfo,
    path: string,
    method: string,
    requestBody: ClaudeMessagesRequest,
    headers: Record<string, string>,
  ): Promise<StreamProxyResponse> {
    // 1. 选择渠道
    const channel = await this.channelSelector.selectChannel(apiKey, requestBody);

    this.logger.log(
      `Proxying stream ${method} ${path} via channel: ${channel.name}`,
    );

    // 2. 构建目标 URL
    const targetUrl = this.buildTargetUrl(channel, path);

    // 3. 准备请求头
    const proxyHeaders = this.buildProxyHeaders(channel, headers);

    try {
      // 4. 创建流式请求
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: targetUrl,
          data: requestBody,
          headers: proxyHeaders,
          responseType: 'stream',
        }),
      );

      return {
        channel,
        stream: response.data,
      };
    } catch (error) {
      this.logger.error(
        `Stream request failed via channel ${channel.name}: ${error.message}`,
      );

      await this.handleChannelError(channel, error);

      throw error;
    }
  }

  /**
   * 构建目标 URL
   */
  private buildTargetUrl(channel: Channel, path: string): string {
    const baseUrl = channel.baseUrl.replace(/\/+$/, ''); // 移除尾部斜杠
    const cleanPath = path.replace(/^\/+/, ''); // 移除开头斜杠
    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * 构建代理请求头
   */
  private buildProxyHeaders(
    channel: Channel,
    originalHeaders: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': originalHeaders['anthropic-version'] || '2023-06-01',
      'x-api-key': channel.apiKey, // 使用渠道的 API Key
    };

    // 转发特定的请求头
    const headersToForward = [
      'anthropic-beta',
      'anthropic-dangerous-direct-browser-access',
    ];

    headersToForward.forEach((key) => {
      if (originalHeaders[key]) {
        headers[key] = originalHeaders[key];
      }
    });

    return headers;
  }

  /**
   * 转发 HTTP 请求
   */
  private async forwardRequest(
    method: string,
    url: string,
    data: any,
    headers: Record<string, string>,
  ): Promise<AxiosResponse> {
    try {
      return await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          headers,
          timeout: 300000, // 5分钟超时
        }),
      );
    } catch (error) {
      // 处理 Axios 错误
      if (error.response) {
        // 服务器返回了错误响应
        const status = error.response.status;
        const data = error.response.data;

        this.logger.error(
          `Channel returned error ${status}: ${JSON.stringify(data)}`,
        );

        // 抛出包含原始错误信息的异常
        throw new HttpException(data, status);
      }

      // 网络错误或超时
      throw error;
    }
  }

  /**
   * 处理渠道错误
   */
  private async handleChannelError(channel: Channel, error: unknown) {
    const axiosError = error as {
      response?: {
        status?: number;
        headers?: Record<string, string>;
      }
    };
    const status = axiosError.response?.status;

    // 429: 限流
    if (status === 429) {
      const resetHeader = axiosError.response?.headers?.['x-ratelimit-reset'];
      const resetTimestamp = resetHeader
        ? parseInt(resetHeader, 10)
        : undefined;

      await this.channelSelector.markChannelRateLimited(
        channel.id,
        resetTimestamp,
      );

      this.logger.warn(
        `Channel ${channel.name} rate limited, reset at: ${resetTimestamp ? new Date(resetTimestamp * 1000) : 'unknown'}`,
      );
    }
    // 401, 403: 认证失败
    else if (status === 401 || status === 403) {
      await this.channelSelector.markChannelError(channel.id);
      this.logger.error(
        `Channel ${channel.name} authentication failed (${status})`,
      );
    }
    // 500+: 服务器错误
    else if (status >= 500) {
      await this.channelSelector.markChannelError(channel.id);
      this.logger.error(`Channel ${channel.name} server error (${status})`);
    }
  }
}
