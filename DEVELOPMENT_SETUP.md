DEVELOPMENT_SETUP.md# VOCH Platform - Development Setup Guide

## 🚀 Quick Start

This guide will help you set up the VOCH (Voice of Change) platform for local development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** (v14 or higher)
- **Redis** (v7 or higher)
- **Git**

## 🏗️ Project Structure

```
voice-bharat/
├── frontend/           # Next.js frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example
├── backend/            # NestJS backend API
│   ├── src/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── .env.example
├── design/             # UI/UX design files
│   └── ui-screens/     # 18+ screen mockups
└── docs/               # Documentation
```

## 🎨 Design System

### Brand Colors
- **Primary Green**: `#2E6F40`
- **Secondary Amber**: `#F0B429`
- **Background**: `#F9FAFB`
- **Text Primary**: `#1F2937`

### Design Files
All UI/UX design mockups are available in `/design/ui-screens/` directory, including:
- Authentication screens (Login, Signup, Onboarding)
- Main Feed (Instagram/Facebook-style)
- Profile, Posts, Reels
- Polls and Civic Engagement
- NGO Profiles and Fundraisers
- Messaging and Notifications

## ⚙️ Frontend Setup (Next.js)

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your values:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# OAuth Credentials (get from respective platforms)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Cloudinary for file uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Frontend will be available at: **http://localhost:3000**

## 🔧 Backend Setup (NestJS)

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/voch_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Set Up Database

#### Create PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE voch_db;
\q
```

#### Run Prisma Migrations

```bash
npx prisma migrate dev --name init
```

#### Generate Prisma Client

```bash
npx prisma generate
```

#### (Optional) Open Prisma Studio

```bash
npx prisma studio
```

Prisma Studio will open at: **http://localhost:5555**

### 5. Start Redis Server

```bash
redis-server
```

### 6. Run Development Server

```bash
npm run start:dev
# or
yarn start:dev
```

Backend API will be available at: **http://localhost:3001**

## 📊 Database Schema Overview

The Prisma schema includes the following models:

### Core Models
- **User**: Authentication, profiles, gamification (XP, levels, badges)
- **Post**: Social media posts with images/videos/reels
- **Comment**: Post comments
- **Like**: Post likes
- **Follow**: User following system

### Civic Engagement
- **Poll**: Create and manage polls
- **PollVote**: Track poll votes (anonymous support)

### NGO Features
- **NGOProfile**: Verified NGO profiles
- **Fundraiser**: Fundraising campaigns
- **Donation**: Track donations with payment integration

### Communication
- **Message**: E2E encrypted messaging
- **Notification**: Multi-type notification system

## 🧪 Running Tests

### Frontend Tests

```bash
cd frontend
npm run test
```

### Backend Tests

```bash
cd backend
npm run test
npm run test:e2e
npm run test:cov
```

## 🔨 Build for Production

### Frontend Build

```bash
cd frontend
npm run build
npm run start
```

### Backend Build

```bash
cd backend
npm run build
npm run start:prod
```

## 📦 Key Technologies

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **React Hook Form + Zod** - Form validation
- **Framer Motion** - Animations

### Backend
- **NestJS** - Node.js framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Passport.js** - Authentication
- **Socket.io** - WebSockets
- **Bcrypt** - Password hashing
- **Cloudinary** - File storage

## 🎯 Development Roadmap

### Phase 1: MVP (Months 1-3)
- [ ] Authentication (Email + OAuth)
- [ ] User profiles
- [ ] Post feed
- [ ] Polls

### Phase 2: Engagement (Months 4-6)
- [ ] Reels
- [ ] NGO features
- [ ] Fundraisers
- [ ] Gamification

### Phase 3: Scale (Months 7-9)
- [ ] Messaging
- [ ] Notifications
- [ ] Multi-language support
- [ ] Mobile apps

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues

1. Ensure PostgreSQL is running:
```bash
pg_isready
```

2. Check database credentials in `.env`
3. Verify database exists:
```bash
psql -U postgres -l
```

### Prisma Migration Issues

```bash
# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Force migrate
npx prisma migrate deploy
```

## 📚 Additional Resources

- [VOCH_SETUP_GUIDE.md](./VOCH_SETUP_GUIDE.md) - Platform overview
- [ROADMAP.md](./ROADMAP.md) - 18-month development plan
- [Design Files](/design/ui-screens/README.md) - UI/UX mockups
- [Prisma Schema](/backend/prisma/schema.prisma) - Database structure

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 💡 Support

For questions or issues:
- Create an issue on GitHub
- Email: support@voch.in
- Website: https://voch.in

---

**Built with ❤️ for social good by the VOCH team**
