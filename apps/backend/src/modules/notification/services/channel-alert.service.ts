import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailNotificationService } from './email-notification.service';
import { SystemSettingsService } from './system-settings.service';
import { AlertType, NotificationStatus, Channel } from '@prisma/client';

export interface AlertDetails {
  statusCode?: number;
  errorMessage?: string;
  resetTimestamp?: Date;
  errorCount?: number;
}

@Injectable()
export class ChannelAlertService {
  private readonly logger = new Logger(ChannelAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailNotificationService,
    private readonly settingsService: SystemSettingsService
  ) {}

  /**
   * 发送渠道告警（带去重检查）
   */
  async sendAlert(
    channel: Channel,
    alertType: AlertType,
    details?: AlertDetails
  ): Promise<boolean> {
    try {
      // 1. 检查是否启用该类型的告警
      const alertConfig = await this.settingsService.getAlertConfig();
      if (!alertConfig.enabledTypes.includes(alertType)) {
        this.logger.debug(`告警类型 ${alertType} 未启用，跳过发送 (渠道: ${channel.name})`);
        return false;
      }

      // 2. 检查是否有收件人
      if (!alertConfig.recipients || alertConfig.recipients.length === 0) {
        this.logger.warn('未配置告警收件人，跳过发送');
        return false;
      }

      // 3. 检查冷却期（除了恢复通知）
      if (alertType !== AlertType.RECOVERED) {
        const shouldSend = await this.shouldSendAlert(
          channel.id,
          alertType,
          alertConfig.cooldownMinutes
        );
        if (!shouldSend) {
          this.logger.debug(`渠道 ${channel.name} 的 ${alertType} 告警在冷却期内，跳过发送`);
          return false;
        }
      }

      // 4. 生成邮件内容
      const { subject, html, text } = this.generateEmailContent(channel, alertType, details);

      // 5. 记录告警日志（状态为 PENDING）
      const log = await this.prisma.alertNotificationLog.create({
        data: {
          channelId: channel.id,
          alertType,
          recipients: alertConfig.recipients,
          subject,
          content: text,
          status: NotificationStatus.PENDING,
        },
      });

      // 6. 发送邮件
      const success = await this.emailService.sendEmail({
        to: alertConfig.recipients,
        subject,
        html,
        text,
      });

      // 7. 更新告警日志状态
      await this.prisma.alertNotificationLog.update({
        where: { id: log.id },
        data: {
          status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          errorMessage: success ? null : '邮件发送失败',
        },
      });

      if (success) {
        this.logger.log(
          `告警邮件已发送: ${channel.name} - ${alertType} (收件人: ${alertConfig.recipients.length}人)`
        );
      } else {
        this.logger.error(`告警邮件发送失败: ${channel.name} - ${alertType}`);
      }

      return success;
    } catch (error) {
      this.logger.error('发送渠道告警失败', error);
      return false;
    }
  }

  /**
   * 检查是否应该发送告警（冷却期检查）
   */
  private async shouldSendAlert(
    channelId: string,
    alertType: AlertType,
    cooldownMinutes: number
  ): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const recentAlert = await this.prisma.alertNotificationLog.findFirst({
      where: {
        channelId,
        alertType,
        sentAt: { gte: cutoffTime },
        status: NotificationStatus.SENT,
      },
      orderBy: { sentAt: 'desc' },
    });

    return !recentAlert; // 没有最近的告警记录才发送
  }

  /**
   * 生成邮件内容
   */
  private generateEmailContent(
    channel: Channel,
    alertType: AlertType,
    details?: AlertDetails
  ): { subject: string; html: string; text: string } {
    const timestamp = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    let subject: string;
    let title: string;
    let emoji: string;
    let severity: string;
    let severityColor: string;
    let recommendation: string[];

    switch (alertType) {
      case AlertType.ERROR:
        emoji = '🚨';
        severity = '严重';
        severityColor = '#dc3545';
        title = '渠道认证失败';
        subject = `【严重】渠道 ${channel.name} 认证失败`;
        recommendation = [
          '检查 API Key 是否有效',
          '确认账户是否被封禁',
          '检查账户余额是否充足',
          '访问管理后台更新配置',
        ];
        break;

      case AlertType.TEMP_ERROR:
        emoji = '⚠️';
        severity = '警告';
        severityColor = '#ffc107';
        title = '渠道临时错误';
        subject = `【警告】渠道 ${channel.name} 出现临时错误`;
        recommendation = [
          '系统将在 5 分钟后自动恢复该渠道',
          '如果问题持续，请检查上游服务状态',
          '监控后续告警，确认是否自动恢复',
        ];
        break;

      case AlertType.RATE_LIMITED:
        emoji = '⏱️';
        severity = '提示';
        severityColor = '#17a2b8';
        title = '渠道被限流';
        subject = `【提示】渠道 ${channel.name} 被限流`;
        const resetTime = details?.resetTimestamp
          ? new Date(details.resetTimestamp).toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
            })
          : '未知';
        recommendation = [
          `系统将在限流结束后自动恢复 (预计: ${resetTime})`,
          '考虑增加其他渠道以分散负载',
          '检查是否有异常的高频请求',
        ];
        break;

      case AlertType.RECOVERED:
        emoji = '✅';
        severity = '恢复';
        severityColor = '#28a745';
        title = '渠道已恢复';
        subject = `【恢复】渠道 ${channel.name} 已恢复正常`;
        recommendation = ['渠道已重新加入可用池', '系统将继续监控该渠道状态'];
        break;
    }

    // HTML 邮件
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h2 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .info-table { width: 100%; background: white; border-radius: 4px; overflow: hidden; margin: 20px 0; }
    .info-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .info-table td:first-child { font-weight: bold; width: 140px; background: #f5f5f5; }
    .recommendations { background: white; padding: 20px; border-radius: 4px; margin-top: 20px; }
    .recommendations h3 { margin-top: 0; color: ${severityColor}; }
    .recommendations ul { margin: 10px 0; padding-left: 20px; }
    .recommendations li { margin: 8px 0; }
    .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${emoji} ${title}</h2>
    </div>
    <div class="content">
      <table class="info-table">
        <tr>
          <td>渠道名称</td>
          <td>${channel.name}</td>
        </tr>
        <tr>
          <td>告警类型</td>
          <td><strong style="color: ${severityColor}">${severity}</strong></td>
        </tr>
        <tr>
          <td>渠道状态</td>
          <td>${channel.status}</td>
        </tr>
        ${details?.statusCode ? `<tr><td>HTTP 状态码</td><td>${details.statusCode}</td></tr>` : ''}
        ${details?.errorMessage ? `<tr><td>错误信息</td><td>${details.errorMessage}</td></tr>` : ''}
        ${details?.errorCount ? `<tr><td>错误次数</td><td>${details.errorCount} 次</td></tr>` : ''}
        <tr>
          <td>发生时间</td>
          <td>${timestamp}</td>
        </tr>
      </table>

      <div class="recommendations">
        <h3>建议操作</h3>
        <ul>
          ${recommendation.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="footer">
        <p>此邮件由 GC-Code1 渠道监控系统自动发送</p>
        <p>如需管理告警配置，请登录系统后台</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // 纯文本邮件
    const text = `
${emoji} ${title}

渠道名称: ${channel.name}
告警类型: ${severity}
渠道状态: ${channel.status}
${details?.statusCode ? `HTTP 状态码: ${details.statusCode}` : ''}
${details?.errorMessage ? `错误信息: ${details.errorMessage}` : ''}
${details?.errorCount ? `错误次数: ${details.errorCount} 次` : ''}
发生时间: ${timestamp}

建议操作:
${recommendation.map((item, index) => `${index + 1}. ${item}`).join('\n')}

---
此邮件由 GC-Code1 渠道监控系统自动发送
如需管理告警配置，请登录系统后台
    `.trim();

    return { subject, html, text };
  }

  /**
   * 获取告警历史
   */
  async getAlertHistory(params: {
    channelId?: string;
    alertType?: AlertType;
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
  }) {
    const { channelId, alertType, status, limit = 50, offset = 0 } = params;

    const [logs, total] = await Promise.all([
      this.prisma.alertNotificationLog.findMany({
        where: {
          ...(channelId && { channelId }),
          ...(alertType && { alertType }),
          ...(status && { status }),
        },
        include: {
          channel: {
            select: {
              name: true,
              status: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.alertNotificationLog.count({
        where: {
          ...(channelId && { channelId }),
          ...(alertType && { alertType }),
          ...(status && { status }),
        },
      }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  /**
   * 获取告警统计
   */
  async getAlertStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.prisma.alertNotificationLog.groupBy({
      by: ['alertType', 'status'],
      where: {
        sentAt: { gte: startDate },
      },
      _count: true,
    });

    return stats;
  }
}
