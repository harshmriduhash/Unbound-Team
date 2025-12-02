# 🚀 Unbound.team - India-First SaaS MVP

**Status:** ✅ Production-Ready MVP (Dec 2, 2025)

An autonomous AI workforce platform with **multi-tenant architecture**, **India-first billing** (Razorpay + Stripe), and **API-key + JWT authentication**. Deploy to production in <4 hours.

---

## Quick Links

- **📘 Get Started:** [`SAAS-MVP-QUICKSTART.md`](./SAAS-MVP-QUICKSTART.md) — Deploy in 5 steps
- **💳 Billing Docs:** [`BILLING-SYSTEM.md`](./BILLING-SYSTEM.md) — Razorpay, Stripe, webhooks
- **📊 Implementation:** [`MVP-IMPLEMENTATION-SUMMARY.md`](./MVP-IMPLEMENTATION-SUMMARY.md) — What's built, roadmap
- **🔐 Original Docs:** [`README.md`](./README.md) — Full feature list

---

## What's Included

### ✅ Production Features

| Feature | Status | Details |
|---------|--------|---------|
| **Multi-tenant** | ✅ | Unbound.team, Maggie Forbes, Growth Manager Pro |
| **Razorpay billing** | ✅ | INR payments for India (₹999–₹9,999/month) |
| **Stripe fallback** | ✅ | USD/EUR for international customers |
| **Authentication** | ✅ | API Key + JWT Bearer token |
| **Rate limiting** | ✅ | 60 req/min per client (configurable) |
| **Webhooks** | ✅ | Auto-update subscriptions on payment events |
| **Revenue tracking** | ✅ | Monthly revenue per tenant + partner payouts |
| **Job queue** | ✅ | Bull + Redis for async tasks |
| **AI orchestration** | ✅ | OpenAI, Anthropic, Google Generative AI |
| **5 core solutions** | ✅ | Lead gen, content, market research, landing page, email |

### 🔧 Tech Stack

```
Frontend:       Vercel, React/Next.js (optional)
Backend:        Node.js + Express (Railway/Render)
Database:       Supabase (Postgres)
Payments:       Razorpay, Stripe
Queue:          Bull (Redis) / Supabase
Auth:           JWT + API Keys
Deployment:     GitHub → Railway (auto-deploy)
```

### 📁 Key Files

```
backend/
  ├── middleware/auth.js              # Auth middleware (API key + JWT)
  ├── services/billing.js             # Razorpay + Stripe integration
  └── server.js                        # Main API server (with billing endpoints)

.env.sample                            # Required secrets template
supabase-billing-migration.sql        # DB schema for billing
.github/workflows/ci-cd.yml           # Auto-deployment CI/CD

SAAS-MVP-QUICKSTART.md                # ⭐ Start here
BILLING-SYSTEM.md                     # Billing API reference
MVP-IMPLEMENTATION-SUMMARY.md         # What's built, roadmap
```

---

## Deploy in 4 Hours

### 1. Prerequisites (30 min)

```bash
# Get accounts:
# - Supabase (free tier)
# - Razorpay (free, ~$10/year live)
# - Railway or Render (free tier)

# Get keys:
# - Razorpay: https://razorpay.com/settings/api-keys
# - Stripe: https://dashboard.stripe.com/apikeys (optional)
```

### 2. Database (30 min)

```sql
-- In Supabase SQL Editor, run:
-- 1. supabase-multi-tenant-schema.sql
-- 2. supabase-billing-migration.sql
```

### 3. Configure (30 min)

```bash
# Copy template
cp .env.sample .env

# Fill in secrets
SUPABASE_URL=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
# etc.
```

### 4. Deploy (60 min)

```bash
cd backend
npm install
npm run dev                    # Test locally

git push origin main          # Auto-deploys via Railway
# Verify: https://your-railway-url.app/health

# Set up webhooks in Razorpay & Stripe dashboards
```

### 5. Test (30 min)

```bash
# Create subscription
curl -X POST https://your-api.app/api/billing/create-subscription \
  -H "x-api-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "unbound-team",
    "userId": "test@example.com",
    "plan": "starter",
    "country": "IN"
  }'

# Check status
curl https://your-api.app/api/billing/unbound-team/test@example.com \
  -H "x-api-key: your-admin-key"
```

✅ **You're live!**

See [`SAAS-MVP-QUICKSTART.md`](./SAAS-MVP-QUICKSTART.md) for detailed step-by-step.

---

## API Overview

### Authentication

All `/api/*` endpoints require **one of**:

```bash
# Option 1: Admin API Key (header)
curl https://api.example.com/api/billing/pricing \
  -H "x-api-key: your-admin-key"

# Option 2: Bearer JWT (header)
curl https://api.example.com/api/billing/pricing \
  -H "Authorization: Bearer <jwt-token>"
```

### Billing Endpoints

```bash
# Create subscription
POST /api/billing/create-subscription
  { tenantId, userId, plan, country }

# Get billing status
GET /api/billing/:tenantId/:userId

# Cancel subscription
POST /api/billing/:tenantId/:userId/cancel

# List pricing tiers
GET /api/billing/pricing

# Webhooks (no auth required)
POST /webhooks/razorpay
POST /webhooks/stripe
```

### Solution Endpoints (Job Queue)

```bash
# Submit job
POST /api/solutions/lead-generation
  { userId, targetIndustry, location, criteria }

# Check status
GET /api/solutions/lead-generation/status/:jobId

# Similar for:
# - /api/solutions/content-creation
# - /api/solutions/market-research
# - /api/solutions/landing-page
# - /api/solutions/email-marketing
```

See [`BILLING-SYSTEM.md`](./BILLING-SYSTEM.md) for full API reference.

---

## Pricing Tiers

| Plan | INR/mo | USD/mo | EUR/mo | Features |
|------|--------|--------|--------|----------|
| **Free** | ₹0 | $0 | €0 | 1 problem/month |
| **Starter** | ₹999 | $12 | €11 | 20 problems, email support |
| **Growth** | ₹2,999 | $36 | €33 | 100 problems, priority support |
| **Premium** | ₹9,999 | $120 | €110 | Unlimited, VIP support |

---

## Partner Revenue Share

Share revenue with partners (Maggie Forbes, Growth Manager Pro, etc.):

```
Partner A: 50% revenue share
┌─ Month 1: ₹10,000 revenue
├─ Partner gets: ₹5,000
└─ Unbound gets: ₹5,000

Partner B: 30% revenue share
┌─ Month 1: ₹5,000 revenue
├─ Partner gets: ₹1,500
└─ Unbound gets: ₹3,500
```

Automatic calculation via `calculate_monthly_revenue()` function.

---

## Architecture

### Multi-Tenancy

```
Supabase Postgres
├── tenants              # Partner brands
├── tenant_users         # User-to-tenant assignment + subscription
├── tenant_revenue       # Monthly billing & payouts
├── tenant_user_usage    # Problem count tracking
├── social_proof         # Testimonials/case studies
└── client_provisioning_log  # Audit trail
```

### Payment Flow

```
Customer
   ↓
[API: POST /api/billing/create-subscription]
   ↓
Backend [Detect country: India → Razorpay, else → Stripe]
   ↓
Create subscription in payment processor
   ↓
Return subscription ID + payment URL
   ↓
Customer pays on Razorpay/Stripe hosted page
   ↓
Webhook fires on payment success
   ↓
[API: POST /webhooks/razorpay or /webhooks/stripe]
   ↓
Update subscription status in database
   ↓
Record revenue for monthly payout
```

---

## Security Checklist

- ✅ API key + JWT authentication
- ✅ Rate limiting (60 req/min)
- ✅ CORS enabled
- ✅ Secrets in `.env` (never committed)
- ⚠️ TODO: Supabase Row-Level Security (RLS) policies
- ⚠️ TODO: Webhook signature verification

See [`MVP-IMPLEMENTATION-SUMMARY.md`](./MVP-IMPLEMENTATION-SUMMARY.md) for post-MVP security hardening.

---

## Monitoring & Logs

### Health Check

```bash
curl https://your-api.app/health
```

### Webhook Logs

- **Razorpay:** Dashboard → Settings → Webhooks → Logs
- **Stripe:** Dashboard → Developers → Webhooks → Logs

### Application Logs

```bash
# Via Railway dashboard or:
railway logs
```

### Add Error Tracking (Optional)

```bash
# Install Sentry
npm install --save @sentry/node

# Update .env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## Roadmap

### This Week
- [ ] Deploy to production
- [ ] Configure webhooks
- [ ] Test end-to-end
- [ ] Invite 5–10 beta customers

### Next 2 Weeks
- [ ] Add Supabase RLS policies
- [ ] Implement usage limit enforcement
- [ ] Build customer billing portal
- [ ] Add email notifications

### Month 2
- [ ] Partner dashboard
- [ ] Affiliate program
- [ ] Usage analytics
- [ ] Advanced billing features

See [`MVP-IMPLEMENTATION-SUMMARY.md`](./MVP-IMPLEMENTATION-SUMMARY.md#post-mvp-roadmap-2–4-weeks) for full roadmap.

---

## Troubleshooting

### "Razorpay subscription not created"
- Verify `RAZORPAY_KEY_ID` starts with `rzp_test_` (test mode)
- Check credentials at https://razorpay.com/settings/api-keys

### "Webhook not received"
- Verify API URL is publicly accessible: `curl https://your-url/health`
- Check webhook logs in Razorpay/Stripe dashboard
- Ensure endpoint returns HTTP 200

### "Revenue not calculating"
- If using free Supabase, schedule cron job in Node app (see docs)
- Check `tenant_revenue` table for records

See [`BILLING-SYSTEM.md`](./BILLING-SYSTEM.md#troubleshooting) for more troubleshooting.

---

## Testing

### Local Testing

```bash
cd backend
npm install
npm run dev

# In another terminal:
curl http://localhost:3001/health
```

### Integration Tests

```bash
# (Test suite to be expanded)
npm run test
```

### GitHub Actions CI/CD

Push to `main` branch → Auto-runs:
- ✅ Lint & syntax checks
- ✅ Unit tests
- ✅ Security audit
- ✅ Build verification
- ✅ Deploy to Railway
- ✅ Health check

---

## Cost Estimate

| Service | Tier | Cost/mo |
|---------|------|---------|
| Supabase | Pro | $25 |
| Railway | Starter | $5–10 |
| Razorpay | Pay-as-you-go | 2% revenue |
| Stripe | Pay-as-you-go | 2.2% + $0.30 |
| **Total Fixed** | — | **$30–35** |

Plus transaction fees (~2–2.5% of revenue).

---

## Support

- **Deployment:** [`SAAS-MVP-QUICKSTART.md`](./SAAS-MVP-QUICKSTART.md)
- **Billing:** [`BILLING-SYSTEM.md`](./BILLING-SYSTEM.md)
- **Architecture:** [`MVP-IMPLEMENTATION-SUMMARY.md`](./MVP-IMPLEMENTATION-SUMMARY.md)
- **Razorpay Docs:** https://razorpay.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Railway Docs:** https://docs.railway.app

---

## License

MIT

---

## 🎉 Ready to Launch?

1. Read [`SAAS-MVP-QUICKSTART.md`](./SAAS-MVP-QUICKSTART.md)
2. Get Razorpay + Supabase accounts
3. Configure `.env`
4. Deploy to Railway
5. Invite beta customers
6. Monitor logs
7. Scale 🚀

**Questions?** Check the docs or reach out!
