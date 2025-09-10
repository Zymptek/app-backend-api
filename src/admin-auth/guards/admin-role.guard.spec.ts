import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminRoleGuard } from './admin-role.guard';
import { UserType, UserStatus } from '@prisma/client';

describe('AdminRoleGuard', () => {
  let guard: AdminRoleGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRoleGuard],
    }).compile();

    guard = module.get<AdminRoleGuard>(AdminRoleGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid admin user', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            admin: {
              userType: UserType.admin,
              status: UserStatus.active,
              emailVerified: true,
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when no admin user found', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            admin: null,
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for non-admin user type', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            admin: {
              userType: UserType.buyer,
              status: UserStatus.active,
              emailVerified: true,
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });
});
