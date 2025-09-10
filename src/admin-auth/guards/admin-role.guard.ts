import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserType, UserStatus } from '@prisma/client';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  private readonly logger = new Logger(AdminRoleGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const admin = request.admin;

    if (!admin) {
      this.logger.warn('No admin user found in request');
      throw new ForbiddenException('No admin user found');
    }

    // Check if user is admin
    if (admin.userType !== UserType.admin) {
      this.logger.warn(`Access denied for user type: ${admin.userType}`);
      throw new ForbiddenException('Access denied. Admin role required.');
    }

    // Check if user is active
    if (admin.status !== UserStatus.active) {
      this.logger.warn(`Access denied for user status: ${admin.status}`);
      throw new ForbiddenException('Access denied. Account is not active.');
    }

    // Check if email is verified
    if (!admin.emailVerified) {
      this.logger.warn(`Access denied for unverified email`);
      throw new ForbiddenException(
        'Access denied. Email verification required.',
      );
    }

    this.logger.log(`Admin access granted`);
    return true;
  }
}
