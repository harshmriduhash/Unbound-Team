# 🚀 Getting Started - Unbound.team SaaS MVP

## Prerequisites

- **Node.js 18+** and **npm 9+**
- **Supabase account** (free tier: [supabase.com](https://supabase.com))
- **Razorpay account** (India; test mode: [razorpay.com](https://razorpay.com))
- **Stripe account** (International; test mode: [stripe.com](https://stripe.com))
- **Git** and GitHub account (for CI/CD)

---

## 📋 Local Development Setup

### Step 1: Prepare Environment Variables

```bash
cd backend
cp ../.env.sample .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
ADMIN_API_KEY=your-admin-api-key-change-this

# Billing (Razorpay - India)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Billing (Stripe - International)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Frontend URL (for redirects after checkout)
FRONTEND_URL=http://localhost:5173
```

**Where to get credentials:**
- **Supabase**: Create project → copy URL + keys from Settings → API
- **Razorpay**: Sign up → Settings → API Keys (use test keys)
- **Stripe**: Sign up → Developers → API Keys (use test keys)

### Step 2: Set Up Supabase Database

1. Create a new Supabase project (or use existing)
2. In Supabase dashboard, go to SQL Editor
3. Run these migrations in order:
   - `supabase-multi-tenant-schema.sql` (core tables)
   - `supabase-billing-migration.sql` (billing fields)

Or use Supabase CLI:
```bash
supabase db push
```

### Step 3: Run Backend

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
✅ Server running on port 3001
✅ Billing service loaded
```

Verify:
```bash
curl http://localhost:3001/health
# Should return {"status": "healthy", ...}
```

### Step 4: Run Frontend

**Create frontend/.env:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Install and run:**
```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

Open `http://localhost:5173` in your browser.

### Step 5: Test the Flow

1. **Sign Up**: Click "Join Free" → Fill form → "Create Account"
2. **Login**: Use your credentials
3. **Dashboard**: View (empty for new user)
4. **Billing**: Go to `/billing`
   - Enter: `tenant-id`, `user-email`, `admin-api-key`
   - Click "Create Subscription"
   - For Razorpay (India): Opens checkout modal
   - For Stripe (Intl): Redirects to checkout

---

## 🌐 Production Deployment

### Deploy Backend to Railway

```bash
cd backend
npm install -g railway
railway login
railway link
railway variables
# Paste all .env values into Railway UI

railway up
```

Get your Railway URL: `https://your-app.railway.app`

### Deploy Frontend to Vercel

1. **Push to GitHub** (if not already)
2. **Create Vercel account** at [vercel.com](https://vercel.com)
3. **Import repo**:
   - Select GitHub repo
   - Set root directory: `frontend`
   - Add env vars:
     ```
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
4. **Deploy**: Auto-deploys on `main` push

Get your Vercel URL: `https://your-app.vercel.app`

### Update Backend with Frontend URL

After Vercel deploy, update backend:

```bash
# In Railway dashboard or locally:
# Set FRONTEND_URL=https://your-app.vercel.app

# Redeploy backend
railway up
```

### GitHub Actions Auto-Deploy

Enable auto-deploy in `.github/workflows/ci-deploy.yml`:

1. Go to GitHub repo → Settings → Secrets
2. Add:
   - `VERCEL_TOKEN` (from Vercel settings)
   - `VERCEL_ORG_ID` (from Vercel)
   - `VERCEL_PROJECT_ID` (from Vercel)
3. Next push to `main` → auto-deploys!

---

## 🔐 Security & Production Checklist

Before launching:

- [ ] **RLS Policies**: Set Row-Level Security on Supabase tables
- [ ] **Webhook Verification**: ✅ Already implemented
- [ ] **API Auth**: ✅ All `/api/*` need x-api-key or JWT
- [ ] **Rate Limiting**: ✅ 60 req/min per IP
- [ ] **Environment Variables**: Use platform secrets, never commit `.env`
- [ ] **HTTPS**: Ensure all URLs use `https://` in prod
- [ ] **CORS**: Add specific allowed origins (not just `*`)
- [ ] **Test Webhooks**: Set webhook URLs in Razorpay/Stripe dashboards

---

## 🧪 Testing Payments Locally

### Razorpay Test Cards

Use in Razorpay Checkout (test mode):
- Card: `4111111111111111`
- CVV: Any 3 digits
- Expiry: Any future date

### Stripe Test Cards

Use in Stripe Checkout (test mode):
- Card: `4242 4242 4242 4242`
- CVV: Any 3 digits
- Expiry: Any future date

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check Node version
node -v  # Need 18+

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Check .env file exists
ls backend/.env  # Should exist
```

### Frontend can't reach API
```bash
# Ensure backend is running
curl http://localhost:3001/health

# Check Vite config proxy
cat frontend/vite.config.js | grep proxy

# Clear Vite cache
rm -rf frontend/.vite
```

### Auth not working
- Verify `VITE_SUPABASE_URL` in `frontend/.env`
- Check Supabase → Authentication → Providers (email enabled)
- Try signing up with different email address

### Razorpay checkout not appearing
- Ensure `RAZORPAY_KEY_ID` is test key (starts with `rzp_test_`)
- Check backend response includes `razorpayOrder` field
- Open browser DevTools → Console for errors

### Webhooks not working
```bash
# Use ngrok to expose backend
ngrok http 3001

# Set webhook URL in provider dashboard:
# Razorpay: https://xxxx-ngrok.io/webhooks/razorpay
# Stripe: https://xxxx-ngrok.io/webhooks/stripe

# Check backend logs for verification failures
```

---

## 📚 Project Structure

```
unbound-team/
├── backend/
│   ├── server.js              # Express app
│   ├── middleware/
│   │   └── auth.js            # API key + JWT auth
│   ├── services/
│   │   └── billing.js         # Razorpay + Stripe
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Billing.jsx
│   │   └── App.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci-deploy.yml      # GitHub Actions
├── supabase-*.sql             # DB migrations
├── .env.sample                # Env template
└── README.md

```

---

## 🚀 Next Steps

1. **Custom Domain**: Set custom domain for Railway/Vercel
2. **SSL/TLS**: Ensure HTTPS on all endpoints
3. **Email**: Set up transactional email (Resend, SendGrid)
4. **Monitoring**: Add Sentry for error tracking
5. **Analytics**: Add product analytics (Mixpanel, Fathom)
6. **RLS Policies**: Implement Row-Level Security for data isolation

---

## 📞 Support

For issues:
1. Check Troubleshooting section above
2. Review GitHub repo issues
3. Check logs: `railway logs` (backend) or Vercel dashboard (frontend)

