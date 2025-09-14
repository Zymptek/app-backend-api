import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Violation of terms of service',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
