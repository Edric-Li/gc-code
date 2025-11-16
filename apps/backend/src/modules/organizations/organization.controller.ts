import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LogService } from '../logs/log.service';
import { Role, AuditAction } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // 只有系统管理员可以管理组织
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly logService: LogService
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateOrganizationDto,
    @Request() req,
    @Req() expressReq: ExpressRequest
  ) {
    const result = await this.organizationService.create(createDto, req.user.id);

    await this.logService.logAudit({
      userId: req.user.id,
      action: AuditAction.CREATE,
      resource: 'Organization',
      resourceId: result.id,
      description: `创建组织: ${result.name}`,
      changes: {
        name: result.name,
        slug: result.slug,
      },
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      userAgent: expressReq.headers['user-agent'],
    });

    return result;
  }

  @Get()
  findAll(@Query('mine') mine?: string, @Request() req?) {
    // 如果 mine=true，只返回用户所属的组织
    const userId = mine === 'true' ? req.user.id : undefined;
    return this.organizationService.findAll(userId);
  }

  @Get('tree')
  getTree() {
    return this.organizationService.getTree();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.organizationService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @Request() req,
    @Req() expressReq: ExpressRequest
  ) {
    const oldOrg = await this.organizationService.findOne(id);
    const result = await this.organizationService.update(id, updateDto, req.user.id);

    await this.logService.logAudit({
      userId: req.user.id,
      action: AuditAction.UPDATE,
      resource: 'Organization',
      resourceId: id,
      description: `更新组织: ${oldOrg.name}`,
      changes: {
        before: { name: oldOrg.name, description: oldOrg.description },
        after: { name: result.name, description: result.description },
        fields: Object.keys(updateDto),
      },
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      userAgent: expressReq.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req, @Req() expressReq: ExpressRequest) {
    const org = await this.organizationService.findOne(id);
    const result = await this.organizationService.remove(id, req.user.id);

    await this.logService.logAudit({
      userId: req.user.id,
      action: AuditAction.DELETE,
      resource: 'Organization',
      resourceId: id,
      description: `删除组织: ${org.name}`,
      changes: {
        deletedOrganization: { name: org.name, slug: org.slug },
      },
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      userAgent: expressReq.headers['user-agent'],
    });

    return result;
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req,
    @Req() expressReq: ExpressRequest
  ) {
    const org = await this.organizationService.findOne(id);
    const result = await this.organizationService.addMember(id, addMemberDto, req.user.id);

    await this.logService.logAudit({
      userId: req.user.id,
      action: AuditAction.UPDATE,
      resource: 'Organization',
      resourceId: id,
      description: `添加成员到组织: ${org.name}`,
      changes: {
        action: 'addMember',
        userId: addMemberDto.userId,
        isAdmin: addMemberDto.isAdmin,
      },
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      userAgent: expressReq.headers['user-agent'],
    });

    return result;
  }

  @Put(':id/members/:memberId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
    @Request() req,
    @Req() expressReq: ExpressRequest
  ) {
    const org = await this.organizationService.findOne(id);
    const result = await this.organizationService.updateMemberRole(
      id,
      memberId,
      updateDto,
      req.user.id
    );

    await this.logService.logAudit({
      userId: req.user.id,
      action: AuditAction.UPDATE,
      resource: 'Organization',
      resourceId: id,
      description: `更新组织成员角色: ${org.name}`,
      changes: {
        action: 'updateMemberRole',
        memberId,
        newRole: updateDto.role,
      },
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      userAgent: expressReq.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
    @Req() expressReq: ExpressRequest
  ) {
    const org = await this.organizationService.findOne(id);
    const result = await this.organizationService.removeMember(id, memberId, req.user.id);

    await this.logService.logAudit({
      userId: req.user.id,
      action: AuditAction.UPDATE,
      resource: 'Organization',
      resourceId: id,
      description: `从组织移除成员: ${org.name}`,
      changes: {
        action: 'removeMember',
        memberId,
      },
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      userAgent: expressReq.headers['user-agent'],
    });

    return result;
  }
}
