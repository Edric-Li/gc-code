/**
 * 文档配置
 * 定义文档导航结构和路由
 */

export interface DocItem {
  title: string;
  href: string;
  items?: DocItem[];
}

export interface DocSection {
  title: string;
  items: DocItem[];
}

export const docsConfig: DocSection[] = [
  {
    title: '快速开始',
    items: [
      {
        title: 'GC Code 概述',
        href: '/docs/getting-started/overview',
      },
      {
        title: '快速安装',
        href: '/docs/getting-started/installation',
      },
      {
        title: '基础配置',
        href: '/docs/getting-started/configuration',
      },
      {
        title: '第一个请求',
        href: '/docs/getting-started/first-request',
      },
    ],
  },
  {
    title: '核心功能',
    items: [
      {
        title: '模型支持',
        href: '/docs/core-features/models',
        items: [
          {
            title: 'Claude 集成',
            href: '/docs/core-features/models/claude',
          },
          {
            title: 'Kimi 集成',
            href: '/docs/core-features/models/kimi',
          },
          {
            title: 'GLM 集成',
            href: '/docs/core-features/models/glm',
          },
        ],
      },
      {
        title: 'API 接口',
        href: '/docs/core-features/api',
      },
      {
        title: '认证机制',
        href: '/docs/core-features/authentication',
      },
    ],
  },
  {
    title: '使用指南',
    items: [
      {
        title: '部署指南',
        href: '/docs/guides/deployment',
      },
      {
        title: '配置详解',
        href: '/docs/guides/configuration',
      },
      {
        title: '最佳实践',
        href: '/docs/guides/best-practices',
      },
      {
        title: '性能优化',
        href: '/docs/guides/performance',
      },
    ],
  },
  {
    title: 'API 参考',
    items: [
      {
        title: 'REST API',
        href: '/docs/api-reference/rest-api',
      },
      {
        title: '请求格式',
        href: '/docs/api-reference/request-format',
      },
      {
        title: '响应格式',
        href: '/docs/api-reference/response-format',
      },
      {
        title: '错误码',
        href: '/docs/api-reference/error-codes',
      },
    ],
  },
  {
    title: '常见问题',
    items: [
      {
        title: '安装问题',
        href: '/docs/faq/installation',
      },
      {
        title: '配置问题',
        href: '/docs/faq/configuration',
      },
      {
        title: '使用问题',
        href: '/docs/faq/usage',
      },
    ],
  },
];

/**
 * 获取所有文档路径的扁平列表
 */
export function getAllDocPaths(): string[] {
  const paths: string[] = [];

  function traverse(items: DocItem[]) {
    for (const item of items) {
      paths.push(item.href);
      if (item.items) {
        traverse(item.items);
      }
    }
  }

  docsConfig.forEach((section) => traverse(section.items));
  return paths;
}

/**
 * 根据当前路径获取上一页和下一页
 */
export function getDocNavigation(currentPath: string): {
  prev: DocItem | null;
  next: DocItem | null;
} {
  const allPaths = getAllDocPaths();
  const allItems: DocItem[] = [];

  function traverse(items: DocItem[]) {
    for (const item of items) {
      allItems.push(item);
      if (item.items) {
        traverse(item.items);
      }
    }
  }

  docsConfig.forEach((section) => traverse(section.items));

  const currentIndex = allPaths.indexOf(currentPath);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}
