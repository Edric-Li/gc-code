import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsEnum,
  MaxLength,
  MinLength,
  IsPositive,
  ValidateIf,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelTargetType } from '@prisma/client';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'API Key 名称',
    example: 'My API Key',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'API Key 描述',
    example: '用于生产环境的 API Key',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '过期时间（ISO 8601 格式），null 表示永不过期',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: '每日费用限制，null 表示无限',
    example: 100.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  dailyCostLimit?: number;

  @ApiProperty({
    description: '关联的用户ID（管理员创建 API Key 时必须指定）',
    example: 'e4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: '渠道目标类型：CHANNEL（具体渠道）、PROVIDER（AI供货商）',
    enum: ChannelTargetType,
    example: ChannelTargetType.CHANNEL,
    default: ChannelTargetType.CHANNEL,
  })
  @IsEnum(ChannelTargetType)
  @IsOptional()
  channelTargetType?: ChannelTargetType = ChannelTargetType.CHANNEL;

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

  @ApiPropertyOptional({
    description: '自定义 API Key 值（仅管理员可用），如果不指定则自动生成。必须以 sk- 或 cr_ 开头，长度10-255字符',
    example: 'sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'Custom key must be at least 10 characters long' })
  @MaxLength(255, { message: 'Custom key cannot exceed 255 characters' })
  @Matches(/^(sk-|cr_)/, { message: 'Custom key must start with "sk-" or "cr_"' })
  customKey?: string;
}
