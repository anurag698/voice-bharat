import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
  expiresAt?: Date;
  issuedAt?: Date;
}

export interface TokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenValidationService {
  private readonly logger = new Logger(TokenValidationService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate an access token and return detailed information
   */
  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Extract expiration and issued at times
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
      const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;

      this.logger.log(
        `Access token validated successfully for user: ${payload.email}`,
      );

      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        expiresAt,
        issuedAt,
      };
    } catch (error) {
      this.logger.error(
        `Access token validation failed: ${error.message}`,
        error.stack,
      );

      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate a refresh token and return detailed information
   */
  async validateRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verify and decode the refresh token
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Extract expiration and issued at times
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
      const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;

      this.logger.log(
        `Refresh token validated successfully for user: ${payload.email}`,
      );

      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        expiresAt,
        issuedAt,
      };
    } catch (error) {
      this.logger.error(
        `Refresh token validation failed: ${error.message}`,
        error.stack,
      );

      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Decode a token without verifying signature (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload;
    } catch (error) {
      this.logger.error(`Token decoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if a token is expired (without full validation)
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return true;
      }

      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate < new Date();
    } catch (error) {
      this.logger.error(`Token expiration check failed: ${error.message}`);
      return true;
    }
  }

  /**
   * Generate a new access token for a user
   */
  async generateAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email: email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d', // 7 days
    });
  }

  /**
   * Generate a new refresh token for a user
   */
  async generateRefreshToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email: email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d', // 30 days
    });
  }

  /**
   * Validate token and throw exception if invalid (for use in guards)
   */
  async validateTokenOrThrow(token: string): Promise<TokenPayload> {
    const result = await this.validateAccessToken(token);

    if (!result.valid) {
      throw new UnauthorizedException(
        result.error || 'Invalid or expired token',
      );
    }

    return {
      sub: result.userId!,
      email: result.email!,
    };
  }

  /**
   * Get token expiration time remaining in seconds
   */
  getTokenTimeRemaining(token: string): number | null {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return null;
      }

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const remainingMs = expirationDate.getTime() - now.getTime();

      return Math.max(0, Math.floor(remainingMs / 1000));
    } catch (error) {
      this.logger.error(
        `Failed to get token time remaining: ${error.message}`,
      );
      return null;
    }
  }
}
