import { IsOptional, IsString, IsEmail, IsUrl, MaxLength, MinLength, IsEnum, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: 'User first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ required: false, description: 'User last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ required: false, description: 'Username' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @ApiProperty({ required: false, description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'User bio/description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ required: false, description: 'Profile avatar URL' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ required: false, description: 'Cover image URL' })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiProperty({ required: false, description: 'User location/city' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ required: false, description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ required: false, description: 'Date of birth' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @ApiProperty({ required: false, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], description: 'User gender' })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string;

  @ApiProperty({ required: false, description: 'User phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ required: false, description: 'Preferred language code (e.g., en, hi, ta)' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  preferredLanguage?: string;
}

export class UpdatePrivacySettingsDto {
  @ApiProperty({ required: false, description: 'Is profile public' })
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ required: false, description: 'Show email to others' })
  @IsOptional()
  showEmail?: boolean;

  @ApiProperty({ required: false, description: 'Show phone to others' })
  @IsOptional()
  showPhone?: boolean;

  @ApiProperty({ required: false, description: 'Allow messages from non-followers' })
  @IsOptional()
  allowMessagesFromNonFollowers?: boolean;

  @ApiProperty({ required: false, description: 'Show activity status' })
  @IsOptional()
  showActivityStatus?: boolean;
}
