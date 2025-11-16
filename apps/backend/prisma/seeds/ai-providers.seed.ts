import { PrismaClient, ProviderType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAiProviders() {
  console.log('Seeding AI Providers...');

  // 本系统只支持 Anthropic 协议的提供商
  const providers = [
    {
      name: 'Anthropic',
      slug: 'anthropic',
      type: ProviderType.ANTHROPIC,
      logoUrl: 'https://www.anthropic.com/favicon.ico',
      website: 'https://www.anthropic.com',
      description: 'Anthropic 提供 Claude 系列 AI 模型',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 1,
      metadata: {
        defaultModels: [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ],
        apiDocs: 'https://docs.anthropic.com/claude/reference',
      },
    },
  ];

  for (const provider of providers) {
    await prisma.aiProvider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });
    console.log(`✓ Created/Updated provider: ${provider.name}`);
  }

  console.log('AI Providers seeding completed!');
}

// 如果直接运行此文件
if (require.main === module) {
  seedAiProviders()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
