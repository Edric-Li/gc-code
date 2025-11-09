export const siteConfig = {
  name: 'GC Code',
  description: '统一接入 Claude、Codex 等多种 AI 服务',
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
      title: '指南',
      href: '/guides',
    },
    {
      title: 'API',
      href: '/api',
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
