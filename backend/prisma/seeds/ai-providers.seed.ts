import { PrismaClient, ProviderType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAiProviders() {
  console.log('Seeding AI Providers...');

  const providers = [
    {
      name: 'OpenAI',
      slug: 'openai',
      type: ProviderType.OPENAI,
      logoUrl: 'https://cdn.openai.com/assets/favicon-32x32.png',
      website: 'https://openai.com',
      description: 'OpenAI 是领先的 AI 研究公司，提供 GPT 系列模型',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 1,
      metadata: {
        defaultModels: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
        apiDocs: 'https://platform.openai.com/docs/api-reference',
      },
    },
    {
      name: 'Anthropic',
      slug: 'anthropic',
      type: ProviderType.ANTHROPIC,
      logoUrl: 'https://www.anthropic.com/favicon.ico',
      website: 'https://www.anthropic.com',
      description: 'Anthropic 提供 Claude 系列 AI 模型',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 2,
      metadata: {
        defaultModels: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        apiDocs: 'https://docs.anthropic.com/claude/reference',
      },
    },
    {
      name: 'Azure OpenAI',
      slug: 'azure-openai',
      type: ProviderType.AZURE_OPENAI,
      logoUrl: 'https://azure.microsoft.com/favicon.ico',
      website: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
      description: 'Microsoft Azure 提供的 OpenAI 服务',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 3,
      metadata: {
        defaultModels: ['gpt-4', 'gpt-35-turbo'],
        apiDocs: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/',
      },
    },
    {
      name: 'Google AI',
      slug: 'google-ai',
      type: ProviderType.GOOGLE_AI,
      logoUrl: 'https://www.google.com/favicon.ico',
      website: 'https://ai.google.dev',
      description: 'Google 提供的 Gemini 系列 AI 模型',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 4,
      metadata: {
        defaultModels: ['gemini-pro', 'gemini-pro-vision'],
        apiDocs: 'https://ai.google.dev/docs',
      },
    },
    {
      name: 'Kimi',
      slug: 'kimi',
      type: ProviderType.KIMI,
      logoUrl: 'https://kimi.moonshot.cn/favicon.ico',
      website: 'https://kimi.moonshot.cn',
      description: '月之暗面提供的 Kimi AI 模型',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 5,
      metadata: {
        defaultModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
        apiDocs: 'https://platform.moonshot.cn/docs',
      },
    },
    {
      name: 'DeepSeek',
      slug: 'deepseek',
      type: ProviderType.DEEPSEEK,
      logoUrl: 'https://www.deepseek.com/favicon.ico',
      website: 'https://www.deepseek.com',
      description: 'DeepSeek 提供的开源 AI 模型',
      isBuiltIn: true,
      isActive: true,
      sortOrder: 6,
      metadata: {
        defaultModels: ['deepseek-chat', 'deepseek-coder'],
        apiDocs: 'https://platform.deepseek.com/api-docs',
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
