import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

interface AuthenticatedRequest {
  admin?: {
    supabaseUser?: {
      id: string;
      access_token: string;
    };
  };
}
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminSignInDto } from './dto/admin-signin.dto';
import { AdminAuthResponseDto } from './dto/admin-response.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AdminRoleGuard } from './guards/admin-role.guard';

@ApiTags('Admin Authentication')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin sign in',
    description: 'Authenticate admin user and return access tokens',
  })
  @ApiBody({ type: AdminSignInDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully signed in',
    type: AdminAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or insufficient permissions',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async signIn(
    @Body() signInDto: AdminSignInDto,
  ): Promise<AdminAuthResponseDto> {
    return this.adminAuthService.signIn(signInDto);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, AdminRoleGuard)
  @ApiOperation({
    summary: 'Admin sign out',
    description: 'Sign out admin user and invalidate session',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully signed out',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Signed out successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired token',
  })
  async signOut(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    // Get user ID and access token from the authenticated request (set by SupabaseAuthGuard)
    const userId = req.admin?.supabaseUser?.id;
    const accessToken = req.admin?.supabaseUser?.access_token;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found in request');
    }

    return this.adminAuthService.signOut(userId, accessToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refresh expired access token using refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AdminAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<AdminAuthResponseDto> {
    return this.adminAuthService.refreshSession(refreshToken);
  }
}
