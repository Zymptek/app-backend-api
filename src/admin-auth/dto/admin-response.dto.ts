import { ApiProperty } from '@nestjs/swagger';
import { UserType, UserStatus } from '@prisma/client';

export class AdminResponseDto {
  @ApiProperty({
    description: 'Admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Supabase user ID',
    example: 'auth-user-123',
  })
  supabaseId: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@zymptek.com',
  })
  email: string;

  @ApiProperty({
    description: 'Admin first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Admin company name',
    example: 'Zymptek Inc',
  })
  companyName: string;

  @ApiProperty({
    description: 'User type',
    enum: UserType,
    example: UserType.admin,
  })
  userType: UserType;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.active,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Email verified status',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Profile completion status',
    example: true,
  })
  profileComplete: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastLogin: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class AdminAuthResponseDto {
  @ApiProperty({
    description: 'Access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for token renewal',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Admin user information',
    type: AdminResponseDto,
  })
  admin: AdminResponseDto;
}
