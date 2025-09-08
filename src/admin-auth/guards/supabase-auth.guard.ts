import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as {
      headers: { authorization?: string };
      admin?: any;
    };
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No authorization token provided');
      throw new UnauthorizedException('No authorization token provided');
    }

    try {
      // Verify token with Supabase
      const supabase = this.supabaseService.getClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        this.logger.warn(
          `Token verification failed: ${error?.message || 'No user found'}`,
        );
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Get user from Prisma database
      const dbUser = await this.prismaService.user.findFirst({
        where: {
          supabaseId: user.id,
        },
        include: {
          adminProfile: true,
          sellerProfile: true,
          buyerProfile: true,
        },
      });

      if (!dbUser) {
        this.logger.warn(`User not found in database: ${user.id}`);
        throw new UnauthorizedException('User not found in database');
      }

      // Attach both Supabase user and database user to request
      request.admin = {
        ...dbUser,
        supabaseUser: user,
      };

      this.logger.log(`User authenticated: ${dbUser.userType}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string };
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
