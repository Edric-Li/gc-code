import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 扩展 Express Request 类型以包含用户信息
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
