# 后端技术栈选型方案

## 目录

- [一、ORM 框架对比](#一orm-框架对比)
- [二、后端框架选择](#二后端框架选择)
- [三、完整技术栈推荐](#三完整技术栈推荐)
- [四、其他关键技术选型](#四其他关键技术选型)
- [五、最终推荐方案](#五最终推荐方案)

---

## 一、ORM 框架对比

### 1. Prisma ⭐⭐⭐⭐⭐ (强烈推荐)

#### 优势特点

- ✅ **类型安全最佳**: Schema 驱动，自动生成完美的 TypeScript 类型
- ✅ **开发体验极佳**: Prisma Studio (可视化数据库管理)、强大的查询 API
- ✅ **迁移工具强大**: `prisma migrate` 管理数据库版本
- ✅ **性能优秀**: 查询优化、连接池管理
- ✅ **现代化**: 2019年发布，设计理念先进
- ✅ **多数据库支持**: PostgreSQL、MySQL、SQLite、MongoDB、SQL Server

#### 代码示例

```typescript
// schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String?
  role      Role     @default(USER)
  profile   Profile?
  apiKeys   ApiKey[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 自动生成的类型安全客户端
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    username: 'testuser',
    profile: {
      create: {
        displayName: 'Test User'
      }
    }
  },
  include: {
    profile: true,
    apiKeys: true
  }
});
// user 变量有完整的类型推断！
```

#### 技术指标

- **包大小**: ~2.5MB
- **社区活跃度**: ⭐⭐⭐⭐⭐ (GitHub 35k+ stars)
- **学习曲线**: 中等（需要学习 Prisma Schema 语法）

---

### 2. TypeORM ⭐⭐⭐⭐

#### 优势特点

- ✅ **成熟稳定**: 2016年发布，生态系统成熟
- ✅ **NestJS 默认集成**: 官方推荐，集成简单
- ✅ **装饰器语法**: 如果熟悉 Java/Spring，上手快
- ✅ **Active Record 或 Data Mapper 模式**: 灵活
- ✅ **迁移工具**: 完善的迁移管理
- ⚠️ **类型安全一般**: 运行时才能发现一些错误
- ⚠️ **维护状态**: 近年更新变慢，一些 issue 长期未解决

#### 代码示例

```typescript
// 装饰器风格，类似 Java/C# ORM
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 使用
const user = await userRepository.findOne({
  where: { email: 'test@example.com' },
  relations: ['profile', 'apiKeys'],
});
```

#### 技术指标

- **包大小**: ~1.8MB
- **社区活跃度**: ⭐⭐⭐⭐ (GitHub 33k+ stars，但近年活跃度下降)

---

### 3. Drizzle ORM ⭐⭐⭐⭐ (新兴之星)

#### 优势特点

- ✅ **极致类型安全**: 比 Prisma 更严格的类型推断
- ✅ **性能最佳**: 轻量级，零运行时开销
- ✅ **SQL-like API**: 如果熟悉 SQL，学习曲线平缓
- ✅ **轻量**: 包体积小
- ✅ **边缘计算友好**: 支持 Cloudflare Workers、Vercel Edge
- ⚠️ **较新**: 2022年发布，生态系统还在建设中
- ⚠️ **缺少 GUI 工具**: 没有类似 Prisma Studio 的工具

#### 代码示例

```typescript
// SQL-like 的 TypeScript API
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 查询 - SQL-like
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'test@example.com'))
  .leftJoin(profiles, eq(users.id, profiles.userId));
```

#### 技术指标

- **包大小**: ~200KB (轻量级)
- **社区活跃度**: ⭐⭐⭐⭐ (GitHub 20k+ stars，快速增长)

---

### 4. Sequelize (不推荐)

#### 特点

- ✅ **最老牌**: 2011年发布，非常成熟
- ❌ **TypeScript 支持差**: 类型定义是后加的，体验不好
- ❌ **开发体验**: 相比现代 ORM 落后
- ❌ **性能**: 相对较慢

**结论**: 除非是维护老项目，否则不推荐

---

### ORM 框架对比总结

| 特性            | Prisma     | TypeORM    | Drizzle    |
| --------------- | ---------- | ---------- | ---------- |
| **类型安全**    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| **开发体验**    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐   |
| **性能**        | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| **学习曲线**    | 中等       | 简单       | 简单       |
| **生态成熟度**  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐     |
| **迁移工具**    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐     |
| **NestJS 集成** | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     |
| **包大小**      | 2.5MB      | 1.8MB      | 200KB      |

**推荐排序：**

1. **Prisma** ⭐⭐⭐⭐⭐ - **最推荐**（综合最佳）
2. **Drizzle** ⭐⭐⭐⭐ - 如果追求极致性能和轻量
3. **TypeORM** ⭐⭐⭐ - 如果要和 NestJS 深度集成

---

## 二、后端框架选择

### 1. NestJS ⭐⭐⭐⭐⭐ (强烈推荐)

#### 优势特点

- ✅ **企业级框架**: 类似 Spring Boot 的架构
- ✅ **完整生态**: 内置 JWT、Passport、GraphQL、WebSocket 等
- ✅ **依赖注入**: 代码组织清晰，易于测试
- ✅ **装饰器**: 优雅的 API 设计
- ✅ **文档完善**: 官方文档非常详细
- ✅ **内置支持**: Swagger、验证、配置管理等
- ⚠️ **学习曲线**: 相对陡峭（需要理解依赖注入、装饰器等概念）
- ⚠️ **性能**: 比原生 Express/Fastify 稍慢

#### 代码示例

```typescript
// 企业级架构，依赖注入，模块化
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }
}
```

**适用场景**: 中大型项目、企业应用、需要长期维护

---

### 2. Fastify + TypeScript ⭐⭐⭐⭐

#### 优势特点

- ✅ **性能最佳**: 比 Express 快 2-3 倍
- ✅ **现代化**: 原生 async/await，Promise 支持好
- ✅ **类型安全**: TypeScript 支持好
- ✅ **插件生态**: 丰富的插件系统
- ✅ **JSON Schema 验证**: 内置验证，性能好
- ⚠️ **需要手动组织**: 没有 NestJS 那样的架构约束
- ⚠️ **中间件生态**: 比 Express 小

#### 代码示例

```typescript
// 高性能，插件化
const fastify = Fastify({ logger: true });

fastify.register(fastifyJwt, { secret: 'supersecret' });
fastify.register(fastifyCors, { origin: true });

fastify.post('/api/auth/login', async (request, reply) => {
  const { username, password } = request.body;
  // 验证逻辑
  const token = fastify.jwt.sign({ id: user.id });
  return { token, user };
});

await fastify.listen({ port: 4000 });
```

**适用场景**: 高性能 API、微服务、对性能敏感的项目

---

### 3. Express + TypeScript ⭐⭐⭐

#### 优势特点

- ✅ **生态最大**: 几乎所有中间件都支持
- ✅ **学习曲线低**: 最简单，文档最多
- ✅ **灵活性高**: 自由度大
- ⚠️ **性能一般**: 比 Fastify 慢
- ⚠️ **TypeScript 支持**: 需要手动配置类型

#### 代码示例

```typescript
// 经典，简单，生态最大
const app = express();

app.use(express.json());
app.use(cors());

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  // 验证逻辑
  res.json({ token, user });
});

app.listen(4000);
```

**适用场景**: 快速原型、小型项目、熟悉 Express 的团队

---

## 三、完整技术栈推荐

### 方案 A: 现代企业级方案 ⭐⭐⭐⭐⭐ (最推荐)

#### 技术栈组成

```
- 框架: NestJS 10+
- ORM: Prisma 5+
- 数据库: PostgreSQL 15+
- 认证: Passport + JWT
- 验证: class-validator + class-transformer
- 配置: @nestjs/config
- 缓存: Redis (ioredis)
- 文档: Swagger (@nestjs/swagger)
```

#### 核心依赖

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/config": "^3.1.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/platform-express": "^10.3.0",
    "@prisma/client": "^5.8.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "@azure/msal-node": "^2.6.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "reflect-metadata": "^0.1.14",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.38",
    "prisma": "^5.8.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

#### 项目结构

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── azure-ad.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── admin.module.ts
│   │   └── ai-services/
│   │       ├── ai-services.controller.ts
│   │       ├── ai-services.service.ts
│   │       └── ai-services.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   └── validation.schema.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

#### 选择理由

1. ✅ **NestJS**: 提供企业级架构，代码组织清晰
2. ✅ **Prisma**: 类型安全最佳，迁移工具强大，开发体验好
3. ✅ **PostgreSQL**: 可靠、功能强大、适合复杂查询
4. ✅ **适合场景**: 用户管理、权限控制、Azure AD 集成

---

### 方案 B: 高性能轻量级方案 ⭐⭐⭐⭐

#### 技术栈组成

```
- 框架: Fastify 4+
- ORM: Drizzle ORM
- 数据库: PostgreSQL 15+
- 认证: fastify-jwt + fastify-passport
- 验证: Zod
```

**优势**: 性能最佳，包体积小，适合微服务
**劣势**: 需要更多手动配置，没有 NestJS 的架构约束

---

### 方案 C: 快速原型方案 ⭐⭐⭐

#### 技术栈组成

```
- 框架: Express 4+
- ORM: Prisma 5+
- 数据库: PostgreSQL 15+
- 认证: express-jwt + passport
```

**优势**: 简单快速，适合快速验证想法
**劣势**: 缺少架构约束，长期维护成本高

---

## 四、其他关键技术选型

### 1. 数据验证库

#### class-validator (NestJS 推荐)

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### Zod (现代化选择)

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

type CreateUserDto = z.infer<typeof createUserSchema>;
```

**推荐**:

- NestJS → class-validator
- Fastify/Express → Zod

---

### 2. 密码加密

#### bcrypt (推荐)

```typescript
import * as bcrypt from 'bcrypt';

// 加密
const hash = await bcrypt.hash(password, 10);

// 验证
const isMatch = await bcrypt.compare(password, hash);
```

#### argon2 (更安全，但速度慢)

```typescript
import * as argon2 from 'argon2';

// 加密
const hash = await argon2.hash(password);

// 验证
const isMatch = await argon2.verify(hash, password);
```

**推荐**: bcrypt (平衡性能和安全性)

---

### 3. Azure AD 集成

```typescript
// @azure/msal-node (官方库)
import { ConfidentialClientApplication } from '@azure/msal-node';

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

const cca = new ConfidentialClientApplication(msalConfig);
```

---

### 4. 安全措施

#### JWT 配置

```typescript
{
  secret: process.env.JWT_SECRET,
  expiresIn: '1h',  // access token 短期
  refreshExpiresIn: '7d'  // refresh token 长期
}
```

#### API Key 加密存储

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

#### CORS 配置

```typescript
{
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}
```

#### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### 安全头 (Helmet)

```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## 五、最终推荐方案

### 推荐配置

```
✨ NestJS + Prisma + PostgreSQL + Redis
```

### 选择理由

1. ✅ **类型安全**: 全栈 TypeScript，Prisma 提供完美类型推断
2. ✅ **架构清晰**: NestJS 模块化设计，适合团队协作
3. ✅ **易于扩展**: 未来添加新功能（如 WebSocket、GraphQL）很容易
4. ✅ **成熟稳定**: 生态系统完善，文档齐全
5. ✅ **长期维护**: 代码组织规范，维护成本低
6. ✅ **Azure AD**: Passport 策略支持好

### 核心依赖版本

```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@prisma/client": "^5.8.0",
  "passport": "^0.7.0",
  "@azure/msal-node": "^2.6.0",
  "bcrypt": "^5.1.1",
  "class-validator": "^0.14.1"
}
```

### 环境变量配置

```env
# backend/.env.example

# 服务器配置
NODE_ENV=development
PORT=4000
API_PREFIX=/api

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=gc_code_portal

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# 加密密钥 (用于加密 API Keys)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Azure AD 配置
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_REDIRECT_URI=http://localhost:4000/api/auth/azure/callback

# CORS
FRONTEND_URL=http://localhost:3000

# Redis (可选，用于缓存和会话)
REDIS_HOST=localhost
REDIS_PORT=6379

# 日志
LOG_LEVEL=debug
```

### 实施步骤

#### 第一阶段: 基础搭建 (1-2周)

- 创建后端项目结构
- 配置数据库和 ORM (Prisma)
- 实现用户表和基础 CRUD
- 实现 JWT 认证

#### 第二阶段: 本地认证 (1周)

- 实现用户名密码注册/登录
- 实现密码加密和验证
- 前端集成登录/注册页面

#### 第三阶段: Azure AD 集成 (1-2周)

- 配置 Azure AD 应用
- 实现 OAuth2 流程
- 前端添加 Azure AD 登录按钮

#### 第四阶段: 管理员功能 (1-2周)

- 实现用户管理 CRUD
- 实现权限控制
- 前端添加管理员面板

#### 第五阶段: 完善与优化 (1周)

- 添加审计日志
- 完善错误处理
- 性能优化
- 安全加固

---

## 附录

### 参考资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Azure AD MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
- [Passport.js 官方文档](http://www.passportjs.org/)

### 相关文档

- [后端架构设计](./BACKEND_ARCHITECTURE.md)
- [API 接口设计](./API_DESIGN.md)
- [数据库设计](./DATABASE_DESIGN.md)
- [部署指南](./DEPLOYMENT.md)
