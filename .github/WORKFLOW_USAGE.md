# GitHub Actions 工作流使用指南

## 📋 概述

本项目配置了自动化 CI/CD 流程，可以自动构建、发布 Docker 镜像和创建 GitHub Release。

## 🚀 工作流程

### 1. 自动发布流程 (`auto-release.yml`)

**功能：**

- 自动检测代码变更
- 自动递增版本号（patch 版本）
- 自动构建多平台 Docker 镜像（amd64, arm64）
- 推送到 Docker Hub 和 GitHub Container Registry
- 自动创建 GitHub Release

**触发条件：**

- 推送到 `master` 分支
- 忽略文档更新（\*.md, docs/等）
- 忽略 `[skip ci]` 标记的提交

**工作流程：**

1. 检测是否有实质性代码变更
2. 获取当前版本号（从 Git Tag）
3. 计算新版本号（自动 +1 patch 版本）
4. 生成更新日志
5. 创建新 Git Tag
6. 构建并推送 Docker 镜像
7. 创建 GitHub Release

### 2. Docker 构建和发布 (`docker-publish.yml`)

**功能：**

- 手动或 tag 触发的 Docker 构建
- 多平台支持（amd64, arm64）
- 智能标签管理
- 使用 GitHub Actions Cache 加速构建

**触发条件：**

- 推送到 `master` 分支
- 创建版本标签（如 `v1.0.0`）
- Pull Request（仅构建，不推送）
- 手动触发（workflow_dispatch）

## 📝 使用方式

### 方式 1: 自动发布（推荐）

只需正常提交代码到 master 分支：

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin master
```

**结果：**

- ✅ 自动检测代码变更
- ✅ 自动递增版本号（例如：v1.0.0 → v1.0.1）
- ✅ 自动构建并推送 Docker 镜像
- ✅ 自动创建 GitHub Release

### 方式 2: 手动创建版本

如果需要指定特定版本号：

```bash
# 创建版本标签
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

**结果：**

- 触发 `docker-publish.yml` 工作流
- 构建并推送以下标签：
  - `v1.2.0`
  - `1.2.0`
  - `1.2`
  - `1`
  - `latest`

### 方式 3: 跳过自动构建

在 commit 消息中添加 `[skip ci]`：

```bash
git commit -m "docs: 更新文档 [skip ci]"
git push origin master
```

## 🔧 配置 Secrets

在使用之前，需要在 GitHub 仓库中配置以下 Secrets：

### 必需的 Secrets

1. **DOCKERHUB_USERNAME** - Docker Hub 用户名
   - 设置路径: Settings → Secrets → Actions → New repository secret
   - 值: `edricli7`

2. **DOCKERHUB_TOKEN** - Docker Hub 访问令牌
   - 创建令牌: https://hub.docker.com/settings/security
   - 设置路径: Settings → Secrets → Actions → New repository secret

### 可选的 Secrets

GitHub Container Registry (GHCR) 使用 `GITHUB_TOKEN` 自动认证，无需额外配置。

## 📦 Docker 镜像使用

### 拉取镜像

```bash
# 从 Docker Hub 拉取最新版本
docker pull edricli7/gc-code-portal:latest

# 拉取指定版本
docker pull edricli7/gc-code-portal:v1.0.0

# 从 GitHub Container Registry 拉取
docker pull ghcr.io/edricli7/gc-code-portal:latest
```

### 运行容器

```bash
# 直接运行
docker run -d -p 80:80 edricli7/gc-code-portal:latest

# 使用 docker-compose
docker-compose up -d
```

## 🛠️ 手动触发构建

1. 访问仓库的 **Actions** 页面
2. 选择 **"Docker Build & Push"** 工作流
3. 点击 **"Run workflow"**
4. 选择分支并运行

## 📊 查看构建状态

- **Actions 页面**: https://github.com/你的用户名/gc-code1/actions
- **Releases 页面**: https://github.com/你的用户名/gc-code1/releases
- **Docker Hub**: https://hub.docker.com/r/edricli7/gc-code-portal
- **GHCR**: https://github.com/你的用户名?tab=packages

## 🎯 版本号规则

项目使用语义化版本号（Semantic Versioning）：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 自动发布规则

- 推送到 master 分支 → 自动递增 PATCH 版本
- 手动创建 tag → 使用指定版本号

## ❓ 常见问题

### Q: 如何回滚到之前的版本？

```bash
# 使用特定版本标签
docker pull edricli7/gc-code-portal:v1.0.0

# 在 docker-compose.yml 中指定版本
image: edricli7/gc-code-portal:v1.0.0
```

### Q: 为什么我的提交没有触发自动发布？

检查以下几点：

1. 是否只修改了文档文件（\*.md, docs/等）
2. commit 消息是否包含 `[skip ci]`
3. 是否由 `github-actions[bot]` 创建的提交

### Q: 构建失败如何调试？

1. 查看 Actions 页面的详细日志
2. 在本地测试 Docker 构建：
   ```bash
   docker build -t test .
   ```
3. 检查 Secrets 是否配置正确

### Q: 如何修改版本号递增规则？

编辑 `.github/workflows/auto-release.yml`，修改 `Calculate next version` 步骤中的版本计算逻辑。

### Q: 支持哪些平台？

当前支持以下平台：

- ✅ linux/amd64
- ✅ linux/arm64

## 📚 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 官方文档](https://docs.docker.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Docker Hub 仓库](https://hub.docker.com/r/edricli7/gc-code-portal)

## 🔄 工作流程图

```
代码提交到 master
    ↓
检测文件变更
    ↓
有实质性变更？
    ├─ 否 → 跳过构建
    └─ 是 → 继续
        ↓
    计算新版本号
        ↓
    生成更新日志
        ↓
    创建 Git Tag
        ↓
    构建 Docker 镜像
        ↓
    推送到 Docker Hub/GHCR
        ↓
    创建 GitHub Release
        ↓
    完成 ✅
```
