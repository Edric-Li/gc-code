import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendTestEmailDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  to: string;
}
