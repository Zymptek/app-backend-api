import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserListResponseDto,
} from './dto';
import { UserType, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    userType?: UserType,
    status?: UserStatus,
    search?: string,
  ): Promise<UserListResponseDto> {
    try {
      // Normalize and validate pagination inputs
      const normalizedPage = Math.max(1, Math.floor(page) || 1);
      const normalizedLimit = Math.min(
        Math.max(1, Math.floor(limit) || 10),
        100,
      );
      const skip = (normalizedPage - 1) * normalizedLimit;

      // Build where clause with proper type safety
      const where: {
        userType?: UserType;
        status?: UserStatus;
        OR?: Array<{
          email?: { contains: string; mode: 'insensitive' };
          firstName?: { contains: string; mode: 'insensitive' };
          lastName?: { contains: string; mode: 'insensitive' };
          companyName?: { contains: string; mode: 'insensitive' };
        }>;
      } = {};

      if (userType) {
        where.userType = userType;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        // Properly escape search term: first escape backslashes, then escape % and _
        const escapedSearch = search
          .trim()
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/[%_]/g, '\\$&'); // Then escape % and _
        where.OR = [
          { email: { contains: escapedSearch, mode: 'insensitive' } },
          { firstName: { contains: escapedSearch, mode: 'insensitive' } },
          { lastName: { contains: escapedSearch, mode: 'insensitive' } },
          { companyName: { contains: escapedSearch, mode: 'insensitive' } },
        ];
      }

      // Use parallel queries for better performance
      const result = await this.prismaService.withServiceRoleClient(
        async (client) => {
          const [users, total] = await Promise.all([
            client.user.findMany({
              where,
              skip,
              take: normalizedLimit, // Use the normalized limit
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                supabaseId: true,
                email: true,
                userType: true,
                status: true,
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true,
                country: true,
                emailVerified: true,
                profileComplete: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            client.user.count({ where }),
          ]);

          return { users, total };
        },
      );

      const totalPages = Math.ceil(result.total / normalizedLimit);

      return {
        users: result.users.map((user) => this.mapUserToResponse(user)),
        total: result.total,
        page: normalizedPage,
        limit: normalizedLimit, // Return the actual limit used
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.prismaService.withServiceRoleClient(
        async (client) => {
          const user = await client.user.findUnique({
            where: { id },
            select: {
              id: true,
              supabaseId: true,
              email: true,
              userType: true,
              status: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              country: true,
              emailVerified: true,
              profileComplete: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
          }

          return user;
        },
      );

      return this.mapUserToResponse(user);
    } catch (error) {
      this.logger.error(
        `Error fetching user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    let supabaseUserId: string | null = null;

    try {
      const { email, password, userType, ...userData } = createUserDto;

      // Check if user already exists
      const existingUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.findFirst({
            where: { email },
          });
        },
      );

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Create user in Supabase Auth
      const supabaseAdmin = this.supabaseService.getServiceRoleClient();
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email for admin-created users
        });

      if (authError || !authData.user) {
        this.logger.error(
          `Supabase user creation failed: ${authError?.message}`,
        );
        throw new Error('Failed to create user in authentication system');
      }

      // Store Supabase user ID for potential rollback
      supabaseUserId = authData.user.id;

      // Create user in database with appropriate profile in a single transaction
      const user = await this.prismaService.withServiceRoleClient(
        async (client) => {
          // Create the main user record
          const newUser = await client.user.create({
            data: {
              supabaseId: authData.user.id,
              email,
              userType,
              status: UserStatus.active, // Admin-created users are active by default
              emailVerified: true, // Admin-created users are email verified
              profileComplete: false,
              ...userData,
            },
            select: {
              id: true,
              supabaseId: true,
              email: true,
              userType: true,
              status: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              country: true,
              emailVerified: true,
              profileComplete: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          // Create appropriate profile based on user type
          if (userType === UserType.admin) {
            await client.adminProfile.create({
              data: {
                userId: newUser.id,
                fullName:
                  userData.firstName && userData.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : null,
                permissions: ['read', 'write'], // Default admin permissions
                isActive: true,
              },
            });
          } else if (userType === UserType.seller) {
            await client.sellerProfile.create({
              data: {
                userId: newUser.id,
                verified: false, // New sellers need verification
                businessInfo: userData.companyName
                  ? {
                      companyName: userData.companyName,
                      country: userData.country || null,
                    }
                  : undefined,
              },
            });
          } else if (userType === UserType.buyer) {
            await client.buyerProfile.create({
              data: {
                userId: newUser.id,
                verified: false, // New buyers need verification
                procurementInfo: userData.companyName
                  ? {
                      companyName: userData.companyName,
                      country: userData.country || null,
                    }
                  : undefined,
              },
            });
          }

          return newUser;
        },
      );

      this.logger.log(
        `User created successfully: ${user.id} with ${userType} profile`,
      );

      return this.mapUserToResponse(user);
    } catch (error) {
      // Compensating rollback: Delete Supabase user if DB transaction failed
      if (supabaseUserId) {
        try {
          const supabaseAdmin = this.supabaseService.getServiceRoleClient();
          const { error: deleteError } =
            await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);

          if (deleteError) {
            this.logger.error(
              `Failed to rollback Supabase user: ${deleteError.message}`,
            );
            // Log the orphaned user for manual cleanup
            this.logger.error(
              'ORPHANED SUPABASE USER - Manual cleanup required',
            );
          } else {
            this.logger.log('Successfully rolled back Supabase user');
          }
        } catch (rollbackError) {
          this.logger.error(
            `Exception during Supabase user rollback: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`,
          );
          // Log the orphaned user for manual cleanup
          this.logger.error('ORPHANED SUPABASE USER - Manual cleanup required');
        }
      }

      this.logger.error(
        `Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    let emailUpdatedInSupabase = false;
    let originalEmail: string | null = null;
    let existingUser: {
      id: string;
      supabaseId: string;
      email: string;
      userType: UserType;
      status: UserStatus;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      phone: string | null;
      country: string | null;
      emailVerified: boolean;
      profileComplete: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
    } | null = null;

    try {
      const { email, userType, ...updateData } = updateUserDto;

      // Check if user exists
      existingUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.findUnique({
            where: { id },
          });
        },
      );

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Prevent userType changes to avoid orphaned profile records
      if (userType && userType !== existingUser.userType) {
        throw new BadRequestException(
          'User type cannot be changed via this endpoint. User type changes require a separate migration process to handle related profile records safely.',
        );
      }

      // If email is being updated, check for conflicts
      if (email && existingUser && email !== existingUser.email) {
        const emailConflict = await this.prismaService.withServiceRoleClient(
          async (client) => {
            return client.user.findFirst({
              where: { email },
            });
          },
        );

        if (emailConflict) {
          throw new ConflictException('User with this email already exists');
        }

        // Store original email for potential rollback
        originalEmail = existingUser.email;

        // Update email in Supabase Auth FIRST (before database update)
        const supabaseAdmin = this.supabaseService.getServiceRoleClient();
        const { error: supabaseUpdateError } =
          await supabaseAdmin.auth.admin.updateUserById(
            existingUser.supabaseId,
            { email },
          );

        if (supabaseUpdateError) {
          this.logger.error(
            `Failed to update email in Supabase: ${supabaseUpdateError.message}`,
          );
          throw new Error('Failed to update email in authentication system');
        }

        emailUpdatedInSupabase = true;
        this.logger.log('Email updated in Supabase successfully');
      }

      // Update user in database (include email if provided, exclude userType)
      const user = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.update({
            where: { id },
            data: {
              ...updateData,
              ...(email ? { email } : {}), // Include email if provided
              // userType is excluded to prevent orphaned profile records
            },
            select: {
              id: true,
              supabaseId: true,
              email: true,
              userType: true,
              status: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              country: true,
              emailVerified: true,
              profileComplete: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        },
      );

      this.logger.log('User updated successfully');

      return this.mapUserToResponse(user);
    } catch (error) {
      // Compensating rollback: Revert Supabase email if database update failed
      if (emailUpdatedInSupabase && originalEmail && existingUser) {
        try {
          const supabaseAdmin = this.supabaseService.getServiceRoleClient();
          const { error: rollbackError } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingUser.supabaseId,
              { email: originalEmail },
            );

          if (rollbackError) {
            this.logger.error(
              `Failed to rollback email in Supabase: ${rollbackError.message}`,
            );
            // Log the inconsistent state for manual cleanup
            this.logger.error(
              'EMAIL INCONSISTENCY: Supabase and Database have different email values - Manual cleanup required',
            );
          } else {
            this.logger.log('Successfully rolled back email in Supabase');
          }
        } catch (rollbackError) {
          this.logger.error(
            `Exception during email rollback: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`,
          );
          // Log the inconsistent state for manual cleanup
          this.logger.error(
            'EMAIL INCONSISTENCY: Supabase and Database have different email values - Manual cleanup required',
          );
        }
      }

      this.logger.error(
        `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async suspend(
    id: string,
    suspendUserDto: { reason?: string },
  ): Promise<UserResponseDto> {
    let supabaseUserDisabled = false;
    let existingUser: {
      id: string;
      supabaseId: string;
      email: string;
      userType: UserType;
      status: UserStatus;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      phone: string | null;
      country: string | null;
      emailVerified: boolean;
      profileComplete: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      verificationData: unknown;
    } | null = null;

    try {
      // Check if user exists
      existingUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.findUnique({
            where: { id },
          });
        },
      );

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Disable user in Supabase Auth FIRST
      const supabaseAdmin = this.supabaseService.getServiceRoleClient();
      const { error: supabaseDisableError } =
        await supabaseAdmin.auth.admin.updateUserById(existingUser.supabaseId, {
          ban_duration: 'none', // Permanent ban
        });

      if (supabaseDisableError) {
        this.logger.error(
          `Failed to disable user in Supabase: ${supabaseDisableError.message}`,
        );
        throw new Error('Failed to disable user in authentication system');
      }

      supabaseUserDisabled = true;
      this.logger.log('User disabled in Supabase successfully');

      // Update user status to suspended in database
      const user = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.update({
            where: { id },
            data: {
              status: UserStatus.suspended,
              verificationData: {
                ...((existingUser?.verificationData as Record<
                  string,
                  unknown
                >) || {}),
                preSuspensionStatus: existingUser?.status,
                ...(suspendUserDto.reason
                  ? { suspensionReason: suspendUserDto.reason }
                  : {}),
              },
            },
            select: {
              id: true,
              supabaseId: true,
              email: true,
              userType: true,
              status: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              country: true,
              emailVerified: true,
              profileComplete: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        },
      );

      this.logger.log('User suspended successfully');

      return this.mapUserToResponse(user);
    } catch (error) {
      // Compensating rollback: Re-enable Supabase user if DB update failed
      if (supabaseUserDisabled && existingUser) {
        try {
          const supabaseAdmin = this.supabaseService.getServiceRoleClient();
          const { error: rollbackError } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingUser.supabaseId,
              {
                ban_duration: 'none', // Remove ban
              },
            );

          if (rollbackError) {
            this.logger.error(
              `Failed to rollback user enable in Supabase: ${rollbackError.message}`,
            );
            // Log the inconsistent state for manual cleanup
            this.logger.error(
              'USER INCONSISTENCY: Supabase user disabled but database not suspended - Manual cleanup required',
            );
          } else {
            this.logger.log('Successfully rolled back user enable in Supabase');
          }
        } catch (rollbackError) {
          this.logger.error(
            `Exception during user enable rollback: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`,
          );
          // Log the inconsistent state for manual cleanup
          this.logger.error(
            'USER INCONSISTENCY: Supabase user disabled but database not suspended - Manual cleanup required',
          );
        }
      }

      this.logger.error(
        `Error suspending user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async unsuspend(id: string): Promise<UserResponseDto> {
    let supabaseUserEnabled = false;
    let existingUser: {
      id: string;
      supabaseId: string;
      email: string;
      userType: UserType;
      status: UserStatus;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
      phone: string | null;
      country: string | null;
      emailVerified: boolean;
      profileComplete: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      verificationData: unknown;
    } | null = null;

    try {
      // Check if user exists
      existingUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.findUnique({
            where: { id },
          });
        },
      );

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Determine the status to restore (use preSuspensionStatus or fallback to active)
      const verificationData = existingUser.verificationData as Record<
        string,
        unknown
      > | null;
      const preSuspensionStatus =
        verificationData?.preSuspensionStatus as UserStatus;
      const statusToRestore = preSuspensionStatus || UserStatus.active;

      // Enable user in Supabase Auth FIRST
      const supabaseAdmin = this.supabaseService.getServiceRoleClient();
      const { error: supabaseEnableError } =
        await supabaseAdmin.auth.admin.updateUserById(existingUser.supabaseId, {
          ban_duration: 'none', // Remove ban to enable user
        });

      if (supabaseEnableError) {
        this.logger.error(
          `Failed to enable user in Supabase: ${supabaseEnableError.message}`,
        );
        throw new Error('Failed to enable user in authentication system');
      }

      supabaseUserEnabled = true;
      this.logger.log('User enabled in Supabase successfully');

      // Update user status and clear suspension data in database
      const user = await this.prismaService.withServiceRoleClient(
        async (client) => {
          // Prepare updated verificationData by removing suspension-related fields
          const updatedVerificationData = verificationData
            ? { ...verificationData }
            : {};
          delete updatedVerificationData.suspensionReason;
          delete updatedVerificationData.preSuspensionStatus;

          return client.user.update({
            where: { id },
            data: {
              status: statusToRestore,
              verificationData:
                Object.keys(updatedVerificationData).length > 0
                  ? (updatedVerificationData as Record<string, unknown>)
                  : undefined,
            },
            select: {
              id: true,
              supabaseId: true,
              email: true,
              userType: true,
              status: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              country: true,
              emailVerified: true,
              profileComplete: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        },
      );

      this.logger.log(
        `User unsuspended successfully and restored to ${statusToRestore} status`,
      );

      return this.mapUserToResponse(user);
    } catch (error) {
      // Compensating rollback: Re-disable Supabase user if DB update failed
      if (supabaseUserEnabled && existingUser) {
        try {
          const supabaseAdmin = this.supabaseService.getServiceRoleClient();
          const { error: rollbackError } =
            await supabaseAdmin.auth.admin.updateUserById(
              existingUser.supabaseId,
              {
                ban_duration: 'none', // Re-ban the user
              },
            );

          if (rollbackError) {
            this.logger.error(
              `Failed to rollback user disable in Supabase: ${rollbackError.message}`,
            );
            // Log the inconsistent state for manual cleanup
            this.logger.error(
              'USER INCONSISTENCY: Supabase user enabled but database not active - Manual cleanup required',
            );
          } else {
            this.logger.log(
              'Successfully rolled back user disable in Supabase',
            );
          }
        } catch (rollbackError) {
          this.logger.error(
            `Exception during user disable rollback: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`,
          );
          // Log the inconsistent state for manual cleanup
          this.logger.error(
            'USER INCONSISTENCY: Supabase user enabled but database not active - Manual cleanup required',
          );
        }
      }

      this.logger.error(
        `Error unsuspending user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      // Check if user exists
      const existingUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          return client.user.findUnique({
            where: { id },
            select: { id: true, supabaseId: true, email: true },
          });
        },
      );

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Delete user from database (cascade will handle related records)
      await this.prismaService.withServiceRoleClient(async (client) => {
        // Delete the user - this will cascade delete all related profiles
        await client.user.delete({
          where: { id },
        });
      });

      // Delete user from Supabase Auth
      const supabaseAdmin = this.supabaseService.getServiceRoleClient();
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        existingUser.supabaseId,
      );

      if (deleteError) {
        this.logger.warn(
          `Failed to delete user from Supabase: ${deleteError.message}`,
        );
        // Don't throw error here as the database deletion succeeded
      }

      this.logger.log('User deleted successfully');

      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  private mapUserToResponse(user: {
    id: string;
    supabaseId: string;
    email: string;
    userType: UserType;
    status: UserStatus;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    country: string | null;
    emailVerified: boolean;
    profileComplete: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      userType: user.userType,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      phone: user.phone,
      country: user.country,
      emailVerified: user.emailVerified,
      profileComplete: user.profileComplete,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Utility method to clean up orphaned Supabase users
   * This can be called manually or via a scheduled job
   */
  async cleanupOrphanedSupabaseUser(supabaseUserId: string): Promise<boolean> {
    try {
      const supabaseAdmin = this.supabaseService.getServiceRoleClient();
      const { error } =
        await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);

      if (error) {
        this.logger.error(
          `Failed to cleanup orphaned Supabase user: ${error.message}`,
        );
        return false;
      }

      this.logger.log('Successfully cleaned up orphaned Supabase user');
      return true;
    } catch (error) {
      this.logger.error(
        `Exception during orphaned user cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }
}
