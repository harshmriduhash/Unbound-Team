/**
 * Billing Service - Razorpay (India) + Stripe (International) MVP
 * Supports multi-tenant billing with usage tracking and revenue share
 */

const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');
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
      // Create Razorpay order for checkout (not subscription yet; frontend will handle checkout)
      const razorpayOrder = await razorpay.orders.create({
        amount: tier.monthly_price_inr * 100, // Convert to paise
        currency: 'INR',
        receipt: `order-${tenantId}-${userId}`,
        notes: {
          tenantId,
          userId,
          plan,
          name: tier.name,
          description: `${tier.name} plan subscription`
        }
      });

      subscriptionId = razorpayOrder.id;
      paymentData = {
        provider: 'razorpay',
        order_id: razorpayOrder.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID
      };
    } else {
      // Create Stripe checkout session (not subscription yet; frontend will redirect to checkout)
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?status=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing?status=cancel`,
        client_reference_id: `${tenantId}-${userId}`,
        metadata: {
          tenantId,
          userId,
          plan,
          country
        },
        line_items: [
          {
            price_data: {
              currency: country === 'EU' ? 'eur' : 'usd',
              product_data: {
                name: tier.name,
                description: `${plan} plan subscription`
              },
              unit_amount: Math.round(
                (country === 'EU' ? tier.monthly_price_eur : tier.monthly_price_usd) * 100
              ),
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1
          }
        ]
      });

      subscriptionId = checkoutSession.id;
      paymentData = {
        provider: 'stripe',
        session_id: checkoutSession.id,
        stripeCheckoutUrl: checkoutSession.url
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
      tier,
      razorpayOrder: provider === 'razorpay' ? { id: paymentData.order_id, amount: tier.monthly_price_inr * 100, currency: 'INR', notes: { name: tier.name, description: `${tier.name} plan` } } : null,
      razorpayKey: provider === 'razorpay' ? paymentData.razorpayKey : null,
      stripeCheckoutUrl: provider === 'stripe' ? paymentData.stripeCheckoutUrl : null
    };
  } catch (error) {
    console.error('Create subscription error:', error);
    throw error;
  }
}

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

function verifyRazorpayWebhook(body, signature) {
  try {
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET);
    shasum.update(JSON.stringify(body));
    const digest = shasum.digest('hex');
    return digest === signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
}

function verifyStripeWebhook(body, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Stripe signature verification error:', error);
    return null;
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
  verifyRazorpayWebhook,
  verifyStripeWebhook,
  getBillingStatus,
  cancelSubscription,
  calculateRevenueShare,
  PRICING_TIERS
};
