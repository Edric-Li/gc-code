import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsEnum,
  MaxLength,
  IsPositive,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelTargetType } from '@prisma/client';

export class UpdateApiKeyDto {
  @ApiPropertyOptional({
    description: 'API Key 名称',
    example: 'Updated API Key Name',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'API Key 描述',
    example: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '过期时间（ISO 8601 格式），null 表示永不过期',
    example: '2026-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: '每日费用限制，null 表示无限',
    example: 200.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  dailyCostLimit?: number;

  @ApiPropertyOptional({
    description: '渠道目标类型：CHANNEL（具体渠道）、PROVIDER（AI供货商）',
    enum: ChannelTargetType,
    example: ChannelTargetType.CHANNEL,
  })
  @IsEnum(ChannelTargetType)
  @IsOptional()
  channelTargetType?: ChannelTargetType;

  @ApiPropertyOptional({
    description:
      '关联的渠道ID。CHANNEL模式：指定使用的渠道。PROVIDER模式：可选的专属渠道（优先使用，必须属于所选供货商）',
    example: 'f5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
  })
  @IsUUID()
  @IsOptional()
  channelId?: string;

  @ApiPropertyOptional({
    description: '关联的AI供货商ID（当 targetType=PROVIDER 时使用）',
    example: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7',
  })
  @ValidateIf((o) => o.channelTargetType === ChannelTargetType.PROVIDER)
  @IsNotEmpty({
    message: 'targetType 为 PROVIDER 时 providerId 是必需的',
  })
  @IsUUID(undefined, {
    message: 'providerId 必须是有效的 UUID',
  })
  @IsOptional()
  providerId?: string;
}
