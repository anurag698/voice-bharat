import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload avatar image to Cloudinary
   * @param file - Multer file object
   * @param userId - User ID for organizing uploads
   * @returns Cloudinary upload result with secure URL
   */
  async uploadAvatar(file: Express.Multer.File, userId: number): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Upload to Cloudinary using stream
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `voch/avatars/${userId}`,
            public_id: `avatar_${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
            allowed_formats: ['jpg', 'png', 'gif', 'webp'],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Delete avatar from Cloudinary
   * @param avatarUrl - Full Cloudinary URL of the avatar
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl || !avatarUrl.includes('cloudinary.com')) {
      return; // Not a Cloudinary URL, skip deletion
    }

    try {
      // Extract public_id from URL
      const urlParts = avatarUrl.split('/');
      const publicIdWithExtension = urlParts.slice(-3).join('/').split('.')[0];
      
      await cloudinary.uploader.destroy(publicIdWithExtension);
    } catch (error) {
      // Log error but don't throw - avatar deletion is not critical
      console.error('Failed to delete avatar from Cloudinary:', error.message);
    }
  }
}
