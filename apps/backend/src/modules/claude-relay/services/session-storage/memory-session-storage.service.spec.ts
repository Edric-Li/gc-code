import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemorySessionStorageService } from './memory-session-storage.service';

describe('MemorySessionStorageService', () => {
  let service: MemorySessionStorageService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemorySessionStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              const config = {
                SESSION_TTL_SECONDS: 3600,
                SESSION_RENEW_THRESHOLD_SECONDS: 300,
                SESSION_MAX_CACHE_SIZE: 10000,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MemorySessionStorageService>(MemorySessionStorageService);
    configService = module.get<ConfigService>(ConfigService);

    // 初始化服务
    service.onModuleInit();
  });

  afterEach(async () => {
    // 清理服务
    await service.clearAll();
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setMapping and getMapping', () => {
    it('should set and get mapping', async () => {
      const sessionHash = 'test123';
      const channelId = 'channel-456';
      const apiKeyId = 'key-789';

      const mapping = await service.setMapping(sessionHash, channelId, apiKeyId);

      expect(mapping.sessionHash).toBe(sessionHash);
      expect(mapping.channelId).toBe(channelId);
      expect(mapping.apiKeyId).toBe(apiKeyId);
      expect(mapping.requestCount).toBe(1);

      const retrieved = await service.getMapping(sessionHash);
      expect(retrieved).toBeTruthy();
      expect(retrieved.channelId).toBe(channelId);
    });

    it('should return null for non-existent mapping', async () => {
      const mapping = await service.getMapping('nonexistent');
      expect(mapping).toBeNull();
    });

    it('should return null for expired mapping', async () => {
      const sessionHash = 'test456';
      const mapping = await service.setMapping(sessionHash, 'channel1', 'key1');

      // 手动设置为已过期
      mapping.expiresAt = new Date(Date.now() - 1000);

      const retrieved = await service.getMapping(sessionHash);
      expect(retrieved).toBeNull();
    });
  });

  describe('updateMapping', () => {
    it('should update request count and access time', async () => {
      const sessionHash = 'test789';
      await service.setMapping(sessionHash, 'channel1', 'key1');

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.updateMapping(sessionHash);
      await service.updateMapping(sessionHash);

      const mapping = await service.getMapping(sessionHash);
      expect(mapping.requestCount).toBe(3); // 1 + 2
      expect(mapping.lastAccessAt.getTime()).toBeGreaterThan(mapping.createdAt.getTime());
    });

    it('should do nothing for non-existent mapping', async () => {
      await expect(service.updateMapping('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('renewMapping', () => {
    it('should renew mapping when TTL is low', async () => {
      const sessionHash = 'test999';
      const mapping = await service.setMapping(sessionHash, 'channel1', 'key1');

      // 手动设置较短的过期时间（200秒后过期，小于阈值300秒）
      mapping.expiresAt = new Date(Date.now() + 200 * 1000);

      const renewed = await service.renewMapping(sessionHash);
      expect(renewed).toBe(true);

      const updated = await service.getMapping(sessionHash);
      const remainingMs = updated.expiresAt.getTime() - Date.now();
      const remainingSeconds = Math.floor(remainingMs / 1000);

      // 应该被续期到3600秒
      expect(remainingSeconds).toBeGreaterThan(3500);
    });

    it('should not renew when TTL is sufficient', async () => {
      const sessionHash = 'test1000';
      await service.setMapping(sessionHash, 'channel1', 'key1');

      const renewed = await service.renewMapping(sessionHash);
      expect(renewed).toBe(false);
    });

    it('should return false for non-existent mapping', async () => {
      const renewed = await service.renewMapping('nonexistent');
      expect(renewed).toBe(false);
    });
  });

  describe('deleteMapping', () => {
    it('should delete mapping', async () => {
      const sessionHash = 'test1111';
      await service.setMapping(sessionHash, 'channel1', 'key1');

      await service.deleteMapping(sessionHash);

      const mapping = await service.getMapping(sessionHash);
      expect(mapping).toBeNull();
    });

    it('should do nothing for non-existent mapping', async () => {
      await expect(service.deleteMapping('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      await service.setMapping('hash1', 'channel1', 'key1');
      await service.setMapping('hash2', 'channel2', 'key2');
      await service.setMapping('hash3', 'channel3', 'key3');

      await service.updateMapping('hash1');
      await service.updateMapping('hash1');
      await service.updateMapping('hash2');

      const stats = await service.getStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.avgRequestsPerSession).toBe((3 + 2 + 1) / 3);
    });

    it('should return zero stats for empty cache', async () => {
      const stats = await service.getStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.avgRequestsPerSession).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      // 创建一些会话
      const mapping1 = await service.setMapping('hash1', 'channel1', 'key1');
      const mapping2 = await service.setMapping('hash2', 'channel2', 'key2');

      // 手动设置一个为已过期
      mapping1.expiresAt = new Date(Date.now() - 1000);

      const cleanedCount = await service.cleanupExpiredSessions();

      expect(cleanedCount).toBe(1);

      const m1 = await service.getMapping('hash1');
      const m2 = await service.getMapping('hash2');

      expect(m1).toBeNull();
      expect(m2).toBeTruthy();
    });
  });

  describe('getCacheSize', () => {
    it('should return correct cache size', async () => {
      expect(service.getCacheSize()).toBe(0);

      await service.setMapping('hash1', 'channel1', 'key1');
      expect(service.getCacheSize()).toBe(1);

      await service.setMapping('hash2', 'channel2', 'key2');
      expect(service.getCacheSize()).toBe(2);

      await service.deleteMapping('hash1');
      expect(service.getCacheSize()).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all mappings', async () => {
      await service.setMapping('hash1', 'channel1', 'key1');
      await service.setMapping('hash2', 'channel2', 'key2');

      expect(service.getCacheSize()).toBe(2);

      await service.clearAll();

      expect(service.getCacheSize()).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest session when cache is full', async () => {
      // 创建一个小缓存的测试实例
      const smallCacheModule: TestingModule = await Test.createTestingModule({
        providers: [
          MemorySessionStorageService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key, defaultValue) => {
                if (key === 'SESSION_MAX_CACHE_SIZE') return 3;
                return defaultValue;
              }),
            },
          },
        ],
      }).compile();

      const smallCacheService = smallCacheModule.get<MemorySessionStorageService>(
        MemorySessionStorageService
      );
      smallCacheService.onModuleInit();

      // 添加3个会话（填满缓存）
      await smallCacheService.setMapping('hash1', 'channel1', 'key1');
      await new Promise((resolve) => setTimeout(resolve, 10));
      await smallCacheService.setMapping('hash2', 'channel2', 'key2');
      await new Promise((resolve) => setTimeout(resolve, 10));
      await smallCacheService.setMapping('hash3', 'channel3', 'key3');

      expect(smallCacheService.getCacheSize()).toBe(3);

      // 添加第4个会话，应该淘汰最早的
      await new Promise((resolve) => setTimeout(resolve, 10));
      await smallCacheService.setMapping('hash4', 'channel4', 'key4');

      expect(smallCacheService.getCacheSize()).toBe(3);

      // hash1 应该被淘汰
      const m1 = await smallCacheService.getMapping('hash1');
      expect(m1).toBeNull();

      // 其他应该还在
      const m2 = await smallCacheService.getMapping('hash2');
      const m3 = await smallCacheService.getMapping('hash3');
      const m4 = await smallCacheService.getMapping('hash4');

      expect(m2).toBeTruthy();
      expect(m3).toBeTruthy();
      expect(m4).toBeTruthy();

      smallCacheService.onModuleDestroy();
    });
  });
});
