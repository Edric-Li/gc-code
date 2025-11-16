import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SettingCategory } from '@prisma/client';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
}

export interface AlertConfig {
  recipients: string[];
  cooldownMinutes: number;
  batchEnabled: boolean;
  batchIntervalMinutes: number;
  enabledTypes: string[];
}

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取邮件配置
   */
  async getEmailConfig(): Promise<EmailConfig | null> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: SettingCategory.EMAIL,
            key: 'smtp.primary',
          },
        },
      });

      if (!setting || !setting.enabled) {
        return null;
      }

      return setting.value as EmailConfig;
    } catch (error) {
      this.logger.error('获取邮件配置失败', error);
      return null;
    }
  }

  /**
   * 保存邮件配置
   */
  async saveEmailConfig(config: EmailConfig): Promise<void> {
    await this.prisma.systemSettings.upsert({
      where: {
        category_key: {
          category: SettingCategory.EMAIL,
          key: 'smtp.primary',
        },
      },
      create: {
        category: SettingCategory.EMAIL,
        key: 'smtp.primary',
        value: config,
        encrypted: true,
        enabled: true,
        description: '主邮件服务器配置',
      },
      update: {
        value: config,
        updatedAt: new Date(),
      },
    });

    this.logger.log('邮件配置已保存');
  }

  /**
   * 获取告警配置
   */
  async getAlertConfig(): Promise<AlertConfig> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: SettingCategory.ALERT,
            key: 'channel.rules',
          },
        },
      });

      if (setting && setting.enabled) {
        return setting.value as AlertConfig;
      }
    } catch (error) {
      this.logger.error('获取告警配置失败', error);
    }

    // 返回默认配置
    return {
      recipients: [],
      cooldownMinutes: 30,
      batchEnabled: false,
      batchIntervalMinutes: 5,
      enabledTypes: ['ERROR', 'TEMP_ERROR', 'RATE_LIMITED', 'RECOVERED'],
    };
  }

  /**
   * 保存告警配置
   */
  async saveAlertConfig(config: AlertConfig): Promise<void> {
    await this.prisma.systemSettings.upsert({
      where: {
        category_key: {
          category: SettingCategory.ALERT,
          key: 'channel.rules',
        },
      },
      create: {
        category: SettingCategory.ALERT,
        key: 'channel.rules',
        value: config,
        encrypted: false,
        enabled: true,
        description: '渠道告警规则配置',
      },
      update: {
        value: config,
        updatedAt: new Date(),
      },
    });

    this.logger.log('告警配置已保存');
  }

  /**
   * 测试邮件配置是否存在
   */
  async hasEmailConfig(): Promise<boolean> {
    const config = await this.getEmailConfig();
    return config !== null;
  }

  /**
   * 启用/禁用邮件通知
   */
  async toggleEmailNotification(enabled: boolean): Promise<void> {
    await this.prisma.systemSettings.updateMany({
      where: {
        category: SettingCategory.EMAIL,
        key: 'smtp.primary',
      },
      data: {
        enabled,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`邮件通知已${enabled ? '启用' : '禁用'}`);
  }
}
