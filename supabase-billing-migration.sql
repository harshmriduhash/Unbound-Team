-- ============================================================================
-- MIGRATION: Add Razorpay Billing Fields to Multi-Tenant Schema
-- Run this in Supabase SQL Editor AFTER running supabase-multi-tenant-schema.sql
-- ============================================================================

-- Add Razorpay fields to tenant_users table
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Add provider column to tenant_revenue to track payment source
ALTER TABLE tenant_revenue ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'razorpay'; -- 'razorpay' or 'stripe'
ALTER TABLE tenant_revenue ADD COLUMN IF NOT EXISTS external_invoice_id TEXT; -- Razorpay/Stripe invoice ID

-- Create indexes for efficient billing queries
CREATE INDEX IF NOT EXISTS idx_tenant_users_razorpay_customer ON tenant_users(razorpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_razorpay_subscription ON tenant_users(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_stripe_customer ON tenant_users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_stripe_subscription ON tenant_users(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_tenant_revenue_provider ON tenant_revenue(provider);
CREATE INDEX IF NOT EXISTS idx_tenant_revenue_external_invoice ON tenant_revenue(external_invoice_id);

-- ============================================================================
-- FUNCTION: Update monthly revenue from subscriptions (scheduled task)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_monthly_revenue()
RETURNS void AS $$
BEGIN
  -- Calculate total revenue from active subscriptions this month
  -- This function should be run daily via a cron job (pg_cron extension in Supabase)
  INSERT INTO tenant_revenue (tenant_id, month, total_revenue, active_users, payout_status)
  SELECT
    tu.tenant_id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    SUM(
      CASE
        WHEN tu.plan = 'starter' THEN 999
        WHEN tu.plan = 'growth' THEN 2999
        WHEN tu.plan = 'premium' THEN 9999
        ELSE 0
      END
    ) as total_revenue,
    COUNT(DISTINCT CASE WHEN tu.status = 'active' THEN tu.user_id END) as active_users,
    'pending'
  FROM tenant_users tu
  WHERE tu.status IN ('active', 'paused')
  GROUP BY tu.tenant_id
  ON CONFLICT (tenant_id, month) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    active_users = EXCLUDED.active_users;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENABLE pg_cron FOR SCHEDULED REVENUE CALCULATIONS (Supabase Premium)
-- ============================================================================
-- Uncomment if you have pg_cron extension enabled:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.schedule('calculate_monthly_revenue', '0 2 * * *', 'SELECT calculate_monthly_revenue()');

-- ============================================================================
-- COMPLETE!
-- ============================================================================
