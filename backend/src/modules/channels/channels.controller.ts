import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { QueryChannelsDto } from './dto/query-channels.dto';
import {
  ChannelResponseEntity,
  PaginatedChannelsResponse,
} from './entities/channel-response.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Channels')
@Controller('channels')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '创建渠道（仅管理员）' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '创建成功',
    type: ChannelResponseEntity,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'AI 提供商不存在' })
  async create(@Body() dto: CreateChannelDto): Promise<ChannelResponseEntity> {
    return this.channelsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取渠道列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    type: PaginatedChannelsResponse,
  })
  async findAll(@Query() query: QueryChannelsDto): Promise<PaginatedChannelsResponse> {
    return this.channelsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个渠道' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    type: ChannelResponseEntity,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '渠道不存在' })
  async findOne(@Param('id') id: string): Promise<ChannelResponseEntity> {
    return this.channelsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '更新渠道（仅管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: ChannelResponseEntity,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '渠道不存在' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto
  ): Promise<ChannelResponseEntity> {
    return this.channelsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除渠道（仅管理员）' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '渠道不存在' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '不允许删除有关联 API Key 的渠道',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.channelsService.remove(id);
  }

  @Post(':id/test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '测试渠道连接（仅管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '测试完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        latency: { type: 'number' },
      },
    },
  })
  async testConnection(
    @Param('id') id: string
  ): Promise<{ success: boolean; message: string; latency?: number }> {
    return this.channelsService.testConnection(id);
  }
}
