# VOCH Platform - Testing Guide

## Overview

This guide provides comprehensive instructions for testing the VOCH Platform, including unit tests, integration tests, end-to-end tests, and manual testing procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Running Tests](#running-tests)
4. [Test Types](#test-types)
5. [Testing Microservices](#testing-microservices)
6. [Frontend Testing](#frontend-testing)
7. [Database Testing](#database-testing)
8. [API Testing](#api-testing)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)
11. [Continuous Integration](#continuous-integration)

## Prerequisites

Before running tests, ensure you have:

- Docker and Docker Compose installed
- Node.js (v18 or higher)
- npm or yarn package manager
- Git
- Test database credentials

## Test Environment Setup

### 1. Start Test Environment

```bash
# Start all services in test mode
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Verify all services are healthy
docker-compose ps
```

### 2. Environment Variables

Create a `.env.test` file:

```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:voch_dev_password_2025@localhost:5432/voch_test_db
REDIS_URL=redis://:voch_redis_pass_2025@localhost:6379
MONGODB_URI=mongodb://admin:voch_mongo_pass_2025@localhost:27017/voch_test_messages?authSource=admin
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=voch_meili_master_key_2025
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.service.spec.ts

# Run e2e tests
npm run test:e2e
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run e2e tests with Playwright
npm run test:e2e

# Run e2e tests in UI mode
npm run test:e2e:ui
```

## Test Types

### Unit Tests

Test individual components, services, and functions in isolation.

**Backend Example:**
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });
  
  it('should hash password correctly', async () => {
    const password = 'testPassword123';
    const hashed = await service.hashPassword(password);
    expect(hashed).not.toBe(password);
  });
});
```

**Frontend Example:**
```typescript
// Button.test.tsx
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test interactions between multiple components or services.

```typescript
// posts.integration.spec.ts
describe('Posts Integration', () => {
  it('should create and retrieve post', async () => {
    const post = await postsService.create({
      content: 'Test post',
      userId: testUser.id,
    });
    
    const retrieved = await postsService.findById(post.id);
    expect(retrieved.content).toBe('Test post');
  });
});
```

### End-to-End Tests

Test complete user workflows.

```typescript
// login.e2e.spec.ts
test('user can login successfully', async ({ page }) => {
  await page.goto('http://localhost:3001/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Testing Microservices

### Authentication Service

```bash
# Test user registration
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "username": "testuser"
  }'

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### User Service

```bash
# Test user profile retrieval
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Posts Service

```bash
# Test post creation
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post content",
    "language": "en"
  }'
```

## Frontend Testing

### Component Testing

```bash
# Run component tests
cd frontend
npm run test:components
```

### Visual Regression Testing

```bash
# Run Storybook
npm run storybook

# Run visual regression tests
npm run test:visual
```

### Accessibility Testing

```bash
# Run a11y tests
npm run test:a11y
```

## Database Testing

### PostgreSQL Tests

```bash
# Run database migrations for test DB
cd backend
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed test data
npx prisma db seed

# Reset test database
npx prisma migrate reset --skip-seed
```

### Redis Tests

```bash
# Connect to Redis CLI
docker exec -it voch_redis redis-cli -a voch_redis_pass_2025

# Test cache operations
SET test_key "test_value"
GET test_key
DEL test_key
```

### MongoDB Tests

```bash
# Connect to MongoDB
docker exec -it voch_mongo mongosh -u admin -p voch_mongo_pass_2025

# Test operations
use voch_test_messages
db.messages.insertOne({content: "test"})
db.messages.find()
```

## API Testing

### Using Postman/Insomnia

1. Import API collection from `docs/api-collection.json`
2. Set environment variables
3. Run collection tests

### Using Jest/Supertest

```typescript
// api.e2e.spec.ts
describe('API Endpoints', () => {
  it('GET /api/health returns 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });
});
```

## Performance Testing

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/load/api-load-test.yml
```

**Sample Artillery Config:**
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "Get posts feed"
    flow:
      - get:
          url: "/posts/feed"
          headers:
            Authorization: "Bearer {{authToken}}"
```

### Stress Testing

```bash
# Run stress tests
npm run test:stress

# Monitor performance
docker stats
```

## Security Testing

### Authentication Tests

```bash
# Test JWT validation
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized
```

### Input Validation

```bash
# Test SQL injection protection
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "' OR '1'='1"}'

# Expected: 400 Bad Request or proper sanitization
```

### CORS Testing

```bash
# Test CORS headers
curl -X OPTIONS http://localhost:3000/api/posts \
  -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: GET"
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test_password
      redis:
        image: redis:7-alpine
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Coverage Goals

- **Unit Tests:** > 80% code coverage
- **Integration Tests:** All critical paths covered
- **E2E Tests:** All major user workflows
- **API Tests:** All endpoints tested

## Best Practices

1. **Write tests first (TDD)** - Follow test-driven development
2. **Keep tests isolated** - Each test should be independent
3. **Use descriptive names** - Test names should explain what they test
4. **Mock external dependencies** - Don't rely on external services
5. **Clean up after tests** - Always reset test data
6. **Test edge cases** - Don't just test happy paths
7. **Maintain test data** - Keep test fixtures up to date
8. **Run tests frequently** - Integrate with CI/CD pipeline

## Troubleshooting

### Tests Failing

```bash
# Clear test database
docker-compose down -v
docker-compose up -d

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check service health
docker-compose ps
```

### Port Conflicts

```bash
# Check ports in use
lsof -i :3000
lsof -i :5432

# Kill processes if needed
kill -9 <PID>
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose logs postgres

# Test connection
psql -h localhost -U postgres -d voch_test_db
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Library](https://testing-library.com/)
- [Artillery Documentation](https://artillery.io/docs/)

## Contributing

When adding new features:
1. Write tests first
2. Ensure all tests pass
3. Update this guide if needed
4. Add test examples for new functionality

---

**Last Updated:** November 2025  
**Maintainer:** VOCH Development Team
