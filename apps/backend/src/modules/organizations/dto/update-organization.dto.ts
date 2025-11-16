import { IsString, IsOptional, IsBoolean, MaxLength, IsEnum, IsUUID } from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsEnum(OrganizationType)
  @IsOptional()
  type?: OrganizationType;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
