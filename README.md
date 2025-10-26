# ThumbGen - AI-Powered YouTube Thumbnail Generator

## AI-Powered Thumbnail Creation Platform

A full-stack web application that leverages generative AI to create compelling YouTube thumbnails. Built with modern technologies and optimized for performance with real-time updates using WebSockets.

[![Live Demo]](http://43.204.220.56/)

## 🎯 Overview

ThumbGen addresses the challenge of creating eye-catching YouTube thumbnails quickly and efficiently. It features an intuitive interface where users can input their video details and receive AI-generated thumbnail suggestions. The application uses a queue system for handling multiple requests and WebSockets for real-time progress updates.

## ✨ Key Features

- **AI-Powered Generation**: Leverage Gemini Nano Banana for intelligent thumbnail creation
- **Real-Time Updates**: WebSocket-based progress tracking for thumbnail generation
- **Queue Management**: Efficient request handling with background worker processing
- **User Authentication**: Secure login and user management with Clerk
- **Generation History**: Track and revisit your previously generated thumbnails
- **Responsive Design**: Optimized for all devices and screen sizes
- **Cloud Storage**: Secure thumbnail storage with AWS S3

## 🛠️ Tech Stack

### Frontend

- **Next.js** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### Backend

- **Node.js** - JavaScript runtime
- **WebSockets** - Real-time bi-directional communication
- **Queue System** - Background job processing

### Database & ORM

- **PostgreSQL** - Relational database
- **Prisma** - Type-safe database access

### AI/ML

- **Generative AI** - AI models for content generation
- **Gemini Nano Banana** - Image generation AI

### Authentication

- **Clerk** - Authentication and user management

### Infrastructure & Deployment

- **AWS** - Cloud infrastructure
- **AWS S3** - Object storage for thumbnails
- **Docker** - Containerization
- **Nginx** - Web server and reverse proxy
- **GitHub Actions** - CI/CD pipeline

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v14 or higher)
- Docker (optional, for containerized deployment)

## 🚀 Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shashivardhan-dev/ThumbGen.git
cd ThumbGen
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env

# Application
NEXTAUTH_SECRET=replace_with_random_secret
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/thumbgen"
DIRECT_URL=your_postgres_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_bucket_name

# AI API Keys
GEMINI_AI_API_KEY=your_gemini_api_key      // for suggestions
SUGGESTION_OPENAI_KEY=your_gemini_api_key  //for image generation 

# Redis
REDIS_HOST=redis_host
REDIS_PORT=10127
REDIS_PASSWORD=redis_password
REDIS_USERNAME=default
```

### 4. Database Setup

Run Prisma migrations to set up your database:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Development Mode

Start the development server with concurrent processes (Next.js + Worker):

```bash
npm run dev
```

This will start:

- Next.js development server on `http://localhost:3000`
- Thumbnail worker process
- WebSocket server for real-time updates

### 6. Build for Production

```bash
# Build Next.js application
npm run build

# Build server components
npm run build:server

# Build worker processes
npm run build:workers

# Start server
node build/server.js

# Start worker
node build/workers/thumbnailWorker.js
```

## 📜 Available Scripts

```bash
# Development with hot reload
npm run dev

# Build Next.js application
npm run build

# Lint code
npm run lint

# Lint and fix issues
npm run lint:fix

# Build server TypeScript files
npm run build:server

# Build worker TypeScript files
npm run build:workers
```

## 🏗️ Project Structure

```markdown
ThumbGen/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   ├── server.ts         # WebSocket server
│   └── workers/          # Background workers
│       └── thumbnailWorker.ts
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── tsconfig.json         # TypeScript configuration
├── tsconfig.server.json  # Server TypeScript config
├── tsconfig.workers.json # Workers TypeScript config
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## 🔑 Demo Credentials

Try the live demo at [http://43.204.220.56/](http://43.204.220.56/)

**Test Account:**

- Email: `shashiavardhan.dev@gmail.com`
- Password: `demo123`

## 🎥 Video Demo

Watch the project walkthrough: [Video](https://ik.imagekit.io/shashi/Project%20Demo/ThumbGen_Demo_Video.mp4?updatedAt=1761504903073)

## 👨‍💻 Author

# Shashivardhan

- Email: shashiavardhan.dev@gmail.com
- GitHub: [@shashivardhan-dev](https://github.com/shashivardhan-dev)
