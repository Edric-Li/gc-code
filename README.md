# GC Code Portal

[![Docker Build & Push](https://github.com/edricli7/gc-code1/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/edricli7/gc-code1/actions/workflows/docker-publish.yml)
[![Auto Release](https://github.com/edricli7/gc-code1/actions/workflows/auto-release.yml/badge.svg)](https://github.com/edricli7/gc-code1/actions/workflows/auto-release.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/edricli7/gc-code-portal?logo=docker)](https://hub.docker.com/r/edricli7/gc-code-portal)
[![Docker Image Size](https://img.shields.io/docker/image-size/edricli7/gc-code-portal/latest?logo=docker)](https://hub.docker.com/r/edricli7/gc-code-portal)

> 统一接入 Claude、Codex 等多种 AI 服务的门户网站

## 特性

- 🎨 现代化 UI 设计
- 🌓 深色/浅色主题切换
- 📱 完全响应式布局
- ⚡ 基于 Vite 的快速开发体验
- 🔍 完整的代码质量保证工具链
- 📝 TypeScript 类型安全

## 技术栈

- **框架**: React 19
- **构建工具**: Vite 6
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **路由**: React Router v7
- **代码质量**: ESLint + Stylelint + Prettier + Husky

## 快速开始

### 方式 1: 使用 Docker（推荐）

```bash
# 拉取最新镜像
docker pull edricli7/gc-code-portal:latest

# 运行容器
docker run -d -p 80:80 edricli7/gc-code-portal:latest

# 或使用 docker-compose
docker-compose up -d
```

访问 http://localhost

### 方式 2: 本地开发

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

#### 构建生产版本

```bash
npm run build
```

#### 预览生产版本

```bash
npm run preview
```

## 开发指南

### 代码质量检查

```bash
# 运行所有检查（类型检查 + ESLint + Stylelint + Prettier）
npm run validate

# 单独运行 ESLint
npm run lint:eslint

# 单独运行 Stylelint
npm run lint:style

# 自动修复 lint 问题
npm run lint:fix

# 格式化代码
npm run format

# TypeScript 类型检查
npm run type-check
```

详细的代码质量工具说明请查看 [CODE_QUALITY.md](./CODE_QUALITY.md)

### Git 提交

项目配置了 Git hooks，会在提交前自动检查代码质量：

```bash
git add .
git commit -m "feat: your feature"  # 自动运行 lint-staged
git push  # 自动运行 type-check
```

### 项目结构

```
gc-code-portal/
├── public/              # 静态资源
├── src/
│   ├── assets/         # 资源文件（图片、样式）
│   ├── components/     # React 组件
│   │   ├── common/    # 通用组件
│   │   ├── layout/    # 布局组件
│   │   └── ui/        # UI 组件
│   ├── contexts/      # React Context
│   ├── hooks/         # 自定义 Hooks
│   ├── lib/           # 工具函数
│   ├── pages/         # 页面组件
│   ├── router/        # 路由配置
│   ├── types/         # TypeScript 类型
│   └── config/        # 配置文件
├── .husky/            # Git hooks
└── docs/              # 项目文档
```

## 编辑器配置

### VS Code

推荐安装以下插件：

- ESLint
- Stylelint
- Prettier - Code formatter
- Tailwind CSS IntelliSense

推荐的 `.vscode/settings.json` 配置：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  }
}
```

## 可用脚本

| 脚本                 | 说明                       |
| -------------------- | -------------------------- |
| `npm run dev`        | 启动开发服务器             |
| `npm run build`      | 构建生产版本               |
| `npm run preview`    | 预览生产版本               |
| `npm run lint`       | 运行所有 lint 检查         |
| `npm run lint:fix`   | 自动修复 lint 问题         |
| `npm run format`     | 格式化代码                 |
| `npm run type-check` | TypeScript 类型检查        |
| `npm run validate`   | 完整验证（推荐提交前运行） |

## 文档

- [产品文档](./GC_Code_产品文档_v1.0.md)
- [实施计划](./GC_Code_V1实施计划.md)
- [代码质量](./CODE_QUALITY.md)
- [GitHub Actions 使用指南](./.github/WORKFLOW_USAGE.md)
- [Docker 部署](./docker-compose.yml)

## 许可证

MIT

## 贡献

欢迎贡献！请确保：

1. 代码通过 `npm run validate`
2. 遵循现有的代码风格
3. 添加必要的测试和文档
