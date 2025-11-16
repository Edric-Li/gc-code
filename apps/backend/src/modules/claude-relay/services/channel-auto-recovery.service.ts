import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma.service';
import { ChannelStatus, AlertType } from '@prisma/client';
import { ChannelPoolCacheService } from './channel-pool-cache.service';
import { ChannelErrorTrackerService } from './channel-error-tracker.service';
import { ChannelAlertService } from '../../notification/services/channel-alert.service';

/**
 * 渠道自动恢复服务
 *
 * 功能:
 * - 定时检查 TEMP_ERROR 状态的渠道
 * - 5分钟后自动恢复为 ACTIVE 状态
 * - 刷新渠道池缓存
 * - 发送恢复通知
 */
@Injectable()
export class ChannelAutoRecoveryService {
  private readonly logger = new Logger(ChannelAutoRecoveryService.name);

  // 临时错误自动恢复时间（5分钟）
  private readonly TEMP_ERROR_RECOVERY_MINUTES = 5;

  constructor(
    private prisma: PrismaService,
    private channelPoolCache: ChannelPoolCacheService,
    private errorTracker: ChannelErrorTrackerService,
    private alertService: ChannelAlertService,
  ) {}

  /**
   * 定时任务：每分钟检查一次需要恢复的渠道
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndRecoverChannels() {
    try {
      const now = new Date();
      const recoveryThreshold = new Date(
        now.getTime() - this.TEMP_ERROR_RECOVERY_MINUTES * 60 * 1000
      );

      // 查找需要恢复的渠道（TEMP_ERROR 状态且超过 5 分钟）
      const channelsToRecover = await this.prisma.channel.findMany({
        where: {
          status: ChannelStatus.TEMP_ERROR,
          lastErrorAt: {
            lte: recoveryThreshold,
          },
          isActive: true,
          deletedAt: null,
        },
      });

      if (channelsToRecover.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${channelsToRecover.length} channels to recover from TEMP_ERROR`
      );

      // 批量恢复渠道
      for (const channel of channelsToRecover) {
        await this.recoverChannel(channel.id, channel.name);
      }

      // 刷新渠道池缓存
      await this.channelPoolCache.refresh();
      this.logger.log('Channel pool cache refreshed after recovery');
    } catch (error) {
      this.logger.error(`Failed to check and recover channels: ${error.message}`);
    }
  }

  /**
   * 恢复单个渠道
   * @param channelId 渠道 ID
   * @param channelName 渠道名称（用于日志）
   */
  private async recoverChannel(channelId: string, channelName: string) {
    try {
      // 恢复为 ACTIVE 状态
      const channel = await this.prisma.channel.update({
        where: { id: channelId },
        data: {
          status: ChannelStatus.ACTIVE,
          errorCount: 0, // 重置错误计数
        },
      });

      // 清除错误追踪
      this.errorTracker.clearErrors(channelId);

      // 添加到缓存池
      this.channelPoolCache.upsertChannel(channel);

      this.logger.log(
        `✅ Channel ${channelName} (${channelId}) auto-recovered from TEMP_ERROR to ACTIVE`
      );

      // 发送恢复通知
      await this.alertService.sendAlert(channel, AlertType.RECOVERED);
    } catch (error) {
      this.logger.error(
        `Failed to recover channel ${channelName} (${channelId}): ${error.message}`
      );
    }
  }

  /**
   * 手动恢复指定渠道（用于管理接口）
   * @param channelId 渠道 ID
   */
  async manualRecoverChannel(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    if (channel.status !== ChannelStatus.TEMP_ERROR) {
      this.logger.warn(
        `Channel ${channel.name} is not in TEMP_ERROR status, current status: ${channel.status}`
      );
      return { success: false, message: 'Channel is not in TEMP_ERROR status' };
    }

    await this.recoverChannel(channelId, channel.name);
    await this.channelPoolCache.refresh();

    return { success: true, message: 'Channel recovered successfully' };
  }

  /**
   * 获取恢复统计信息
   */
  async getRecoveryStats() {
    const tempErrorChannels = await this.prisma.channel.findMany({
      where: {
        status: ChannelStatus.TEMP_ERROR,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        lastErrorAt: true,
        errorCount: true,
      },
    });

    const now = new Date();
    const stats = tempErrorChannels.map((channel) => {
      const minutesSinceError = channel.lastErrorAt
        ? Math.floor((now.getTime() - channel.lastErrorAt.getTime()) / 1000 / 60)
        : null;
      const willRecoverIn = minutesSinceError
        ? Math.max(0, this.TEMP_ERROR_RECOVERY_MINUTES - minutesSinceError)
        : null;

      return {
        channelId: channel.id,
        channelName: channel.name,
        errorCount: channel.errorCount,
        minutesSinceError,
        willRecoverInMinutes: willRecoverIn,
      };
    });

    return {
      totalTempErrorChannels: tempErrorChannels.length,
      recoveryThresholdMinutes: this.TEMP_ERROR_RECOVERY_MINUTES,
      channels: stats,
    };
  }
}
