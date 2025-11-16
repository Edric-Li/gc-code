import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailNotificationService } from './services/email-notification.service';
import { SystemSettingsService } from './services/system-settings.service';
import { ChannelAlertService } from './services/channel-alert.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [
    SystemSettingsService,
    EmailNotificationService,
    ChannelAlertService,
  ],
  exports: [
    SystemSettingsService,
    EmailNotificationService,
    ChannelAlertService,
  ],
})
export class NotificationModule {}
