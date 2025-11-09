# GitHub Secrets 配置指南

在使用 GitHub Actions 自动构建和发布 Docker 镜像之前，需要配置以下 Secrets。

## 📋 必需的 Secrets

### 1. DOCKERHUB_USERNAME

Docker Hub 用户名，用于登录 Docker Hub。

**设置步骤：**

1. 访问你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. Name: `DOCKERHUB_USERNAME`
5. Secret: `edricli7`（你的 Docker Hub 用户名）
6. 点击 **Add secret**

### 2. DOCKERHUB_TOKEN

Docker Hub 访问令牌，用于推送镜像到 Docker Hub。

**创建令牌：**

1. 登录 [Docker Hub](https://hub.docker.com/)
2. 点击右上角头像 → **Account Settings**
3. 选择 **Security** 标签页
4. 点击 **New Access Token**
5. 输入描述（如：GitHub Actions）
6. 选择权限：**Read, Write, Delete**
7. 点击 **Generate**
8. **复制令牌**（只显示一次！）

**设置 Secret：**

1. 访问 GitHub 仓库 Settings → Secrets and variables → Actions
2. 点击 **New repository secret**
3. Name: `DOCKERHUB_TOKEN`
4. Secret: 粘贴刚才复制的令牌
5. 点击 **Add secret**

## 🎯 可选的 Secrets

### GITHUB_TOKEN

GitHub Container Registry (GHCR) 使用 `GITHUB_TOKEN` 自动认证，**无需手动配置**。

这个 token 由 GitHub Actions 自动提供，已经配置在工作流中。

## ✅ 验证配置

配置完成后，你可以：

1. 访问仓库的 **Settings** → **Secrets and variables** → **Actions**
2. 确认以下 Secrets 已添加：
   - ✅ `DOCKERHUB_USERNAME`
   - ✅ `DOCKERHUB_TOKEN`

## 🚀 测试自动构建

配置完成后，推送一个提交到 master 分支来测试：

```bash
git add .
git commit -m "test: 测试自动构建"
git push origin master
```

然后访问 **Actions** 页面查看构建状态。

## 🔒 安全注意事项

1. **永远不要**将 Secrets 提交到代码仓库
2. **永远不要**在 Actions 日志中打印 Secrets
3. 定期轮换访问令牌
4. 如果令牌泄露，立即在 Docker Hub 中删除并重新生成

## ❓ 常见问题

### Q: 我忘记复制 Docker Hub 令牌了怎么办？

A: 在 Docker Hub 的 Security 页面删除旧令牌，重新生成一个新的。

### Q: 如何更新已配置的 Secret？

A: 访问 Settings → Secrets → Actions，点击对应 Secret 右侧的 **Update** 按钮。

### Q: 推送失败提示认证错误？

A: 检查：

1. DOCKERHUB_USERNAME 是否正确
2. DOCKERHUB_TOKEN 是否有效
3. 令牌权限是否包含 Write

### Q: 可以使用 Docker Hub 密码而不是令牌吗？

A: 不推荐！出于安全考虑，应该使用访问令牌。令牌可以随时撤销且权限可控。

## 📚 相关链接

- [Docker Hub Token 文档](https://docs.docker.com/docker-hub/access-tokens/)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions 最佳实践](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
