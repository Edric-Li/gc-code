import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { LogModule } from './modules/logs/log.module';
import { UserModule } from './modules/users/user.module';

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

    // 日志模块
    LogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
