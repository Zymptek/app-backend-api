import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, SuspendUserDto } from './dto';
import { UserType, UserStatus } from '@prisma/client';
import { SupabaseAuthGuard } from '../admin-auth/guards/supabase-auth.guard';
import { AdminRoleGuard } from '../admin-auth/guards/admin-role.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
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

  const mockUserListResponse = {
    users: [mockUser],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            suspend: jest.fn(),
            unsuspend: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminRoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of users', async () => {
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(mockUserListResponse);

      const result = await controller.findAll();

      expect(result).toEqual(mockUserListResponse);
      expect(findAllSpy).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass query parameters to service', async () => {
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(mockUserListResponse);

      await controller.findAll(
        2,
        20,
        UserType.seller,
        UserStatus.active,
        'search',
      );

      expect(findAllSpy).toHaveBeenCalledWith(
        2,
        20,
        UserType.seller,
        UserStatus.active,
        'search',
      );
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockUser);

      const result = await controller.findOne(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toEqual(mockUser);
      expect(findOneSpy).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        userType: UserType.buyer,
        firstName: 'Jane',
        lastName: 'Smith',
        companyName: 'New Corp',
      };

      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(createSpy).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        companyName: 'Updated Corp',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockResolvedValue(updatedUser);

      const result = await controller.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateUserDto,
      );

      expect(result).toEqual(updatedUser);
      expect(updateSpy).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updateUserDto,
      );
    });
  });

  describe('suspend', () => {
    it('should suspend user', async () => {
      const suspendUserDto: SuspendUserDto = {
        reason: 'Violation of terms',
      };

      const suspendedUser = { ...mockUser, status: UserStatus.suspended };
      const suspendSpy = jest
        .spyOn(service, 'suspend')
        .mockResolvedValue(suspendedUser);

      const result = await controller.suspend(
        '123e4567-e89b-12d3-a456-426614174000',
        suspendUserDto,
      );

      expect(result).toEqual(suspendedUser);
      expect(suspendSpy).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        suspendUserDto,
      );
    });
  });

  describe('unsuspend', () => {
    it('should unsuspend user', async () => {
      const unsuspendedUser = { ...mockUser, status: UserStatus.active };
      const unsuspendSpy = jest
        .spyOn(service, 'unsuspend')
        .mockResolvedValue(unsuspendedUser);

      const result = await controller.unsuspend(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toEqual(unsuspendedUser);
      expect(unsuspendSpy).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue({
        message: 'User deleted successfully',
      });

      const result = await controller.delete(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(deleteSpy).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });
});
