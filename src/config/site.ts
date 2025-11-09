export const siteConfig = {
  name: 'GC Code',
  description: '支持 Claude 等多种 AI 模型',
  url: 'https://gc-code.example.com',
  ogImage: 'https://gc-code.example.com/og.png',
  links: {
    github: 'https://github.com/Wei-Shaw/claude-relay-service',
  },
  creator: 'GC Inc.',
};

export const navConfig = {
  mainNav: [
    {
      title: '首页',
      href: '/',
    },
    {
      title: '文档',
      href: '/docs',
    },
    {
      title: 'MCP 精选',
      href: '/mcp',
    },
    {
      title: 'API 地址',
      href: '/api',
    },
    {
      title: '用量查询',
      href: '/usage',
    },
  ],
  sidebarNav: [
    {
      title: '开始',
      items: [
        {
          title: '介绍',
          href: '/docs/introduction',
        },
        {
          title: '快速开始',
          href: '/docs/quick-start',
        },
      ],
    },
  ],
};
