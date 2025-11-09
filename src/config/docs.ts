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
    title: 'Claude 指南',
    items: [
      {
        title: 'Claude 介绍',
        href: '/docs/claude/introduction',
      },
      {
        title: '环境安装',
        href: '/docs/claude/installation',
      },
      {
        title: '快速开始',
        href: '/docs/claude/quick-start',
      },
      {
        title: 'API 使用',
        href: '/docs/claude/api-usage',
      },
      {
        title: '高级功能',
        href: '/docs/claude/advanced',
      },
      {
        title: '常见问题',
        href: '/docs/claude/faq',
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
