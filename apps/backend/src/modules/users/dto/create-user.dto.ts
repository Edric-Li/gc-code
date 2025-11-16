import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: '用户邮箱（必填）',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: '用户名',
    example: 'john_doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({
    description: '显示名称',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({
    description: '头像 URL',
    example: 'https://example.com/avatar.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: '用户角色',
    enum: Role,
    default: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: '是否激活',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
