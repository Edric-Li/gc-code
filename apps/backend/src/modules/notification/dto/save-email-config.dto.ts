import { IsString, IsNumber, IsBoolean, IsEmail, IsNotEmpty, Min, Max, MinLength } from 'class-validator';

export class SaveEmailConfigDto {
  @IsString()
  @IsNotEmpty({ message: 'SMTP 地址不能为空' })
  host: string;

  @IsNumber({}, { message: '端口必须是数字' })
  @Min(1, { message: '端口号必须大于等于 1' })
  @Max(65535, { message: '端口号必须小于等于 65535' })
  port: number;

  @IsBoolean({ message: 'secure 必须是布尔值' })
  secure: boolean;

  @IsEmail({}, { message: '发件人邮箱格式不正确' })
  @IsNotEmpty({ message: '发件人邮箱不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少为 6 个字符' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '发件人名称不能为空' })
  fromName: string;
}
