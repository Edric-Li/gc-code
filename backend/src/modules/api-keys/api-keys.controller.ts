import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import {
  QueryApiKeysDto,
  ApiKeyUsageQueryDto,
  ApiKeyStatsQueryDto,
  ApiKeyRankingQueryDto,
} from './dto/query-api-keys.dto';
import {
  ApiKeyResponseEntity,
  PaginatedApiKeysResponse,
  ApiKeyUsageResponse,
  ApiKeyStatsOverview,
  ApiKeyRankingResponse,
} from './entities/api-key-response.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '创建新的 API Key（仅管理员）' })
  @ApiResponse({
    status: 201,
    description: 'API Key 创建成功',
    type: ApiKeyResponseEntity,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createApiKeyDto: CreateApiKeyDto, @Request() req): Promise<ApiKeyResponseEntity> {
    return this.apiKeysService.create(req.user.id, createApiKeyDto);
  }

  @Post('my-keys')
  @ApiOperation({ summary: '为当前用户创建 API Key（普通用户，限制20个）' })
  @ApiResponse({
    status: 201,
    description: 'API Key 创建成功',
    type: ApiKeyResponseEntity,
  })
  @ApiResponse({ status: 400, description: '请求参数错误或已达到创建上限' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createMyKey(
    @Body() createDto: Omit<CreateApiKeyDto, 'userId'>,
    @Request() req
  ): Promise<ApiKeyResponseEntity> {
    // 自动填充 userId 为当前用户
    const createApiKeyDto: CreateApiKeyDto = {
      ...createDto,
      userId: req.user.id,
    };
    return this.apiKeysService.createForUser(req.user.id, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: '查询 API Key 列表（分页）' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: PaginatedApiKeysResponse,
  })
  findAll(@Query() query: QueryApiKeysDto, @Request() req): Promise<PaginatedApiKeysResponse> {
    return this.apiKeysService.findAll(req.user.id, query);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: '获取用户总体统计' })
  @ApiResponse({
    status: 200,
    description: '统计数据',
    type: ApiKeyStatsOverview,
  })
  getOverview(@Query() query: ApiKeyStatsQueryDto, @Request() req): Promise<ApiKeyStatsOverview> {
    return this.apiKeysService.getOverview(req.user.id, query);
  }

  @Get('stats/ranking')
  @ApiOperation({ summary: '获取用量排行榜' })
  @ApiResponse({
    status: 200,
    description: '排行榜数据',
    type: ApiKeyRankingResponse,
  })
  getRanking(
    @Query() query: ApiKeyRankingQueryDto,
    @Request() req
  ): Promise<ApiKeyRankingResponse> {
    return this.apiKeysService.getRanking(req.user.id, query);
  }

  @Get('request-logs/all')
  @ApiOperation({ summary: '获取所有 API Key 的详细请求日志' })
  @ApiResponse({
    status: 200,
    description: '请求日志列表',
  })
  getAllRequestLogs(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('apiKeyIds') apiKeyIds?: string | string[],
    @Query('models') models?: string | string[],
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('success') success?: string
  ) {
    // 处理多选参数：确保转换为数组
    const apiKeyIdsArray = apiKeyIds
      ? Array.isArray(apiKeyIds)
        ? apiKeyIds
        : [apiKeyIds]
      : undefined;
    const modelsArray = models ? (Array.isArray(models) ? models : [models]) : undefined;

    return this.apiKeysService.getAllRequestLogs(req.user.id, {
      page: +page,
      limit: +limit,
      apiKeyIds: apiKeyIdsArray,
      models: modelsArray,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
    });
  }

  @Get('request-logs/models')
  @ApiOperation({ summary: '获取所有使用过的模型列表' })
  @ApiResponse({
    status: 200,
    description: '模型列表',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  getUsedModels(@Request() req) {
    return this.apiKeysService.getUsedModels(req.user.id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: '获取单个 API Key 的使用趋势' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '使用趋势数据',
    type: ApiKeyUsageResponse,
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  getApiKeyUsage(
    @Param('id') id: string,
    @Query() query: ApiKeyUsageQueryDto,
    @Request() req
  ): Promise<ApiKeyUsageResponse> {
    return this.apiKeysService.getApiKeyUsage(id, req.user.id, query);
  }

  @Get(':id/request-logs')
  @ApiOperation({ summary: '获取单个 API Key 的详细请求日志' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '请求日志列表',
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  getRequestLogs(
    @Param('id') id: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('success') success?: string
  ) {
    return this.apiKeysService.getRequestLogs(id, req.user.id, {
      page: +page,
      limit: +limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '查询 API Key 详情' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: ApiKeyResponseEntity,
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  findOne(@Param('id') id: string, @Request() req): Promise<ApiKeyResponseEntity> {
    return this.apiKeysService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新 API Key' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: ApiKeyResponseEntity,
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  update(
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
    @Request() req
  ): Promise<ApiKeyResponseEntity> {
    return this.apiKeysService.update(id, req.user.id, updateApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 API Key（软删除）' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        id: { type: 'string' },
        deletedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  remove(@Param('id') id: string, @Request() req) {
    return this.apiKeysService.softDelete(id, req.user.id);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤销 API Key' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '撤销成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        id: { type: 'string' },
        status: { type: 'string' },
        revokedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  revoke(@Param('id') id: string, @Request() req) {
    return this.apiKeysService.revoke(id, req.user.id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '恢复已删除的 API Key' })
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @ApiResponse({
    status: 200,
    description: '恢复成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        id: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'API Key 不存在' })
  @ApiResponse({ status: 400, description: 'API Key 未被删除' })
  restore(@Param('id') id: string, @Request() req) {
    return this.apiKeysService.restore(id, req.user.id);
  }

  @Get('check-name/:userId/:name')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '检查 API Key 名称是否可用（管理员）' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiParam({ name: 'name', description: 'API Key 名称' })
  @ApiResponse({
    status: 200,
    description: '检查结果',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  checkNameAvailable(@Param('userId') userId: string, @Param('name') name: string) {
    return this.apiKeysService.checkNameAvailable(userId, name);
  }

  @Get('check-my-name/:name')
  @ApiOperation({ summary: '检查自己的 API Key 名称是否可用' })
  @ApiParam({ name: 'name', description: 'API Key 名称' })
  @ApiResponse({
    status: 200,
    description: '检查结果',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  checkMyNameAvailable(@Param('name') name: string, @Request() req) {
    return this.apiKeysService.checkNameAvailable(req.user.id, name);
  }
}
