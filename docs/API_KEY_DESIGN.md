# API Token 管理系统设计文档

> 版本: v1.0
> 日期: 2025-11-11
> 作者: Claude Code
> 项目: gc-code1 - API 令牌管理 MVP

---

## 📋 目录

- [1. 项目背景](#1-项目背景)
- [2. 设计目标](#2-设计目标)
- [3. 数据库设计](#3-数据库设计)
- [4. MVP 功能设计](#4-mvp-功能设计)
- [5. API 接口设计](#5-api-接口设计)
- [6. 安全设计](#6-安全设计)
- [7. 实现路线图](#7-实现路线图)
- [8. 技术栈](#8-技术栈)

---

## 1. 项目背景

### 1.1 旧项目问题分析

**claude-relay-service** 项目存在的问题：

- 使用 Redis 作为主数据库，随着规模增长技术债务增加
- 数据持久化和复杂查询能力有限
- 功能过于复杂，包含大量非核心功能
- 维护成本高，扩展性受限

### 1.2 新项目定位

在当前 **gc-code1** 项目中重新实现精简版的 API Keys 管理系统：

- 从 Redis 迁移到 PostgreSQL + Prisma ORM
- 保留核心功能：令牌管理、额度控制、用量统计
- 剔除非必要功能：复杂限流、动态定价、激活模式
- 实现软删除以保留历史数据

---

## 2. 设计目标

### 2.1 核心功能需求

1. **令牌基础管理**
   - 创建令牌（设置名称、过期时间、额度）
   - 查询令牌列表（支持搜索、过滤、分页）
   - 更新令牌信息
   - 删除令牌（软删除）
   - 撤销令牌

2. **用户关联**
   - 一个用户可以创建多个令牌
   - 令牌与用户强关联
   - 支持按用户统计总体用量

3. **用量统计**
   - 令牌级别统计（单个令牌的使用情况）
   - 用户级别统计（用户所有令牌的总用量）
   - 支持时间范围查询
   - 按天/周/月聚合展示

4. **数据持久化**
   - 软删除保留历史数据
   - 删除令牌后用量数据不丢失
   - 支持恢复已删除的令牌

### 2.2 非功能性需求

- **性能**: 令牌验证 < 10ms
- **安全**: 令牌哈希存储，明文仅显示一次
- **可扩展性**: 预留权限字段支持未来扩展
- **易用性**: RESTful API，清晰的错误提示

---

## 3. 数据库设计

### 3.1 技术选型

- **数据库**: PostgreSQL 15
- **ORM**: Prisma 5
- **关系**: 外键约束 + 级联删除

### 3.2 表结构设计

#### 3.2.1 枚举类型

```prisma
// API Token 状态枚举
enum TokenStatus {
  ACTIVE     // 激活中
  EXPIRED    // 已过期
  REVOKED    // 已撤销
  DELETED    // 已删除（软删除）
}
```

#### 3.2.2 API Token 主表

```prisma
model ApiToken {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String      @map("user_id") @db.Uuid

  // 基础信息
  name        String      @db.VarChar(255)                    // 令牌名称
  description String?     @db.Text                            // 令牌描述
  token       String      @unique @db.VarChar(255)            // 令牌值（SHA256哈希后的前缀）
  tokenHash   String      @unique @map("token_hash") @db.VarChar(64) // 完整哈希值，用于验证

  // 额度和限制
  quotaLimit  Decimal?    @map("quota_limit") @db.Decimal(12, 2)  // 总额度（null=无限）
  quotaUsed   Decimal     @default(0) @map("quota_used") @db.Decimal(12, 2) // 已使用额度

  // 请求次数统计
  requestLimit Int?       @map("request_limit")               // 请求次数限制（null=无限）
  requestCount Int        @default(0) @map("request_count")  // 已使用请求次数

  // 时间字段
  expiresAt   DateTime?   @map("expires_at") @db.Timestamp(3)   // 过期时间（null=永不过期）
  lastUsedAt  DateTime?   @map("last_used_at") @db.Timestamp(3) // 最后使用时间
  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt   DateTime    @default(now()) @updatedAt @map("updated_at") @db.Timestamp(3)
  deletedAt   DateTime?   @map("deleted_at") @db.Timestamp(3)   // 软删除时间

  // 状态和权限
  status      TokenStatus @default(ACTIVE)
  permissions Json?                                             // 权限范围（JSON数组）
  metadata    Json?                                             // 其他元数据

  // 关联关系
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageRecords ApiTokenUsage[]

  @@index([userId], name: "idx_api_tokens_user_id")
  @@index([token], name: "idx_api_tokens_token")
  @@index([tokenHash], name: "idx_api_tokens_token_hash")
  @@index([status], name: "idx_api_tokens_status")
  @@index([expiresAt], name: "idx_api_tokens_expires_at")
  @@index([deletedAt], name: "idx_api_tokens_deleted_at")
  @@map("api_tokens")
}
```

**字段说明**:

| 字段           | 类型     | 说明                                    |
| -------------- | -------- | --------------------------------------- |
| `id`           | UUID     | 主键                                    |
| `userId`       | UUID     | 所属用户ID（外键）                      |
| `name`         | String   | 令牌名称，用于用户识别                  |
| `description`  | String   | 令牌描述（可选）                        |
| `token`        | String   | 令牌前缀（如 `sk-***abc123`），用于显示 |
| `tokenHash`    | String   | SHA256 哈希值，用于验证                 |
| `quotaLimit`   | Decimal  | 总额度限制，null 表示无限               |
| `quotaUsed`    | Decimal  | 已使用额度                              |
| `requestLimit` | Int      | 请求次数限制，null 表示无限             |
| `requestCount` | Int      | 已使用请求次数                          |
| `expiresAt`    | DateTime | 过期时间，null 表示永不过期             |
| `lastUsedAt`   | DateTime | 最后使用时间                            |
| `deletedAt`    | DateTime | 软删除时间戳                            |
| `status`       | Enum     | 令牌状态                                |
| `permissions`  | JSON     | 权限范围（预留扩展）                    |
| `metadata`     | JSON     | 其他元数据（预留扩展）                  |

#### 3.2.3 API Token 用量记录表

```prisma
model ApiTokenUsage {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tokenId     String   @map("token_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid   // 冗余，便于用户级统计

  // 使用统计
  requestCount Int     @default(0) @map("request_count")        // 请求次数
  successCount Int     @default(0) @map("success_count")        // 成功次数
  failureCount Int     @default(0) @map("failure_count")        // 失败次数

  // 费用统计
  tokensUsed  Int      @default(0) @map("tokens_used")          // 消耗的Token数量（AI场景）
  cost        Decimal  @default(0) @db.Decimal(12, 4)           // 产生的费用

  // 时间字段（按小时或天聚合）
  periodStart DateTime @map("period_start") @db.Timestamp(3)     // 统计周期开始
  periodEnd   DateTime @map("period_end") @db.Timestamp(3)       // 统计周期结束
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp(3)
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamp(3)

  // 元数据
  metadata    Json?                                               // 额外统计数据

  // 关联关系
  token       ApiToken @relation(fields: [tokenId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tokenId, periodStart])  // 防止重复统计
  @@index([tokenId], name: "idx_api_token_usage_token_id")
  @@index([userId], name: "idx_api_token_usage_user_id")
  @@index([periodStart], name: "idx_api_token_usage_period_start")
  @@index([createdAt], name: "idx_api_token_usage_created_at")
  @@map("api_token_usage")
}
```

**设计说明**:

- 按时间周期（小时/天）聚合统计数据
- 冗余 `userId` 字段便于用户级查询
- `@@unique([tokenId, periodStart])` 防止重复统计
- 软删除令牌后，用量记录依然保留

#### 3.2.4 User 模型扩展

在现有 `User` 模型中添加关联：

```prisma
model User {
  // ... 现有字段

  // 新增关联
  apiTokens            ApiToken[]
  apiTokenUsage        ApiTokenUsage[]
}
```

### 3.3 索引优化

| 表                | 索引          | 用途                     |
| ----------------- | ------------- | ------------------------ |
| `api_tokens`      | `userId`      | 查询用户的所有令牌       |
| `api_tokens`      | `token`       | 快速查找令牌（显示前缀） |
| `api_tokens`      | `tokenHash`   | 令牌验证（最重要）       |
| `api_tokens`      | `status`      | 按状态过滤               |
| `api_tokens`      | `expiresAt`   | 过期检查和清理           |
| `api_tokens`      | `deletedAt`   | 软删除过滤               |
| `api_token_usage` | `tokenId`     | 令牌级统计查询           |
| `api_token_usage` | `userId`      | 用户级统计查询           |
| `api_token_usage` | `periodStart` | 时间范围查询             |

### 3.4 数据关系图

```
User (用户)
  ├── 1:N → ApiToken (令牌)
  │          ├── 1:N → ApiTokenUsage (用量记录)
  │          └── 字段: name, token, quotaLimit, expiresAt
  └── 1:N → ApiTokenUsage (用量记录汇总)
```

---

## 4. MVP 功能设计

### 4.1 功能模块划分

#### 阶段 1：令牌基础管理（P0 优先级）

| 功能         | 描述                                     | 优先级 |
| ------------ | ---------------------------------------- | ------ |
| 创建令牌     | 生成新的 API Token，设置名称、过期、额度 | P0     |
| 查询令牌列表 | 分页查询用户的所有令牌，支持搜索过滤     | P0     |
| 查询令牌详情 | 查看单个令牌的详细信息和统计摘要         | P1     |
| 更新令牌     | 修改令牌的名称、描述、额度、过期时间     | P1     |
| 删除令牌     | 软删除令牌（保留数据）                   | P0     |
| 撤销令牌     | 立即使令牌失效但不删除                   | P2     |

#### 阶段 2：令牌验证和使用（P0 优先级）

| 功能           | 描述                          | 优先级 |
| -------------- | ----------------------------- | ------ |
| 令牌验证中间件 | 验证 API Token 的有效性和额度 | P0     |
| 令牌使用记录   | 记录每次 API 调用，更新用量   | P0     |

#### 阶段 3：统计分析（P1-P2 优先级）

| 功能           | 描述                           | 优先级 |
| -------------- | ------------------------------ | ------ |
| 用户总体统计   | 查询用户所有令牌的总用量       | P1     |
| 令牌使用趋势   | 查询单个令牌的时间序列用量数据 | P2     |
| 用量排行榜     | 按用量对令牌进行排序           | P2     |
| 恢复已删除令牌 | 取消软删除状态                 | P3     |

### 4.2 功能详细说明

#### 4.2.1 创建令牌

**输入**:

- 名称（必填）
- 描述（可选）
- 过期时间（可选，null = 永不过期）
- 额度限制（可选，null = 无限额度）
- 请求次数限制（可选，null = 无限请求）

**业务逻辑**:

1. 生成随机令牌：`sk-{64位随机hex字符}`
2. 计算 SHA256 哈希值
3. 存储哈希值到数据库
4. 仅在响应中返回一次完整明文令牌

**输出**:

- 完整明文令牌（仅此一次显示）
- 令牌基本信息

#### 4.2.2 查询令牌列表

**输入**:

- 分页参数（page, limit）
- 搜索关键词（名称模糊搜索）
- 状态过滤（ACTIVE/EXPIRED/REVOKED）
- 是否包含已删除（默认不包含）

**业务逻辑**:

1. 根据当前用户 ID 过滤
2. 默认排除 `deletedAt != null` 的记录
3. 支持按名称模糊搜索
4. 支持按状态过滤
5. 分页返回结果

**输出**:

- 令牌列表（不包含完整 token，仅显示前缀）
- 总数、当前页、每页数量

#### 4.2.3 删除令牌（软删除）

**业务逻辑**:

1. 设置 `deletedAt = now()`
2. 修改状态为 `DELETED`
3. 不删除关联的 `ApiTokenUsage` 记录
4. 保留所有历史数据

**优点**:

- 用量统计数据不丢失
- 可以恢复误删的令牌
- 审计追踪完整

#### 4.2.4 令牌验证中间件

**验证流程**:

```typescript
1. 从请求头提取令牌: Authorization: Bearer sk-xxx...
2. 计算令牌的 SHA256 哈希值
3. 在数据库中查询 tokenHash
4. 检查:
   - 令牌是否存在
   - status == ACTIVE
   - deletedAt == null
   - expiresAt == null || expiresAt > now()
   - quotaLimit == null || quotaUsed < quotaLimit
   - requestLimit == null || requestCount < requestLimit
5. 验证通过:
   - 更新 lastUsedAt = now()
   - requestCount += 1
   - 将 userId 注入到请求上下文
6. 验证失败:
   - 返回 401 Unauthorized
   - 记录失败日志
```

#### 4.2.5 用量统计聚合

**聚合策略**:

- **实时统计**: `ApiToken` 表中的 `requestCount` 和 `quotaUsed`
- **历史统计**: `ApiTokenUsage` 表按天聚合
- **聚合任务**: 定时任务每小时/每天聚合一次

**统计维度**:

- 请求次数
- 成功/失败次数
- Token 消耗量（AI 场景）
- 费用（如果有计费）

---

## 5. API 接口设计

### 5.1 认证方式

所有接口均需携带 JWT Token：

```
Authorization: Bearer <jwt_token>
```

部分接口支持 API Token 认证：

```
Authorization: Bearer <api_token>
```

### 5.2 接口列表

#### 5.2.1 创建令牌

```http
POST /api/tokens
```

**请求头**:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "My API Token",
  "description": "用于生产环境的令牌",
  "expiresAt": "2025-12-31T23:59:59Z",
  "quotaLimit": 1000.0,
  "requestLimit": 10000,
  "permissions": ["read", "write"]
}
```

**响应** (201 Created):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "token": "sk-1a2b3c4d5e6f7g8h9i0j...",
  "name": "My API Token",
  "description": "用于生产环境的令牌",
  "status": "ACTIVE",
  "quotaLimit": 1000.0,
  "quotaUsed": 0,
  "requestLimit": 10000,
  "requestCount": 0,
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2025-11-11T10:00:00Z",
  "updatedAt": "2025-11-11T10:00:00Z"
}
```

**注意**: `token` 字段仅在创建时返回一次，请妥善保存。

---

#### 5.2.2 查询令牌列表

```http
GET /api/tokens?page=1&limit=20&status=ACTIVE&search=keyword
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `page` | int | 页码 | 1 |
| `limit` | int | 每页数量 | 20 |
| `status` | enum | 状态过滤（ACTIVE/EXPIRED/REVOKED/DELETED） | - |
| `search` | string | 名称模糊搜索 | - |
| `includeDeleted` | boolean | 是否包含已删除 | false |

**响应** (200 OK):

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My API Token",
      "tokenPreview": "sk-***abc123",
      "status": "ACTIVE",
      "quotaLimit": 1000.0,
      "quotaUsed": 250.5,
      "requestLimit": 10000,
      "requestCount": 1234,
      "lastUsedAt": "2025-11-10T15:30:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "createdAt": "2025-11-11T10:00:00Z",
      "updatedAt": "2025-11-11T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

#### 5.2.3 查询令牌详情

```http
GET /api/tokens/:id
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**响应** (200 OK):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "My API Token",
  "description": "用于生产环境的令牌",
  "tokenPreview": "sk-***abc123",
  "status": "ACTIVE",
  "quotaLimit": 1000.0,
  "quotaUsed": 250.5,
  "requestLimit": 10000,
  "requestCount": 1234,
  "lastUsedAt": "2025-11-10T15:30:00Z",
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2025-11-11T10:00:00Z",
  "updatedAt": "2025-11-11T10:00:00Z",
  "permissions": ["read", "write"],
  "usageSummary": {
    "totalRequests": 1234,
    "successCount": 1200,
    "failureCount": 34,
    "successRate": 97.24,
    "totalCost": 250.5,
    "avgCostPerRequest": 0.203,
    "last7DaysRequests": 456,
    "last30DaysRequests": 1234
  }
}
```

---

#### 5.2.4 更新令牌

```http
PATCH /api/tokens/:id
```

**请求头**:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体** (所有字段可选):

```json
{
  "name": "Updated Token Name",
  "description": "Updated description",
  "quotaLimit": 2000.0,
  "requestLimit": 20000,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**响应** (200 OK):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Token Name"
  // ... 更新后的完整信息
}
```

**注意**: 不能更新 `token`, `tokenHash`, `quotaUsed`, `requestCount` 等字段。

---

#### 5.2.5 删除令牌（软删除）

```http
DELETE /api/tokens/:id
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**响应** (200 OK):

```json
{
  "message": "Token deleted successfully",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "deletedAt": "2025-11-11T12:00:00Z"
}
```

---

#### 5.2.6 撤销令牌

```http
POST /api/tokens/:id/revoke
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**响应** (200 OK):

```json
{
  "message": "Token revoked successfully",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "REVOKED",
  "revokedAt": "2025-11-11T12:00:00Z"
}
```

---

#### 5.2.7 恢复已删除的令牌

```http
POST /api/tokens/:id/restore
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**响应** (200 OK):

```json
{
  "message": "Token restored successfully",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "ACTIVE",
  "deletedAt": null
}
```

---

#### 5.2.8 用户总体统计

```http
GET /api/tokens/stats/overview
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `startDate` | string | 开始日期（ISO 8601） | 30天前 |
| `endDate` | string | 结束日期（ISO 8601） | 今天 |

**响应** (200 OK):

```json
{
  "totalTokens": 5,
  "activeTokens": 3,
  "expiredTokens": 1,
  "revokedTokens": 1,
  "totalRequests": 12345,
  "successCount": 12000,
  "failureCount": 345,
  "successRate": 97.2,
  "totalCost": 2500.5,
  "quotaUsed": 2500.5,
  "avgCostPerRequest": 0.202,
  "periodStart": "2025-10-12T00:00:00Z",
  "periodEnd": "2025-11-11T23:59:59Z"
}
```

---

#### 5.2.9 单个令牌使用趋势

```http
GET /api/tokens/:id/usage
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `granularity` | enum | 聚合粒度（hour/day/week/month） | day |
| `startDate` | string | 开始日期 | 30天前 |
| `endDate` | string | 结束日期 | 今天 |

**响应** (200 OK):

```json
{
  "tokenId": "123e4567-e89b-12d3-a456-426614174000",
  "tokenName": "My API Token",
  "granularity": "day",
  "periodStart": "2025-10-12T00:00:00Z",
  "periodEnd": "2025-11-11T23:59:59Z",
  "data": [
    {
      "periodStart": "2025-11-01T00:00:00Z",
      "periodEnd": "2025-11-01T23:59:59Z",
      "requestCount": 150,
      "successCount": 148,
      "failureCount": 2,
      "tokensUsed": 15000,
      "cost": 30.5
    },
    {
      "periodStart": "2025-11-02T00:00:00Z",
      "periodEnd": "2025-11-02T23:59:59Z",
      "requestCount": 200,
      "successCount": 195,
      "failureCount": 5,
      "tokensUsed": 20000,
      "cost": 40.0
    }
  ],
  "summary": {
    "totalRequests": 1234,
    "avgDailyRequests": 41,
    "totalCost": 250.5,
    "avgDailyCost": 8.35
  }
}
```

---

#### 5.2.10 用量排行榜

```http
GET /api/tokens/stats/ranking
```

**请求头**:

```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `orderBy` | enum | 排序字段（requests/cost/quota） | requests |
| `startDate` | string | 开始日期 | 30天前 |
| `endDate` | string | 结束日期 | 今天 |
| `top` | int | 返回前N个 | 10 |

**响应** (200 OK):

```json
{
  "orderBy": "requests",
  "periodStart": "2025-10-12T00:00:00Z",
  "periodEnd": "2025-11-11T23:59:59Z",
  "data": [
    {
      "rank": 1,
      "tokenId": "123e4567-e89b-12d3-a456-426614174000",
      "tokenName": "Production Token",
      "requestCount": 5000,
      "cost": 1000.0,
      "quotaUsed": 1000.0,
      "successRate": 98.5
    },
    {
      "rank": 2,
      "tokenId": "223e4567-e89b-12d3-a456-426614174001",
      "tokenName": "Staging Token",
      "requestCount": 3000,
      "cost": 600.0,
      "quotaUsed": 600.0,
      "successRate": 97.2
    }
  ]
}
```

---

### 5.3 错误响应

所有接口遵循统一的错误格式：

```json
{
  "statusCode": 400,
  "message": "Invalid token format",
  "error": "Bad Request",
  "timestamp": "2025-11-11T12:00:00Z",
  "path": "/api/tokens"
}
```

**常见错误码**:

| 状态码 | 说明                       |
| ------ | -------------------------- |
| 400    | 请求参数错误               |
| 401    | 未授权（Token 无效或过期） |
| 403    | 权限不足                   |
| 404    | 资源不存在                 |
| 409    | 资源冲突（如令牌名称重复） |
| 422    | 业务逻辑错误（如额度不足） |
| 500    | 服务器内部错误             |

---

## 6. 安全设计

### 6.1 令牌生成

**生成算法**:

```typescript
import crypto from 'crypto';

// 生成 64 位随机 hex 字符串
const randomBytes = crypto.randomBytes(32).toString('hex');
const token = `sk-${randomBytes}`;

// 示例: sk-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f
```

**格式**:

- 前缀: `sk-` (secret key)
- 长度: 67 字符（sk- + 64位hex）
- 字符集: `[a-f0-9]`

### 6.2 令牌存储

**哈希算法**: SHA-256

```typescript
import crypto from 'crypto';

const tokenHash = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

// 存储到数据库
{
  token: token.substring(0, 10) + '***' + token.slice(-6),  // sk-1a2b3c***e2f
  tokenHash: tokenHash  // 完整 SHA-256 哈希值（64字符）
}
```

**原则**:

- 数据库中不存储完整明文令牌
- `token` 字段仅存储前缀和后缀用于显示
- `tokenHash` 字段存储完整哈希用于验证
- 明文令牌仅在创建时返回给用户一次

### 6.3 令牌验证

**验证流程**:

```typescript
// 1. 从请求头提取令牌
const token = req.headers.authorization?.replace('Bearer ', '');

// 2. 计算哈希值
const inputHash = crypto.createHash('sha256').update(token).digest('hex');

// 3. 查询数据库
const apiToken = await prisma.apiToken.findUnique({
  where: { tokenHash: inputHash },
});

// 4. 验证状态
if (!apiToken) {
  throw new UnauthorizedException('Invalid token');
}

if (apiToken.deletedAt) {
  throw new UnauthorizedException('Token has been deleted');
}

if (apiToken.status !== 'ACTIVE') {
  throw new UnauthorizedException(`Token is ${apiToken.status.toLowerCase()}`);
}

// 5. 验证过期时间
if (apiToken.expiresAt && new Date() > apiToken.expiresAt) {
  // 更新状态为 EXPIRED
  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { status: 'EXPIRED' },
  });
  throw new UnauthorizedException('Token has expired');
}

// 6. 验证额度
if (apiToken.quotaLimit && apiToken.quotaUsed >= apiToken.quotaLimit) {
  throw new UnauthorizedException('Quota limit exceeded');
}

// 7. 验证请求次数
if (apiToken.requestLimit && apiToken.requestCount >= apiToken.requestLimit) {
  throw new UnauthorizedException('Request limit exceeded');
}

// 8. 验证通过，更新使用信息
await prisma.apiToken.update({
  where: { id: apiToken.id },
  data: {
    lastUsedAt: new Date(),
    requestCount: { increment: 1 },
  },
});

// 9. 注入用户信息到请求上下文
req.user = apiToken.user;
req.apiToken = apiToken;
```

### 6.4 权限控制

**未来扩展**: `permissions` 字段支持细粒度权限控制

```json
{
  "permissions": ["api:read", "api:write", "user:read"]
}
```

**权限检查**:

```typescript
@UseGuards(ApiTokenGuard, PermissionsGuard)
@RequirePermissions('api:write')
async createResource() {
  // 业务逻辑
}
```

### 6.5 安全最佳实践

1. **HTTPS Only**: 生产环境必须使用 HTTPS
2. **Rate Limiting**: 限制 API 调用频率，防止暴力破解
3. **日志记录**: 记录所有令牌使用情况和失败尝试
4. **定期清理**: 定期清理过期和已删除的令牌
5. **敏感数据脱敏**: 日志中不记录完整令牌
6. **双重认证**: 关键操作需要 JWT + API Token 双重验证

---

## 7. 实现路线图

### Phase 1: 数据库层（1-2天）

- [ ] 更新 Prisma schema
  - 添加 `TokenStatus` 枚举
  - 添加 `ApiToken` 模型
  - 添加 `ApiTokenUsage` 模型
  - 更新 `User` 模型关联
- [ ] 生成 Prisma Client
- [ ] 运行数据库迁移
- [ ] 编写种子数据（测试数据）

**文件**:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/`
- `backend/prisma/seed.ts`

---

### Phase 2: 后端核心（3-5天）

#### 2.1 创建 Tokens Module

```bash
backend/src/modules/tokens/
├── tokens.module.ts
├── tokens.controller.ts
├── tokens.service.ts
├── dto/
│   ├── create-token.dto.ts
│   ├── update-token.dto.ts
│   ├── query-tokens.dto.ts
│   └── token-usage.dto.ts
├── guards/
│   └── api-token.guard.ts
├── decorators/
│   └── api-token.decorator.ts
└── entities/
    └── token-response.entity.ts
```

#### 2.2 实现 P0 功能

- [ ] **Service 层**
  - `createToken()`: 生成令牌 + 哈希存储
  - `findAll()`: 分页查询列表
  - `findOne()`: 查询详情
  - `update()`: 更新令牌
  - `softDelete()`: 软删除
  - `validateToken()`: 验证令牌有效性

- [ ] **Controller 层**
  - POST `/api/tokens` - 创建令牌
  - GET `/api/tokens` - 查询列表
  - GET `/api/tokens/:id` - 查询详情
  - PATCH `/api/tokens/:id` - 更新令牌
  - DELETE `/api/tokens/:id` - 删除令牌

- [ ] **DTO 验证**
  - 使用 `class-validator` 进行参数校验
  - 自定义验证器（如额度格式、过期时间）

#### 2.3 实现中间件

- [ ] **ApiTokenGuard**
  - 提取令牌 → 验证哈希 → 检查状态 → 更新使用
  - 注入用户信息到请求上下文

- [ ] **ApiTokenDecorator**
  - `@ApiToken()` 装饰器获取当前令牌信息

---

### Phase 3: 统计分析（2-3天）

#### 3.1 实现统计接口

- [ ] `getOverview()`: 用户总体统计
- [ ] `getTokenUsage()`: 单个令牌使用趋势
- [ ] `getRanking()`: 用量排行榜

#### 3.2 聚合任务

- [ ] 创建定时任务模块 (`@nestjs/schedule`)
- [ ] 实现每日聚合任务
  - 从实时数据聚合到 `api_token_usage` 表
  - 按天汇总请求次数、费用等

---

### Phase 4: 前端开发（5-7天）

#### 4.1 令牌管理页面

- [ ] **令牌列表**
  - 表格展示（名称、状态、额度、创建时间）
  - 搜索、过滤、排序、分页
  - 操作按钮（查看、编辑、删除、撤销）

- [ ] **创建令牌弹窗**
  - 表单输入（名称、描述、过期时间、额度）
  - 创建成功后显示完整令牌（仅一次）
  - 复制按钮

- [ ] **令牌详情页面**
  - 基本信息展示
  - 使用统计卡片
  - 最近使用记录列表

#### 4.2 统计仪表盘

- [ ] **总览卡片**
  - 总令牌数、激活数、总请求、总费用

- [ ] **使用趋势图表**
  - 折线图（按天显示请求量）
  - 柱状图（按令牌显示用量排行）

- [ ] **时间范围选择器**
  - 最近 7 天 / 30 天 / 自定义

#### 4.3 API 集成

- [ ] 创建 API 客户端（Axios）
- [ ] 实现所有接口调用
- [ ] 错误处理和提示

---

### Phase 5: 测试和优化（2-3天）

- [ ] **单元测试**
  - Service 层测试
  - Guard 测试
  - DTO 验证测试

- [ ] **集成测试**
  - API 接口测试（E2E）
  - 令牌验证流程测试

- [ ] **性能优化**
  - 数据库查询优化
  - 索引优化
  - 缓存策略（Redis 缓存验证结果）

- [ ] **安全审计**
  - 令牌生成强度检查
  - SQL 注入防护
  - XSS 防护

---

## 8. 技术栈

### 8.1 后端技术栈

| 技术              | 版本 | 用途     |
| ----------------- | ---- | -------- |
| NestJS            | 10.3 | 后端框架 |
| TypeScript        | 5.3  | 编程语言 |
| Prisma            | 5.8  | ORM      |
| PostgreSQL        | 15   | 数据库   |
| Passport          | 0.7  | 认证框架 |
| JWT               | -    | 用户认证 |
| class-validator   | 0.14 | 参数验证 |
| class-transformer | 0.5  | 数据转换 |

### 8.2 前端技术栈

| 技术                     | 用途           |
| ------------------------ | -------------- |
| React                    | UI 框架        |
| TypeScript               | 编程语言       |
| Ant Design / Material-UI | UI 组件库      |
| Axios                    | HTTP 客户端    |
| React Query              | 数据获取和缓存 |
| ECharts / Recharts       | 图表库         |

### 8.3 开发工具

| 工具     | 用途       |
| -------- | ---------- |
| ESLint   | 代码检查   |
| Prettier | 代码格式化 |
| Jest     | 单元测试   |
| Postman  | API 测试   |
| pgAdmin  | 数据库管理 |

---

## 9. 附录

### 9.1 参考资料

- [Prisma 官方文档](https://www.prisma.io/docs)
- [NestJS 官方文档](https://docs.nestjs.com)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs)

### 9.2 相关文件路径

| 文件           | 路径                                                |
| -------------- | --------------------------------------------------- |
| Prisma Schema  | `backend/prisma/schema.prisma`                      |
| 当前项目根目录 | `/Users/edric/Code/OpenSource/gc-code1`             |
| 旧项目根目录   | `/Users/edric/Code/OpenSource/claude-relay-service` |

### 9.3 数据库迁移命令

```bash
# 生成迁移文件
npx prisma migrate dev --name add_api_tokens

# 应用迁移
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset

# 生成 Prisma Client
npx prisma generate

# 打开 Prisma Studio
npx prisma studio
```

---

## 10. 更新日志

| 版本 | 日期       | 说明         |
| ---- | ---------- | ------------ |
| v1.0 | 2025-11-11 | 初始设计文档 |

---

**文档结束**
