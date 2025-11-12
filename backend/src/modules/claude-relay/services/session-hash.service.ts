import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface SessionHashOptions {
  messageCount?: number;
  includeSystemPrompt?: boolean;
}

@Injectable()
export class SessionHashService {
  private readonly HASH_ALGORITHM = 'sha256';
  private readonly HASH_LENGTH = 16;
  private readonly DEFAULT_MESSAGE_COUNT = 3;

  /**
   * 生成会话哈希
   */
  generateHash(
    messages: any[],
    options: SessionHashOptions = {},
  ): string {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('Messages array cannot be empty');
    }

    const {
      messageCount = this.DEFAULT_MESSAGE_COUNT,
      includeSystemPrompt = false,
    } = options;

    // 提取内容
    const content = this.extractHashContent(
      messages,
      messageCount,
      includeSystemPrompt,
    );

    // 生成哈希
    return this.computeHash(content);
  }

  /**
   * 提取用于生成哈希的内容
   */
  private extractHashContent(
    messages: any[],
    messageCount: number,
    includeSystemPrompt: boolean,
  ): string {
    // 过滤消息
    let filteredMessages = messages;

    if (!includeSystemPrompt) {
      filteredMessages = messages.filter((msg) => msg.role !== 'system');
    }

    // 取前 N 条消息
    const selectedMessages = filteredMessages.slice(0, messageCount);

    // 提取内容
    const contents = selectedMessages.map((msg) => {
      if (typeof msg.content === 'string') {
        return msg.content;
      } else if (Array.isArray(msg.content)) {
        // 处理多模态消息
        return msg.content
          .map((item) => {
            if (item.type === 'text') {
              return item.text;
            } else if (item.type === 'image') {
              return item.source?.data?.substring(0, 100) || '';
            }
            return '';
          })
          .join('|');
      }
      return '';
    });

    return contents.join('|||');
  }

  /**
   * 计算哈希值
   */
  private computeHash(content: string): string {
    const hash = crypto
      .createHash(this.HASH_ALGORITHM)
      .update(content)
      .digest('hex');

    return hash.substring(0, this.HASH_LENGTH);
  }

  /**
   * 验证会话哈希格式
   */
  validateHash(hash: string): boolean {
    if (typeof hash !== 'string') {
      return false;
    }

    if (hash.length !== this.HASH_LENGTH) {
      return false;
    }

    return /^[0-9a-f]+$/i.test(hash);
  }
}
