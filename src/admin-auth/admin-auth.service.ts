import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSignInDto } from './dto/admin-signin.dto';
import {
  AdminAuthResponseDto,
  AdminResponseDto,
} from './dto/admin-response.dto';
import { UserType, UserStatus } from '@prisma/client';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
  ) {}

  async signIn(signInDto: AdminSignInDto): Promise<AdminAuthResponseDto> {
    const { email, password } = signInDto;

    try {
      // Authenticate with Supabase
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        this.logger.warn(`Sign in failed for user, error: ${error?.message}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      const { user, session } = data;

      // Get user from database using service-role client to bypass RLS
      const dbUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          const dbUser = await client.user.findFirst({
            where: {
              supabaseId: user.id,
            },
            include: {
              adminProfile: true,
            },
          });

          if (!dbUser) {
            this.logger.warn(`User not found in database: ${user.id}`);
            throw new UnauthorizedException('User not found in database');
          }

          // Verify admin role
          if (dbUser.userType !== UserType.admin) {
            this.logger.warn(`Access denied for non-admin user`);
            throw new UnauthorizedException(
              'Access denied. Admin role required.',
            );
          }

          // Check if user is active
          if (dbUser.status !== UserStatus.active) {
            this.logger.warn(`Access denied for inactive user`);
            throw new UnauthorizedException(
              'Access denied. Account is not active.',
            );
          }

          // Update last login
          await client.user.update({
            where: { id: dbUser.id },
            data: { lastLogin: new Date() },
          });

          return dbUser;
        },
      );

      this.logger.log(`Admin signed in successfully`);

      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        tokenType: 'Bearer',
        admin: this.mapUserToAdminResponse(dbUser),
      };
    } catch (error) {
      this.logger.error(
        `Sign in error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Sign in failed');
    }
  }

  async signOut(
    userId: string,
    accessToken: string,
  ): Promise<{ message: string }> {
    try {
      // Use service-role client to revoke the user's session
      const supabaseAdmin = this.supabaseService.getServiceRoleClient();

      // Sign out the user using their access token
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
        accessToken,
        'global',
      );

      if (signOutError) {
        this.logger.warn(`Sign out revocation error: ${signOutError.message}`);
        throw new UnauthorizedException('Failed to revoke session');
      }

      this.logger.log(`Admin signed out successfully for user`);
      return { message: 'Signed out successfully' };
    } catch (error) {
      this.logger.error(
        `Sign out error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Sign out failed');
    }
  }

  async refreshSession(refreshToken: string): Promise<AdminAuthResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        this.logger.warn(`Refresh session failed: ${error?.message}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { user, session } = data;

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user from database using service-role client to bypass RLS
      const dbUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          const dbUser = await client.user.findFirst({
            where: {
              supabaseId: user.id,
            },
            include: {
              adminProfile: true,
            },
          });

          if (!dbUser || dbUser.userType !== UserType.admin) {
            throw new UnauthorizedException(
              'Invalid user or insufficient permissions',
            );
          }

          return dbUser;
        },
      );

      this.logger.log(`Session refreshed for admin`);

      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        tokenType: 'Bearer',
        admin: this.mapUserToAdminResponse(dbUser),
      };
    } catch (error) {
      this.logger.error(
        `Refresh session error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Session refresh failed');
    }
  }

  async verifyAdminToken(accessToken: string): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Get user from database using service-role client to bypass RLS
      const dbUser = await this.prismaService.withServiceRoleClient(
        async (client) => {
          const dbUser = await client.user.findFirst({
            where: {
              supabaseId: user.id,
            },
            include: {
              adminProfile: true,
            },
          });

          if (!dbUser || dbUser.userType !== UserType.admin) {
            throw new UnauthorizedException(
              'Invalid user or insufficient permissions',
            );
          }

          return dbUser;
        },
      );

      return {
        ...dbUser,
        supabaseUser: user,
      };
    } catch (error) {
      this.logger.error(
        `Verify admin token error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private mapUserToAdminResponse(user: {
    id: string;
    supabaseId: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    userType: UserType;
    status: UserStatus;
    emailVerified: boolean;
    profileComplete: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminResponseDto {
    return {
      id: user.id,
      supabaseId: user.supabaseId || '',
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      userType: user.userType,
      status: user.status,
      emailVerified: user.emailVerified,
      profileComplete: user.profileComplete,
      lastLogin: user.lastLogin || new Date(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
