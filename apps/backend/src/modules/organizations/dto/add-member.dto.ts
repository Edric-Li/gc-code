import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean; // 可选，默认为 false（普通成员）
}
