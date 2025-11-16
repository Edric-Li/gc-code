# Prisma Migrations

此目录包含所有数据库迁移文件，使用 Prisma 标准格式。

## 目录结构

```
migrations/
├── migration_lock.toml          # Prisma 迁移锁定文件（标识数据库类型）
├── 20231201000000_init/         # 初始化迁移
│   └── migration.sql
├── 20231202000000_add_channel_management/
│   └── migration.sql
├── ...
└── 20250116000001_add_temp_error_channel_status/
    └── migration.sql
```

## Migration 命名规范

格式：`{timestamp}_{description}/migration.sql`
- **timestamp**: YYYYMMDDHHMMSS 格式
- **description**: 简短描述（使用下划线分隔）

## 如何创建新的 Migration

### 方法 1: 使用 Prisma CLI（推荐）

```bash
# 1. 修改 schema.prisma
# 2. 生成 migration
npx prisma migrate dev --name your_migration_name

# 3. 应用 migration
npx prisma migrate deploy
```

### 方法 2: 手动创建

```bash
# 1. 创建 migration 目录
mkdir -p migrations/20250116120000_your_migration_name

# 2. 创建 migration.sql 文件
touch migrations/20250116120000_your_migration_name/migration.sql

# 3. 编写 SQL
# 4. 应用 migration
npx prisma migrate deploy
```

## Docker 部署

在 Docker 容器启动时，`docker-entrypoint.sh` 会自动执行：

```bash
npx prisma migrate deploy
```

这会应用所有未执行的 migrations。

## Migration 历史

Prisma 使用数据库中的 `_prisma_migrations` 表来追踪已执行的 migrations。

查看 migration 状态：
```bash
npx prisma migrate status
```

## 注意事项

⚠️ **重要**：
- 永远不要修改已部署的 migration 文件
- 永远不要删除已部署的 migration 文件
- 如果需要回滚，创建新的 migration
- 在生产环境部署前，先在测试环境验证

## 当前 Migrations

1. `20231201000000_init` - 初始化数据库表
2. `20231202000000_add_channel_management` - 添加渠道管理功能
3. `20231203000000_add_channel_management_fixed` - 修复渠道管理表结构
4. `20231204000000_add_api_key_request_log` - 添加 API Key 请求日志
5. `20231205000000_add_channel_priority_weight` - 添加渠道优先级和权重
6. `20231206000000_remove_channel_advanced_fields` - 移除渠道高级配置字段
7. `20250116000001_add_temp_error_channel_status` - 添加 TEMP_ERROR 渠道状态

## 错误处理策略更新

最新的 migration (`20250116000001_add_temp_error_channel_status`) 实现了改进的错误处理：

### 新的渠道状态
- `ACTIVE` - 正常使用
- `DISABLED` - 已禁用
- `ERROR` - 永久性错误（401/403）
- `TEMP_ERROR` - **临时错误（5xx，5分钟自动恢复）** ← 新增
- `MAINTENANCE` - 维护中
- `RATE_LIMITED` - 限流中

### 相关服务
- `ChannelErrorTrackerService` - 追踪 5 分钟窗口内的错误次数（阈值：3次）
- `ChannelAutoRecoveryService` - 定时任务，每分钟检查并自动恢复 TEMP_ERROR 状态的渠道
