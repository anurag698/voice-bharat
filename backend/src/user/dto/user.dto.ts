import { IsString, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating user profile information
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'Rahul',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Kumar',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User bio or description',
    example: 'Passionate about civic engagement and social change',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://cdn.voch.in/avatars/user123.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Cover/banner image URL',
    example: 'https://cdn.voch.in/covers/user123.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Cover image must be a valid URL' })
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'User location',
    example: 'Mumbai, India',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;

  @ApiPropertyOptional({
    description: 'User website URL',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;
}
