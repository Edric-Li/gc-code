import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// 强制要求设置加密密钥环境变量
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    'ENCRYPTION_KEY environment variable must be set. ' +
      'Generate a secure key using: openssl rand -base64 32\n' +
      'Then add it to your .env file: ENCRYPTION_KEY=your-generated-key'
  );
}

if (ENCRYPTION_KEY.length < 32) {
  throw new Error(
    'ENCRYPTION_KEY must be at least 32 characters long for security. ' +
      'Generate a new key using: openssl rand -base64 32'
  );
}

// 确保密钥长度为 32 字节
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

/**
 * 加密 API 密钥
 */
export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // 格式: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * 解密 API 密钥
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * 脱敏 API 密钥（用于显示）
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  const prefix = apiKey.substring(0, 7);
  const suffix = apiKey.substring(apiKey.length - 4);
  return `${prefix}...${suffix}`;
}
