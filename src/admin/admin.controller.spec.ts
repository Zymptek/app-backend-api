import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, UserStatus } from '@prisma/client';
import type { AdminUser } from '../admin-auth/decorators/current-admin.decorator';

describe('AdminController', () => {
  let controller: AdminController;
  let prismaService: PrismaService;

  const mockAdmin = {
    id: 'admin-id',
    email: 'admin@zymptek.com',
    firstName: 'Admin',
    lastName: 'User',
    companyName: 'Zymptek Inc',
    userType: UserType.admin,
    status: UserStatus.active,
    emailVerified: true,
    profileComplete: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    adminProfile: {
      fullName: 'Admin User',
      permissions: ['read', 'write'],
      isActive: true,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      const mockCounts = {
        totalUsers: 100,
        totalSellers: 50,
        totalBuyers: 45,
        activeUsers: 80,
        pendingUsers: 20,
      };

      const countSpy = jest
        .fn()
        .mockResolvedValueOnce(mockCounts.totalUsers)
        .mockResolvedValueOnce(mockCounts.totalSellers)
        .mockResolvedValueOnce(mockCounts.totalBuyers)
        .mockResolvedValueOnce(mockCounts.activeUsers)
        .mockResolvedValueOnce(mockCounts.pendingUsers);
      prismaService.user.count = countSpy;

      const result = await controller.getDashboard(mockAdmin as AdminUser);

      expect(result).toEqual({
        message: 'Dashboard data retrieved successfully',
        data: {
          totalUsers: mockCounts.totalUsers,
          totalSellers: mockCounts.totalSellers,
          totalBuyers: mockCounts.totalBuyers,
          activeUsers: mockCounts.activeUsers,
          pendingUsers: mockCounts.pendingUsers,
          admin: {
            id: mockAdmin.id,
            email: mockAdmin.email,
            firstName: mockAdmin.firstName,
            lastName: mockAdmin.lastName,
          },
        },
      });

      expect(countSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('getAdminProfile', () => {
    it('should return admin profile', () => {
      const result = controller.getAdminProfile(mockAdmin as AdminUser);

      expect(result).toEqual({
        message: 'Admin profile retrieved successfully',
        data: {
          id: mockAdmin.id,
          email: mockAdmin.email,
          firstName: mockAdmin.firstName,
          lastName: mockAdmin.lastName,
          companyName: mockAdmin.companyName,
          userType: mockAdmin.userType,
          status: mockAdmin.status,
          emailVerified: mockAdmin.emailVerified,
          profileComplete: mockAdmin.profileComplete,
          lastLogin: mockAdmin.lastLogin,
          createdAt: mockAdmin.createdAt,
          updatedAt: mockAdmin.updatedAt,
          adminProfile: mockAdmin.adminProfile,
        },
      });
    });
  });
});
