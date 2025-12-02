# SaaS MVP Quick Start Guide

This guide gets your India-first SaaS (Unbound.team) running in production with billing, multi-tenancy, and authentication.

---

## Prerequisites

- **Node.js** 18+ 
- **Supabase** project (free tier is fine for MVP)
- **Razorpay** account (free for testing; ~$10 annual for live)
- **Stripe** account (optional; fallback for international)
- **Railway** or **Render** for backend hosting
- **Vercel** for frontend (optional; included in repo)

---

## Step 1: Set Up Supabase Database

### 1a. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Choose region (ideally Singapore or Mumbai for India)
3. Note your **Project URL** and **Service Role Key**

### 1b. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor** → **New Query**
2. Copy and run the contents of these files in order:
   - `supabase-multi-tenant-schema.sql` (main multi-tenant schema)
   - `supabase-billing-migration.sql` (add billing fields)
   - (Other schema files as needed)

3. Verify tables created: `tenants`, `tenant_users`, `tenant_revenue`, `tenant_user_usage`, `social_proof`

---

## Step 2: Get Payment Processor Credentials

### 2a. Razorpay (Required for India)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings** → **API Keys**
3. Note your **Key ID** and **Key Secret**
4. In production, enable "Live Mode" and replace test keys

### 2b. Stripe (Optional; for international)

1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Developers** → **API Keys**
3. Note your **Secret Key** and **Publishable Key**

---

## Step 3: Configure Environment

1. In your project root, copy `.env.sample` to `.env`:
   ```bash
   cp .env.sample .env
   ```

2. Fill in values:
   ```bash
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Auth
   JWT_SECRET=your-32-character-secret-key-here
   ADMIN_API_KEY=your-admin-key-change-this
   
   # Razorpay
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=test_secret_xxxxx
   
   # Stripe (optional)
   STRIPE_SECRET_KEY=sk_test_xxxxx
   ```

3. **NEVER commit `.env` to git.** Use platform secrets instead (see Step 5).

---

## Step 4: Install Dependencies & Test Locally

```bash
cd backend
npm install

# Run tests
npm run test

# Start dev server (with auto-reload)
npm run dev
```

API should be available at `http://localhost:3001`.

**Test endpoints:**
```bash
# Health check
curl http://localhost:3001/health

# Get pricing (no auth needed)
curl http://localhost:3001/api/billing/pricing \
  -H "x-api-key: your-admin-key-change-this"

# Create subscription (with auth)
curl -X POST http://localhost:3001/api/billing/create-subscription \
  -H "x-api-key: your-admin-key-change-this" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "unbound-team",
    "userId": "user@example.com",
    "plan": "starter",
    "country": "IN"
  }'
```

---

## Step 5: Deploy Backend to Railway

### 5a. Create Railway Project

1. Go to [railway.app](https://railway.app) → Create new project
2. Select **GitHub** → Connect repo
3. Select `Unbound-Team` repository

### 5b. Add Supabase & Payment Credentials

1. In Railway project, go to **Variables**
2. Add all `.env` variables from Step 3:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `ADMIN_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `STRIPE_SECRET_KEY`

3. Click **Deploy**

### 5c. Get Public URL

Once deployed, Railway gives you a public URL like `https://unbound-team-production.up.railway.app`.

**Note this URL** for webhook setup.

---

## Step 6: Configure Payment Processor Webhooks

### 6a. Razorpay Webhooks

1. Go to Razorpay **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Enter URL: `https://your-railway-url.app/webhooks/razorpay`
4. Select events:
   - `subscription.activated`
   - `subscription.paused`
   - `subscription.completed`
   - `invoice.paid`
   - `invoice.failed`
5. Save

### 6b. Stripe Webhooks

1. Go to Stripe **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://your-railway-url.app/webhooks/stripe`
4. Select events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add Events**

---

## Step 7: Enable Database Scheduler (Revenue Calculation)

This runs nightly revenue calculations. Requires Supabase Pro ($20/month) for `pg_cron`.

**Option A: With pg_cron (Pro tier)**

1. In Supabase SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   SELECT cron.schedule('calculate_monthly_revenue', '0 2 * * *', 
     'SELECT calculate_monthly_revenue()');
   ```

2. Revenue calculates daily at 2 AM UTC

**Option B: Manual / Node cron job (Free tier)**

Add this to backend startup (in `server.js`):
```javascript
const cron = require('node-cron');

// Run at 2 AM every day
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily revenue calculation...');
  // Call your billing service to calculate revenue
});
```

---

## Step 8: Deploy Frontend (Optional)

If you have a frontend consuming the backend:

1. Deploy to **Vercel** (recommended):
   ```bash
   vercel --prod
   ```

2. Set environment variable in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.app
   ```

---

## Step 9: Test End-to-End

### Create Test Subscription

```bash
curl -X POST https://your-railway-url.app/api/billing/create-subscription \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "unbound-team",
    "userId": "test@example.com",
    "plan": "starter",
    "country": "IN"
  }'
```

### Check Subscription Status

```bash
curl https://your-railway-url.app/api/billing/unbound-team/test@example.com \
  -H "Authorization: Bearer your-jwt-token"
```

### Monitor Webhook Receipts

1. Go to Razorpay **Settings** → **Webhooks** → Click webhook → View **Logs**
2. Go to Stripe **Developers** → **Webhooks** → Click endpoint → View **Logs**
3. Verify status code is `200`

---

## Step 10: Set Up Monitoring (Optional)

### Add Error Tracking (Sentry)

1. Sign up at [sentry.io](https://sentry.io)
2. Create project for Node.js
3. Note your **DSN**
4. Add to `.env`:
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

### Add Structured Logging

Update `backend/server.js` to include centralized logging:
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN
});
```

---

## Troubleshooting

### 1. "Razorpay subscription not created"
- Check credentials in `.env`
- Verify key_id starts with `rzp_`
- In test mode, use test keys

### 2. "Webhook not received"
- Verify URL is publicly accessible: `curl https://your-url.app/health`
- Check webhook logs in payment processor dashboard
- Ensure endpoint returns `200` status

### 3. "Revenue not calculating"
- If using free Supabase tier, manually schedule the cron job in your Node app
- Check that database user has permission to run `calculate_monthly_revenue()`

### 4. "Auth failing with Bearer token"
- Ensure token was signed with same `JWT_SECRET`
- Verify token hasn't expired
- Check token format: `Authorization: Bearer <token>`

---

## Next Steps

1. **Add Frontend UI** for subscription management (sign up, upgrade, billing portal)
2. **Implement Usage Tracking** (call `/api/solutions/*` endpoints; track against plan limits)
3. **Add Partner Dashboard** (show revenue, active users, testimonials)
4. **Enable SSL/TLS** (recommended; Railway does automatically)
5. **Set up CI/CD** (GitHub Actions to auto-deploy on push)
6. **Scale Workers** (increase replica count in Railway as load grows)

---

## Support

- **Razorpay Docs:** https://razorpay.com/docs/
- **Stripe Docs:** https://stripe.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Railway Docs:** https://docs.railway.app

---

## Costs (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | $0–$100 | Free tier fine for MVP; pay as you grow |
| Railway | $5–$50 | Backend; $5/month minimum |
| Razorpay | $0 | Free; takes 2% of transactions |
| Stripe | $0 | Free; takes 2.2% + $0.30 per transaction |
| **Total** | **~$10** | **Per month for MVP** |

---

## You're Live! 🚀

Your India-first SaaS is now running with:
- ✅ Multi-tenant architecture
- ✅ Razorpay billing (INR)
- ✅ Stripe fallback (USD/EUR)
- ✅ API key + JWT authentication
- ✅ Rate limiting
- ✅ Revenue share tracking
- ✅ Webhook handling
- ✅ Auto-scaling on Railway

Next: Invite beta customers, monitor errors, iterate on UX.
