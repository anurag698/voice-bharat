import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserProfileService } from './user-profile.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService),
    private emailVerificationService: EmailVerificationService {},
    private passwordResetService: PasswordResetService,
          private userProfileService: UserProfileService

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Email or username already exists' })
  async signup(
    @Body()
    body: {
      email: string;
      password: string;
      username: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.authService.signup(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.login(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // Token invalidation handled on client side
    return { message: 'Logout successful' };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() body: { token: string }) {
    return this.emailVerificationService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  async resendVerification(@Body() body: { email: string }) {
    return this.emailVerificationService.resendVerificationEmail(body.email);
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent (if account exists)' })
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.passwordResetService.requestPasswordReset(body.email);
  }

  @Post('verify-reset-token')
  @ApiOperation({ summary: 'Verify password reset token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyResetToken(@Body() body: { token: string }) {
    return this.passwordResetService.verifyResetToken(body.token);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or weak password' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.passwordResetService.resetPassword(body.token, body.newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.passwordResetService.changePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  // ============ User Profile Management ============

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.userProfileService.getProfile(req.user.sub);
  }

  @Get('profile/public/:username')
  @ApiOperation({ summary: 'Get public user profile by username' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Request() req) {
    const authenticatedUserId = req.user?.sub;
    const { username } = req.params;
    return this.userProfileService.getPublicProfile(username, authenticatedUserId);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or username/email already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: any,
  ) {
    return this.userProfileService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Get('profile/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPrivacySettings(@Request() req) {
    return this.userProfileService.getPrivacySettings(req.user.sub);
  }

  @Post('profile/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePrivacySettings(
    @Request() req,
    @Body() updatePrivacySettingsDto: any,
  ) {
    return this.userProfileService.updatePrivacySettings(req.user.sub, updatePrivacySettingsDto);
  }

  @Post('profile/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@Request() req) {
    return this.userProfileService.deleteAccount(req.user.sub);
  }

  @Get('users/search')
  @ApiOperation({ summary: 'Search users by username or name' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchUsers(@Request() req) {
    const { query, limit = 20, offset = 0 } = req.query;
    return this.userProfileService.searchUsers(query as string, Number(limit), Number(offset));
  }
}
