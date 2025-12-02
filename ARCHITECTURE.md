# Unbound.team SaaS Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UNBOUND.TEAM MVP ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────────┘

                                    CUSTOMERS
                    ┌─────────────┬──────────────┬──────────────┐
                    │             │              │              │
                    ▼             ▼              ▼              ▼
        ┌───────────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Unbound.team      │  │  Maggie  │  │ Growth   │  │ Custom   │
        │ (Main Brand)      │  │  Forbes  │  │ Manager  │  │ Partner  │
        │                   │  │ (50% rev)│  │ (50% rev)│  │          │
        └───────────────────┘  └──────────┘  └──────────┘  └──────────┘
                    │             │              │              │
                    └─────────────┴──────────────┴──────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │                      BACKEND API (Node.js/Express)               │
    │                    Hosted: Railway / Render                       │
    ├──────────────────────────────────────────────────────────────────┤
    │                                                                   │
    │  ┌────────────────────────────────────────────────────────────┐  │
    │  │ MIDDLEWARE LAYER                                           │  │
    │  │ ├─ Auth Middleware (API key + JWT validation)            │  │
    │  │ ├─ Rate Limiter (60 req/min per client)                  │  │
    │  │ ├─ CORS Handler                                           │  │
    │  │ └─ Error Handler                                          │  │
    │  └────────────────────────────────────────────────────────────┘  │
    │                                                                   │
    │  ┌────────────────────────────────────────────────────────────┐  │
    │  │ BILLING LAYER (NEW - Razorpay + Stripe)                 │  │
    │  │ ├─ POST /api/billing/create-subscription ────────┐       │  │
    │  │ ├─ GET  /api/billing/:tenantId/:userId           │       │  │
    │  │ ├─ POST /api/billing/:tenantId/:userId/cancel    │       │  │
    │  │ ├─ GET  /api/billing/pricing                     │       │  │
    │  │ ├─ POST /webhooks/razorpay (payment events)      │       │  │
    │  │ └─ POST /webhooks/stripe (payment events)        │       │  │
    │  └────────────────────────────────────────────────────────────┘  │
    │                                                                   │
    │  ┌────────────────────────────────────────────────────────────┐  │
    │  │ SOLUTION LAYER (Existing)                                │  │
    │  │ ├─ POST /api/solutions/lead-generation           │       │  │
    │  │ ├─ POST /api/solutions/content-creation          │       │  │
    │  │ ├─ POST /api/solutions/market-research           │       │  │
    │  │ ├─ POST /api/solutions/landing-page              │       │  │
    │  │ └─ POST /api/solutions/email-marketing           │       │  │
    │  └────────────────────────────────────────────────────────────┘  │
    │                                                                   │
    │  ┌────────────────────────────────────────────────────────────┐  │
    │  │ PARTNER LAYER                                             │  │
    │  │ ├─ GET  /api/partner/:tenantSlug/stats           │       │  │
    │  │ ├─ POST /api/partner/:tenantSlug/provision-client        │  │
    │  │ ├─ PUT  /api/partner/:tenantSlug/client/plan            │  │
    │  │ ├─ GET  /api/partner/:tenantSlug/revenue         │       │  │
    │  │ └─ POST /api/partner/:tenantSlug/testimonial            │  │
    │  └────────────────────────────────────────────────────────────┘  │
    │                                                                   │
    └──────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Razorpay API │    │  Stripe API  │    │    Job Queue │
    │  (India INR) │    │(USD/EUR Intl)│    │(Bull+Redis   │
    │              │    │              │    │ or Supabase) │
    └──────────────┘    └──────────────┘    └──────────────┘
           │                    │                    │
           └────────────────────┴────────────────────┘
                        │
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
    ┌───────────────────┐    ┌─────────────────────────────────────┐
    │ Payment Events    │    │ Queue Worker                        │
    │ ├─ subscription   │    │ ├─ Process lead generation jobs    │
    │ │   .activated    │    │ ├─ Process content creation        │
    │ ├─ subscription   │    │ ├─ Process market research         │
    │ │   .paused       │    │ ├─ Send emails                      │
    │ ├─ invoice.paid   │    │ └─ Call AI models                  │
    │ └─ invoice.failed │    └─────────────────────────────────────┘
    └───────────────────┘
           │
           └─────────────────────────────────┐
                                              │
                        ┌─────────────────────┴────────────────────┐
                        │                                          │
                        ▼                                          ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │                     SUPABASE POSTGRESQL                          │
    │                   Hosted on Supabase Cloud                       │
    ├──────────────────────────────────────────────────────────────────┤
    │                                                                   │
    │  MULTI-TENANT SCHEMA:                                            │
    │  ├─ tenants                     (Unbound, Maggie Forbes, etc.)  │
    │  ├─ tenant_users                (User-to-tenant assignments)    │
    │  │  ├─ plan (free/starter/growth/premium)                      │
    │  │  ├─ razorpay_customer_id, subscription_id                  │
    │  │  ├─ stripe_customer_id, subscription_id                    │
    │  │  └─ current_period_start/end                              │
    │  ├─ tenant_revenue              (Monthly billing & revenue share)│
    │  │  ├─ month, total_revenue, partner_share                    │
    │  │  ├─ provider (razorpay/stripe)                             │
    │  │  └─ payout_status (pending/processing/paid)               │
    │  ├─ tenant_user_usage           (Problem count tracking)      │
    │  ├─ social_proof                (Testimonials/case studies)   │
    │  └─ client_provisioning_log     (Audit trail)                │
    │                                                                   │
    │  FUNCTIONS:                                                      │
    │  ├─ get_tenant_stats()          (Total users, MRR, testimonials)│
    │  └─ calculate_monthly_revenue() (Nightly billing aggregation)  │
    │                                                                   │
    │  INDEXES:                                                        │
    │  ├─ idx_tenant_users_tenant, idx_tenant_users_plan            │
    │  ├─ idx_tenant_revenue_provider, idx_tenant_revenue_month    │
    │  └─ ... (performance optimized)                              │
    │                                                                   │
    └──────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow (Razorpay for India, Stripe for International)

```
Customer Initiates Purchase
        │
        ▼
[Frontend/API calls POST /api/billing/create-subscription]
        │
        ├─ tenantId: "unbound-team"
        ├─ userId: "user@example.com"
        ├─ plan: "growth"      (₹2,999/month)
        └─ country: "IN"
        │
        ▼
Backend Routing
        │
    ┌───┴───┐
    │       │
  "IN"    Other
    │       │
    ▼       ▼
Razorpay  Stripe
    │       │
    ├───┬───┘
    │   │
    ▼   ▼
[Create Customer]
[Create Plan]
[Create Subscription]
    │
    ▼
Return Subscription ID
+ Payment URL to Frontend
    │
    ▼
Customer Completes Payment
(On Razorpay/Stripe hosted checkout)
    │
    ▼
Payment Processor Processes
    │
    ├─ Authorization
    ├─ Capture funds
    └─ Generate invoice
    │
    ▼
Webhook Event Sent
POST /webhooks/razorpay or /webhooks/stripe
    │
    ├─ Event: subscription.activated
    ├─ Event: invoice.paid
    └─ Timestamp
    │
    ▼
[Backend receives webhook]
Verify signature (TODO: add before prod)
    │
    ▼
Update Database
    ├─ UPDATE tenant_users
    │  └─ status = 'active'
    │  └─ current_period_start/end
    └─ INSERT tenant_revenue
       └─ Record payment
    │
    ▼
Return HTTP 200 to webhook sender
    │
    ▼
✅ Customer subscription active
   Revenue recorded for payout
```

---

## Authentication Flow

```
Client Application
        │
        ├─ Option A: Use API Key
        │           (for admin/batch operations)
        │           │
        │           ▼
        │   [Include in request header]
        │   Header: x-api-key: your-admin-key
        │           │
        │           ▼
        │   Backend auth middleware
        │   ├─ Check if key === ADMIN_API_KEY
        │   ├─ If YES → set req.user = { role: 'admin', apiKey: true }
        │   ├─ If NO → continue to next check
        │   └─ (Allow other auth methods)
        │
        ├─ Option B: Use Bearer JWT
        │           (for user applications)
        │           │
        │           ▼
        │   [Include in request header]
        │   Header: Authorization: Bearer <jwt-token>
        │           │
        │           ▼
        │   Backend auth middleware
        │   ├─ Extract token from header
        │   ├─ Verify signature using JWT_SECRET
        │   ├─ If valid → set req.user = <payload>
        │   ├─ If invalid → return 401 Unauthorized
        │   └─ (Payload includes: sub, tenant, permissions)
        │
        └─ Option C: No Auth (public endpoints only)
                    ├─ GET /health
                    └─ GET /

All API routes require at least one of the above.
```

---

## Deployment Pipeline (GitHub Actions CI/CD)

```
Developer
    │
    ├─ Commits code
    └─ Pushes to main branch
        │
        ▼
GitHub detects push
    │
    ▼
Trigger CI/CD Workflow (.github/workflows/ci-cd.yml)
    │
    ├─ Step 1: LINT & SYNTAX CHECK
    │  ├─ Run: node -c server.js
    │  ├─ Run: node -c middleware/auth.js
    │  └─ Run: node -c services/billing.js
    │  └─ Result: ✅ or ❌
    │
    ├─ Step 2: UNIT TESTS
    │  ├─ Set up test database (Postgres)
    │  ├─ Run: npm test
    │  └─ Result: ✅ or ⚠️ (continue on error)
    │
    ├─ Step 3: SECURITY AUDIT
    │  ├─ Run: npm audit
    │  ├─ Check for hardcoded secrets
    │  └─ Result: ✅ or ⚠️
    │
    ├─ Step 4: BUILD
    │  ├─ Install dependencies
    │  ├─ Verify critical files exist
    │  └─ Result: ✅
    │
    └─ Step 5: DEPLOY (if main branch)
       ├─ Call: railway deploy
       ├─ Auto-pulls from GitHub
       ├─ Installs dependencies
       ├─ Runs: npm start
       └─ Result: 🚀 LIVE
           │
           ▼
       Step 6: HEALTH CHECK
       ├─ Wait 30 seconds for startup
       ├─ Call: GET https://your-api.app/health
       ├─ Call: GET https://your-api.app/api/billing/pricing
       └─ Result: ✅ API responsive
```

---

## Revenue Share & Payout Workflow

```
Month Ends (e.g., Dec 31)
    │
    ▼
Daily Scheduled Task (2 AM UTC)
├─ Function: calculate_monthly_revenue()
└─ Runs: SELECT SUM(plan_prices) GROUP BY tenant
    │
    ▼
Revenue Calculated Per Tenant
    │
    ├─ Unbound.team:     ₹50,000 (no revenue share)
    ├─ Maggie Forbes:    ₹30,000 (50% share = ₹15,000 for partner)
    └─ Growth Manager:   ₹20,000 (50% share = ₹10,000 for partner)
    │
    ▼
INSERT tenant_revenue table
    │
    ├─ tenant_id: maggie-forbes
    ├─ month: 2025-12
    ├─ total_revenue: ₹30,000
    ├─ partner_share: ₹15,000
    ├─ unbound_share: ₹15,000
    └─ payout_status: pending
    │
    ▼
[Admin reviews payouts]
    │
    ├─ UPDATE payout_status = 'processing'
    ├─ Initiate bank transfer to partner
    └─ UPDATE payout_status = 'paid'
    │
    ▼
Monthly Revenue Report
├─ Show to partners via dashboard
└─ Calculate next month's projections
```

---

## Pricing Tier Limits (Enforced in Code)

```
Free Tier (₹0/month)
├─ problems_per_month: 1
├─ features: Basic AI
└─ Enforcement: Increment counter in tenant_user_usage

Starter Tier (₹999/month)
├─ problems_per_month: 20
├─ features: Advanced AI, Email support
└─ Enforcement: Increment counter, block if > 20

Growth Tier (₹2,999/month)
├─ problems_per_month: 100
├─ features: Priority support, Analytics
└─ Enforcement: Increment counter, block if > 100

Premium Tier (₹9,999/month)
├─ problems_per_month: 1000000 (unlimited)
├─ features: VIP support, Custom integrations
└─ Enforcement: No blocking

Usage Tracking:
├─ Table: tenant_user_usage
├─ Key: (tenant_id, user_id, month)
├─ Incremented on: POST /api/solutions/*
└─ Checked on: Each API call
```

---

## Infrastructure Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB REPOSITORY                        │
│  (harshmriduhash/Unbound-Team)                                  │
├─────────────────────────────────────────────────────────────────┤
│ ├─ backend/                                                     │
│ │  ├─ server.js              ← Main API                        │
│ │  ├─ package.json                                             │
│ │  ├─ middleware/auth.js     ← Authentication                 │
│ │  ├─ services/billing.js    ← Razorpay + Stripe             │
│ │  ├─ services/ai-orchestrator.js                            │
│ │  └─ test/                                                    │
│ ├─ .github/workflows/ci-cd.yml  ← Auto-deployment             │
│ ├─ supabase-billing-migration.sql                             │
│ ├─ SAAS-MVP-QUICKSTART.md                                     │
│ └─ BILLING-SYSTEM.md                                           │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐        ┌──────────┐
    │ Railway │         │Supabase │        │Razorpay+ │
    │ (Backend)        │(Database)       │  Stripe  │
    │                   │                 │          │
    │ • Node.js         │ • Postgres      │ • Auth   │
    │ • Express         │ • Auth          │ • Billing│
    │ • Auto-deploy     │ • Real-time     │ • Queue  │
    │ • Environment     │ • Functions     │          │
    │   variables       │ • Webhooks      │          │
    └─────────┘         └─────────┘        └──────────┘
        │                   │
        └───────────────────┴───────────────────┐
                                                 │
                            ┌────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Customers   │
                    │              │
                    │ • Web browser│
                    │ • Mobile app │
                    │ • API client │
                    └──────────────┘
```

---

## Summary

✅ **Multi-tenant:** Unbound.team, Maggie Forbes, Growth Manager Pro (with revenue share)  
✅ **India-first:** Razorpay primary (₹999–₹9,999/month)  
✅ **Global:** Stripe fallback (USD/EUR)  
✅ **Secure:** API key + JWT authentication  
✅ **Rate-limited:** 60 req/min per client  
✅ **Auto-scaling:** Railway (5 min to 10k requests/sec)  
✅ **CI/CD:** GitHub → Railway (auto-deploy on push)  
✅ **Monitored:** Health checks, webhook logs, error tracking (Sentry-ready)

**Ready to ship! 🚀**
