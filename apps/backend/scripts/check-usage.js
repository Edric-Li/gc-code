const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // 检查使用记录
    const usageRecords = await prisma.apiKeyUsage.findMany();
    console.log('===== API Key Usage Records =====');
    console.log('Total records:', usageRecords.length);

    if (usageRecords.length > 0) {
      console.log('\nSample records:');
      console.log(JSON.stringify(usageRecords.slice(0, 3), null, 2));
    } else {
      console.log('\n⚠️  No usage records found in database!');
      console.log('This explains why all statistics show 0.');

      // 检查 API Keys
      const apiKeys = await prisma.apiKey.findMany({
        select: { id: true, name: true }
      });
      console.log('\nExisting API Keys:', apiKeys.length);

      // 创建测试数据
      if (apiKeys.length > 0) {
        console.log('\n💡 Creating sample usage data for testing...');
        const sampleKey = apiKeys[0];

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        await prisma.apiKeyUsage.create({
          data: {
            keyId: sampleKey.id,
            userId: (await prisma.apiKey.findUnique({ where: { id: sampleKey.id } })).userId,
            requestCount: 150,
            successCount: 145,
            failureCount: 5,
            tokensUsed: 25000,
            cost: 12.50,
            periodStart: yesterday,
            periodEnd: now,
          }
        });

        console.log('✅ Sample usage data created successfully!');
        console.log('   - Requests: 150 (145 success, 5 failures)');
        console.log('   - Tokens: 25,000');
        console.log('   - Cost: ¥12.50');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
