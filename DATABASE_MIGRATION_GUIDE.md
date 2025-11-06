# Database Migration Guide

## Overview

This guide covers database management for the VOCH platform using Prisma ORM. It includes migration workflows, seeding strategies, and best practices for database schema evolution.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Creating Migrations](#creating-migrations)
4. [Running Migrations](#running-migrations)
5. [Database Seeding](#database-seeding)
6. [Rollback Strategies](#rollback-strategies)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Required Tools:**
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Prisma CLI installed globally or via npm

**Environment Variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/voch_dev"
DATABASE_URL_PROD="postgresql://user:password@host:5432/voch_prod"
```

---

## Initial Setup

### Step 1: Install Prisma

```bash
cd backend
npm install prisma @prisma/client
```

### Step 2: Initialize Prisma (Already Done)

The schema is already configured at `backend/prisma/schema.prisma`

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

This generates TypeScript types based on your schema.

---

## Creating Migrations

### Development Workflow

**1. Modify Schema**

Edit `backend/prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  // Add new field
  viewCount Int      @default(0)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**2. Create Migration**

```bash
npx prisma migrate dev --name add_view_count_to_posts
```

This command:
- Creates SQL migration file in `prisma/migrations/`
- Applies migration to development database
- Regenerates Prisma Client
- Updates `_prisma_migrations` table

**3. Review Generated Migration**

Check `prisma/migrations/<timestamp>_add_view_count_to_posts/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "Post" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
```

---

## Running Migrations

### Development Environment

```bash
# Create and apply migration
npx prisma migrate dev

# With custom name
npx prisma migrate dev --name migration_description

# Create migration without applying
npx prisma migrate dev --create-only
```

### Production Environment

```bash
# Deploy pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Resolve migration issues
npx prisma migrate resolve --applied <migration_name>
npx prisma migrate resolve --rolled-back <migration_name>
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
- name: Run Database Migrations
  run: |
    cd backend
    npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
```

---

## Database Seeding

### Create Seed Script

Create `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data (optional, be careful!)
  // await prisma.comment.deleteMany();
  // await prisma.post.deleteMany();
  // await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('Test@1234', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'admin@voch.com' },
    update: {},
    create: {
      email: 'admin@voch.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: {
          bio: 'Platform Administrator',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user@voch.com' },
    update: {},
    create: {
      email: 'user@voch.com',
      username: 'testuser',
      password: hashedPassword,
      role: 'USER',
      profile: {
        create: {
          bio: 'Test User for VOCH Platform',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        },
      },
    },
  });

  // Create test posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Welcome to VOCH',
      content: 'This is the first post on our platform.',
      userId: user1.id,
      status: 'PUBLISHED',
      category: 'ANNOUNCEMENT',
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Community Guidelines',
      content: 'Please follow our community guidelines for respectful discussions.',
      userId: user1.id,
      status: 'PUBLISHED',
      category: 'GENERAL',
    },
  });

  // Create test comments
  await prisma.comment.create({
    data: {
      content: 'Great platform!',
      userId: user2.id,
      postId: post1.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log({ user1, user2, post1, post2 });
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Configure Package.json

Add to `backend/package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "npx prisma db seed",
    "db:reset": "npx prisma migrate reset"
  }
}
```

### Run Seeding

```bash
# Seed database
npm run db:seed

# Reset database and seed
npm run db:reset
```

---

## Rollback Strategies

### Strategy 1: Undo Last Migration (Development)

```bash
# Reset database to last migration
npx prisma migrate reset

# This will:
# - Drop database
# - Create new database
# - Apply all migrations except the last
# - Run seed script
```

### Strategy 2: Manual Rollback (Production)

**Create reverse migration:**

```bash
npx prisma migrate dev --name rollback_view_count --create-only
```

Edit the generated migration file:

```sql
-- Reverse previous migration
ALTER TABLE "Post" DROP COLUMN "viewCount";
```

Then apply:

```bash
npx prisma migrate deploy
```

### Strategy 3: Mark Migration as Resolved

```bash
# If migration failed midway
npx prisma migrate resolve --rolled-back <migration_name>

# Then reapply
npx prisma migrate deploy
```

---

## Best Practices

### 1. Migration Naming

**Good:**
- `add_email_verification_to_users`
- `create_notification_table`
- `update_post_status_enum`

**Bad:**
- `migration1`
- `fix`
- `update`

### 2. Schema Changes

**Always test migrations locally first:**

```bash
# Test in local environment
DATABASE_URL="postgresql://localhost:5432/voch_test" npx prisma migrate dev
```

**Use default values for new non-nullable fields:**

```prisma
model User {
  // Add default value to avoid migration errors
  status Status @default(ACTIVE)
}
```

### 3. Data Migrations

For complex data transformations, create custom migration:

```sql
-- Migration: 20241106_normalize_usernames

-- Step 1: Add new column
ALTER TABLE "User" ADD COLUMN "normalizedUsername" TEXT;

-- Step 2: Populate data
UPDATE "User" SET "normalizedUsername" = LOWER("username");

-- Step 3: Make it required
ALTER TABLE "User" ALTER COLUMN "normalizedUsername" SET NOT NULL;

-- Step 4: Add index
CREATE UNIQUE INDEX "User_normalizedUsername_key" ON "User"("normalizedUsername");
```

### 4. Backup Before Production Migration

```bash
# PostgreSQL backup
pg_dump -U postgres -d voch_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Then run migration
npx prisma migrate deploy
```

### 5. Use Transactions

Prisma migrations are wrapped in transactions automatically, but for custom SQL:

```sql
BEGIN;
  -- Your migration statements
  ALTER TABLE "Post" ADD COLUMN "viewCount" INTEGER;
  UPDATE "Post" SET "viewCount" = 0;
COMMIT;
```

---

## Troubleshooting

### Issue 1: Migration Failed Midway

**Error:**
```
Migration failed. Database is in an inconsistent state.
```

**Solution:**
```bash
# Check status
npx prisma migrate status

# Mark as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Fix schema issue, then deploy
npx prisma migrate deploy
```

### Issue 2: Schema and Database Out of Sync

**Error:**
```
Prisma schema is out of sync with the database.
```

**Solution:**
```bash
# Pull database schema to Prisma
npx prisma db pull

# Or create new migration
npx prisma migrate dev
```

### Issue 3: Cannot Connect to Database

**Error:**
```
Can't reach database server at `localhost:5432`
```

**Solution:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Issue 4: Seeding Fails

**Error:**
```
Unique constraint failed on the fields: (`email`)
```

**Solution:**
```bash
# Reset database
npx prisma migrate reset

# Or use upsert instead of create in seed script
```

### Issue 5: Production Migration Stuck

**Steps:**
1. Check migration status: `npx prisma migrate status`
2. Connect to database and check `_prisma_migrations` table
3. If locked, manually update: `UPDATE _prisma_migrations SET finished_at = NOW() WHERE finished_at IS NULL;`
4. Resolve and reapply: `npx prisma migrate resolve --applied <name> && npx prisma migrate deploy`

---

## Quick Reference Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration (dev)
npx prisma migrate dev --name <description>

# Deploy migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (dev only)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio

# Pull schema from database
npx prisma db pull

# Push schema to database (prototype)
npx prisma db push
```

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)
- [Production Best Practices](https://www.prisma.io/docs/guides/deployment/production)
- Backend Schema: `backend/prisma/schema.prisma`
- Environment Template: `.env.example`

---

**Last Updated:** November 6, 2024  
**Version:** 1.0  
**Maintainer:** VOCH Development Team
