/**
 * Billing Service - Razorpay (India) + Stripe (International) MVP
 * Supports multi-tenant billing with usage tracking and revenue share
 */

const Razorpay = require('razorpay');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

// Initialize payment providers
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================================================
// PRICING TIERS
// ============================================================================

const PRICING_TIERS = {
  free: {
    name: 'Free',
    monthly_price_inr: 0,
    monthly_price_usd: 0,
    monthly_price_eur: 0,
    problems_per_month: 1,
    features: ['1 problem/month', 'Basic AI features']
  },
  starter: {
    name: 'Starter',
    monthly_price_inr: 999, // ~$12 USD
    monthly_price_usd: 12,
    monthly_price_eur: 11,
    problems_per_month: 20,
    features: ['20 problems/month', 'Advanced AI', 'Email support']
  },
  growth: {
    name: 'Growth',
    monthly_price_inr: 2999, // ~$36 USD
    monthly_price_usd: 36,
    monthly_price_eur: 33,
    problems_per_month: 100,
    features: ['100 problems/month', 'Priority support', 'Analytics']
  },
  premium: {
    name: 'Premium',
    monthly_price_inr: 9999, // ~$120 USD
    monthly_price_usd: 120,
    monthly_price_eur: 110,
    problems_per_month: 1000,
    features: ['Unlimited problems', 'VIP support', 'Custom integrations']
  }
};

// ============================================================================
// CREATE SUBSCRIPTION (Razorpay for India, Stripe for others)
// ============================================================================

async function createSubscription(tenantId, userId, plan, country = 'IN') {
  try {
    const tier = PRICING_TIERS[plan] || PRICING_TIERS.free;
    if (!tier) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Determine payment processor based on country
    const provider = country === 'IN' ? 'razorpay' : 'stripe';

    let paymentData = {};
    let subscriptionId = null;

    if (provider === 'razorpay') {
      // Create Razorpay customer and plan
      const customer = await razorpay.customers.create({
        email: userId, // Use userId as email placeholder; should be actual email in production
        notify_sms: 1,
        notify_email: 1,
        description: `${tenantId} - ${plan} tier`
      });

      // Create a plan in Razorpay
      const razorpayPlan = await razorpay.plans.create({
        period: 'monthly',
        interval: 1,
        period_start: Math.floor(Date.now() / 1000),
        amount: tier.monthly_price_inr * 100, // Convert to paise
        currency_code: 'INR',
        description: `${tier.name} plan - ${plan}`
      });

      // Create subscription
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlan.id,
        customer_notify: 1,
        quantity: 1,
        total_count: 12, // 1 year
        start_at: Math.floor(Date.now() / 1000)
      });

      subscriptionId = subscription.id;
      paymentData = {
        provider: 'razorpay',
        customer_id: customer.id,
        subscription_id: subscription.id,
        plan_id: razorpayPlan.id
      };
    } else {
      // Create Stripe subscription
      const customer = await stripe.customers.create({
        metadata: {
          tenantId,
          userId,
          country
        }
      });

      // Find or create Stripe price
      const priceAmount = Math.round(tier.monthly_price_usd * 100); // Convert to cents
      const stripePrices = await stripe.prices.list({
        lookup_keys: [`${plan}_monthly_usd`],
        limit: 1
      });

      let priceId;
      if (stripePrices.data.length > 0) {
        priceId = stripePrices.data[0].id;
      } else {
        const newPrice = await stripe.prices.create({
          currency: 'usd',
          unit_amount: priceAmount,
          recurring: { interval: 'month' },
          product_data: { name: tier.name },
          lookup_key: `${plan}_monthly_usd`
        });
        priceId = newPrice.id;
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      subscriptionId = subscription.id;
      paymentData = {
        provider: 'stripe',
        customer_id: customer.id,
        subscription_id: subscription.id,
        client_secret: subscription.latest_invoice.payment_intent.client_secret
      };
    }

    // Save to database
    const { data, error } = await supabase
      .from('tenant_users')
      .update({
        plan,
        [`${provider}_customer_id`]: paymentData.customer_id,
        [`${provider}_subscription_id`]: paymentData.subscription_id,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }

    return {
      success: true,
      subscriptionId,
      plan,
      provider,
      paymentData,
      tier
    };
  } catch (error) {
    console.error('Create subscription error:', error);
    throw error;
  }
}

// ============================================================================
// HANDLE WEBHOOKS
// ============================================================================

async function handleRazorpayWebhook(event) {
  try {
    const { entity } = event;

    switch (entity.event) {
      case 'subscription.authenticated':
        console.log(`Subscription authenticated: ${entity.payload.subscription.entity.id}`);
        break;

      case 'subscription.activated':
        const activeSub = entity.payload.subscription.entity;
        await supabase
          .from('tenant_users')
          .update({
            status: 'active',
            current_period_start: new Date(activeSub.start_at * 1000).toISOString(),
            current_period_end: new Date(activeSub.current_start * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('razorpay_subscription_id', activeSub.id);
        break;

      case 'subscription.completed':
        const completedSub = entity.payload.subscription.entity;
        await supabase
          .from('tenant_users')
          .update({ status: 'canceled' })
          .eq('razorpay_subscription_id', completedSub.id);
        break;

      case 'subscription.paused':
      case 'subscription.halted':
        const pausedSub = entity.payload.subscription.entity;
        await supabase
          .from('tenant_users')
          .update({ status: 'paused' })
          .eq('razorpay_subscription_id', pausedSub.id);
        break;

      case 'invoice.paid':
        const invoice = entity.payload.invoice.entity;
        await recordPayment(invoice.id, invoice.amount / 100, 'razorpay');
        break;

      case 'invoice.failed':
        const failedInvoice = entity.payload.invoice.entity;
        console.error(`Invoice failed: ${failedInvoice.id}`);
        break;

      default:
        console.log(`Unhandled Razorpay event: ${entity.event}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    throw error;
  }
}

async function handleStripeWebhook(event) {
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        const status = updatedSub.status === 'active' ? 'active' : updatedSub.status;
        await supabase
          .from('tenant_users')
          .update({
            status,
            current_period_start: new Date(updatedSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', updatedSub.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        await supabase
          .from('tenant_users')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', deletedSub.id);
        break;

      case 'invoice.payment_succeeded':
        const paidInvoice = event.data.object;
        await recordPayment(paidInvoice.id, paidInvoice.amount_paid / 100, 'stripe');
        break;

      case 'invoice.payment_failed':
        const failedStripInvoice = event.data.object;
        console.error(`Stripe invoice payment failed: ${failedStripInvoice.id}`);
        break;

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Stripe webhook error:', error);
    throw error;
  }
}

// ============================================================================
// RECORD PAYMENT (for revenue tracking)
// ============================================================================

async function recordPayment(externalInvoiceId, amountUSD, provider) {
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant_revenue')
      .select('*')
      .eq('provider', provider)
      .eq('external_invoice_id', externalInvoiceId)
      .single();

    if (!tenantError && tenant) {
      // Already recorded
      return;
    }

    // Convert USD to INR for revenue share calculation (simplified; use live rates in production)
    const amountINR = Math.round(amountUSD * 83); // ~1 USD = 83 INR

    const month = new Date().toISOString().slice(0, 7);

    const { error } = await supabase
      .from('tenant_revenue')
      .insert({
        month,
        total_revenue: amountINR,
        provider,
        external_invoice_id: externalInvoiceId,
        payout_status: 'pending'
      });

    if (error) {
      console.error('Failed to record payment:', error);
    }
  } catch (error) {
    console.error('Record payment error:', error);
  }
}

// ============================================================================
// GET BILLING STATUS
// ============================================================================

async function getBillingStatus(tenantId, userId) {
  try {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`User not found: ${error.message}`);
    }

    const tier = PRICING_TIERS[data.plan] || PRICING_TIERS.free;
    const provider = data.razorpay_subscription_id ? 'razorpay' : data.stripe_subscription_id ? 'stripe' : null;

    return {
      plan: data.plan,
      tier,
      status: data.status,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      provider,
      subscription_id: provider === 'razorpay' ? data.razorpay_subscription_id : data.stripe_subscription_id
    };
  } catch (error) {
    console.error('Get billing status error:', error);
    throw error;
  }
}

// ============================================================================
// CANCEL SUBSCRIPTION
// ============================================================================

async function cancelSubscription(tenantId, userId) {
  try {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (data.razorpay_subscription_id) {
      await razorpay.subscriptions.cancel(data.razorpay_subscription_id);
    } else if (data.stripe_subscription_id) {
      await stripe.subscriptions.del(data.stripe_subscription_id);
    }

    await supabase
      .from('tenant_users')
      .update({ status: 'canceled', plan: 'free' })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    return { success: true };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}

// ============================================================================
// CALCULATE REVENUE SHARE (for partners)
// ============================================================================

async function calculateRevenueShare(tenantId, month) {
  try {
    const { data: revenue, error } = await supabase
      .from('tenant_revenue')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('month', month)
      .single();

    if (error || !revenue) {
      return { total_revenue: 0, partner_share: 0, unbound_share: 0 };
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('revenue_share_percent')
      .eq('id', tenantId)
      .single();

    const sharePercent = (tenant?.revenue_share_percent || 0) / 100;
    const partnerShare = Math.round(revenue.total_revenue * sharePercent);
    const unboundShare = revenue.total_revenue - partnerShare;

    return {
      total_revenue: revenue.total_revenue,
      partner_share: partnerShare,
      unbound_share: unboundShare
    };
  } catch (error) {
    console.error('Calculate revenue share error:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createSubscription,
  handleRazorpayWebhook,
  handleStripeWebhook,
  getBillingStatus,
  cancelSubscription,
  calculateRevenueShare,
  PRICING_TIERS
};
