export interface SessionMapping {
  sessionHash: string;
  channelId: string;
  apiKeyId: string;
  createdAt: Date;
  lastAccessAt: Date;
  expiresAt: Date;
  requestCount: number;
}

export interface SessionStats {
  totalSessions: number;
  avgRequestsPerSession: number;
}

/**
 * Session 存储接口
 * 支持内存和 Redis 等多种实现
 */
export interface ISessionStorageService {
  /**
   * 获取会话映射
   */
  getMapping(sessionHash: string): Promise<SessionMapping | null>;

  /**
   * 设置会话映射
   */
  setMapping(
    sessionHash: string,
    channelId: string,
    apiKeyId: string,
  ): Promise<SessionMapping>;

  /**
   * 更新会话映射（增加请求计数）
   */
  updateMapping(sessionHash: string): Promise<void>;

  /**
   * 续期会话
   */
  renewMapping(sessionHash: string): Promise<boolean>;

  /**
   * 删除会话映射
   */
  deleteMapping(sessionHash: string): Promise<void>;

  /**
   * 获取会话统计
   */
  getStats(): Promise<SessionStats>;

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): Promise<number>;
}
