import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: '关联的渠道ID，null 表示自动选择可用渠道',
    example: 'f5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
  })
  @IsUUID()
  @IsOptional()
  channelId?: string;
}
