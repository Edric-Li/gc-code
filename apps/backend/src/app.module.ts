import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { LogModule } from './modules/logs/log.module';
import { UserModule } from './modules/users/user.module';
import { OrganizationModule } from './modules/organizations/organization.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AiProvidersModule } from './modules/ai-providers/ai-providers.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ClaudeRelayModule } from './modules/claude-relay/claude-relay.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Prisma 模块（全局）
    PrismaModule,

    // 健康检查模块
    HealthModule,

    // 认证模块
    AuthModule,

    // 用户模块
    UserModule,

    // 组织模块
    OrganizationModule,

    // 日志模块
    LogModule,

    // API Keys 模块
    ApiKeysModule,

    // AI Providers 模块
    AiProvidersModule,

    // Channels 模块
    ChannelsModule,

    // Claude Relay 模块（Sticky Session）
    ClaudeRelayModule,

    // 通知模块（邮件告警）
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
