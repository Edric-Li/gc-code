import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, QueryUsersDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('statistics')
  getStatistics() {
    return this.userService.getStatistics();
  }

  @Get('simple-list')
  getSimpleList(@Query('search') search?: string) {
    return this.userService.getSimpleList(search);
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
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
