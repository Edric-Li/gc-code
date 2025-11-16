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

  /**
   * 验证邮件配置的有效性
   */
  private isValidEmailConfig(value: any): value is EmailConfig {
    return (
      value &&
      typeof value === 'object' &&
      typeof value.host === 'string' &&
      typeof value.port === 'number' &&
      typeof value.secure === 'boolean' &&
      typeof value.username === 'string' &&
      typeof value.password === 'string' &&
      typeof value.fromName === 'string' &&
      value.host.length > 0 &&
      value.port > 0 &&
      value.port <= 65535 &&
      value.username.length > 0 &&
      value.password.length > 0
    );
  }

  /**
   * 验证告警配置的有效性
   */
  private isValidAlertConfig(value: any): value is AlertConfig {
    return (
      value &&
      typeof value === 'object' &&
      Array.isArray(value.recipients) &&
      typeof value.cooldownMinutes === 'number' &&
      typeof value.batchEnabled === 'boolean' &&
      typeof value.batchIntervalMinutes === 'number' &&
      Array.isArray(value.enabledTypes) &&
      value.cooldownMinutes > 0 &&
      value.batchIntervalMinutes > 0 &&
      value.recipients.every((r: any) => typeof r === 'string') &&
      value.enabledTypes.every((t: any) => typeof t === 'string')
    );
  }

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

      // 运行时类型验证
      if (!this.isValidEmailConfig(setting.value)) {
        this.logger.error(
          '邮件配置格式无效，请检查数据库中的配置是否被篡改',
          setting.value,
        );
        return null;
      }

      return setting.value;
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
        // 运行时类型验证
        if (!this.isValidAlertConfig(setting.value)) {
          this.logger.error(
            '告警配置格式无效，请检查数据库中的配置是否被篡改，将使用默认配置',
            setting.value,
          );
          // 继续执行以返回默认配置
        } else {
          return setting.value;
        }
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
