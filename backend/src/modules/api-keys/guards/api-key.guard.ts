import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';

/**
 * API Key 验证守卫
 * 用于验证请求头中的 API Key 是否有效
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeysService: ApiKeysService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 从请求头提取 API Key
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // 检查格式: Bearer <key>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const key = parts[1];

    try {
      // 验证 API Key
      const result = await this.apiKeysService.validateKey(key);

      // 将用户和 API Key 信息注入到请求对象
      request.user = result.user;
      request.apiKey = result.apiKey;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid API key');
    }
  }
}
