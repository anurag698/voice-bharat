import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailerService: MailerService,
  ) {}

  /**
   * Generate a verification token and send verification email
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate a random verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Store token in database
    await this.prisma.verificationToken.create({
      data: {
        userId,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Generate verification URL
    const frontendUrl = this.config.get('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your VOCH Account',
        template: 'email-verification',
        context: {
          verificationUrl,
          email,
        },
      });
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // Find the verification token
    const verificationToken = await this.prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'EMAIL_VERIFICATION',
        used: false,
      },
      include: {
        user: true,
      },
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark user as verified and token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
      this.prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Delete any existing unused verification tokens for this user
    await this.prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        used: false,
      },
    });

    // Send new verification email
    await this.sendVerificationEmail(user.id, user.email);

    return { message: 'Verification email sent successfully' };
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    return user?.emailVerified ?? false;
  }

  /**
   * Clean up expired verification tokens (should be run as a cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.verificationToken.deleteMany({
      where: {
        type: 'EMAIL_VERIFICATION',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
