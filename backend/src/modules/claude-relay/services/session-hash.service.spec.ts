import { Test, TestingModule } from '@nestjs/testing';
import { SessionHashService } from './session-hash.service';

describe('SessionHashService', () => {
  let service: SessionHashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionHashService],
    }).compile();

    service = module.get<SessionHashService>(SessionHashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateHash', () => {
    it('should generate same hash for same messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const hash1 = service.generateHash(messages);
      const hash2 = service.generateHash(messages);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hash for different messages', () => {
      const messages1 = [{ role: 'user', content: 'Hello' }];
      const messages2 = [{ role: 'user', content: 'Hi' }];

      const hash1 = service.generateHash(messages1);
      const hash2 = service.generateHash(messages2);

      expect(hash1).not.toBe(hash2);
    });

    it('should only use first N messages', () => {
      const messages1 = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Different' }, // 第4条，不会被包含
      ];

      const messages2 = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Another Different' }, // 第4条不同，但不影响hash
      ];

      const hash1 = service.generateHash(messages1);
      const hash2 = service.generateHash(messages2);

      // 因为只取前3条，所以hash应该相同
      expect(hash1).toBe(hash2);
    });

    it('should handle multimodal messages', () => {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' },
            { type: 'image', source: { data: 'base64data...' } },
          ],
        },
      ];

      const hash = service.generateHash(messages);
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(16);
    });

    it('should exclude system messages by default', () => {
      const messages1 = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
      ];

      const messages2 = [
        { role: 'user', content: 'Hello' },
      ];

      const hash1 = service.generateHash(messages1);
      const hash2 = service.generateHash(messages2);

      // 系统消息默认被排除，所以hash应该相同
      expect(hash1).toBe(hash2);
    });

    it('should include system messages when requested', () => {
      const messages1 = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
      ];

      const messages2 = [
        { role: 'user', content: 'Hello' },
      ];

      const hash1 = service.generateHash(messages1, { includeSystemPrompt: true });
      const hash2 = service.generateHash(messages2, { includeSystemPrompt: true });

      // 包含系统消息时，hash应该不同
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty messages', () => {
      expect(() => service.generateHash([])).toThrow('Messages array cannot be empty');
    });

    it('should throw error for invalid messages', () => {
      expect(() => service.generateHash(null as any)).toThrow();
      expect(() => service.generateHash(undefined as any)).toThrow();
    });
  });

  describe('validateHash', () => {
    it('should validate correct hash', () => {
      const hash = 'a3f5c8e9b2d1f4a7';
      expect(service.validateHash(hash)).toBe(true);
    });

    it('should reject invalid hash length', () => {
      const hash = 'abc123';
      expect(service.validateHash(hash)).toBe(false);
    });

    it('should reject non-hex hash', () => {
      const hash = 'ghijklmnopqrstuv';
      expect(service.validateHash(hash)).toBe(false);
    });

    it('should reject non-string hash', () => {
      expect(service.validateHash(null as any)).toBe(false);
      expect(service.validateHash(undefined as any)).toBe(false);
      expect(service.validateHash(123 as any)).toBe(false);
    });

    it('should validate uppercase hex', () => {
      const hash = 'A3F5C8E9B2D1F4A7';
      expect(service.validateHash(hash)).toBe(true);
    });
  });
});
