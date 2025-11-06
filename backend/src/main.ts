import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cookie parser middleware
  app.use(cookieParser());

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('VOCH API')
    .setDescription('Voice of Change - Social Media & Civic Engagement Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('posts', 'Posts and social feed')
    .addTag('polls', 'Polls and voting')
    .addTag('ngos', 'NGO profiles and fundraisers')
    .addTag('messages', 'E2E encrypted messaging')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 VOCH API running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api`);
}

bootstrap();
