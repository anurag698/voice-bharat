# VOCH - Voice of Change 🗣️

**Where Your Voice Creates Change**

[![Deploy Status](https://img.shields.io/badge/deploy-active-success)](https://voice-bharat.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

VOCH is a next-generation social media platform that merges communication, civic engagement, and social impact — empowering users to connect, create content, participate in polls, support NGOs, and earn rewards through gamified interactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- Git
- VS Code (recommended)

### 1. Clone & Setup
```bash
# Clone repository
git clone https://github.com/anurag698/voice-bharat.git
cd voice-bharat

# Switch to development branch
git checkout anurag698-patch-1

# Start Docker services
docker-compose up -d
```

### 2. Follow Complete Setup Guide
See **[VOCH_SETUP_GUIDE.md](./VOCH_SETUP_GUIDE.md)** for detailed instructions on:
- Frontend initialization (Next.js + Tailwind)
- Backend setup (NestJS + Prisma)
- Database configuration
- Environment variables
- Development server startup

## 📁 Project Structure

```
voice-bharat/
├── frontend/          # Next.js 14 app
├── backend/           # NestJS API
├── docs/              # Documentation
├── infra/             # Docker & K8s configs
├── docker-compose.yml # Local development
└── VOCH_SETUP_GUIDE.md
```

## 🎯 Core Features

### Phase 1 (MVP)
- ✅ User authentication (OAuth + JWT)
- ✅ Posts, polls, and commenting
- ✅ Profile management
- ✅ Follow/Friend system

### Phase 2
- 🚧 Reels (vertical video)
- 🚧 NGO verification & fundraisers
- 🚧 Gamification (XP, badges, levels)
- 🚧 Feed algorithm

### Phase 3
- 📅 E2EE messaging
- 📅 Payment integration (Razorpay)
- 📅 Advanced analytics
- 📅 Mobile apps (React Native)

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State)

**Backend:**
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- MongoDB (Messages)

**Infrastructure:**
- Docker
- Vercel (Frontend)
- Railway/AWS (Backend)

## 🔗 Links

- **Live Demo**: [voice-bharat.vercel.app](https://voice-bharat.vercel.app)
- **Documentation**: [VOCH_SETUP_GUIDE.md](./VOCH_SETUP_GUIDE.md)
- **Domain**: [voch.in](https://voch.in) (Coming Soon)

## 📝 Development Status

**Current Phase**: Foundation Setup ✅  
**Next Milestone**: User Authentication & Posts  
**Target Launch**: Q1 2026

## 🤝 Contributing

This is a private development project. For collaboration inquiries, please contact the repository owner.

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the people of India**
