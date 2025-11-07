#!/bin/bash

# VOCH Platform - Quick Setup Script
# This script helps you set up the development environment quickly

set -e  # Exit on error

echo "🚀 VOCH Platform Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "${YELLOW}⚠ Backend .env file not found. Copying from .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo "${GREEN}✓ Created backend/.env${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo "${YELLOW}⚠ Frontend .env file not found. Copying from .env.example...${NC}"
    cp frontend/.env.example frontend/.env
    echo "${GREEN}✓ Created frontend/.env${NC}"
fi

echo ""
echo "${GREEN}✓ Environment files ready${NC}"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Full setup (recommended for first time)"
echo "2) Start services only"
echo "3) Stop all services"
echo "4) View logs"
echo "5) Clean everything and restart"
read -p "Enter your choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "${YELLOW}Starting full setup...${NC}"
        echo ""
        
        # Stop any existing containers
        echo "Stopping existing containers..."
        docker-compose down
        
        # Build and start services
        echo ""
        echo "Building and starting all services..."
        docker-compose up -d --build
        
        # Wait for PostgreSQL to be ready
        echo ""
        echo "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Run database migrations
        echo ""
        echo "Running database migrations..."
        docker-compose exec -T backend npx prisma migrate deploy
        
        # Seed database
        echo ""
        echo "Seeding database with initial data..."
        docker-compose exec -T backend npx prisma db seed
        
        echo ""
        echo "${GREEN}✅ Setup complete!${NC}"
        echo ""
        echo "Services are running:"
        echo "  - Backend API: http://localhost:3000"
        echo "  - API Docs: http://localhost:3000/api"
        echo "  - Frontend: http://localhost:3001"
        echo "  - MailHog: http://localhost:8025"
        echo "  - MinIO Console: http://localhost:9001"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop services: docker-compose down"
        ;;
    2)
        echo ""
        echo "${YELLOW}Starting services...${NC}"
        docker-compose up -d
        echo "${GREEN}✅ Services started${NC}"
        ;;
    3)
        echo ""
        echo "${YELLOW}Stopping all services...${NC}"
        docker-compose down
        echo "${GREEN}✅ Services stopped${NC}"
        ;;
    4)
        echo ""
        echo "${YELLOW}Showing logs (Press Ctrl+C to exit)...${NC}"
        docker-compose logs -f
        ;;
    5)
        echo ""
        echo "${RED}⚠ This will remove all data. Are you sure? (y/n)${NC}"
        read -p "" confirm
        if [ "$confirm" = "y" ]; then
            echo "${YELLOW}Cleaning everything...${NC}"
            docker-compose down -v
            docker system prune -f
            echo "${GREEN}✅ Cleaned${NC}"
            echo ""
            echo "Run option 1 to set up again."
        else
            echo "Cancelled."
        fi
        ;;
    *)
        echo "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
