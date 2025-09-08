import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminSignInDto } from './dto/admin-signin.dto';
import { AdminAuthResponseDto } from './dto/admin-response.dto';
import { UserType, UserStatus } from '@prisma/client';

describe('AdminAuthController', () => {
  let controller: AdminAuthController;
  let authService: AdminAuthService;

  const mockAuthResponse: AdminAuthResponseDto = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
    admin: {
      id: 'admin-id',
      supabaseId: 'supabase-user-id',
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
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AdminAuthService,
          useValue: {
            signIn: jest.fn(),
            signOut: jest.fn(),
            refreshSession: jest.fn(),
            getCurrentAdmin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminAuthController>(AdminAuthController);
    authService = module.get<AdminAuthService>(AdminAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should successfully sign in admin user', async () => {
      const signInDto: AdminSignInDto = {
        email: 'admin@zymptek.com',
        password: 'password123',
      };

      const signInSpy = jest.fn().mockResolvedValue(mockAuthResponse);
      authService.signIn = signInSpy;

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(mockAuthResponse);
      expect(signInSpy).toHaveBeenCalledWith(signInDto);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out admin user', async () => {
      const signOutSpy = jest
        .fn()
        .mockResolvedValue({ message: 'Signed out successfully' });
      authService.signOut = signOutSpy;

      const result = await controller.signOut();

      expect(result).toEqual({ message: 'Signed out successfully' });
      expect(signOutSpy).toHaveBeenCalledWith();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const refreshToken = 'refresh-token';

      const refreshSpy = jest.fn().mockResolvedValue(mockAuthResponse);
      authService.refreshSession = refreshSpy;

      const result = await controller.refreshToken(refreshToken);

      expect(result).toEqual(mockAuthResponse);
      expect(refreshSpy).toHaveBeenCalledWith(refreshToken);
    });
  });
});
