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
      icon: 'Home',
    },
    {
      title: '文档中心',
      href: '/docs',
      icon: 'BookOpen',
    },
    {
      title: 'MCP 精选',
      href: '/mcp',
      icon: 'Sparkles',
    },
    {
      title: '经验分享',
      href: '/experience',
      icon: 'MessageSquare',
    },
    {
      title: '用量查询',
      href: '/usage',
      icon: 'BarChart3',
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
