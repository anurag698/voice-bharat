import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigModule } from '@nestjs/config';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { UserProfileService } from './user-profile.service';
import { UploadService } from './upload.service';
import { TokenValidationService } from './token-validation.service';

@Module({
  imports: [
        ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'voch-secret-key-change-in-production',
      signOptions: {
        expiresIn: '7d', // Token expires in 7 days
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaServic,
    RefreshTokenStrategy,
    GoogleStrategy,
    FacebookStrategy,
    EmailVerificationService,
    PasswordResetService,
    UserProfileService,
    UploadService,
                  TokenValidationService,
    PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
