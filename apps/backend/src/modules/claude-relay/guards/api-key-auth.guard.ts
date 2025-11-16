import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../common/prisma.service';
import { ApiKeyCacheService } from '../services/api-key-cache.service';
import { Request } from 'express';

/**
 * API Key 认证守卫
 * 从请求头中提取 x-api-key 并验证
 * 使用缓存优化性能
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private apiKeyCache: ApiKeyCacheService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否为公开路由
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 1. 从请求头中提取 API Key
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // 2. 验证 API Key
    const apiKeyRecord = await this.validateApiKey(apiKey);

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 3. 将 API Key 信息附加到请求对象
    request.apiKey = apiKeyRecord;
    request.user = apiKeyRecord.user;

    return true;
  }

  /**
   * 从请求头中提取 API Key
   */
  private extractApiKey(request: Request): string | null {
    // 支持多种格式
    const xApiKey = request.headers['x-api-key'];
    const authorization = request.headers['authorization'];

    if (xApiKey) {
      return Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
    }

    if (authorization) {
      const authStr = Array.isArray(authorization) ? authorization[0] : authorization;
      if (authStr.startsWith('Bearer ')) {
        return authStr.substring(7);
      }
    }

    return null;
  }

  /**
   * 验证 API Key（优先使用缓存）
   */
  private async validateApiKey(key: string) {
    // 从缓存获取 API Key 信息
    const apiKey = await this.apiKeyCache.get(key);

    if (!apiKey) {
      return null;
    }

    // 检查状态
    if (apiKey.status !== 'ACTIVE') {
      throw new UnauthorizedException(`API key is ${apiKey.status.toLowerCase()}`);
    }

    // 检查软删除
    if (apiKey.deletedAt) {
      throw new UnauthorizedException('API key has been deleted');
    }

    // 检查过期时间
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new UnauthorizedException('API key has expired');
    }

    // 优化：只在距离上次更新超过 5 分钟时才更新 last_used_at
    // 这样可以大幅减少数据库写入压力
    const now = Date.now();
    const lastUsedTime = apiKey.lastUsedAt ? apiKey.lastUsedAt.getTime() : 0;
    const shouldUpdate = now - lastUsedTime > 5 * 60 * 1000; // 5 分钟

    if (shouldUpdate) {
      const newLastUsedAt = new Date();

      // 异步更新数据库，不等待
      this.prisma.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: newLastUsedAt },
        })
        .catch((error) => {
          this.logger.error(`Failed to update API key lastUsedAt: ${error.message}`);
        });

      // 同步更新缓存中的对象（避免后续 5 分钟内重复更新数据库）
      apiKey.lastUsedAt = newLastUsedAt;
    }

    return apiKey;
  }
}
