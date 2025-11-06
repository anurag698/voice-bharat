import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(data: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Check if username is taken
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new UnauthorizedException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
    };
  }

    async validateOAuthLogin(oauthUser: any, provider: string) {
    const { email, firstName, lastName, avatar } = oauthUser;

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user from OAuth data
      // Generate a unique username from email
      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          avatar,
          password: '', // OAuth users don't have passwords
          isEmailVerified: true, // OAuth emails are pre-verified
        },
      });
    } else {
      // Update avatar if provided and user exists
      if (avatar && avatar !== user.avatar) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatar },
        });
      }
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
      },
      token,
      provider,
    };
  }
}
