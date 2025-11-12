import { PrismaClient, KeyStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * 生成测试 API Key
 */
async function createTestApiKey() {
  console.log('🔑 Creating test API key...\n');

  try {
    // 1. 查找或创建测试用户
    let testUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: 'test@example.com' }, { role: 'ADMIN' }],
      },
    });

    if (!testUser) {
      console.log('⚠️  No admin user found. Creating a test user...');
      testUser = await prisma.user.create({
        data: {
          username: 'test-admin',
          email: 'test@example.com',
          displayName: 'Test Admin',
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`✅ Created test user: ${testUser.email} (ID: ${testUser.id})\n`);
    } else {
      console.log(`✅ Using existing user: ${testUser.email} (ID: ${testUser.id})\n`);
    }

    // 2. 查找可用的渠道（可选）
    const channels = await prisma.channel.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
      take: 5,
    });

    console.log(`📡 Found ${channels.length} active channels:`);
    channels.forEach((ch, i) => {
      console.log(`   ${i + 1}. ${ch.name} (${ch.provider.name}) - ID: ${ch.id}`);
    });
    console.log();

    // 3. 生成 API Key
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const apiKey = `sk-${randomBytes}`;

    // 4. 创建 API Key（不绑定特定渠道，使用共享池）
    const createdKey = await prisma.apiKey.create({
      data: {
        userId: testUser.id,
        channelId: null, // null = 使用共享渠道池
        name: 'Test API Key',
        description: 'API Key for testing Claude Relay service',
        key: apiKey,
        status: KeyStatus.ACTIVE,
        expiresAt: null, // 永不过期
        dailyCostLimit: null, // 无限额
      },
    });

    console.log('🎉 Test API Key created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 API Key Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:          ${createdKey.id}`);
    console.log(`User:        ${testUser.displayName} (${testUser.email})`);
    console.log(`Name:        ${createdKey.name}`);
    console.log(`Status:      ${createdKey.status}`);
    console.log(`Channel:     Auto (Shared Pool)`);
    console.log(`Expires:     Never`);
    console.log(`Cost Limit:  Unlimited`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔐 YOUR API KEY (save this!):\n');
    console.log(`   ${apiKey}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 Test with curl:\n');
    console.log(`curl -X POST http://localhost:5555/api/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
`);
  } catch (error) {
    console.error('❌ Error creating test API key:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createTestApiKey()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
