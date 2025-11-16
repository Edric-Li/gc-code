import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, QueryUsersDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LogService } from '../logs/log.service';
import { Role, AuditAction } from '@prisma/client';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logService: LogService
  ) {}

  @Get('statistics')
  getStatistics() {
    return this.userService.getStatistics();
  }

  @Get('simple-list')
  getSimpleList(@Query('search') search?: string) {
    return this.userService.getSimpleList(search);
  }

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: { id: string },
    @Req() req: Request
  ) {
    const result = await this.userService.create(createUserDto);

    // 记录审计日志
    await this.logService.logAudit({
      userId: currentUser.id,
      action: AuditAction.CREATE,
      resource: 'User',
      resourceId: result.id,
      description: `预创建用户 ${result.email}`,
      changes: {
        email: result.email,
        username: result.username,
        role: result.role,
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.userService.findAll({
      skip: query.skip ? Number(query.skip) : undefined,
      take: query.take ? Number(query.take) : undefined,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: { id: string },
    @Req() req: Request
  ) {
    // 获取更新前的用户数据
    const oldUser = await this.userService.findOne(id);
    const result = await this.userService.update(id, updateUserDto);

    // 记录审计日志
    await this.logService.logAudit({
      userId: currentUser.id,
      action: AuditAction.UPDATE,
      resource: 'User',
      resourceId: id,
      description: `更新用户 ${oldUser.email}`,
      changes: {
        before: oldUser,
        after: result,
        fields: Object.keys(updateUserDto),
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string },
    @Req() req: Request
  ) {
    // 获取删除前的用户数据
    const user = await this.userService.findOne(id);
    const result = await this.userService.remove(id);

    // 记录审计日志
    await this.logService.logAudit({
      userId: currentUser.id,
      action: AuditAction.DELETE,
      resource: 'User',
      resourceId: id,
      description: `删除用户 ${user.email}`,
      changes: {
        deletedUser: user,
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }
}
