import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { SystemSettingsService, EmailConfig } from './system-settings.service';
import { encryptApiKey, decryptApiKey } from '../../../common/crypto.util';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
}

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private transporter: Transporter | null = null;
  private currentConfig: EmailConfig | null = null;

  constructor(private readonly settingsService: SystemSettingsService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  async initializeTransporter(): Promise<boolean> {
    try {
      const config = await this.loadConfiguration();

      if (!config) {
        this.logger.warn('邮件配置未设置，通知功能将被禁用');
        this.transporter = null;
        this.currentConfig = null;
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password,
        },
        // 超时设置
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      this.currentConfig = config;
      this.logger.log(`邮件服务已初始化: ${config.host}:${config.port}`);
      return true;
    } catch (error) {
      this.logger.error('初始化邮件服务失败', error);
      this.transporter = null;
      this.currentConfig = null;
      return false;
    }
  }

  /**
   * 加载配置（从数据库）
   */
  private async loadConfiguration(): Promise<EmailConfig | null> {
    try {
      const config = await this.settingsService.getEmailConfig();

      if (!config) {
        return null;
      }

      // 检查密码是否已加密
      if (this.isEncrypted(config.password)) {
        try {
          config.password = decryptApiKey(config.password);
        } catch (error) {
          this.logger.error('解密邮件密码失败，配置可能已损坏', error);
          return null; // 解密失败应该返回 null，避免使用错误的密码
        }
      } else {
        // 明文密码（旧数据或首次配置）
        this.logger.warn(
          '检测到明文邮件密码，建议重新保存配置以加密存储。密码将在下次保存时自动加密。',
        );
      }

      return config;
    } catch (error) {
      this.logger.error('从数据库加载邮件配置失败', error);
      return null;
    }
  }

  /**
   * 检查密码是否已加密
   * AES-256-GCM 加密格式: iv:authTag:encrypted (三个十六进制字符串)
   */
  private isEncrypted(password: string): boolean {
    // 检查是否符合加密格式：32个字符:32个字符:任意长度
    return /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/.test(password);
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter || !this.currentConfig) {
      this.logger.warn('邮件服务未配置，跳过发送');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${this.currentConfig.fromName}" <${this.currentConfig.username}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`邮件发送成功: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('邮件发送失败', error);
      return false;
    }
  }

  /**
   * 测试邮件连接
   */
  async testConnection(config?: EmailConfig): Promise<EmailTestResult> {
    try {
      let testTransporter: Transporter;

      if (config) {
        // 测试提供的配置
        testTransporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.username,
            pass: config.password,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
        });
      } else {
        // 测试当前配置
        if (!this.transporter) {
          return {
            success: false,
            message: '邮件服务未初始化',
          };
        }
        testTransporter = this.transporter;
      }

      await testTransporter.verify();
      return {
        success: true,
        message: '邮件服务器连接成功',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '未知错误';
      return {
        success: false,
        message: `连接失败: ${errorMessage}`,
      };
    }
  }

  /**
   * 保存邮件配置（加密密码）
   */
  async saveConfig(config: EmailConfig): Promise<void> {
    // 加密密码
    const encryptedConfig = {
      ...config,
      password: encryptApiKey(config.password),
    };

    await this.settingsService.saveEmailConfig(encryptedConfig);

    // 重新初始化传输器
    await this.initializeTransporter();
  }

  /**
   * 重新加载配置
   */
  async reloadConfiguration(): Promise<boolean> {
    this.logger.log('重新加载邮件配置...');
    return await this.initializeTransporter();
  }

  /**
   * 检查邮件服务是否可用
   */
  isAvailable(): boolean {
    return this.transporter !== null;
  }

  /**
   * 获取当前配置（脱敏）
   */
  getCurrentConfig(): Partial<EmailConfig> | null {
    if (!this.currentConfig) {
      return null;
    }

    return {
      host: this.currentConfig.host,
      port: this.currentConfig.port,
      secure: this.currentConfig.secure,
      username: this.currentConfig.username,
      fromName: this.currentConfig.fromName,
      // 密码不返回
    };
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(to: string): Promise<boolean> {
    return await this.sendEmail({
      to,
      subject: '邮件服务测试 - GC-Code1',
      html: `
        <h2>邮件服务测试</h2>
        <p>这是一封测试邮件，用于验证邮件服务器配置是否正确。</p>
        <p><strong>发送时间：</strong>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">此邮件由 GC-Code1 监控系统自动发送</p>
      `,
      text: `邮件服务测试\n\n这是一封测试邮件，用于验证邮件服务器配置是否正确。\n\n发送时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    });
  }
}
