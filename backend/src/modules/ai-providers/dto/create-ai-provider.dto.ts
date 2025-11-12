import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from '@prisma/client';

export class ProviderModelDto {
  @ApiProperty({ description: '模型名称', example: 'gpt-4' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelName: string;

  @ApiPropertyOptional({ description: '显示名称', example: 'GPT-4 Turbo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ description: '模型描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '模型元数据', type: 'object' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateAiProviderDto {
  @ApiProperty({ description: '提供商名称', example: 'OpenAI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'URL友好标识',
    example: 'openai',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug 只能包含小写字母、数字和连字符',
  })
  slug: string;

  @ApiProperty({
    description: '提供商类型',
    enum: ProviderType,
    example: ProviderType.OPENAI,
  })
  @IsEnum(ProviderType)
  type: ProviderType;

  @ApiPropertyOptional({ description: 'Logo 地址' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ description: '官网地址' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ description: '描述信息' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '扩展元数据', type: 'object' })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '支持的模型列表',
    type: [ProviderModelDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderModelDto)
  models?: ProviderModelDto[];
}
