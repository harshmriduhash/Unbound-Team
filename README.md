# 🚀 Unbound.team

**Your Autonomous AI Team - Unbound from Big Tech**

A fully automated AI workforce that solves entrepreneur problems 24/7, grows through word-of-mouth on the open internet, and operates completely independent of Big Tech platforms.

---

## 🎯 What We Built (Phase 1 - COMPLETE ✅)

### SaaS MVP Core Features

1. **Multi-Tenant Billing System** - Razorpay (India) + Stripe (International)
   - Tiered pricing: Free, Starter, Growth, Premium
   - Server-side checkout with Razorpay order creation and Stripe session
   - Webhook signature verification (prevents payment spoofing)
   - Revenue tracking and partner revenue share

2. **User Authentication** - Supabase Auth
   - Email/password signup and login
   - Session management via JWT
   - Protected routes with `PrivateRoute` component
   - Tenant isolation and multi-tenant support

3. **React Frontend** - Vite + React 18
   - Home page with hero and features
   - Authentication pages (signup/login)
   - Protected dashboard with problems/products listing
   - Billing page with checkout integration
   - Tailwind CSS styling
   - API proxy for dev (Vite → backend)

4. **Express Backend** - Production-ready API
   - API key + JWT authentication middleware
   - Rate limiting (60 req/min per IP)
   - Billing endpoints (create subscription, get status, cancel)
   - Webhook endpoints with signature verification
   - Static frontend serving in production
   - Graceful service initialization and shutdown

5. **Database Schema** - Multi-tenant Supabase/Postgres
   - `tenants` - Partner/workspace tenants
   - `tenant_users` - Users with plan, billing details
   - `tenant_revenue` - Revenue tracking by month
   - `tenant_user_usage` - Per-user usage metering
   - `problems`, `products_listed` - Community content
   - Support for Razorpay and Stripe subscription tracking

6. **CI/CD Pipeline** - GitHub Actions
   - Auto-build frontend (Vite) and backend (Node syntax check)
   - Optional Vercel deploy for frontend
   - Optional Railway deploy for backend
   - Artifact upload for multi-stage deployment

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Node.js 18+ + Express 4.18
- **Billing:** Razorpay SDK, Stripe SDK
- **Database:** Supabase (PostgreSQL) + Supabase Auth
- **Rate Limiting:** express-rate-limit
- **Auth:** jsonwebtoken (JWT)
- **AI APIs:** Anthropic Claude, OpenAI GPT, Google Gemini (optional)
- **Queue:** Bull + Redis (optional for background jobs)

### Frontend
- **Build Tool:** Vite 5.0
- **Framework:** React 18.2 + React Router 6.14
- **Database Client:** @supabase/supabase-js
- **Styling:** Tailwind CSS (CDN)
- **HTTP Client:** Axios

### Infrastructure
- **Production Deploy:** Railway (backend), Vercel (frontend), or AWS
- **Database:** Supabase (managed PostgreSQL)
- **CI/CD:** GitHub Actions
- **Webhooks:** Razorpay, Stripe

---

## 📁 Project Structure

```
unbound-team/
├── backend/
│   ├── config/
│   │   └── ai-models.js         # AI model configuration and costs
│   ├── services/
│   │   ├── ai-orchestrator.js   # Multi-model AI routing
│   │   ├── ai-providers.js      # Individual AI API clients
│   │   ├── lead-scraper.js      # Lead generation engine
│   │   ├── notifications.js     # Discord notification system
│   │   └── task-queue.js        # Background job processor
│   ├── test/
│   │   ├── test-orchestrator.js # Test AI orchestrator
│   │   ├── test-task-queue.js   # Test queue system
│   │   ├── test-notifications.js # Test Discord alerts
│   │   └── test-lead-generation.js # Test lead scraper
│   ├── server.js                # Express API server
│   └── package.json
├── api/
│   └── lead-generation.js       # Vercel serverless function
├── dashboard.html               # Admin dashboard
├── test-leads.html             # Lead generation test page
├── BUILD-GUIDE.md              # Complete build strategy
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis instance (local or managed)
- API keys for AI providers (see below)
- Supabase account
- Discord webhook (optional but recommended)

### 1. Clone & Install

```bash
git clone https://github.com/HarshMriduhash/Unbound-Team.git
cd unbound-team/backend
npm install
```

### 2. Environment Setup

Create `backend/.env`:

```bash
# AI API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
PERPLEXITY_API_KEY=pplx-xxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxx

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Discord Notifications (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Cost Protection
DAILY_SPENDING_CAP=5.00
```

### 3. Start Redis

```bash
# Local Redis
redis-server

# Or use managed Redis (Railway, Upstash, etc.)
```

### 4. Run Backend

```bash
cd backend
npm start

# Or for development with auto-reload
npm run dev
```

### 5. Test the System

```bash
# Test AI Orchestrator
npm run test

# Test Task Queue
npm run test:queue

# Test Notifications
npm run test:notifications

# Test Lead Generation
node test/test-lead-generation.js
```

### 6. Access Dashboard

Open `dashboard.html` in your browser to monitor the system in real-time.

---

## 🎯 How It Works

### Lead Generation Example

1. **User submits request** via test-leads.html:
   - Target industry: "high-end business clients seeking business strategist"
   - Location: "global"
   - Count: 10 leads
   - Min fit score: 8/10

2. **AI generates search strategy:**
   - Identifies target subreddits, forums, blogs
   - Creates search queries optimized for target audience
   - Determines scraping priorities

3. **Autonomous scraping:**
   - Reddit communities (r/Entrepreneur, r/startups, etc.)
   - Indie Hackers forums
   - Product Hunt discussions
   - Business strategy blogs

4. **AI enrichment:**
   - Analyzes each lead's content
   - Identifies pain points and challenges
   - Generates fit score (1-10)
   - Creates personalized outreach strategy

5. **Delivery:**
   - CSV export with all lead data
   - JSON format for API integration
   - Summary statistics (avg fit score, sources, etc.)

### Cost Optimization

The AI Orchestrator automatically routes tasks to the cheapest available model:

1. **Gemini 1.5 Flash** (Free, 1500 req/day) - Try first
2. **GPT-4o-mini** ($0.15/1M tokens) - Fallback for simple tasks
3. **Claude Haiku** ($0.25/1M tokens) - Fast decisions
4. **Perplexity** - Research only
5. **Claude Sonnet** - Complex problems (use sparingly)

Daily spending cap prevents runaway costs.

---

## 🔧 API Endpoints

### Lead Generation

```bash
POST /api/solutions/lead-generation
Content-Type: application/json

{
  "userId": "user-123",
  "targetIndustry": "SaaS founders",
  "location": "global",
  "criteria": {
    "count": 10,
    "minScore": 6,
    "industry": "SaaS"
  }
}

Response: { "success": true, "jobId": "123" }
```

### Content Creation

```bash
POST /api/solutions/content-creation
Content-Type: application/json

{
  "userId": "user-123",
  "topic": "How to validate SaaS ideas",
  "keywords": ["saas", "validation", "mvp"],
  "tone": "professional",
  "wordCount": 1500
}
```

### Market Research

```bash
POST /api/solutions/market-research
Content-Type: application/json

{
  "userId": "user-123",
  "idea": "AI-powered email assistant",
  "industry": "productivity software",
  "competitors": ["Superhuman", "Front"]
}
```

### Job Status

```bash
GET /api/queue/:queueName/job/:jobId

Response: {
  "id": "123",
  "state": "completed",
  "progress": 100,
  "result": { ... }
}
```

### Queue Stats

```bash
GET /api/queue/stats

Response: {
  "leadGeneration": {
    "waiting": 0,
    "active": 1,
    "completed": 45,
    "failed": 2
  }
}
```

---

## 📊 Monitoring & Alerts

### Discord Notifications

Automatic alerts for:

- ✅ **Job Completed** - When background jobs finish successfully
- ❌ **Job Failed** - When jobs encounter errors
- ⚠️ **Job Stalled** - When jobs are stuck
- 💰 **Spending Alerts** - At 50%, 75%, 90%, 100% of daily cap
- 📈 **Daily Summary** - Queue stats and cost breakdown

### Admin Dashboard

Real-time monitoring:

- Active jobs in each queue
- Completed/failed job counts
- AI model usage statistics
- Daily spending tracker
- Cost per model breakdown
- Auto-refresh every 5 seconds

---

## 🧪 Testing

### Test AI Orchestrator

```bash
npm run test
```

Tests:
- Multi-model routing
- Cost calculation
- Daily cap enforcement
- Automatic fallback
- Usage tracking

### Test Task Queue

```bash
npm run test:queue
```

Tests:
- Job creation
- Background processing
- Retry logic
- Event notifications
- Queue statistics

### Test Lead Generation

```bash
node backend/test/test-lead-generation.js
```

Generates 10 real leads for "SaaS founders" and exports to CSV.

---

## 🚧 Deployment

### Backend (Railway/Render)

1. Create new project on Railway or Render
2. Connect GitHub repo
3. Add environment variables
4. Deploy backend service
5. Add Redis addon

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set root directory: `.`
3. Add environment variables (Supabase, API URL)
4. Deploy

### Redis

Options:
- **Upstash** - Free tier, serverless Redis
- **Railway** - Built-in Redis addon
- **Render** - Managed Redis
- **Self-hosted** - Docker container

---

## 💰 Cost Estimates

### Free Tier Usage
- Gemini: $0 (1500 requests/day free)
- Vercel: $0 (hobby plan)
- Supabase: $0 (free tier)
- Upstash Redis: $0 (free tier)

### Paid API Usage (at $5/day cap)
- GPT-4o-mini: ~$1-2/day
- Claude Haiku: ~$1-2/day
- Perplexity: ~$1/day (if used)

### Monthly Operating Cost: $50-150

At 10 paying users ($50/month each): $500 revenue - $150 costs = $350 profit (70% margin)

---

## 📅 Build Phases

### ✅ Phase 1: Foundation (COMPLETE)
- [x] API cost protection system
- [x] Multi-model AI orchestrator
- [x] Task queue with 7 specialized queues
- [x] Discord notification system
- [x] Admin dashboard
- [x] Lead generation MVP
- [x] Testing suite

### 🚧 Phase 2: Discovery & Growth Engine (NEXT)
- [ ] RSS feed monitor (indie blogs, news)
- [ ] Forum scraper (find entrepreneur questions)
- [ ] Blog comment analyzer
- [ ] Web mention monitor
- [ ] Blogger outreach automation

### 📋 Phase 3: Complete Solutions (Weeks 5-6)
- [ ] Content creation system
- [ ] Market research automation
- [ ] Landing page builder
- [ ] Email marketing campaigns

### 🌱 Phase 4: Word-of-Mouth Growth (Weeks 7-8)
- [ ] Referral tracking
- [ ] Case study generator
- [ ] Testimonial automation
- [ ] Auto-reach referred audiences

### ⚡ Phase 5: Optimization (Weeks 9-10)
- [ ] Performance improvements
- [ ] Cost reduction
- [ ] Caching layer
- [ ] Analytics dashboard

---

## 🎯 Next Steps

1. **Deploy backend to Railway/Render** for 24/7 operation
2. **Test Maggie Forbes Strategies lead generation** - Find 10 high-end business clients seeking strategist for optimization and scaling
3. **Begin Phase 2** - Build discovery engine for organic growth
4. **Set up cron jobs** - Automated daily tasks
5. **Enable monitoring** - Production alerts and dashboards

---

## 📚 Documentation

- **BUILD-GUIDE.md** - Complete build strategy and philosophy
- **backend/config/ai-models.js** - AI model configuration
- **backend/services/** - Core service documentation
- **test/** - Testing examples and usage

---

## 🤝 Philosophy

**Anti-Big Tech:** No reliance on Facebook, Twitter, LinkedIn, TikTok

**Open Internet:** Leverage blogs, forums, RSS, indie media

**Word of Mouth:** Grow through genuine value and referrals

**Fully Automated:** AI operates 24/7 without human intervention

**Cost-Effective:** Use free tiers and cheapest models first

**Results-Based:** Only charge when we deliver tangible value

---

## 🔗 Links

- **GitHub:** https://github.com/HarshMriduhash/Unbound-Team
- **Vercel:** https://unboundteam-three.vercel.app
- **Dashboard:** /dashboard.html
- **Test Leads:** /test-leads.html

---

**Phase 1 complete. Let's deploy and test.**
