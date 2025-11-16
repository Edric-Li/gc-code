import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * API Key 装饰器
 * 用于在 Controller 中获取当前请求的 API Key 信息
 *
 * 用法:
 * @ApiKey() apiKey: ApiKey
 */
export const ApiKey = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.apiKey;
});

/**
 * Current User 装饰器（通过 API Key 认证）
 * 用于在 Controller 中获取当前用户信息
 *
 * 用法:
 * @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
