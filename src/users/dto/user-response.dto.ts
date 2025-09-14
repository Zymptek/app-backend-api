import { ApiProperty } from '@nestjs/swagger';
import { UserType, UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Supabase user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  supabaseId: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Type of user',
    enum: UserType,
    example: UserType.buyer,
  })
  userType: UserType;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.active,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Corp Inc',
    nullable: true,
  })
  companyName: string | null;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Profile completion status',
    example: true,
  })
  profileComplete: boolean;

  @ApiProperty({
    description: 'Last login date',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastLogin: Date | null;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserResponseDto],
  })
  users: UserResponseDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of users per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}
