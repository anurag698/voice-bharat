# VOCH Platform - Database Migrations

This directory contains Prisma database migrations for the VOCH (Voice of Change) platform.

## 📁 Migration Structure

Each migration is stored in a timestamped directory following the format: `YYYYMMDDHHMMSS_description`

### Current Migrations

- **20251106000000_init** - Initial database schema
  - Created: November 6, 2025
  - Description: Complete initial schema setup for VOCH platform
  - Tables: 25+ tables including User, Post, Comment, Reel, NGO, Fundraiser, etc.
  - Indexes: 60+ indexes for optimal performance
  - Constraints: Foreign keys with CASCADE rules for data integrity

## 🚀 Running Migrations

### Prerequisites

Ensure you have:
- PostgreSQL database running
- Database connection string in `.env` file as `DATABASE_URL`
- Prisma CLI installed: `npm install prisma --save-dev`

### Apply Migrations

```bash
# Navigate to backend directory
cd backend

# Apply all pending migrations
npx prisma migrate deploy

# For development (creates migration if schema changed)
npx prisma migrate dev
```

### Check Migration Status

```bash
# View current migration status
npx prisma migrate status
```

## 🗄️ Database Schema Overview

The initial migration creates the following core tables:

### User Management
- `User` - User accounts with authentication
- `NGOProfile` - NGO verification and profiles

### Content & Social
- `Post` - User posts and content
- `Comment` - Post comments
- `Like` - Post likes
- `Reel` - Short video content
- `ReelLike` / `ReelComment` - Reel interactions
- `Follow` - User following relationships
- `Friend` - Friend connections

### Social Impact
- `Fundraiser` - Fundraising campaigns
- `Donation` - Donation transactions
- `Poll` / `PollVote` - Community polling

### Engagement & Gamification
- `Notification` - User notifications
- `Message` - E2E encrypted messaging
- `Activity` - User activity tracking (XP system)
- `Badge` - Achievement badges

### Content Organization
- `Hashtag` - Trending hashtags
- `Mention` - User mentions
- `Share` - Content sharing tracking

### Moderation
- `Report` - Content/user reports

## 🔄 Seeding the Database

After running migrations, seed the database with initial data:

```bash
# Run seed script
npx prisma db seed

# This will create:
# - Admin user
# - Moderator user
# - 3 test users
# - Sample posts with comments
# - Test fundraisers
```

## 📊 Database Tools

### Prisma Studio
Launch Prisma Studio to view and edit data:

```bash
npx prisma studio
```

### Generate Prisma Client
After schema changes, regenerate the Prisma client:

```bash
npx prisma generate
```

## ⚠️ Important Notes

1. **Never modify migration files manually** - Always use `prisma migrate` commands
2. **Backup before migrations** - Always backup production databases before applying migrations
3. **Test migrations** - Test all migrations in development/staging before production
4. **Migration conflicts** - If migrations conflict, resolve using `prisma migrate resolve`

## 🔗 Related Documentation

- [DATABASE_MIGRATION_GUIDE.md](../../../DATABASE_MIGRATION_GUIDE.md) - Comprehensive migration guide
- [IMPLEMENTATION_PLAN.md](../../../IMPLEMENTATION_PLAN.md) - Platform roadmap
- [Prisma Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## 📝 Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 20251106000000_init | Nov 6, 2025 | Initial schema with all core tables |

---

**Last Updated**: November 6, 2025  
**Database**: PostgreSQL  
**ORM**: Prisma
