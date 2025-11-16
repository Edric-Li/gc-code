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
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // 只有系统管理员可以管理组织
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  create(@Body() createDto: CreateOrganizationDto, @Request() req) {
    return this.organizationService.create(createDto, req.user.id);
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
  update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationDto, @Request() req) {
    return this.organizationService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.organizationService.remove(id, req.user.id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.organizationService.addMember(id, addMemberDto, req.user.id);
  }

  @Put(':id/members/:memberId')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
    @Request() req
  ) {
    return this.organizationService.updateMemberRole(id, memberId, updateDto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.organizationService.removeMember(id, memberId, req.user.id);
  }
}
