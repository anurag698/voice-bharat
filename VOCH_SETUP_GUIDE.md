# VOCH Platform - Complete Developer Setup Guide

## Repository: voice-bharat → VOCH (voch.in)
**Platform**: Social Media + Civic Engagement  
**Tagline**: Where your voice creates change

---

## 🚀 Quick Start

### 1. Create Folder Structure
```bash
cd voice-bharat
mkdir -p frontend backend docs infra design scripts
mkdir -p frontend/src/app frontend/src/components frontend/public
mkdir -p backend/src backend/prisma backend/tests
mkdir -p docs/{api,design,setup} infra/{docker,k8s}
```

### 2. Initialize Frontend (Next.js + Tailwind)
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
yarn add zustand axios socket.io-client
yarn add -D @types/node
```

### 3. Initialize Backend (NestJS)
```bash
cd ../backend
npm i -g @nestjs/cli
nest new . --skip-git
yarn add @nestjs/config @nestjs/jwt passport passport-jwt bcrypt
yarn add @prisma/client typeorm pg redis bullmq socket.io
```

### 4. Setup Prisma Database
```bash
cd backend
npx prisma init
```

**Edit `prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @unique
  password  String
  role      String   @default("user")
  xp        Int      @default(0)
  createdAt DateTime @default(now())
  posts     Post[]
  polls     Poll[]
}

model Post {
  id        Int      @id @default(autoincrement())
  content   String
  type      String
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  likes     Int      @default(0)
  createdAt DateTime @default(now())
}

model Poll {
  id        Int      @id @default(autoincrement())
  question  String
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

### 5. Environment Files

**backend/.env**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/vochdb"
JWT_SECRET=your_secret_key_change_in_production
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_secret
REDIS_URL=redis://localhost:6379
PORT=5000
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### 6. Docker Compose Setup

**docker-compose.yml** (root):
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: vochdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/vochdb
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 7. Run Application

```bash
# Start services
docker-compose up -d

# Run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate

# Start backend
yarn dev

# Start frontend (new terminal)
cd frontend
yarn dev
```

### 8. Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Prisma Studio**: `npx prisma studio` (localhost:5555)

---

## 📚 Full Product Documentation

Refer to the complete **Product & Technical Design Document** for:
- Feature specifications (Posts, Polls, Reels, Fundraisers)
- User flows and wireframes
- API endpoints
- Database schema (complete)
- Gamification & XP system
- Feed algorithm
- E2EE messaging implementation
- Scaling strategy

---

## 📁 Final Project Structure

```
voice-bharat/
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js 14 app directory
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── posts/
│   │   └── polls/
│   ├── prisma/
│   └── package.json
├── docs/
│   ├── api/
│   ├── design/
│   └── setup/
├── infra/
│   ├── docker/
│   └── k8s/
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ✅ Setup Checklist

- [ ] Clone repository
- [ ] Create folder structure
- [ ] Initialize frontend (Next.js)
- [ ] Initialize backend (NestJS)
- [ ] Setup Prisma schema
- [ ] Create environment files
- [ ] Create docker-compose.yml
- [ ] Run `docker-compose up -d`
- [ ] Run Prisma migrations
- [ ] Test localhost:3000 & localhost:5000
- [ ] Install VS Code extensions (Prisma, Tailwind, ESLint)

---

**Created**: November 2025  
**For**: VOCH Platform Development
