import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanNonAnthropicProviders() {
  console.log('Cleaning non-Anthropic providers...');

  try {
    // 查找所有非 Anthropic 的提供商
    const nonAnthropicProviders = await prisma.aiProvider.findMany({
      where: {
        slug: {
          not: 'anthropic',
        },
      },
      include: {
        _count: {
          select: {
            channels: true,
          },
        },
      },
    });

    console.log(`Found ${nonAnthropicProviders.length} non-Anthropic providers`);

    // 删除没有关联渠道的提供商
    for (const provider of nonAnthropicProviders) {
      if (provider._count.channels === 0) {
        await prisma.aiProvider.delete({
          where: { id: provider.id },
        });
        console.log(`✓ Deleted provider: ${provider.name} (${provider.slug})`);
      } else {
        console.log(
          `⚠ Skipped provider: ${provider.name} (${provider.slug}) - has ${provider._count.channels} channels`
        );
      }
    }

    console.log('Cleaning completed!');
  } catch (error) {
    console.error('Error cleaning providers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  cleanNonAnthropicProviders().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
