import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMinSize,
  Matches,
  IsObject,
} from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ description: '所属 AI 提供商 ID' })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ description: '渠道名称', example: 'OpenAI 官方渠道' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: '渠道描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'API 基础地址（仅支持HTTPS）',
    example: 'https://api.openai.com',
  })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsNotEmpty()
  @MaxLength(500)
  @Matches(/^https:\/\/.+[^/]$/, {
    message: 'baseUrl必须使用HTTPS协议且不应以斜杠结尾',
  })
  baseUrl: string;

  @ApiProperty({
    description: 'API 密钥',
    example: 'sk-xxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'API密钥长度过短，至少需要20个字符' })
  @MaxLength(500)
  apiKey: string;

  @ApiPropertyOptional({
    description: '支持的模型列表',
    example: ['gpt-4', 'gpt-3.5-turbo'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  models?: string[];

  @ApiPropertyOptional({
    description: '扩展元数据',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
