import { IsString, IsInt, IsOptional, IsUrl, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for sending a message to another user
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the user receiving the message',
    example: 123,
    type: 'integer',
  })
  @IsInt({ message: 'Receiver ID must be an integer' })
  @Type(() => Number)
  receiverId: number;

  @ApiProperty({
    description: 'Content of the message (will be encrypted)',
    example: 'Hey! How are you doing?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'URL of an attachment (image, video, document)',
    example: 'https://cdn.voch.in/attachments/file123.pdf',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Attachment URL must be a valid URL' })
  attachmentUrl?: string;
}
