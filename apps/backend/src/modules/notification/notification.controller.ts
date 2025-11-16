import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { EmailNotificationService } from './services/email-notification.service';
import { SystemSettingsService } from './services/system-settings.service';
import { ChannelAlertService } from './services/channel-alert.service';
import { AlertType, NotificationStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SaveEmailConfigDto } from './dto/save-email-config.dto';
import { SaveAlertConfigDto } from './dto/save-alert-config.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { ToggleEmailDto } from './dto/toggle-email.dto';

/**
 * 通知配置管理 Controller
 * 仅管理员可访问
 */
@Controller('api/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class NotificationController {
  constructor(
    private readonly emailService: EmailNotificationService,
    private readonly settingsService: SystemSettingsService,
    private readonly alertService: ChannelAlertService,
  ) {}

  // ==================== 邮件配置管理 ====================

  /**
   * 获取邮件配置（脱敏）
   */
  @Get('email/config')
  async getEmailConfig() {
    const config = await this.emailService.getCurrentConfig();
    return {
      success: true,
      data: config,
    };
  }

  /**
   * 保存邮件配置
   */
  @Post('email/config')
  @HttpCode(HttpStatus.OK)
  async saveEmailConfig(@Body() config: SaveEmailConfigDto) {
    await this.emailService.saveConfig(config);
    return {
      success: true,
      message: '邮件配置保存成功',
    };
  }

  /**
   * 测试邮件连接
   */
  @Post('email/test-connection')
  @HttpCode(HttpStatus.OK)
  async testEmailConnection(@Body() config?: SaveEmailConfigDto) {
    const result = await this.emailService.testConnection(config);
    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * 发送测试邮件
   */
  @Post('email/test-send')
  @HttpCode(HttpStatus.OK)
  async sendTestEmail(@Body() body: SendTestEmailDto) {
    const success = await this.emailService.sendTestEmail(body.to);
    return {
      success,
      message: success ? '测试邮件发送成功' : '测试邮件发送失败',
    };
  }

  /**
   * 重新加载邮件配置
   */
  @Post('email/reload')
  @HttpCode(HttpStatus.OK)
  async reloadEmailConfig() {
    const success = await this.emailService.reloadConfiguration();
    return {
      success,
      message: success ? '邮件配置重新加载成功' : '邮件配置重新加载失败',
    };
  }

  /**
   * 启用/禁用邮件通知
   */
  @Post('email/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleEmailNotification(@Body() body: ToggleEmailDto) {
    await this.settingsService.toggleEmailNotification(body.enabled);
    return {
      success: true,
      message: `邮件通知已${body.enabled ? '启用' : '禁用'}`,
    };
  }

  // ==================== 告警配置管理 ====================

  /**
   * 获取告警配置
   */
  @Get('alert/config')
  async getAlertConfig() {
    const config = await this.settingsService.getAlertConfig();
    return {
      success: true,
      data: config,
    };
  }

  /**
   * 保存告警配置
   */
  @Post('alert/config')
  @HttpCode(HttpStatus.OK)
  async saveAlertConfig(@Body() config: SaveAlertConfigDto) {
    await this.settingsService.saveAlertConfig(config);
    return {
      success: true,
      message: '告警配置保存成功',
    };
  }

  // ==================== 告警历史和统计 ====================

  /**
   * 获取告警历史
   */
  @Get('alerts/history')
  async getAlertHistory(
    @Query('channelId') channelId?: string,
    @Query('alertType') alertType?: AlertType,
    @Query('status') status?: NotificationStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.alertService.getAlertHistory({
      channelId,
      alertType,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: result.logs,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * 获取告警统计
   */
  @Get('alerts/stats')
  async getAlertStats(@Query('days') days?: string) {
    const stats = await this.alertService.getAlertStats(
      days ? parseInt(days, 10) : undefined,
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 获取邮件服务状态
   */
  @Get('status')
  async getNotificationStatus() {
    const emailAvailable = this.emailService.isAvailable();
    const hasEmailConfig = await this.settingsService.hasEmailConfig();

    return {
      success: true,
      data: {
        emailAvailable,
        hasEmailConfig,
        emailConfig: await this.emailService.getCurrentConfig(),
      },
    };
  }
}
