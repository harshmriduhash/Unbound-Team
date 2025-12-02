# Billing System Documentation - Razorpay + Stripe MVP

## Overview

The SaaS MVP uses a **dual payment processor strategy**:
- **Razorpay** (primary): All payments from India (INR-based)
- **Stripe** (fallback): International payments (USD, EUR, etc.)

Both are integrated with automatic subscription management, webhook handling, and revenue tracking for partner revenue share.

---

## Architecture

### Payment Flow

```
Customer                Backend API          Razorpay/Stripe      Webhook Handler
   |                        |                      |                      |
   |--POST /billing/create-->|                      |                      |
   |                        |--create subscription->|                      |
   |                        |<----subscription id---|                      |
   |<--subscription id-------|                      |                      |
   |                        |                      |                      |
   |              [Customer pays on Razorpay/Stripe hosted page]           |
   |                        |                      |                      |
   |                        |                      |--webhook event------->|
   |                        |                      |                      |
   |                        |<--update subscription--|                      |
   |                        |   (via webhook)        |                      |
   |                        |                      |                      |
   |--GET /billing/:id----->|                      |                      |
   |<--billing status-------|                      |                      |
```

### Supported Plans

| Plan | INR/Month | USD/Month | EUR/Month | Features |
|------|-----------|-----------|-----------|----------|
| Free | ₹0 | $0 | €0 | 1 problem/month |
| Starter | ₹999 | $12 | €11 | 20 problems/month, Email support |
| Growth | ₹2,999 | $36 | €33 | 100 problems/month, Priority support |
| Premium | ₹9,999 | $120 | €110 | Unlimited, VIP support |

---

## API Endpoints

### 1. Create Subscription

**POST** `/api/billing/create-subscription`

Creates a new subscription for a tenant user. Automatically detects payment processor based on country.

**Request:**
```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user@example.com",
  "plan": "growth",
  "country": "IN"  // Optional, defaults to "IN"
}
```

**Response (Razorpay):**
```json
{
  "success": true,
  "subscriptionId": "sub_00000000000001",
  "plan": "growth",
  "provider": "razorpay",
  "paymentData": {
    "provider": "razorpay",
    "customer_id": "cust_00000000000001",
    "subscription_id": "sub_00000000000001",
    "plan_id": "plan_00000000000001"
  },
  "tier": {
    "name": "Growth",
    "monthly_price_inr": 2999,
    "problems_per_month": 100
  }
}
```

**Response (Stripe):**
```json
{
  "success": true,
  "subscriptionId": "sub_1234567890",
  "plan": "growth",
  "provider": "stripe",
  "paymentData": {
    "provider": "stripe",
    "customer_id": "cus_1234567890",
    "subscription_id": "sub_1234567890",
    "client_secret": "pi_1234567890_secret_1234567890"
  },
  "tier": {
    "name": "Growth",
    "monthly_price_usd": 36,
    "problems_per_month": 100
  }
}
```

---

### 2. Get Billing Status

**GET** `/api/billing/:tenantId/:userId`

Retrieve current subscription status and billing information.

**Response:**
```json
{
  "plan": "growth",
  "tier": {
    "name": "Growth",
    "monthly_price_inr": 2999,
    "problems_per_month": 100
  },
  "status": "active",
  "current_period_start": "2025-12-02T10:00:00Z",
  "current_period_end": "2026-01-02T10:00:00Z",
  "provider": "razorpay",
  "subscription_id": "sub_00000000000001"
}
```

---

### 3. Cancel Subscription

**POST** `/api/billing/:tenantId/:userId/cancel`

Cancel a subscription and revert user to free plan.

**Response:**
```json
{
  "success": true
}
```

---

### 4. Get Pricing Tiers

**GET** `/api/billing/pricing`

Get all available pricing tiers across currencies.

**Response:**
```json
{
  "tiers": {
    "free": { ... },
    "starter": { ... },
    "growth": { ... },
    "premium": { ... }
  },
  "message": "Pricing in INR for India, USD for US, EUR for Europe"
}
```

---

## Webhook Handlers

### Razorpay Webhooks

**Endpoint:** `POST /webhooks/razorpay`

Razorpay sends events to this endpoint. The service automatically updates subscription status based on event type.

**Supported Events:**

| Event | Action |
|-------|--------|
| `subscription.authenticated` | Logging |
| `subscription.activated` | Mark as active |
| `subscription.completed` | Mark as canceled |
| `subscription.paused` | Mark as paused |
| `invoice.paid` | Record payment to revenue table |
| `invoice.failed` | Log error |

**Setup in Razorpay:**
1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-api.com/webhooks/razorpay`
3. Select events: `subscription.*`, `invoice.*`

---

### Stripe Webhooks

**Endpoint:** `POST /webhooks/stripe`

Similar to Razorpay, Stripe sends events to update subscriptions.

**Supported Events:**

| Event | Action |
|-------|--------|
| `customer.subscription.updated` | Update subscription status & period |
| `customer.subscription.deleted` | Mark as canceled |
| `invoice.payment_succeeded` | Record payment |
| `invoice.payment_failed` | Log error |

**Setup in Stripe:**
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-api.com/webhooks/stripe`
3. Select events: `customer.subscription.*`, `invoice.payment.*`

---

## Environment Variables

Add these to your `.env` file:

```bash
# Razorpay (India)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_key_secret

# Stripe (International)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

---

## Database Schema

### tenant_users
```sql
razorpay_customer_id TEXT
razorpay_subscription_id TEXT
stripe_customer_id TEXT                  -- existing
stripe_subscription_id TEXT              -- existing
current_period_start TIMESTAMP
current_period_end TIMESTAMP
plan TEXT                                -- 'free', 'starter', 'growth', 'premium'
plan_limits JSONB
```

### tenant_revenue
```sql
provider TEXT                            -- 'razorpay' or 'stripe'
external_invoice_id TEXT                 -- payment processor invoice ID
total_revenue NUMERIC
partner_share NUMERIC
payout_status TEXT                       -- 'pending', 'processing', 'paid'
month TEXT                               -- 'YYYY-MM'
```

---

## Revenue Share Calculation

For each partner tenant, revenue is automatically tracked and split based on `revenue_share_percent`:

```
Total Invoice Amount (INR)
    ↓
[Run calculate_monthly_revenue() nightly]
    ↓
Partner Share = Total × (revenue_share_percent / 100)
Unbound Share = Total - Partner Share
    ↓
Record in tenant_revenue table
    ↓
[Ready for payout on monthly billing cycle]
```

**Example:**
- Growth Manager Pro partners at 50% revenue share
- Month generated ₹10,000 in subscription revenue
- Partner receives: ₹5,000
- Unbound keeps: ₹5,000

---

## Testing

### Razorpay Test Mode

Use test credentials to test without real charges:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=test_secret
```

Test card for Razorpay: `4111111111111111` (any expiry, any CVV)

### Stripe Test Mode

Use test API keys:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
```

Test cards: See https://stripe.com/docs/testing

---

## Scheduled Tasks

The system includes a `calculate_monthly_revenue()` function that should run nightly:

```sql
SELECT cron.schedule('calculate_monthly_revenue', '0 2 * * *', 
  'SELECT calculate_monthly_revenue()');
```

This requires the `pg_cron` extension (available on Supabase Pro).

---

## Error Handling

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` |
| Webhook not firing | Verify endpoint URL is publicly accessible and check payment processor logs |
| Subscription stuck in pending | User hasn't completed payment; check payment processor dashboard |
| Revenue not recorded | Ensure `calculate_monthly_revenue()` is scheduled and running |

---

## Migration Path from Prototype

1. **Run Migration SQL:** Execute `supabase-billing-migration.sql` in Supabase editor
2. **Add Secrets:** Add Razorpay and Stripe keys to your `.env`
3. **Deploy:** Push updated backend with billing service
4. **Test:** Create test subscription via `/api/billing/create-subscription`
5. **Verify Webhooks:** Set up webhooks in Razorpay and Stripe dashboards
6. **Monitor:** Check logs for webhook receipts and subscription events

---

## Future Enhancements

- [ ] Coupon/promo code support
- [ ] Invoice PDF generation
- [ ] Dunning management for failed payments
- [ ] Multi-currency support for Razorpay
- [ ] Usage-based billing (pay-per-problem)
- [ ] Annual billing with discount
- [ ] Partner commission dashboard
- [ ] Subscription analytics
