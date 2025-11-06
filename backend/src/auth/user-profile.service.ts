import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, UpdatePrivacySettingsDto } from './dto/update-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        preferredLanguage: true,
        emailVerified: true,
        isPublic: true,
        showEmail: true,
        showPhone: true,
        allowMessagesFromNonFollowers: true,
        showActivityStatus: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get public profile by username (for viewing other users)
   */
  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        isPublic: true,
        showEmail: true,
        showPhone: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter sensitive data based on privacy settings
    const publicProfile: any = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.coverImage,
      location: user.location,
      website: user.website,
      createdAt: user.createdAt,
      stats: {
        followers: user._count.followers,
        following: user._count.following,
        posts: user._count.posts,
      },
    };

    // Only include email if user allows it
    if (user.showEmail) {
      publicProfile.email = user.email;
    }

    // Only include phone if user allows it
    if (user.showPhone) {
      publicProfile.phone = user.phone;
    }

    return publicProfile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Check if username or email is being updated and if they're already taken
    if (updateProfileDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: updateProfileDto.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username is already taken');
      }
    }

    if (updateProfileDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateProfileDto.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }

      // If email is being updated, mark as unverified
      updateProfileDto['emailVerified'] = false;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateProfileDto,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          avatar: true,
          coverImage: true,
          location: true,
          website: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          preferredLanguage: true,
          emailVerified: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Profile updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException('Failed to update profile');
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    updatePrivacyDto: UpdatePrivacySettingsDto,
  ) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updatePrivacyDto,
        select: {
          id: true,
          isPublic: true,
          showEmail: true,
          showPhone: true,
          allowMessagesFromNonFollowers: true,
          showActivityStatus: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Privacy settings updated successfully',
        settings: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException('Failed to update privacy settings');
    }
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPublic: true,
        showEmail: true,
        showPhone: true,
        allowMessagesFromNonFollowers: true,
        showActivityStatus: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string) {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return {
        message: 'Account deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to delete account');
    }
  }

  /**
   * Search users by username or name
   */
  async searchUsers(query: string, limit: number = 10) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        isPublic: true, // Only show public profiles in search
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: limit,
    });

    return users;
  }
}
