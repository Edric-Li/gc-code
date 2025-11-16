import { IsArray, IsNumber, IsBoolean, IsEmail, IsEnum, Min, Max, ArrayMinSize } from 'class-validator';
import { AlertType } from '@prisma/client';

export class SaveAlertConfigDto {
  @IsArray({ message: 'recipients 必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一个收件人' })
  @IsEmail({}, { each: true, message: '收件人邮箱格式不正确' })
  recipients: string[];

  @IsNumber({}, { message: 'cooldownMinutes 必须是数字' })
  @Min(1, { message: '冷却时间至少为 1 分钟' })
  @Max(1440, { message: '冷却时间最多为 1440 分钟（24小时）' })
  cooldownMinutes: number;

  @IsBoolean({ message: 'batchEnabled 必须是布尔值' })
  batchEnabled: boolean;

  @IsNumber({}, { message: 'batchIntervalMinutes 必须是数字' })
  @Min(1, { message: '批量发送间隔至少为 1 分钟' })
  @Max(60, { message: '批量发送间隔最多为 60 分钟' })
  batchIntervalMinutes: number;

  @IsArray({ message: 'enabledTypes 必须是数组' })
  @IsEnum(AlertType, { each: true, message: '告警类型无效' })
  enabledTypes: AlertType[];
}
