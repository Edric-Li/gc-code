import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
}
