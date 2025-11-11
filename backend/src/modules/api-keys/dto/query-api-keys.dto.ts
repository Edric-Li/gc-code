import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean, IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { KeyStatus } from '@prisma/client';

export class QueryApiKeysDto {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '状态过滤',
    enum: KeyStatus,
    example: KeyStatus.ACTIVE,
  })
  @IsEnum(KeyStatus)
  @IsOptional()
  status?: KeyStatus;

  @ApiPropertyOptional({
    description: '名称模糊搜索',
    example: 'production',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: '按用户ID筛选',
    example: 'e4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: '是否包含已删除的 API Key',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;
}

export class ApiKeyUsageQueryDto {
  @ApiPropertyOptional({
    description: '聚合粒度',
    enum: ['hour', 'day', 'week', 'month'],
    example: 'day',
    default: 'day',
  })
  @IsEnum(['hour', 'day', 'week', 'month'])
  @IsOptional()
  granularity?: 'hour' | 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: '开始日期（ISO 8601 格式）',
    example: '2025-10-12T00:00:00Z',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期（ISO 8601 格式）',
    example: '2025-11-11T23:59:59Z',
  })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class ApiKeyStatsQueryDto {
  @ApiPropertyOptional({
    description: '开始日期（ISO 8601 格式）',
    example: '2025-10-12T00:00:00Z',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期（ISO 8601 格式）',
    example: '2025-11-11T23:59:59Z',
  })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class ApiKeyRankingQueryDto extends ApiKeyStatsQueryDto {
  @ApiPropertyOptional({
    description: '排序字段',
    enum: ['requests', 'cost'],
    example: 'requests',
    default: 'requests',
  })
  @IsEnum(['requests', 'cost'])
  @IsOptional()
  orderBy?: 'requests' | 'cost' = 'requests';

  @ApiPropertyOptional({
    description: '返回前 N 个',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  top?: number = 10;
}
