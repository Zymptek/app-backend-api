import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { AdminUser } from '../admin-auth/decorators/current-admin.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, UserStatus } from '@prisma/client';
import { SupabaseAuthGuard } from '../admin-auth/guards/supabase-auth.guard';
import { AdminRoleGuard } from '../admin-auth/guards/admin-role.guard';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get admin dashboard data',
    description: 'Get overview statistics and data for admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin role required',
  })
  async getDashboard(@CurrentAdmin() admin: AdminUser) {
    // Get basic statistics
    const totalUsers = await this.prismaService.user.count();
    const totalSellers = await this.prismaService.user.count({
      where: { userType: UserType.seller },
    });
    const totalBuyers = await this.prismaService.user.count({
      where: { userType: UserType.buyer },
    });
    const activeUsers = await this.prismaService.user.count({
      where: { status: UserStatus.active },
    });
    const pendingUsers = await this.prismaService.user.count({
      where: { status: UserStatus.pending_verification },
    });

    return {
      message: 'Dashboard data retrieved successfully',
      data: {
        totalUsers,
        totalSellers,
        totalBuyers,
        activeUsers,
        pendingUsers,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
      },
    };
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Get the profile information of the current admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin profile retrieved successfully',
  })
  getAdminProfile(@CurrentAdmin() admin: AdminUser) {
    return {
      message: 'Admin profile retrieved successfully',
      data: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        companyName: admin.companyName,
        userType: admin.userType,
        status: admin.status,
        emailVerified: admin.emailVerified,
        profileComplete: admin.profileComplete,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        adminProfile: admin.adminProfile,
      },
    };
  }
}
