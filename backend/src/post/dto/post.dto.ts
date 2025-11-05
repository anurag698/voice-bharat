import { IsString, IsOptional, IsArray, IsEnum, MaxLength, MinLength, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

/**
 * DTO for creating a new post
 */
export class CreatePostDto {
  @ApiProperty({
    description: 'The content text of the post',
    example: 'Just joined VOCH! Excited to be part of this community 🎉',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Post content cannot be empty' })
  @MinLength(1, { message: 'Post content must be at least 1 character long' })
  @MaxLength(5000, { message: 'Post content cannot exceed 5000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Array of media URLs attached to the post',
    example: ['https://cdn.voch.in/posts/image1.jpg', 'https://cdn.voch.in/posts/video1.mp4'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Media URLs must be an array' })
  @IsUrl({}, { each: true, message: 'Each media URL must be a valid URL' })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Type of media attached to the post',
    enum: MediaType,
    example: 'IMAGE',
  })
  @IsOptional()
  @IsEnum(MediaType, { message: 'Media type must be one of: IMAGE, VIDEO, AUDIO, DOCUMENT' })
  mediaType?: MediaType;

  @ApiPropertyOptional({
    description: 'Language code of the post content',
    example: 'hi',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Language code cannot exceed 10 characters' })
  language?: string;
}

/**
 * DTO for updating an existing post
 */
export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Updated content text of the post',
    example: 'Updated: Just joined VOCH! Excited to be part of this amazing community 🎉',
    minLength: 1,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Post content must be at least 1 character long' })
  @MaxLength(5000, { message: 'Post content cannot exceed 5000 characters' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated array of media URLs',
    example: ['https://cdn.voch.in/posts/updated-image.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Media URLs must be an array' })
  @IsUrl({}, { each: true, message: 'Each media URL must be a valid URL' })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Updated media type',
    enum: MediaType,
    example: 'IMAGE',
  })
  @IsOptional()
  @IsEnum(MediaType, { message: 'Media type must be one of: IMAGE, VIDEO, AUDIO, DOCUMENT' })
  mediaType?: MediaType;
}

/**
 * DTO for adding a comment to a post
 */
export class CreateCommentDto {
  @ApiProperty({
    description: 'The content of the comment',
    example: 'Great post! Welcome to VOCH!',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @MinLength(1, { message: 'Comment must be at least 1 character long' })
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'ID of the parent comment if this is a reply',
    example: 'cm123abc456',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
