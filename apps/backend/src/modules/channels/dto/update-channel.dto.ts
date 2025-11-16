import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateChannelDto } from './create-channel.dto';
import { ChannelStatus } from '@prisma/client';

// 更新时不允许修改 providerId
export class UpdateChannelDto extends PartialType(
  OmitType(CreateChannelDto, ['providerId'] as const)
) {
  @ApiPropertyOptional({
    description: '渠道状态',
    enum: ChannelStatus,
  })
  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;
}
