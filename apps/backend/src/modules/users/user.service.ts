import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
        { displayName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async getSimpleList(search?: string) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      take: 100,
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        oauthAccounts: {
          select: {
            provider: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    // 检查邮箱是否已被使用
    const emailExists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    // 如果提供了用户名，检查是否已被使用
    if (createUserDto.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: createUserDto.username },
      });

      if (usernameExists) {
        throw new ConflictException('Username already exists');
      }
    }

    // 如果没有提供用户名，使用邮箱前缀作为默认用户名
    let username = createUserDto.username;
    if (!username) {
      // 清理邮箱前缀，只保留字母、数字和下划线，并限制长度
      const baseUsername = createUserDto.email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .substring(0, 90); // 限制长度，留空间给后缀

      username = baseUsername;

      // 循环直到找到唯一的用户名
      let attempt = 0;
      let existingUser = await this.prisma.user.findUnique({
        where: { username },
      });

      while (existingUser) {
        // 添加随机后缀确保唯一性
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        username = `${baseUsername}_${randomSuffix}`;

        // 再次检查唯一性
        existingUser = await this.prisma.user.findUnique({
          where: { username },
        });

        attempt++;
        if (attempt > 10) {
          // 防止无限循环，使用时间戳作为后备方案
          username = `${baseUsername}_${Date.now()}`;
          break;
        }
      }
    }

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username,
        displayName: createUserDto.displayName || null,
        avatarUrl: createUserDto.avatarUrl || null,
        role: createUserDto.role || Role.USER,
        isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
        passwordHash: null, // 预创建的用户没有密码，需要通过 OAuth 登录
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // 如果要更新用户名，检查是否已被使用
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });

      if (usernameExists) {
        throw new ConflictException('Username already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async getStatistics() {
    const [totalUsers, activeUsers, adminUsers, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      recentUsers,
    };
  }
}
