import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully create a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: '1',
        email: signupData.email,
        username: signupData.username,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        avatar: null,
        xp: 0,
        level: 1,
      };
      const mockToken = 'jwt.token.here';

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email check
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Username check
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.signup(signupData);

      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: signupData.email,
          password: hashedPassword,
          username: signupData.username,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
        },
      });
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: '1' });

      await expect(service.signup(signupData)).rejects.toThrow(
        new UnauthorizedException('Email already registered'),
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if username already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email check
      mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: '1' }); // Username check

      await expect(service.signup(signupData)).rejects.toThrow(
        new UnauthorizedException('Username already taken'),
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockUser = {
      id: '1',
      email,
      password: 'hashedPassword123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      avatar: null,
      xp: 100,
      level: 2,
      badges: ['early-adopter'],
    };

    it('should successfully login a user with valid credentials', async () => {
      const mockToken = 'jwt.token.here';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(email, password);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          avatar: mockUser.avatar,
          xp: mockUser.xp,
          level: mockUser.level,
          badges: mockUser.badges,
        },
        token: mockToken,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('validateUser', () => {
    const userId = '1';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      avatar: 'https://example.com/avatar.jpg',
      xp: 250,
      level: 3,
      badges: ['contributor', 'early-adopter'],
    };

    it('should successfully validate and return user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(userId);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        avatar: mockUser.avatar,
        xp: mockUser.xp,
        level: mockUser.level,
        badges: mockUser.badges,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(userId)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });

  describe('validateOAuthLogin', () => {
    const oauthUser = {
      email: 'oauth@example.com',
      firstName: 'OAuth',
      lastName: 'User',
      avatar: 'https://example.com/oauth-avatar.jpg',
    };
    const provider = 'google';

    it('should create new user if not exists', async () => {
      const mockUser = {
        id: '1',
        email: oauthUser.email,
        username: 'oauth',
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        avatar: oauthUser.avatar,
        xp: 0,
        level: 1,
        badges: [],
      };
      const mockToken = 'jwt.token.here';

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // User doesn't exist
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Username available
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.validateOAuthLogin(oauthUser, provider);

      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
        provider,
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: oauthUser.email,
          username: 'oauth',
          firstName: oauthUser.firstName,
          lastName: oauthUser.lastName,
          avatar: oauthUser.avatar,
          password: '',
          isEmailVerified: true,
        },
      });
    });

    it('should generate unique username if base username is taken', async () => {
      const mockUser = {
        id: '1',
        email: oauthUser.email,
        username: 'oauth1',
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        avatar: oauthUser.avatar,
        xp: 0,
        level: 1,
        badges: [],
      };
      const mockToken = 'jwt.token.here';

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // User doesn't exist
        .mockResolvedValueOnce({ id: '2' }) // oauth taken
        .mockResolvedValueOnce(null); // oauth1 available
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.validateOAuthLogin(oauthUser, provider);

      expect(result.user.username).toBe('oauth1');
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'oauth1',
          }),
        }),
      );
    });

    it('should update avatar if user exists and avatar is different', async () => {
      const existingUser = {
        id: '1',
        email: oauthUser.email,
        username: 'existinguser',
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        avatar: 'old-avatar.jpg',
        xp: 100,
        level: 2,
        badges: ['early-adopter'],
      };
      const updatedUser = { ...existingUser, avatar: oauthUser.avatar };
      const mockToken = 'jwt.token.here';

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.validateOAuthLogin(oauthUser, provider);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: { avatar: oauthUser.avatar },
      });
      expect(result.user.avatar).toBe(oauthUser.avatar);
    });

    it('should not update avatar if user exists and avatar is same', async () => {
      const existingUser = {
        id: '1',
        email: oauthUser.email,
        username: 'existinguser',
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        avatar: oauthUser.avatar,
        xp: 100,
        level: 2,
        badges: ['early-adopter'],
      };
      const mockToken = 'jwt.token.here';

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.validateOAuthLogin(oauthUser, provider);

      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result.user.avatar).toBe(oauthUser.avatar);
    });
  });
});
