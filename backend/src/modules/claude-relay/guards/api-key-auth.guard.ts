import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Request } from 'express';

/**
 * API Key 认证守卫
 * 从请求头中提取 x-api-key 并验证
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
   * 验证 API Key
   */
  private async validateApiKey(key: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
      include: {
        user: true,
        channel: true,
      },
    });

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

    // 更新最后使用时间（异步，不等待）
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((error) => {
        console.error('Failed to update API key lastUsedAt:', error);
      });

    return apiKey;
  }
}
