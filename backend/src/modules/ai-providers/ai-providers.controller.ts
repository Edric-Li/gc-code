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
import { AiProvidersService } from './ai-providers.service';
import { CreateAiProviderDto } from './dto/create-ai-provider.dto';
import { UpdateAiProviderDto } from './dto/update-ai-provider.dto';
import { QueryAiProvidersDto } from './dto/query-ai-providers.dto';
import {
  AiProviderResponseEntity,
  PaginatedAiProvidersResponse,
} from './entities/ai-provider-response.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('AI Providers')
@Controller('ai-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '创建 AI 提供商（仅管理员）' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '创建成功',
    type: AiProviderResponseEntity,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Slug 已存在' })
  async create(@Body() dto: CreateAiProviderDto): Promise<AiProviderResponseEntity> {
    return this.aiProvidersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取 AI 提供商列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    type: PaginatedAiProvidersResponse,
  })
  async findAll(@Query() query: QueryAiProvidersDto): Promise<PaginatedAiProvidersResponse> {
    return this.aiProvidersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个 AI 提供商' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    type: AiProviderResponseEntity,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '提供商不存在' })
  async findOne(@Param('id') id: string): Promise<AiProviderResponseEntity> {
    return this.aiProvidersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '更新 AI 提供商（仅管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: AiProviderResponseEntity,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '提供商不存在' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '不允许修改预置提供商的某些字段',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAiProviderDto
  ): Promise<AiProviderResponseEntity> {
    return this.aiProvidersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 AI 提供商（仅管理员）' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '提供商不存在' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '不允许删除预置提供商或有关联渠道的提供商',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.aiProvidersService.remove(id);
  }
}
