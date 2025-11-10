# 数据库使用说明

## 数据库信息

- **数据库名称**: `gc_code_portal`
- **连接信息**:
  - Host: localhost
  - Port: 5432
  - User: postgres
  - Password: xA123456
  - Docker 容器: pg-temp

## 数据库表结构

### users 表（用户表）

| 字段          | 类型         | 说明                                 |
| ------------- | ------------ | ------------------------------------ |
| id            | UUID         | 主键，自动生成                       |
| username      | VARCHAR(100) | 用户名，唯一                         |
| email         | VARCHAR(255) | 邮箱，唯一                           |
| password_hash | VARCHAR(255) | 密码哈希（可为空，OAuth 用户无密码） |
| display_name  | VARCHAR(255) | 显示名称                             |
| avatar_url    | VARCHAR(500) | 头像 URL                             |
| role          | Role         | 角色：ADMIN / USER                   |
| is_active     | BOOLEAN      | 是否激活                             |
| created_at    | TIMESTAMP    | 创建时间                             |
| updated_at    | TIMESTAMP    | 更新时间（自动更新）                 |
| last_login_at | TIMESTAMP    | 最后登录时间                         |

### oauth_accounts 表（OAuth 账号表）

| 字段          | 类型          | 说明                                                 |
| ------------- | ------------- | ---------------------------------------------------- |
| id            | UUID          | 主键，自动生成                                       |
| user_id       | UUID          | 外键，关联 users 表                                  |
| provider      | OAuthProvider | OAuth 提供商：AZURE_AD / GOOGLE / GITHUB / MICROSOFT |
| provider_id   | VARCHAR(255)  | 第三方用户 ID                                        |
| email         | VARCHAR(255)  | OAuth 账号邮箱                                       |
| display_name  | VARCHAR(255)  | OAuth 账号显示名称                                   |
| avatar_url    | VARCHAR(500)  | OAuth 账号头像                                       |
| access_token  | TEXT          | 访问令牌                                             |
| refresh_token | TEXT          | 刷新令牌                                             |
| expires_at    | TIMESTAMP     | 令牌过期时间                                         |
| created_at    | TIMESTAMP     | 创建时间                                             |
| updated_at    | TIMESTAMP     | 更新时间（自动更新）                                 |

**约束**：

- `(user_id, provider)` 唯一：一个用户只能绑定一个特定提供商的账号
- `(provider, provider_id)` 唯一：同一个 OAuth 账号只能绑定一个用户
- CASCADE 删除：删除用户时自动删除其所有 OAuth 账号

## 默认账号

系统已创建一个默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@gccode.cn`
- **角色**: ADMIN

⚠️ **重要**：生产环境请立即修改默认密码！

## 常用命令

### 在后端目录下运行：

```bash
# 初始化数据库表（使用 Node.js 脚本，如果已存在则不会重复创建）
npm run db:init

# 重置数据库（使用 Node.js 脚本，删除并重建所有表，会丢失所有数据！）
npm run db:reset

# 进入数据库命令行
npm run db:shell
```

这些命令使用 Node.js 脚本连接到 PostgreSQL，无需直接使用 Docker 命令，更加跨平台。

**脚本说明**：

- `scripts/init-db.js` - 初始化数据库表结构和默认数据
- `scripts/reset-db.js` - 重置数据库（删除并重建）

### 直接使用 Docker 命令：

```bash
# 查看所有表
docker exec -it pg-temp psql -U postgres -d gc_code_portal -c "\dt"

# 查看用户列表
docker exec -it pg-temp psql -U postgres -d gc_code_portal -c "SELECT id, username, email, role FROM users;"

# 查看 OAuth 账号列表
docker exec -it pg-temp psql -U postgres -d gc_code_portal -c "SELECT id, user_id, provider, email FROM oauth_accounts;"

# 备份数据库
docker exec -t pg-temp pg_dump -U postgres gc_code_portal > backup.sql

# 恢复数据库
docker exec -i pg-temp psql -U postgres gc_code_portal < backup.sql
```

## 数据库设计说明

### 用户认证方式

系统支持三种用户类型：

1. **纯本地用户**：只有 `password_hash`，无 OAuth 账号
2. **纯 OAuth 用户**：`password_hash` 为空，有一个或多个 OAuth 账号
3. **混合用户**：既有 `password_hash`，也有 OAuth 账号（可以用两种方式登录）

### OAuth 账号绑定规则

- 一个用户可以绑定多个不同的 OAuth 提供商（例如同时绑定 Azure AD 和 Google）
- 一个用户不能重复绑定同一个提供商（例如不能绑定两个 Azure AD 账号）
- 同一个 OAuth 账号不能绑定到多个用户
- 通过 `email` 字段可以实现账号自动关联（相同邮箱可以自动绑定到同一用户）

### 触发器

数据库包含自动更新 `updated_at` 字段的触发器，每次更新记录时会自动更新时间戳。

## 索引

为提高查询性能，已创建以下索引：

- `users.email` - 用于邮箱登录查询
- `users.username` - 用于用户名登录查询
- `oauth_accounts.user_id` - 用于查询用户的所有 OAuth 账号
- `oauth_accounts.provider` - 用于按提供商查询

## 环境变量

确保 `backend/.env` 文件包含正确的数据库连接信息：

```env
DATABASE_URL=postgresql://postgres:xA123456@localhost:5432/gc_code_portal
```
