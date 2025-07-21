# Creativity Assessment Web Application

A Next.js web application for conducting creativity research experiments with ChatGPT integration. Participants can complete divergent and convergent thinking tasks while all interactions and telemetry data are captured for research analysis.

## ✨ Features

- **🎨 Divergent Thinking Tasks** - Open-ended creative exploration with AI assistance
- **🎯 Remote Associates Test (RAT)** - Structured convergent thinking challenges with research-based word sets
- **💬 ChatGPT Integration** - Real-time AI conversation for enhanced creative processes
- **📊 Comprehensive Data Logging** - Complete telemetry capture including user interactions, browser data, and task performance
- **🔗 Qualtrics Integration** - URL parameter support for seamless research workflow integration
- **📱 Responsive Design** - Beautiful glassmorphism UI with animated backgrounds
- **⚡ Vercel Deployment Ready** - Optimized for easy cloud deployment

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd creativity_assesment
npm install
```

### 2. Environment Setup
Copy `.env.local` and configure:
```bash
# Required for AI functionality
OPENAI_API_KEY=sk-your-openai-api-key-here

# Required for data logging in production (optional for development)
POSTGRES_URL=your-vercel-postgres-connection-string
```

### 3. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Configuration

### OpenAI API Setup
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`: `OPENAI_API_KEY=sk-your-key-here`
3. Restart the development server

### Database Setup (Production)
1. Create a [Vercel Postgres](https://vercel.com/storage/postgres) database
2. Copy connection string to `.env.local`
3. Run the SQL migration from `interactions.sql`

**Note:** The app works without database configuration in development - data will be logged to console.

## 📊 Data Collection

The application captures comprehensive telemetry data:

- **User Interactions**: All messages, timestamps, and response times
- **Task Performance**: RAT round progression, word sets, completion status
- **Browser Telemetry**: Screen resolution, viewport, timezone, user agent
- **Session Data**: Qualtrics ID, task type, IP address
- **System Events**: API calls, errors, navigation patterns

## 🎯 Remote Associates Test (RAT)

Features 15 research-based word sets from Bowden and Jung-Beeman (2003):
- 2-round structure with random word selection
- Progress tracking and completion detection
- AI-assisted thinking and discussion
- Comprehensive performance logging

Example word set: `["cottage", "swiss", "cake"]` → Answer: `"cheese"`
