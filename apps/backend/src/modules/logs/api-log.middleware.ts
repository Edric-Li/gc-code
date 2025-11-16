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
    const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB 缓冲区限制
    let totalSize = 0;

    // 仅在错误状态码时捕获响应体以提取错误信息
    const originalWrite = res.write;
    res.write = function (chunk: unknown, ...args: unknown[]): boolean {
      if (chunk && res.statusCode >= 400 && totalSize < MAX_BUFFER_SIZE) {
        const buffer = Buffer.isBuffer(chunk)
          ? chunk
          : typeof chunk === 'string'
            ? Buffer.from(chunk)
            : null;

        if (buffer) {
          const newSize = totalSize + buffer.length;
          if (newSize <= MAX_BUFFER_SIZE) {
            chunks.push(buffer);
            totalSize = newSize;
          }
        }
      }
      return originalWrite.apply(res, [chunk, ...args] as Parameters<typeof originalWrite>);
    };

    // 重写 end 方法
    res.end = ((chunk: unknown, ...args: unknown[]): Response => {
      const statusCode = res.statusCode;

      const duration = Date.now() - startTime;

      // 仅在错误状态码时记录日志和提取错误信息
      if (statusCode >= 400) {
        if (chunk && totalSize < MAX_BUFFER_SIZE) {
          const buffer = Buffer.isBuffer(chunk)
            ? chunk
            : typeof chunk === 'string'
              ? Buffer.from(chunk)
              : null;

          if (buffer) {
            const newSize = totalSize + buffer.length;
            if (newSize <= MAX_BUFFER_SIZE) {
              chunks.push(buffer);
              totalSize = newSize;
            }
          }
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

        // 异步记录错误日志，不阻塞响应
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
      }

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

      // 获取请求头（过滤敏感信息）
      const requestHeaders = this.sanitizeHeaders(req.headers as Record<string, unknown>);

      // 获取请求体（过滤敏感信息，限制大小）
      const MAX_REQUEST_BODY_SIZE = 100 * 1024; // 100KB
      let requestBody: Record<string, unknown> | string | undefined;
      if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        // 检查请求体大小
        const bodySize = JSON.stringify(req.body).length;
        if (bodySize > MAX_REQUEST_BODY_SIZE) {
          requestBody = `[REQUEST_BODY_TOO_LARGE: ${(bodySize / 1024).toFixed(2)}KB]`;
        } else {
          requestBody = this.sanitizeBody(req.body);
        }
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
        requestHeaders,
        requestBody,
        errorMessage,
      });
    } catch (error) {
      this.logger.error('Failed to save API log', error);
    }
  }

  /**
   * 脱敏请求头
   */
  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sensitiveHeaderKeys = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token',
      'x-xsrf-token',
      'proxy-authorization',
      'x-forwarded-authorization',
      'authentication-info',
      'www-authenticate',
      'proxy-authenticate',
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaderKeys.some((k) => key.toLowerCase() === k.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 脱敏请求体
   * @param body 请求体对象
   * @param depth 当前递归深度
   * @param visited 已访问对象集合，用于检测循环引用
   * @param maxDepth 最大递归深度
   */
  private sanitizeBody(
    body: Record<string, unknown>,
    depth = 0,
    visited: WeakSet<object> = new WeakSet(),
    maxDepth = 5
  ): Record<string, unknown> | string {
    // 检查深度限制
    if (depth > maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // 检查循环引用
    if (visited.has(body)) {
      return '[CIRCULAR_REFERENCE]';
    }
    visited.add(body);

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
    const sanitized: Record<string, unknown> = {};

    try {
      for (const [key, value] of Object.entries(body)) {
        // 敏感字段脱敏
        if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        } else if (Array.isArray(value)) {
          // 处理数组，限制大小
          const maxArrayLength = 100;
          sanitized[key] =
            value.length > maxArrayLength
              ? `[ARRAY_TOO_LARGE: ${value.length} items]`
              : value.map((item) =>
                  typeof item === 'object' && item !== null && !Array.isArray(item)
                    ? this.sanitizeBody(
                        item as Record<string, unknown>,
                        depth + 1,
                        visited,
                        maxDepth
                      )
                    : item
                );
        } else if (typeof value === 'object' && value !== null) {
          // 递归处理嵌套对象
          const result = this.sanitizeBody(
            value as Record<string, unknown>,
            depth + 1,
            visited,
            maxDepth
          );
          sanitized[key] = result;
        } else if (typeof value === 'string' && value.length > 10000) {
          // 限制字符串长度
          sanitized[key] = `[STRING_TOO_LARGE: ${value.length} chars]`;
        } else {
          sanitized[key] = value;
        }
      }
    } catch (error) {
      return '[SANITIZATION_ERROR]';
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
