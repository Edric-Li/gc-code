import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogService } from './log.service';
import { HttpMethod } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: { id: string; email: string; username: string; role: string; [key: string]: unknown };
}

@Injectable()
export class ApiLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiLogMiddleware.name);

  constructor(private readonly logService: LogService) {}

  /**
   * 获取客户端真实 IP 地址（支持代理）
   */
  private getClientIp(req: Request): string {
    // 尝试从 X-Forwarded-For 获取
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
      if (ip) return ip;
    }

    // 尝试从 X-Real-IP 获取
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
      return realIp;
    }

    // 使用连接 IP
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  use(req: RequestWithUser, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, headers } = req;

    // 跳过不需要记录的路径
    const skipPaths = [
      '/health',
      '/api/health',
      '/favicon.ico',
      '/logs/api', // 避免记录查询日志的请求，防止无限循环
    ];

    if (skipPaths.some((path) => originalUrl.startsWith(path))) {
      return next();
    }

    // 获取用户代理
    const userAgent = headers['user-agent'] || '';

    // 获取真实 IP 地址（与 API Key 日志相同的方式）
    const ipAddress = this.getClientIp(req);

    // 捕获原始的 end 方法
    const originalEnd = res.end;
    let errorMessage: string | undefined;
    const chunks: Buffer[] = [];

    // 仅在错误状态码时捕获响应体以提取错误信息
    const originalWrite = res.write;
    res.write = function (chunk: unknown, ...args: unknown[]): boolean {
      if (chunk && res.statusCode >= 400) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
      }
      return originalWrite.apply(res, [chunk, ...args] as Parameters<typeof originalWrite>);
    };

    // 重写 end 方法
    res.end = ((chunk: unknown, ...args: unknown[]): Response => {
      const statusCode = res.statusCode;

      // 仅在错误状态码时提取错误信息
      if (statusCode >= 400) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
        }

        if (chunks.length > 0) {
          const body = Buffer.concat(chunks).toString('utf8');
          try {
            const errorResponse = JSON.parse(body) as {
              message?: string | string[];
              error?: string;
            };
            if (errorResponse.message) {
              errorMessage = Array.isArray(errorResponse.message)
                ? errorResponse.message.join(', ')
                : errorResponse.message;
            } else if (errorResponse.error) {
              errorMessage = errorResponse.error;
            }
          } catch {
            // 如果不是 JSON，忽略
          }
        }
      }

      const duration = Date.now() - startTime;

      // 异步记录日志，不阻塞响应
      setImmediate(() => {
        this.saveLog(
          req,
          method,
          originalUrl,
          statusCode,
          duration,
          ipAddress,
          userAgent,
          errorMessage
        );
      });

      return originalEnd.apply(res, [chunk, ...args] as Parameters<typeof originalEnd>);
    }) as typeof res.end;

    next();
  }

  private async saveLog(
    req: RequestWithUser,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    ipAddress: string,
    userAgent: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      // 获取用户 ID（JWT 策略返回完整的 user 对象）
      const userId = req.user?.id;

      // 获取请求体（过滤敏感信息）
      let requestBody: Record<string, unknown> | undefined;
      if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        requestBody = this.sanitizeBody(req.body);
      }

      // 转换 HTTP 方法
      const httpMethod = this.toHttpMethod(method);

      await this.logService.logApi({
        userId,
        method: httpMethod,
        path: path.split('?')[0], // 移除查询参数
        statusCode,
        duration,
        ipAddress,
        userAgent,
        requestBody,
        errorMessage,
      });
    } catch (error) {
      this.logger.error('Failed to save API log', error);
    }
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeBody(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private toHttpMethod(method: string): HttpMethod {
    const methodMap: Record<string, HttpMethod> = {
      GET: HttpMethod.GET,
      POST: HttpMethod.POST,
      PUT: HttpMethod.PUT,
      PATCH: HttpMethod.PATCH,
      DELETE: HttpMethod.DELETE,
      OPTIONS: HttpMethod.OPTIONS,
      HEAD: HttpMethod.HEAD,
    };

    return methodMap[method.toUpperCase()] || HttpMethod.GET;
  }
}
