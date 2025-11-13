import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { ApiKey, User, Channel } from '@prisma/client';

/**
 * API Key 信息（包含关联的用户和渠道）
 */
export interface ApiKeyInfo extends ApiKey {
  user: User;
  channel: Channel | null;
}

/**
 * 缓存条目
 */
interface CacheEntry {
  data: ApiKeyInfo;
  expiresAt: number;
  createdAt: number;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

/**
 * API Key 内存缓存服务
 *
 * 功能:
 * - LRU 缓存策略，支持最大容量限制
 * - TTL 过期机制，默认 5 分钟
 * - 定时清理过期条目
 * - 主动失效接口
 * - 缓存命中率统计
 */
@Injectable()
export class ApiKeyCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiKeyCacheService.name);

  // 缓存存储 (Map 保持插入顺序，便于 LRU)
  private cache = new Map<string, CacheEntry>();

  // 配置参数
  private readonly MAX_CACHE_SIZE = 50000; // 最大缓存 5 万个 API Key
  private readonly TTL_MS = 5 * 60 * 1000; // 5 分钟 TTL
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 每 60 秒清理一次过期条目

  // 统计数据
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  // 定时清理任务
  private cleanupTimer?: NodeJS.Timeout;

  // Promise 缓存（防止并发查询相同 key 导致的缓存击穿）
  private loadingPromises = new Map<string, Promise<ApiKeyInfo | null>>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 模块初始化：启动定时清理任务
   */
  onModuleInit() {
    this.logger.log('API Key Cache Service initialized');
    this.startCleanupTimer();
  }

  /**
   * 模块销毁：停止定时清理任务
   */
  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.logger.log('API Key Cache Service destroyed');
  }

  /**
   * 获取 API Key 信息（优先从缓存，防止缓存击穿）
   *
   * @param key - API Key 字符串
   * @returns API Key 信息，如果不存在或无效则返回 null
   */
  async get(key: string): Promise<ApiKeyInfo | null> {
    const cached = this.cache.get(key);

    // 缓存命中且未过期
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.hits++;

      // LRU: 将访问的条目移到最后（删除后重新插入）
      this.cache.delete(key);
      this.cache.set(key, cached);

      return cached.data;
    }

    // 缓存未命中，从数据库加载
    this.stats.misses++;

    // 检查是否已有正在加载的 Promise（防止并发查询相同 key）
    if (this.loadingPromises.has(key)) {
      this.logger.debug(`Waiting for existing load promise for key: ${key.substring(0, 10)}...`);
      return await this.loadingPromises.get(key)!;
    }

    // 创建加载 Promise
    const loadPromise = this.loadFromDatabase(key)
      .then((apiKey) => {
        if (apiKey) {
          // 放入缓存
          this.set(key, apiKey);
        }
        return apiKey;
      })
      .catch((error) => {
        this.logger.error(`Failed to load API Key from database: ${error.message}`);
        return null;
      })
      .finally(() => {
        // 清理 Promise 缓存
        this.loadingPromises.delete(key);
      });

    // 缓存 Promise
    this.loadingPromises.set(key, loadPromise);

    return await loadPromise;
  }

  /**
   * 从数据库加载 API Key
   */
  private async loadFromDatabase(key: string): Promise<ApiKeyInfo | null> {
    return await this.prisma.apiKey.findUnique({
      where: { key },
      include: {
        user: true,
        channel: true,
      },
    });
  }

  /**
   * 设置缓存条目
   *
   * @param key - API Key 字符串
   * @param data - API Key 信息
   */
  private set(key: string, data: ApiKeyInfo): void {
    // 如果达到最大容量，执行 LRU 淘汰
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + this.TTL_MS,
      createdAt: now,
    });
  }

  /**
   * LRU 淘汰：删除最早的条目（Map 的第一个元素）
   */
  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * 主动失效指定的 API Key 缓存
   *
   * 使用场景：
   * - API Key 被禁用/删除
   * - API Key 信息更新（如绑定的渠道变更）
   * - API Key 过期时间变更
   *
   * @param key - API Key 字符串
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Invalidated cache for API Key: ${key.substring(0, 10)}...`);
    }
  }

  /**
   * 批量失效多个 API Key 缓存
   *
   * @param keys - API Key 字符串数组
   */
  invalidateMany(keys: string[]): void {
    let count = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug(`Invalidated ${count} API Key caches`);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared all caches (${size} entries)`);
  }

  /**
   * 启动定时清理任务
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.CLEANUP_INTERVAL_MS);

    this.logger.log(`Cleanup timer started (interval: ${this.CLEANUP_INTERVAL_MS}ms)`);
  }

  /**
   * 清理所有过期的缓存条目
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: parseFloat((hitRate * 100).toFixed(2)),
      evictions: this.stats.evictions,
    };
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    this.logger.log('Cache stats reset');
  }

  /**
   * 批量预热缓存（可选）
   *
   * 使用场景：
   * - 服务启动时预加载热点 API Key
   * - 定时从数据库获取活跃的 API Key 并预热
   *
   * @param keys - API Key 字符串数组
   */
  async warmup(keys: string[]): Promise<void> {
    this.logger.log(`Warming up cache with ${keys.length} API Keys...`);

    let successCount = 0;
    for (const key of keys) {
      try {
        const apiKey = await this.loadFromDatabase(key);
        if (apiKey) {
          this.set(key, apiKey);
          successCount++;
        }
      } catch (error) {
        this.logger.warn(`Failed to warmup API Key ${key.substring(0, 10)}...: ${error.message}`);
      }
    }

    this.logger.log(`Cache warmup completed: ${successCount}/${keys.length} successful`);
  }
}
