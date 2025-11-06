import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailerService: MailerService,
  ) {}

  /**
   * Request password reset - generate token and send email
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return { 
        message: 'If an account exists with this email, you will receive a password reset link' 
      };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing unused reset tokens for this user
    await this.prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        used: false,
      },
    });

    // Store reset token in database
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Generate reset URL
    const frontendUrl = this.config.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your VOCH Password',
        template: 'password-reset',
        context: {
          resetUrl,
          email,
          expiresIn: '1 hour',
        },
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw error to prevent revealing user existence
    }

    return { 
      message: 'If an account exists with this email, you will receive a password reset link' 
    };
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    const resetToken = await this.prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET',
        used: false,
      },
    });

    if (!resetToken) {
      return { valid: false };
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    return { valid: true, userId: resetToken.userId };
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find and validate reset token
    const resetToken = await this.prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET',
        used: false,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Validate password strength (minimum 8 characters)
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.verificationToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Send confirmation email
    try {
      await this.mailerService.sendMail({
        to: resetToken.user.email,
        subject: 'Your VOCH Password Has Been Reset',
        template: 'password-reset-confirmation',
        context: {
          email: resetToken.user.email,
        },
      });
    } catch (error) {
      console.error('Failed to send password reset confirmation email:', error);
      // Don't fail the operation if email fails
    }

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Check if new password is same as current
    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Send notification email
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Your VOCH Password Has Been Changed',
        template: 'password-change-notification',
        context: {
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Failed to send password change notification:', error);
    }

    return { message: 'Password changed successfully' };
  }

  /**
   * Clean up expired reset tokens (should be run as a cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.verificationToken.deleteMany({
      where: {
        type: 'PASSWORD_RESET',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
