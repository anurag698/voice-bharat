# ⚡ VOCH Platform - Quick Start Guide

**Get up and running in 5 minutes!**

This guide provides the essential commands to start developing on the VOCH platform immediately.

---

## 📦 Prerequisites

- Node.js v18+
- PostgreSQL v14+
- Git
- Code editor (VS Code recommended)

---

## 🚀 Quick Setup (3 Steps)

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/anurag698/voice-bharat.git
cd voice-bharat
git checkout anurag698-patch-1

# Install backend dependencies
cd backend
npm install
npx prisma generate

# Install frontend dependencies
cd ../frontend
npm install

# Back to root
cd ..
```

### 2. Configure Environment

```bash
# Backend environment
cp backend/.env.example backend/.env

# Edit backend/.env with your config:
# DATABASE_URL="postgresql://user:password@localhost:5432/voch_dev"
# JWT_SECRET="your-secret-key"
# JWT_REFRESH_SECRET="your-refresh-secret"

# Frontend environment
cp frontend/.env.example frontend/.env.local

# Edit frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Initialize Database

```bash
cd backend

# Run migrations
npx prisma migrate dev --name init

# Seed with test data
npx prisma db seed
```

**✅ Setup Complete! Now start coding.**

---

## 🖥️ Development Servers

### Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
# Backend running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:3000
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api/docs (if configured)
- **Prisma Studio**: `npx prisma studio` (database GUI)

---

## 🔑 Test Credentials

```
Admin Account:
  Email: admin@voch.com
  Password: Admin@1234

Moderator Account:
  Email: moderator@voch.com
  Password: Admin@1234

Regular User:
  Email: user1@voch.com
  Password: User@1234
```

---

## 🛠️ Essential Commands

### Backend Commands

```bash
cd backend

# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npx prisma migrate dev     # Create & apply migration
npx prisma migrate deploy  # Deploy migrations (production)
npx prisma db seed         # Seed database
npx prisma studio          # Open database GUI
npx prisma generate        # Regenerate Prisma client

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run with coverage
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run Next.js linter
npm run format             # Format code

# TypeScript
npm run type-check         # Check types (if configured)
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

---

## 📝 Common Workflows

### Creating a New API Endpoint

1. **Define Prisma Model** (`backend/prisma/schema.prisma`)
   ```prisma
   model MyModel {
     id        String   @id @default(uuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```

2. **Create Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_my_model
   ```

3. **Generate NestJS Module**
   ```bash
   nest g module my-module
   nest g controller my-module
   nest g service my-module
   ```

4. **Implement Service & Controller**
   - Add business logic in service
   - Define endpoints in controller
   - Test with Postman/cURL

### Adding a New Frontend Page

1. **Create Page File** (`frontend/src/app/my-page/page.tsx`)
   ```tsx
   export default function MyPage() {
     return <div>My New Page</div>;
   }
   ```

2. **Add Navigation Link**
   ```tsx
   <Link href="/my-page">My Page</Link>
   ```

3. **Fetch Data with React Query**
   ```tsx
   const { data } = useQuery(['myData'], () =>
     apiClient.get('/api/my-endpoint')
   );
   ```

---

## 📚 Quick Reference Links

| Need Help With | See Document |
|----------------|-------------|
| Detailed setup | [VOCH_SETUP_GUIDE.md](./VOCH_SETUP_GUIDE.md) |
| API testing | [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) |
| Database work | [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) |
| Frontend integration | [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) |
| Development workflow | [NEXT_STEPS.md](./NEXT_STEPS.md) |
| Implementation plan | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) |
| Complete setup status | [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) |

---

## 🐞 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify DATABASE_URL in .env is correct
```

### Port Already in Use

```bash
# Find process using port 3000/3001
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Prisma Client Not Generated

```bash
cd backend
npx prisma generate
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## ✨ VS Code Setup (Recommended)

### Install Recommended Extensions

When you open the project, VS Code will suggest extensions. Click "Install All".

Or install manually:
- ESLint
- Prettier
- Prisma
- GitLens
- Thunder Client (API testing)
- Error Lens

### Use DevContainer (Optional)

1. Install "Dev Containers" extension
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Select "Dev Containers: Reopen in Container"
4. Wait for container to build
5. All dependencies auto-installed!

---

## 🎯 Next Steps

1. ✅ **Setup Complete** - You're ready to code!
2. 📖 **Read** [NEXT_STEPS.md](./NEXT_STEPS.md) for development workflow
3. 📝 **Review** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for features
4. 👨‍💻 **Start Coding** - Begin with Phase 1 Week 1 tasks
5. 💬 **Questions?** Check [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)

---

## 🔥 Pro Tips

✅ **Use Prisma Studio** - Visual database editor  
✅ **Enable Hot Reload** - Both servers support live reload  
✅ **Thunder Client** - Test APIs directly in VS Code  
✅ **Git Hooks** - Husky runs linting before commits  
✅ **Type Safety** - TypeScript everywhere for fewer bugs  
✅ **React Query** - Automatic caching & refetching  

---

**Happy Coding! 🚀**

*Last Updated: November 6, 2025*
