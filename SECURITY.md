# 安全配置说明

本文档说明如何在生产环境中配置安全响应头。

## 开发环境

开发环境的安全头已通过 `vite.config.ts` 中的自定义插件自动配置。

## 生产环境配置

### Nginx

在 Nginx 配置文件中添加以下内容：

```nginx
server {
    # ... 其他配置

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://stats.gccode.cn; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

    # 其他安全头
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # ... 其他配置
}
```

### Apache

在 `.htaccess` 文件或 Apache 配置中添加：

```apache
<IfModule mod_headers.c>
    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://stats.gccode.cn; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

    # 其他安全头
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>
```

### Netlify

在项目根目录创建 `public/_headers` 文件：

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://stats.gccode.cn; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Vercel

在项目根目录创建 `vercel.json`：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://stats.gccode.cn; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

## 安全头说明

### Content-Security-Policy (CSP)

防止 XSS 攻击，限制资源加载来源。

- `default-src 'self'`: 默认只允许同源资源
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: 允许内联脚本（React 需要）
- `style-src 'self' 'unsafe-inline'`: 允许内联样式（Tailwind 需要）
- `connect-src 'self' https://stats.gccode.cn`: 允许连接到 API 服务器

### X-Content-Type-Options

防止 MIME 类型嗅探攻击。

### X-Frame-Options

防止点击劫持攻击，禁止页面被嵌入到 iframe。

### X-XSS-Protection

启用浏览器的 XSS 过滤器。

### Referrer-Policy

控制 Referer 头的发送策略，保护用户隐私。

### Permissions-Policy

限制浏览器功能的使用，如地理位置、麦克风、摄像头等。

## localStorage 安全

API Key 存储在 localStorage 中，虽然方便，但存在 XSS 风险。建议：

1. 确保所有用户输入都经过适当的验证和转义
2. 定期审查第三方依赖的安全性
3. 考虑实施子资源完整性（SRI）检查
4. 如果可能，考虑使用 httpOnly cookie 代替 localStorage（需要后端支持）

## 定期更新

安全配置应定期审查和更新，以应对新的威胁和最佳实践。
