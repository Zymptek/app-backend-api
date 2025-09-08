import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseService } from '../../supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserType, UserStatus } from '@prisma/client';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let prismaService: PrismaService;

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockUser = {
    id: 'supabase-user-id',
    email: 'admin@zymptek.com',
  };

  const mockDbUser = {
    id: 'db-user-id',
    supabaseId: 'supabase-user-id',
    email: 'admin@zymptek.com',
    userType: UserType.admin,
    status: UserStatus.active,
    emailVerified: true,
    adminProfile: { fullName: 'Admin User' },
    sellerProfile: null,
    buyerProfile: null,
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer valid-token',
        },
        path: '/api/v1/admin/dashboard',
      }),
    }),
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid admin user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockDbUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(
        'valid-token',
      );
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const contextWithoutToken = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            path: '/api/v1/admin/dashboard',
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
