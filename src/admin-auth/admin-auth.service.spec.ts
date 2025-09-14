import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, UserStatus } from '@prisma/client';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let prismaService: PrismaService;

  const mockSupabaseClient = {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
    },
  };

  const mockSupabaseAdminClient = {
    auth: {
      getUser: jest.fn(),
      admin: {
        signOut: jest.fn(),
        revokeRefreshTokensForUser: jest.fn(),
      },
    },
  };

  const mockUser = {
    id: 'supabase-user-id',
    email: 'admin@zymptek.com',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  const mockSession = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
  };

  const mockDbUser = {
    id: 'db-user-id',
    supabaseId: 'supabase-user-id',
    email: 'admin@zymptek.com',
    firstName: 'Admin',
    lastName: 'User',
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
      providers: [
        AdminAuthService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
            getServiceRoleClient: jest
              .fn()
              .mockReturnValue(mockSupabaseAdminClient),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            createServiceRoleClient: jest.fn().mockReturnValue({
              $connect: jest.fn(),
              $disconnect: jest.fn(),
              user: {
                findFirst: jest.fn(),
                update: jest.fn(),
              },
            }),
            withServiceRoleClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have signIn method', () => {
    expect(typeof service.signIn).toBe('function');
  });

  it('should have signOut method', () => {
    expect(typeof service.signOut).toBe('function');
  });

  it('should have refreshSession method', () => {
    expect(typeof service.refreshSession).toBe('function');
  });

  it('should have verifyAdminToken method', () => {
    expect(typeof service.verifyAdminToken).toBe('function');
  });

  describe('signIn', () => {
    it('should successfully sign in admin user', async () => {
      const signInDto = {
        email: 'admin@zymptek.com',
        password: 'password123',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockDbUser),
          update: jest.fn().mockResolvedValue(mockDbUser),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.signIn(signInDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        admin: expect.objectContaining({
          id: 'db-user-id',
          email: 'admin@zymptek.com',
          userType: UserType.admin,
        }),
      });

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@zymptek.com',
        password: 'password123',
      });

      expect(mockServiceRoleClient.user.findFirst).toHaveBeenCalledWith({
        where: { supabaseId: mockUser.id },
        include: { adminProfile: true },
      });
      expect(mockServiceRoleClient.user.update).toHaveBeenCalledWith({
        where: { id: mockDbUser.id },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const signInDto = {
        email: 'admin@zymptek.com',
        password: 'wrongpassword',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(service.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user with valid user ID and token', async () => {
      const userId = 'user-123';
      const accessToken = 'valid-access-token';

      mockSupabaseAdminClient.auth.admin.signOut.mockResolvedValue({
        error: null,
      });

      const result = await service.signOut(userId, accessToken);

      expect(result).toEqual({ message: 'Signed out successfully' });
      expect(mockSupabaseAdminClient.auth.admin.signOut).toHaveBeenCalledWith(
        accessToken,
        'global',
      );
    });

    it('should throw UnauthorizedException when signout fails', async () => {
      const userId = 'user-123';
      const accessToken = 'invalid-access-token';

      mockSupabaseAdminClient.auth.admin.signOut.mockResolvedValue({
        error: { message: 'Signout failed' },
      });

      await expect(service.signOut(userId, accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockSupabaseAdminClient.auth.admin.signOut).toHaveBeenCalledWith(
        accessToken,
        'global',
      );
    });
  });

  describe('getCurrentAdmin', () => {
    it('should successfully get current admin with active status', async () => {
      const userId = 'supabase-user-id';

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockDbUser),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.getCurrentAdmin(userId);

      expect(result).toEqual({
        id: 'db-user-id',
        email: 'admin@zymptek.com',
        firstName: 'Admin',
        lastName: 'User',
        companyName: '',
        userType: UserType.admin,
      });

      expect(mockServiceRoleClient.user.findFirst).toHaveBeenCalledWith({
        where: {
          supabaseId: userId,
          userType: UserType.admin,
          status: UserStatus.active,
        },
        include: { adminProfile: true },
      });
    });

    it('should throw UnauthorizedException for suspended admin', async () => {
      const userId = 'supabase-user-id';

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null), // No user found due to status filter
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.getCurrentAdmin(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshSession', () => {
    it('should successfully refresh session for active admin', async () => {
      const refreshToken = 'valid-refresh-token';

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockDbUser),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.refreshSession(refreshToken);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        admin: expect.objectContaining({
          id: 'db-user-id',
          email: 'admin@zymptek.com',
          userType: UserType.admin,
        }),
      });

      expect(mockServiceRoleClient.user.findFirst).toHaveBeenCalledWith({
        where: {
          supabaseId: mockUser.id,
          userType: UserType.admin,
          status: UserStatus.active,
        },
        include: { adminProfile: true },
      });
    });

    it('should throw UnauthorizedException for suspended admin during refresh', async () => {
      const refreshToken = 'valid-refresh-token';

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null), // No user found due to status filter
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.refreshSession(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyAdminToken', () => {
    it('should successfully verify token for active admin', async () => {
      const accessToken = 'valid-access-token';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockDbUser),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.verifyAdminToken(accessToken);

      expect(result).toEqual({
        ...mockDbUser,
        supabaseUser: mockUser,
      });

      expect(mockServiceRoleClient.user.findFirst).toHaveBeenCalledWith({
        where: {
          supabaseId: mockUser.id,
          userType: UserType.admin,
          status: UserStatus.active,
        },
        include: { adminProfile: true },
      });
    });

    it('should throw UnauthorizedException for suspended admin during token verification', async () => {
      const accessToken = 'valid-access-token';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null), // No user found due to status filter
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.verifyAdminToken(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
