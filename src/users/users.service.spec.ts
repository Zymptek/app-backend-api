import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserType, UserStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockSupabaseClient = {
    auth: {
      admin: {
        createUser: jest.fn(),
        updateUserById: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  };

  const mockUser = {
    id: 'supabase-user-id',
    email: 'user@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  const mockDbUser = {
    id: 'db-user-id',
    supabaseId: 'supabase-user-id',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    userType: UserType.buyer,
    status: UserStatus.active,
    emailVerified: true,
    profileComplete: false,
    companyName: 'Tech Corp',
    phone: '+1234567890',
    country: 'United States',
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: SupabaseService,
          useValue: {
            getServiceRoleClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            withServiceRoleClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of users', async () => {
      const mockServiceRoleClient = {
        user: {
          findMany: jest.fn().mockResolvedValue([mockDbUser]),
          count: jest.fn().mockResolvedValue(1),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        users: [
          expect.objectContaining({
            id: 'db-user-id',
            email: 'user@example.com',
            userType: UserType.buyer,
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockServiceRoleClient.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should filter users by userType', async () => {
      const mockServiceRoleClient = {
        user: {
          findMany: jest.fn().mockResolvedValue([mockDbUser]),
          count: jest.fn().mockResolvedValue(1),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await service.findAll(1, 10, UserType.buyer);

      expect(mockServiceRoleClient.user.findMany).toHaveBeenCalledWith({
        where: { userType: UserType.buyer },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should filter users by status', async () => {
      const mockServiceRoleClient = {
        user: {
          findMany: jest.fn().mockResolvedValue([mockDbUser]),
          count: jest.fn().mockResolvedValue(1),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await service.findAll(1, 10, undefined, UserStatus.active);

      expect(mockServiceRoleClient.user.findMany).toHaveBeenCalledWith({
        where: { status: UserStatus.active },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should search users by email, name, or company', async () => {
      const mockServiceRoleClient = {
        user: {
          findMany: jest.fn().mockResolvedValue([mockDbUser]),
          count: jest.fn().mockResolvedValue(1),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await service.findAll(1, 10, undefined, undefined, 'john');

      expect(mockServiceRoleClient.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: { contains: 'john', mode: 'insensitive' } },
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { companyName: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockDbUser),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.findOne('db-user-id');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'db-user-id',
          email: 'user@example.com',
          userType: UserType.buyer,
        }),
      );

      expect(mockServiceRoleClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'db-user-id' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      userType: UserType.buyer,
      firstName: 'Jane',
      lastName: 'Smith',
      companyName: 'New Corp',
    };

    it('should create new user successfully', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null), // No existing user
          create: jest.fn().mockResolvedValue(mockDbUser),
        },
        adminProfile: {
          create: jest.fn().mockResolvedValue({}),
        },
        sellerProfile: {
          create: jest.fn().mockResolvedValue({}),
        },
        buyerProfile: {
          create: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn().mockImplementation(async (fn) => {
          return await fn(mockServiceRoleClient);
        }),
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.create(createUserDto);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'db-user-id',
          email: 'user@example.com',
          userType: UserType.buyer,
        }),
      );

      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        email_confirm: true,
      });

      expect(mockServiceRoleClient.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          supabaseId: 'supabase-user-id',
          email: 'newuser@example.com',
          userType: UserType.buyer,
          status: UserStatus.active,
          emailVerified: true,
          profileComplete: false,
          firstName: 'Jane',
          lastName: 'Smith',
          companyName: 'New Corp',
        }),
        select: expect.any(Object),
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockDbUser), // Existing user
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw error when Supabase user creation fails', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Supabase error' },
      });

      const mockServiceRoleClient = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Failed to create user in authentication system',
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      companyName: 'Updated Corp',
    };

    it('should update user successfully', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockDbUser),
          update: jest.fn().mockResolvedValue({
            ...mockDbUser,
            ...updateUserDto,
          }),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.update('db-user-id', updateUserDto);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'db-user-id',
          firstName: 'Updated',
          lastName: 'Name',
          companyName: 'Updated Corp',
        }),
      );

      expect(mockServiceRoleClient.user.update).toHaveBeenCalledWith({
        where: { id: 'db-user-id' },
        data: updateUserDto,
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(
        service.update('non-existent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const updateWithEmail: UpdateUserDto = {
        email: 'existing@example.com',
      };

      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockDbUser), // First call for existing user check
          findFirst: jest.fn().mockResolvedValue(mockDbUser), // Second call for email conflict check
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(
        service.update('db-user-id', updateWithEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('suspend', () => {
    it('should suspend user successfully', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockDbUser),
          update: jest.fn().mockResolvedValue({
            ...mockDbUser,
            status: UserStatus.suspended,
          }),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.suspend('db-user-id', {
        reason: 'Violation of terms',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'db-user-id',
          status: UserStatus.suspended,
        }),
      );

      expect(mockServiceRoleClient.user.update).toHaveBeenCalledWith({
        where: { id: 'db-user-id' },
        data: {
          status: UserStatus.suspended,
          verificationData: expect.any(Object),
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.suspend('non-existent-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unsuspend', () => {
    it('should unsuspend user successfully', async () => {
      const suspendedUser = { ...mockDbUser, status: UserStatus.suspended };

      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(suspendedUser),
          update: jest.fn().mockResolvedValue({
            ...suspendedUser,
            status: UserStatus.active,
          }),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      const result = await service.unsuspend('db-user-id');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'db-user-id',
          status: UserStatus.active,
        }),
      );

      expect(mockServiceRoleClient.user.update).toHaveBeenCalledWith({
        where: { id: 'db-user-id' },
        data: {
          status: UserStatus.active,
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.unsuspend('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockDbUser),
          delete: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn().mockImplementation(async (fn) => {
          return await fn(mockServiceRoleClient);
        }),
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: null,
      });

      const result = await service.delete('db-user-id');

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(mockServiceRoleClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'db-user-id' },
        select: { id: true, supabaseId: true, email: true },
      });
      expect(mockServiceRoleClient.user.delete).toHaveBeenCalledWith({
        where: { id: 'db-user-id' },
      });
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        'supabase-user-id',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockServiceRoleClient = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (prismaService.withServiceRoleClient as jest.Mock).mockImplementation(
        async (fn) => {
          return await fn(mockServiceRoleClient);
        },
      );

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
