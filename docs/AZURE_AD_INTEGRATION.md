# Azure AD 登录集成完整指南

## 目录

- [前期准备](#前期准备)
- [第一步：在 Azure Portal 配置应用](#第一步在-azure-portal-配置应用)
- [第二步：后端集成 Azure AD](#第二步后端集成-azure-ad)
- [第三步：前端集成 Azure AD](#第三步前端集成-azure-ad)
- [第四步：测试和验证](#第四步测试和验证)
- [常见问题和解决方案](#常见问题和解决方案)
- [安全最佳实践](#安全最佳实践)

---

## 前期准备

### 需要的账号和权限

1. **Azure 账号**
   - 需要有 Azure Active Directory (现称为 Microsoft Entra ID)
   - 需要有应用注册权限（通常需要 Application Administrator 或 Global Administrator 角色）

2. **访问地址**
   - Azure Portal: https://portal.azure.com
   - Azure AD 管理中心: https://aad.portal.azure.com

3. **本地开发环境**
   - 前端地址: `http://localhost:3000`
   - 后端地址: `http://localhost:4000`

---

## 第一步：在 Azure Portal 配置应用

### 1.1 登录 Azure Portal

1. 访问 https://portal.azure.com
2. 使用企业账号或个人 Microsoft 账号登录

### 1.2 创建应用注册

#### 导航到应用注册

```
Azure Portal
  → Azure Active Directory (或搜索 "Azure Active Directory")
  → 左侧菜单 "应用注册" (App registrations)
  → 点击 "+ 新注册" (+ New registration)
```

#### 填写应用信息

```
名称 (Name):
  GC Code Portal
  (可以自定义，这是你的应用在 Azure AD 中的显示名称)

支持的账户类型 (Supported account types):
  选择以下之一：

  ✅ 仅此组织目录中的帐户 (Single tenant)
     - 适合企业内部应用
     - 只有你的组织用户可以登录

  □ 任何组织目录中的帐户 (Multi-tenant)
     - 适合 SaaS 应用
     - 任何 Microsoft 365 组织的用户都可以登录

  □ 任何组织目录中的帐户和个人 Microsoft 帐户
     - 包括个人 Outlook.com、Live.com 账号

重定向 URI (Redirect URI):
  平台: Web
  URI: http://localhost:4000/api/auth/azure/callback

  注意：生产环境需要添加实际域名，如：
  https://your-domain.com/api/auth/azure/callback
```

#### 点击"注册"按钮

### 1.3 记录应用信息

注册成功后，你会看到应用的"概述"页面，**请记录以下重要信息**：

```
应用程序(客户端) ID (Application (client) ID):
  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  → 这是你的 AZURE_AD_CLIENT_ID

目录(租户) ID (Directory (tenant) ID):
  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  → 这是你的 AZURE_AD_TENANT_ID
```

### 1.4 创建客户端密钥 (Client Secret)

#### 导航到证书和密码

```
应用注册页面
  → 左侧菜单 "证书和密码" (Certificates & secrets)
  → 选择 "客户端密码" (Client secrets) 选项卡
  → 点击 "+ 新客户端密码" (+ New client secret)
```

#### 创建密钥

```
说明 (Description):
  GC Code Portal Secret
  (可以自定义，用于标识这个密钥的用途)

过期时间 (Expires):
  建议选择：
  - 开发环境: 6个月 或 12个月
  - 生产环境: 24个月 (记得设置提醒，快到期前续期)

点击 "添加" (Add) 按钮
```

#### ⚠️ 重要：立即复制密钥值

```
创建后会显示密钥值 (Value):
  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

  ⚠️ 这个值只显示一次！
  ⚠️ 离开页面后无法再次查看！
  ⚠️ 请立即复制保存到安全的地方！

  → 这是你的 AZURE_AD_CLIENT_SECRET
```

### 1.5 配置 API 权限

#### 导航到 API 权限

```
应用注册页面
  → 左侧菜单 "API 权限" (API permissions)
```

#### 默认权限说明

默认已经包含以下权限，通常足够使用：

```
✅ Microsoft Graph
   - User.Read (委托权限)
     允许应用代表登录用户读取其个人资料信息
```

#### (可选) 添加更多权限

如果需要读取更多用户信息，可以添加：

```
点击 "+ 添加权限" (+ Add a permission)
  → 选择 "Microsoft Graph"
  → 选择 "委托的权限" (Delegated permissions)
  → 搜索并勾选需要的权限：

常用权限：
  ✅ User.Read - 读取用户基本信息（默认已有）
  □ User.ReadBasic.All - 读取所有用户基本信息
  □ email - 读取用户邮箱地址
  □ profile - 读取用户完整资料
  □ openid - OpenID Connect 登录（通常默认包含）

选择后点击 "添加权限" (Add permissions)
```

#### 授予管理员同意（如需要）

```
某些权限需要管理员同意才能使用：

在 "API 权限" 页面
  → 点击 "为 [组织名称] 授予管理员同意"
     (Grant admin consent for [Organization])
  → 确认授权

✅ 所有权限的状态应该显示为 "已授予"
```

### 1.6 配置令牌 (可选但推荐)

#### 配置令牌内容

```
应用注册页面
  → 左侧菜单 "令牌配置" (Token configuration)
  → 点击 "+ 添加可选声明" (+ Add optional claim)
```

#### 添加 ID 令牌声明

```
令牌类型: ID
勾选以下声明:
  ✅ email - 用户邮箱
  ✅ family_name - 姓氏
  ✅ given_name - 名字
  ✅ upn - 用户主体名称 (User Principal Name)

点击 "添加" (Add)
```

#### 添加访问令牌声明

```
令牌类型: Access
勾选以下声明:
  ✅ email
  ✅ upn

点击 "添加" (Add)
```

### 1.7 配置应用角色 (可选 - 用于权限控制)

如果需要在 Azure AD 中定义角色（如管理员、普通用户）：

```
应用注册页面
  → 左侧菜单 "应用角色" (App roles)
  → 点击 "+ 创建应用角色" (+ Create app role)
```

#### 创建管理员角色示例

```
显示名称 (Display name):
  Administrator

允许的成员类型 (Allowed member types):
  ✅ 用户/组 (Users/Groups)

值 (Value):
  admin
  (这个值会在 JWT token 中返回)

说明 (Description):
  Application administrators with full access

✅ 启用此应用角色
```

#### 创建普通用户角色示例

```
显示名称: User
允许的成员类型: 用户/组
值: user
说明: Regular application users
✅ 启用此应用角色
```

### 1.8 分配用户到应用 (可选)

如果你的租户设置要求分配用户才能访问应用：

```
Azure Portal
  → Azure Active Directory
  → 企业应用程序 (Enterprise applications)
  → 搜索并找到 "GC Code Portal"
  → 左侧菜单 "用户和组" (Users and groups)
  → 点击 "+ 添加用户/组" (+ Add user/group)
  → 选择用户和角色
  → 点击 "分配" (Assign)
```

### 1.9 最终配置清单

完成后，你应该有以下信息：

```env
✅ AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ AZURE_AD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ AZURE_AD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✅ AZURE_AD_REDIRECT_URI=http://localhost:4000/api/auth/azure/callback

生产环境还需要：
✅ AZURE_AD_REDIRECT_URI_PROD=https://your-domain.com/api/auth/azure/callback
```

---

## 第二步：后端集成 Azure AD

### 2.1 安装依赖

```bash
cd backend
npm install @azure/msal-node passport passport-azure-ad
npm install --save-dev @types/passport @types/passport-azure-ad
```

### 2.2 配置环境变量

创建 `backend/.env` 文件：

```env
# Azure AD 配置
AZURE_AD_CLIENT_ID=你的应用程序ID
AZURE_AD_TENANT_ID=你的租户ID
AZURE_AD_CLIENT_SECRET=你的客户端密钥
AZURE_AD_REDIRECT_URI=http://localhost:4000/api/auth/azure/callback

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h

# 前端地址
FRONTEND_URL=http://localhost:3000

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/gc_code_portal
```

### 2.3 创建 Azure AD 配置文件

`backend/src/config/azure-ad.config.ts`

```typescript
export const azureAdConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: string, containsPii: boolean) {
        if (containsPii) return;
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3, // Info
    },
  },
};

export const azureAdRedirectUri = process.env.AZURE_AD_REDIRECT_URI!;
export const frontendUrl = process.env.FRONTEND_URL!;
```

### 2.4 创建 Azure AD Strategy

`backend/src/modules/auth/strategies/azure-ad.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-azure-ad-oauth2';
import { AuthService } from '../auth.service';
import { azureAdConfig, azureAdRedirectUri } from '../../../config/azure-ad.config';

@Injectable()
export class AzureAdStrategy extends PassportStrategy(Strategy, 'azure-ad') {
  constructor(private authService: AuthService) {
    super({
      clientID: azureAdConfig.auth.clientId,
      clientSecret: azureAdConfig.auth.clientSecret,
      callbackURL: azureAdRedirectUri,
      tenant: process.env.AZURE_AD_TENANT_ID,
      resource: 'https://graph.microsoft.com',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    try {
      // 从 Azure AD token 中提取用户信息
      const user = await this.authService.validateAzureAdUser({
        azureAdId: profile.oid || profile.sub,
        email: profile.upn || profile.email,
        username: profile.upn?.split('@')[0] || profile.email?.split('@')[0],
        displayName: profile.displayName || profile.name,
        accessToken,
      });

      return done(null, user);
    } catch (error) {
      return done(new UnauthorizedException('Azure AD authentication failed'), false);
    }
  }
}
```

### 2.5 实现 Auth Service

`backend/src/modules/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // 本地用户名密码登录
  async validateLocalUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenResponse(user);
  }

  // Azure AD 用户登录/注册
  async validateAzureAdUser(azureProfile: {
    azureAdId: string;
    email: string;
    username: string;
    displayName: string;
    accessToken: string;
  }) {
    // 查找用户是否已存在
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ azureAdOid: azureProfile.azureAdId }, { email: azureProfile.email }],
      },
    });

    // 如果用户不存在，自动注册
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          username: azureProfile.username,
          email: azureProfile.email,
          azureAdOid: azureProfile.azureAdId,
          authProvider: 'azure_ad',
          role: 'user', // 默认角色
          isActive: true,
          profile: {
            create: {
              displayName: azureProfile.displayName,
            },
          },
        },
        include: {
          profile: true,
        },
      });
    } else {
      // 更新用户信息
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          azureAdOid: azureProfile.azureAdId,
          lastLoginAt: new Date(),
        },
        include: {
          profile: true,
        },
      });
    }

    return this.generateTokenResponse(user);
  }

  // 生成 JWT Token
  private generateTokenResponse(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        displayName: user.profile?.displayName,
      },
    };
  }
}
```

### 2.6 创建 Auth Controller

`backend/src/modules/auth/auth.controller.ts`

```typescript
import { Controller, Get, Post, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { frontendUrl } from '../../config/azure-ad.config';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 本地登录
  @Post('login')
  async login(@Req() req) {
    return this.authService.validateLocalUser(req.body.username, req.body.password);
  }

  // Azure AD 登录 - 重定向到 Azure
  @Get('azure')
  @UseGuards(AuthGuard('azure-ad'))
  async azureLogin() {
    // Guard 会自动重定向到 Azure AD 登录页面
  }

  // Azure AD 回调
  @Get('azure/callback')
  @UseGuards(AuthGuard('azure-ad'))
  async azureCallback(@Req() req, @Res() res: Response) {
    const { accessToken, user } = req.user;

    // 重定向到前端，携带 token
    const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}`;
    return res.redirect(redirectUrl);
  }

  // 获取当前用户信息
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req) {
    return req.user;
  }
}
```

### 2.7 配置 Auth Module

`backend/src/modules/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AzureAdStrategy } from './strategies/azure-ad.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, AzureAdStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 第三步：前端集成 Azure AD

### 3.1 创建认证状态管理

`frontend/src/stores/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // 本地登录
  login: (username: string, password: string) => Promise<void>;

  // Azure AD 登录
  loginWithAzure: () => void;

  // 登出
  logout: () => void;

  // 设置认证信息
  setAuth: (token: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const response = await fetch('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const { accessToken, user } = await response.json();
        set({ token: accessToken, user, isAuthenticated: true });
      },

      loginWithAzure: () => {
        // 重定向到后端的 Azure AD 登录端点
        window.location.href = 'http://localhost:4000/api/auth/azure';
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setAuth: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 3.2 创建 Azure AD 回调页面

`frontend/src/pages/AuthCallback.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 获取用户信息
      fetch('http://localhost:4000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((user) => {
          setAuth(token, user);
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error('Failed to get user info:', error);
          navigate('/login?error=auth_failed');
        });
    } else {
      navigate('/login?error=no_token');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">正在登录...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
```

### 3.3 创建登录页面

`frontend/src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loginWithAzure = useAuthStore((state) => state.loginWithAzure);
  const navigate = useNavigate();

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            登录到 GC Code Portal
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 本地登录表单 */}
        <form className="mt-8 space-y-6" onSubmit={handleLocalLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 分隔线 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        {/* Azure AD 登录按钮 */}
        <button
          onClick={loginWithAzure}
          className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
            <path d="M0 0h11v11H0z" fill="#f25022"/>
            <path d="M12 0h11v11H12z" fill="#00a4ef"/>
            <path d="M0 12h11v11H0z" fill="#7fba00"/>
            <path d="M12 12h11v11H12z" fill="#ffb900"/>
          </svg>
          使用 Microsoft 账号登录
        </button>
      </div>
    </div>
  );
}
```

### 3.4 配置路由

`frontend/src/router/index.tsx`

```typescript
import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import AuthCallback from '../pages/AuthCallback';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  // ... 其他路由
]);
```

### 3.5 创建路由守卫

`frontend/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 第四步：测试和验证

### 4.1 启动开发环境

```bash
# 启动数据库 (如果使用 Docker)
docker-compose up -d postgres

# 后端
cd backend
npm run dev

# 前端 (新终端)
cd frontend
npm run dev
```

### 4.2 测试 Azure AD 登录流程

#### 测试步骤

1. **访问登录页**

   ```
   浏览器打开: http://localhost:3000/login
   ```

2. **点击 "使用 Microsoft 账号登录"**
   - 应该会重定向到 Microsoft 登录页面
   - URL 类似: `https://login.microsoftonline.com/...`

3. **输入 Microsoft 账号**
   - 使用你的企业账号或个人 Microsoft 账号
   - 完成 MFA (如果启用)

4. **授权同意**
   - 首次登录会要求授权应用访问你的信息
   - 点击"接受" (Accept)

5. **回调处理**
   - 成功后应该重定向到: `http://localhost:3000/auth/callback?token=...`
   - 然后自动跳转到 Dashboard

6. **验证登录状态**
   - 检查是否显示用户信息
   - 尝试访问需要登录的页面

### 4.3 调试检查清单

#### 后端检查

```bash
# 检查环境变量是否正确加载
console.log(process.env.AZURE_AD_CLIENT_ID); # 应该有值

# 检查数据库连接
npx prisma studio

# 查看后端日志
# 应该看到 Azure AD 认证相关的日志
```

#### 前端检查

```javascript
// 浏览器控制台
localStorage.getItem('auth-storage'); // 应该看到存储的 token 和 user

// Network 标签
// 检查 API 请求是否正确
// 检查 Authorization header 是否正确携带
```

#### 常见错误检查

```
❌ AADSTS700016: Application with identifier 'xxx' was not found
   → Client ID 配置错误

❌ AADSTS7000215: Invalid client secret provided
   → Client Secret 配置错误或已过期

❌ AADSTS50011: The redirect URI specified in the request does not match
   → Redirect URI 配置不匹配

❌ CORS error
   → 后端 CORS 配置问题

❌ 401 Unauthorized
   → JWT token 验证失败，检查 JWT_SECRET
```

---

## 常见问题和解决方案

### Q1: 重定向 URI 不匹配错误

**错误信息**:

```
AADSTS50011: The redirect URI 'http://localhost:4000/api/auth/azure/callback'
specified in the request does not match the redirect URIs configured for the application
```

**解决方案**:

1. 检查 Azure Portal 中的重定向 URI 配置
2. 确保协议、域名、端口、路径完全匹配
3. 注意 `http` vs `https` 的区别
4. 可以添加多个重定向 URI（开发、测试、生产环境）

### Q2: 客户端密钥过期

**错误信息**:

```
AADSTS7000222: The provided client secret keys for app 'xxx' are expired
```

**解决方案**:

1. 在 Azure Portal 中创建新的客户端密钥
2. 更新 `.env` 文件中的 `AZURE_AD_CLIENT_SECRET`
3. 重启后端服务

### Q3: Token 验证失败

**症状**: 前端收到 token 但无法访问受保护的 API

**解决方案**:

```typescript
// 检查 JWT Strategy 配置
// backend/src/modules/auth/strategies/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // 确保这个值正确
    });
  }
}
```

### Q4: 用户自动注册失败

**症状**: Azure AD 登录成功但用户未创建

**解决方案**:

1. 检查数据库约束（unique 约束可能导致创建失败）
2. 查看后端日志中的详细错误信息
3. 确保 Prisma Schema 与数据库一致

```bash
# 重新生成 Prisma Client
npx prisma generate

# 如果需要，重新运行迁移
npx prisma migrate dev
```

### Q5: CORS 错误

**错误信息**:

```
Access to fetch at 'http://localhost:4000/api/auth/azure' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**解决方案**:

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置 CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(4000);
}
bootstrap();
```

### Q6: 本地开发 HTTPS 要求

某些情况下 Azure AD 可能要求 HTTPS 回调。

**解决方案**:

```bash
# 方案 1: 使用 ngrok 创建临时 HTTPS 隧道
ngrok http 4000

# 获得的 URL 如: https://abc123.ngrok.io
# 在 Azure Portal 中添加重定向 URI:
# https://abc123.ngrok.io/api/auth/azure/callback

# 方案 2: 使用 mkcert 生成本地 SSL 证书
brew install mkcert  # macOS
mkcert -install
mkcert localhost
```

---

## 安全最佳实践

### 1. 环境变量安全

```bash
# ❌ 不要提交到 Git
.env

# ✅ 提供示例文件
.env.example

# ✅ 生产环境使用密钥管理服务
# - Azure Key Vault
# - AWS Secrets Manager
# - HashiCorp Vault
```

### 2. Token 安全

```typescript
// ✅ 使用 HTTP-only Cookies 存储敏感 token
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// ✅ Access Token 可以存在内存或 sessionStorage
// ❌ 避免将 Refresh Token 存在 localStorage
```

### 3. 密钥轮换

```typescript
// 定期轮换客户端密钥
// 1. 在 Azure Portal 创建新密钥
// 2. 更新应用配置（同时保留旧密钥）
// 3. 验证新密钥工作正常
// 4. 删除旧密钥
```

### 4. 日志和审计

```typescript
// 记录认证事件
await this.prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'azure_ad_login',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    details: {
      success: true,
      provider: 'azure_ad',
    },
  },
});
```

### 5. 错误处理

```typescript
// ❌ 不要暴露敏感错误信息
throw new Error(`Azure AD authentication failed: ${error.message}`);

// ✅ 返回通用错误，详细信息记录到日志
logger.error('Azure AD auth failed', { error, userId });
throw new UnauthorizedException('Authentication failed');
```

---

## 生产环境部署清单

### 1. Azure AD 配置

- [ ] 添加生产环境的重定向 URI
- [ ] 配置适当的令牌生命周期
- [ ] 设置客户端密钥过期提醒
- [ ] 配置应用角色和权限
- [ ] 启用条件访问策略（如需要）

### 2. 后端配置

- [ ] 使用环境变量或密钥管理服务
- [ ] 配置 HTTPS
- [ ] 设置适当的 CORS 策略
- [ ] 配置 Rate Limiting
- [ ] 启用请求日志
- [ ] 配置错误监控（如 Sentry）

### 3. 前端配置

- [ ] 更新 API 基础 URL
- [ ] 配置生产环境的重定向 URI
- [ ] 实现 Token 刷新机制
- [ ] 添加错误边界
- [ ] 配置分析工具

### 4. 监控和告警

- [ ] 监控认证失败率
- [ ] 设置异常登录告警
- [ ] 监控 API 响应时间
- [ ] 配置密钥过期告警

---

## 参考资源

- [Azure AD 官方文档](https://docs.microsoft.com/en-us/azure/active-directory/)
- [MSAL Node 文档](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
- [NestJS Passport 文档](https://docs.nestjs.com/security/authentication)
- [OAuth 2.0 和 OpenID Connect](https://oauth.net/2/)

---

## 附录：完整配置示例

### Prisma Schema

```prisma
model User {
  id           String    @id @default(uuid())
  username     String    @unique
  email        String    @unique
  password     String?   // 本地登录用，Azure AD 登录为 null
  authProvider String    @default("local") // 'local' | 'azure_ad'
  azureAdOid   String?   @unique // Azure AD Object ID
  role         String    @default("user") // 'admin' | 'user'
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastLoginAt  DateTime?

  profile  Profile?
  apiKeys  ApiKey[]
  usageLogs UsageLog[]
  auditLogs AuditLog[]

  @@map("users")
}

model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique
  displayName String?
  avatarUrl   String?
  department  String?
  phone       String?
  preferences Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}
```

### Docker Compose (完整版)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gc_code_portal
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - '4000:4000'
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@postgres:5432/gc_code_portal
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      AZURE_AD_CLIENT_ID: ${AZURE_AD_CLIENT_ID}
      AZURE_AD_TENANT_ID: ${AZURE_AD_TENANT_ID}
      AZURE_AD_CLIENT_SECRET: ${AZURE_AD_CLIENT_SECRET}
      AZURE_AD_REDIRECT_URI: ${AZURE_AD_REDIRECT_URI}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - '80:80'
    environment:
      VITE_API_URL: http://localhost:4000/api
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

**祝你集成成功！如有问题，请随时查阅本文档或联系技术支持。**
