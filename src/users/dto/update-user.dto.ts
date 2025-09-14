import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'Type of user',
    enum: UserType,
    example: UserType.buyer,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserType, { message: 'User type must be buyer, seller, or admin' })
  userType?: UserType;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.active,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus, {
    message:
      'User status must be pending_verification, active, verified, rejected, or suspended',
  })
  status?: UserStatus;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Corp Inc',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
    required: false,
  })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({
    description: 'Profile completion status',
    example: true,
    required: false,
  })
  @IsOptional()
  profileComplete?: boolean;
}
