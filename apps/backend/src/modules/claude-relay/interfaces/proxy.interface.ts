/**
 * 代理服务接口定义
 */

import { Channel } from '@prisma/client';
import { Readable } from 'stream';

export interface ProxyResponse {
  status: number;
  data: unknown;
  headers: Record<string, string | string[]>;
}

export interface StreamProxyResponse {
  channel: Channel;
  stream: Readable;
}
