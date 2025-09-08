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

  const mockRequest = {
    headers: {
      authorization: 'Bearer valid-token',
    },
    path: '/api/v1/admin/dashboard',
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
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

      // Verify guard side-effect: admin should be attached to request
      const request = mockExecutionContext.switchToHttp().getRequest();
      expect(request.admin).toBeDefined();
      expect(request.admin).toEqual({
        ...mockDbUser,
        supabaseUser: {
          ...mockUser,
          access_token: 'valid-token',
        },
      });
    });

    it('should attach admin user to request object', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockDbUser);

      await guard.canActivate(mockExecutionContext);

      // Verify that the guard attached the admin user to the request
      expect(mockRequest.admin).toBeDefined();
      expect(mockRequest.admin).toEqual({
        ...mockDbUser,
        supabaseUser: {
          ...mockUser,
          access_token: 'valid-token',
        },
      });
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const requestWithoutToken = {
        headers: {},
        path: '/api/v1/admin/dashboard',
      };

      const contextWithoutToken = {
        switchToHttp: () => ({
          getRequest: () => requestWithoutToken,
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

    it('should throw UnauthorizedException when DB user is missing', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
