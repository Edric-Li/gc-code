import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrganizationRole } from '@prisma/client';

@Injectable()
export class OrganizationService {
  private readonly MAX_DEPTH = 10; // 最大层级深度

  constructor(private readonly prisma: PrismaService) {}

  // 检查循环引用（递归检查所有祖先）
  private async checkCircularReference(organizationId: string, newParentId: string): Promise<void> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>([organizationId]);

    while (currentId) {
      if (visited.has(currentId)) {
        throw new ConflictException('Circular reference detected in organization hierarchy');
      }
      visited.add(currentId);

      const parent = await this.prisma.organization.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!parent) break;
      currentId = parent.parentId;
    }
  }

  // 计算组织层级深度
  private async getOrganizationDepth(organizationId: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = organizationId;

    while (currentId && depth < this.MAX_DEPTH + 1) {
      const org = await this.prisma.organization.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!org || !org.parentId) break;
      currentId = org.parentId;
      depth++;
    }

    return depth;
  }

  async create(createDto: CreateOrganizationDto, creatorId: string) {
    // 检查 slug 是否已存在
    const existing = await this.prisma.organization.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    // 如果指定了父组织，检查父组织是否存在并验证层级深度
    if (createDto.parentId) {
      const parent = await this.prisma.organization.findUnique({
        where: { id: createDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent organization not found');
      }

      // 检查父组织的深度，确保新组织不会超过最大深度
      const parentDepth = await this.getOrganizationDepth(createDto.parentId);
      if (parentDepth >= this.MAX_DEPTH) {
        throw new BadRequestException(
          `Organization hierarchy cannot exceed ${this.MAX_DEPTH} levels`
        );
      }
    }

    // 创建组织并将创建者设为 OWNER
    const organization = await this.prisma.organization.create({
      data: {
        ...createDto,
        members: {
          create: {
            userId: creatorId,
            role: OrganizationRole.OWNER,
          },
        },
      },
      include: {
        parent: true,
        children: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async findAll(userId?: string) {
    const where = userId
      ? {
          members: {
            some: {
              userId,
            },
          },
        }
      : {};

    return this.prisma.organization.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            isActive: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            members: true,
            children: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            isActive: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            members: true,
            children: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, updateDto: UpdateOrganizationDto, userId: string) {
    // 系统管理员权限已在控制器层检查，这里直接更新

    // 如果更新了父组织，检查父组织是否存在，并防止循环引用
    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === id) {
        throw new ConflictException('Organization cannot be its own parent');
      }

      if (updateDto.parentId) {
        const parent = await this.prisma.organization.findUnique({
          where: { id: updateDto.parentId },
        });

        if (!parent) {
          throw new NotFoundException('Parent organization not found');
        }

        // 检查循环引用（递归检查所有祖先）
        await this.checkCircularReference(id, updateDto.parentId);

        // 检查新父组织的深度
        const parentDepth = await this.getOrganizationDepth(updateDto.parentId);
        if (parentDepth >= this.MAX_DEPTH) {
          throw new BadRequestException(
            `Organization hierarchy cannot exceed ${this.MAX_DEPTH} levels`
          );
        }
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateDto,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            children: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // 系统管理员权限已在控制器层检查，这里直接删除

    // 检查是否有子组织
    const childrenCount = await this.prisma.organization.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${childrenCount} child organization(s). Please delete or move child organizations first.`
      );
    }

    await this.prisma.organization.delete({
      where: { id },
    });

    return { message: 'Organization deleted successfully' };
  }

  async addMember(organizationId: string, addMemberDto: AddMemberDto, requesterId: string) {
    // 系统管理员权限已在控制器层检查

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: addMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 检查用户是否已经是成员
    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member');
    }

    // 所有成员都作为普通成员添加，由系统管理员统一管理
    const role = OrganizationRole.MEMBER;

    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: addMemberDto.userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    updateDto: UpdateMemberRoleDto,
    requesterId: string
  ) {
    // 系统管理员权限已在控制器层检查
    const member = await this.prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: updateDto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async removeMember(organizationId: string, memberId: string, requesterId: string) {
    // 系统管理员权限已在控制器层检查
    const targetMember = await this.prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { organization: true },
    });

    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }

  async getTree() {
    // 获取所有组织
    const organizations = await this.prisma.organization.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        _count: {
          select: {
            members: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // O(n) 算法：使用 Map 构建树形结构
    const orgMap = new Map();
    const rootOrganizations = [];

    // 第一遍：将所有组织放入 Map，并初始化 children 数组
    for (const org of organizations) {
      orgMap.set(org.id, { ...org, children: [] });
    }

    // 第二遍：建立父子关系
    for (const org of organizations) {
      const orgWithChildren = orgMap.get(org.id);

      if (org.parentId) {
        // 有父组织，添加到父组织的 children 中
        const parent = orgMap.get(org.parentId);
        if (parent) {
          parent.children.push(orgWithChildren);
        } else {
          // 父组织不存在（数据不一致），作为根节点处理
          rootOrganizations.push(orgWithChildren);
        }
      } else {
        // 没有父组织，是根节点
        rootOrganizations.push(orgWithChildren);
      }
    }

    return rootOrganizations;
  }
}
