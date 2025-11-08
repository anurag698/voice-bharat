import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

export class TestUtils {
  static async createTestApp(module: any): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule(module).compile();
    
    const app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
    return app;
  }

  static async cleanupDatabase(prisma: any) {
    // Clean up in reverse order of dependencies
    const tables = ['like', 'comment', 'post', 'follow', 'donation', 'notification', 'fundraiser', 'user'];
    for (const table of tables) {
      if (prisma[table]) {
        await prisma[table].deleteMany({});
      }
    }
  }

  static generateTestUser(overrides = {}) {
    const timestamp = Date.now();
    return {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'Test@1234',
      name: 'Test User',
      ...overrides,
    };
  }

  static async createAuthenticatedUser(app: INestApplication) {
    const userData = TestUtils.generateTestUser();
    
    // Signup
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(userData)
      .expect(201);
    
    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);
    
    return {
      user: userData,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.body.refreshToken,
      userId: loginResponse.body.user?.id,
    };
  }
}
