import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISessionStorageService, SessionMapping, SessionStats } from './session-storage.interface';

/**
 * 基于内存的 Session 存储实现
 * 使用 Map 结构，支持 LRU 淘汰策略
 */
@Injectable()
export class MemorySessionStorageService
  implements ISessionStorageService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MemorySessionStorageService.name);

  // 内存缓存
  private readonly cache = new Map<string, SessionMapping>();

  // 配置
  private readonly ttlSeconds: number;
  private readonly renewThresholdSeconds: number;
  private readonly maxCacheSize: number;

  // 定时清理任务
  private cleanupInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    // 加载配置
    this.ttlSeconds = this.configService.get('SESSION_TTL_SECONDS', 3600);
    this.renewThresholdSeconds = this.configService.get('SESSION_RENEW_THRESHOLD_SECONDS', 300);
    this.maxCacheSize = this.configService.get('SESSION_MAX_CACHE_SIZE', 10000);
  }

  onModuleInit() {
    this.logger.log('Memory session storage initialized');
    this.logger.log(`Max cache size: ${this.maxCacheSize}, TTL: ${this.ttlSeconds}s`);

    // 启动定时清理任务（每分钟）
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);
  }

  onModuleDestroy() {
    // 清理定时任务
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.logger.log('Memory session storage destroyed');
  }

  /**
   * 获取会话映射
   */
  async getMapping(sessionHash: string): Promise<SessionMapping | null> {
    const mapping = this.cache.get(sessionHash);

    if (!mapping) {
      return null;
    }

    // 检查是否过期
    if (new Date() > mapping.expiresAt) {
      this.cache.delete(sessionHash);
      this.logger.debug(`Session expired and removed: ${sessionHash}`);
      return null;
    }

    return mapping;
  }

  /**
   * 设置会话映射
   */
  async setMapping(
    sessionHash: string,
    channelId: string,
    apiKeyId: string
  ): Promise<SessionMapping> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);

    const mapping: SessionMapping = {
      sessionHash,
      channelId,
      apiKeyId,
      createdAt: now,
      lastAccessAt: now,
      expiresAt,
      requestCount: 1,
    };

    // LRU 策略：如果缓存满了，删除最早的
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(sessionHash, mapping);

    this.logger.log(
      `Created session mapping: ${sessionHash} → ${channelId} (TTL: ${this.ttlSeconds}s)`
    );

    return mapping;
  }

  /**
   * 更新会话映射
   */
  async updateMapping(sessionHash: string): Promise<void> {
    const mapping = this.cache.get(sessionHash);

    if (!mapping) {
      return;
    }

    // 检查是否过期
    if (new Date() > mapping.expiresAt) {
      this.cache.delete(sessionHash);
      return;
    }

    // 更新访问时间和请求计数
    mapping.lastAccessAt = new Date();
    mapping.requestCount += 1;

    this.cache.set(sessionHash, mapping);

    this.logger.debug(`Updated session mapping: ${sessionHash} (count: ${mapping.requestCount})`);
  }

  /**
   * 续期会话
   */
  async renewMapping(sessionHash: string): Promise<boolean> {
    const mapping = this.cache.get(sessionHash);

    if (!mapping) {
      return false;
    }

    const now = new Date();
    const remainingMs = mapping.expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.floor(remainingMs / 1000);

    // 如果剩余时间小于续期阈值，则续期
    if (remainingSeconds < this.renewThresholdSeconds) {
      mapping.expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
      this.cache.set(sessionHash, mapping);

      this.logger.log(
        `Renewed session mapping: ${sessionHash} (was ${remainingSeconds}s, now ${this.ttlSeconds}s)`
      );
      return true;
    }

    this.logger.debug(
      `Session mapping TTL sufficient: ${sessionHash} (${remainingSeconds}s remaining)`
    );
    return false;
  }

  /**
   * 删除会话映射
   */
  async deleteMapping(sessionHash: string): Promise<void> {
    const deleted = this.cache.delete(sessionHash);
    if (deleted) {
      this.logger.log(`Deleted session mapping: ${sessionHash}`);
    }
  }

  /**
   * 获取会话统计
   */
  async getStats(): Promise<SessionStats> {
    const mappings = Array.from(this.cache.values());
    const totalRequests = mappings.reduce((sum, m) => sum + m.requestCount, 0);

    return {
      totalSessions: mappings.length,
      avgRequestsPerSession: mappings.length > 0 ? totalRequests / mappings.length : 0,
    };
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [hash, mapping] of this.cache.entries()) {
      if (now > mapping.expiresAt) {
        this.cache.delete(hash);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * LRU 淘汰：删除最早创建的会话
   */
  private evictOldest(): void {
    let oldestHash: string | null = null;
    let oldestTime = new Date();

    for (const [hash, mapping] of this.cache.entries()) {
      if (mapping.createdAt < oldestTime) {
        oldestTime = mapping.createdAt;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      this.cache.delete(oldestHash);
      this.logger.warn(`Evicted oldest session due to cache size limit: ${oldestHash}`);
    }
  }

  /**
   * 获取当前缓存大小（用于监控）
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 清空所有缓存（用于测试）
   */
  async clearAll(): Promise<void> {
    this.cache.clear();
    this.logger.log('Cleared all session mappings');
  }
}
