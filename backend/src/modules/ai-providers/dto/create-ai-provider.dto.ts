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
} from 'class-validator';
import { ProviderType } from '@prisma/client';

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
}
