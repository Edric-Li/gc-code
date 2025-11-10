import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaService } from '../../common/prisma.service';
import { LogService } from '../logs/log.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfidentialClientApplication } from '@azure/msal-node';

@Injectable()
export class AuthService {
  private msalClient: ConfidentialClientApplication;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logService: LogService
  ) {
    // 初始化 Azure MSAL 客户端
    const msalConfig = {
      auth: {
        clientId: this.configService.get<string>('AZURE_CLIENT_ID'),
        authority: `https://login.microsoftonline.com/${this.configService.get<string>('AZURE_TENANT_ID')}`,
        clientSecret: this.configService.get<string>('AZURE_CLIENT_SECRET'),
      },
    };
    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<Omit<
    { id: string; email: string; username: string; displayName: string | null },
    'passwordHash'
  > | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // 记录失败的登录尝试
      await this.logService.logLogin({
        email: loginDto.email,
        loginMethod: 'LOCAL',
        success: false,
        ipAddress,
        userAgent,
        errorMessage: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 记录成功的登录
    await this.logService.logLogin({
      userId: user.id,
      email: loginDto.email,
      loginMethod: 'LOCAL',
      success: true,
      ipAddress,
      userAgent,
    });

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatarUrl,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 生成用户名（如果未提供）
    const username = registerDto.username || registerDto.email.split('@')[0];

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        username,
        displayName: registerDto.displayName || username,
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async getAzureAuthUrl() {
    const redirectUri = this.configService.get<string>('AZURE_REDIRECT_URI');

    const authCodeUrlParameters = {
      scopes: ['user.read'],
      redirectUri,
    };

    const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return { authUrl };
  }

  async handleAzureCallback(code: string, ipAddress?: string, userAgent?: string) {
    const redirectUri = this.configService.get<string>('AZURE_REDIRECT_URI');

    const tokenRequest = {
      code,
      scopes: ['user.read'],
      redirectUri,
    };

    let azureUser: {
      id: string;
      mail?: string;
      userPrincipalName?: string;
      displayName?: string;
    } | null = null;

    try {
      // 获取访问令牌
      const response = await this.msalClient.acquireTokenByCode(tokenRequest);

      // 获取用户信息
      console.log('Fetching user info from Microsoft Graph API...');
      try {
        const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
          headers: {
            Authorization: `Bearer ${response.accessToken}`,
          },
          timeout: 30000, // 30 second timeout
        });
        console.log('Microsoft Graph API response status:', userResponse.status);
        azureUser = userResponse.data;
        console.log('Successfully fetched user info from Microsoft Graph');
      } catch (fetchError) {
        console.error('Failed to fetch user info from Microsoft Graph:', fetchError.message);
        if (fetchError.response) {
          console.error(
            'Microsoft Graph API error response:',
            fetchError.response.status,
            fetchError.response.data
          );
        }
        throw new Error(`Failed to fetch user profile from Microsoft Graph: ${fetchError.message}`);
      }

      // 查找或创建 OAuth 账户
      console.log('=========== AZURE AUTH DEBUG ===========');
      console.log('Azure User ID (providerId):', azureUser.id);
      console.log('Azure User Email:', azureUser.mail || azureUser.userPrincipalName);
      console.log('Azure User DisplayName:', azureUser.displayName);
      console.log('Searching for OAuth account...');

      let oauthAccount = await this.prisma.oAuthAccount.findUnique({
        where: {
          provider_providerId: {
            provider: 'AZURE_AD',
            providerId: azureUser.id,
          },
        },
        include: {
          user: true,
        },
      });

      console.log('OAuth account search result:', oauthAccount ? 'FOUND' : 'NOT FOUND');
      if (oauthAccount) {
        console.log('Found OAuth account ID:', oauthAccount.id);
        console.log('Found User ID:', oauthAccount.user.id);
      }

      let user;

      if (!oauthAccount) {
        console.log('OAuth account not found, checking for existing user...');
        // 检查邮箱是否已存在
        const existingUser = await this.prisma.user.findUnique({
          where: { email: azureUser.mail || azureUser.userPrincipalName },
        });

        if (existingUser) {
          console.log('Existing user found, creating OAuth link...');
          // 如果用户存在，创建 OAuth 关联
          oauthAccount = await this.prisma.oAuthAccount.create({
            data: {
              provider: 'AZURE_AD',
              providerId: azureUser.id,
              userId: existingUser.id,
              email: azureUser.mail || azureUser.userPrincipalName,
              displayName: azureUser.displayName,
              accessToken: response.accessToken,
              expiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
            },
            include: {
              user: true,
            },
          });
          user = existingUser;
        } else {
          // 创建新用户和 OAuth 关联
          const username = (azureUser.mail || azureUser.userPrincipalName).split('@')[0];
          console.log(
            'Creating new user:',
            username,
            azureUser.mail || azureUser.userPrincipalName
          );
          try {
            user = await this.prisma.user.create({
              data: {
                email: azureUser.mail || azureUser.userPrincipalName,
                username,
                displayName: azureUser.displayName,
                oauthAccounts: {
                  create: {
                    provider: 'AZURE_AD',
                    providerId: azureUser.id,
                    email: azureUser.mail || azureUser.userPrincipalName,
                    displayName: azureUser.displayName,
                    accessToken: response.accessToken,
                    expiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
                  },
                },
              },
            });
            console.log('User created successfully:', user.id);

            // Verify user was actually created
            const verifyUser = await this.prisma.user.findUnique({
              where: { id: user.id },
              include: { oauthAccounts: true },
            });
            console.log('Verification check - User in DB:', verifyUser ? 'YES' : 'NO');
            if (verifyUser) {
              console.log('Verification - OAuth accounts:', verifyUser.oauthAccounts.length);
            }
          } catch (createError) {
            console.error('ERROR creating user:', createError);
            throw createError;
          }
        }
      } else {
        console.log('OAuth account found, updating tokens...');
        user = oauthAccount.user;

        // 更新最后登录时间和 token
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await this.prisma.oAuthAccount.update({
          where: { id: oauthAccount.id },
          data: {
            accessToken: response.accessToken,
            expiresAt: response.expiresOn ? new Date(response.expiresOn) : null,
          },
        });
      }

      // 记录成功的 Azure 登录
      await this.logService.logLogin({
        userId: user.id,
        email: user.email,
        loginMethod: 'AZURE_AD',
        success: true,
        ipAddress,
        userAgent,
      });

      // 生成 JWT token
      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatarUrl,
        },
      };
    } catch (error) {
      console.error('Azure authentication error:', error);

      // 尝试从已获取的信息或错误中提取邮箱
      let email = 'unknown';
      let errorDetails = error.message || 'Azure authentication failed';

      // 如果已经获取到用户信息
      if (azureUser) {
        email = azureUser.mail || azureUser.userPrincipalName || 'unknown';
      }

      // 尝试从 MSAL 错误中提取信息
      if (error.errorCode) {
        errorDetails = `${error.errorCode}: ${error.errorMessage || errorDetails}`;
      }

      // 尝试从 Axios 错误中提取信息
      if (error.response?.data) {
        errorDetails = JSON.stringify(error.response.data);
      }

      // 记录失败的 Azure 登录尝试
      await this.logService.logLogin({
        email,
        loginMethod: 'AZURE_AD',
        success: false,
        ipAddress,
        userAgent,
        errorMessage: errorDetails,
      });

      throw new UnauthorizedException('Azure authentication failed');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...user,
      avatar: user.avatarUrl,
    };
  }
}
