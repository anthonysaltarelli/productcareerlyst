# Stripe Integration Setup Guide

This document outlines the Stripe integration for subscription management, billing, and plan-based feature gating.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Required Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# For development/testing, use test keys:
# STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# Supabase Service Role Key (required for webhooks)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Optional Price ID Overrides

If your Stripe price IDs differ from the defaults, you can override them:

```env
STRIPE_PRICE_LEARN_MONTHLY=price_learn_monthly_12
STRIPE_PRICE_LEARN_QUARTERLY=price_learn_quarterly_27
STRIPE_PRICE_LEARN_YEARLY=price_learn_yearly_84
STRIPE_PRICE_ACCELERATE_MONTHLY=price_accelerate_monthly_20
STRIPE_PRICE_ACCELERATE_QUARTERLY=price_accelerate_quarterly_48
STRIPE_PRICE_ACCELERATE_YEARLY=price_accelerate_yearly_144
```

## Stripe Setup Steps

### 1. Create Products and Prices in Stripe

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**

#### Learn Plan
- **Name**: Learn
- **Description**: Perfect for getting started
- Create three prices:
  - Monthly: $12/month (`price_learn_monthly_12`)
  - Quarterly: $27/3 months (`price_learn_quarterly_27`)
  - Yearly: $84/year (`price_learn_yearly_84`)

#### Accelerate Plan
- **Name**: Accelerate
- **Description**: Most popular - Unlimited everything
- Create three prices:
  - Monthly: $20/month (`price_accelerate_monthly_20`)
  - Quarterly: $48/3 months (`price_accelerate_quarterly_48`)
  - Yearly: $144/year (`price_accelerate_yearly_144`)

### 2. Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 3. Test Mode Setup

For local development:

1. Use Stripe test mode keys
2. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
3. Login: `stripe login`
4. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
5. Copy the webhook signing secret from the CLI output

## Database Migrations

Run the following migrations in order:

1. `sql_migrations/subscriptions/001_create_subscriptions.sql`
2. `sql_migrations/subscription_usage/001_create_subscription_usage.sql`

These migrations create:
- `subscriptions` table: Stores user subscription data synced from Stripe
- `subscription_usage` table: Tracks feature usage per user per month

## API Routes

### `/api/stripe/checkout`
Creates a Stripe Checkout session for new subscriptions.

**Method**: POST  
**Body**:
```json
{
  "plan": "learn" | "accelerate",
  "billingCadence": "monthly" | "quarterly" | "yearly"
}
```

### `/api/stripe/webhook`
Handles Stripe webhook events to sync subscription status.

**Method**: POST  
**Headers**: `stripe-signature` (automatically handled)

### `/api/stripe/customer-portal`
Creates a Stripe Customer Portal session for managing billing.

**Method**: POST

### `/api/billing/transfer`
Transfers subscription from Bubble to new platform.

**Method**: POST  
**Body**:
```json
{
  "email": "user@example.com",
  "stripeCustomerId": "cus_xxxxx" // optional
}
```

## Plan Limits

### Learn Plan
- PM Emails Discovered: 15/month
- Outreach Messages Created: 5/month
- Resume Bullet Optimizations: 30/month
- Resume Customizations for Jobs: 5/month
- Product Portfolio Case Study Ideas: 5/month
- Jobs Tracked: 10/month
- Custom Questions for Interviewers: 5/month
- Automated Company Research Searches: 5/month
- Product Portfolio Template: Not included

### Accelerate Plan
- All features: **Unlimited**
- Product Portfolio Template: Included

## Feature Gating

Use the utility functions in `lib/utils/subscription.ts` to check access:

```typescript
import { hasFeatureAccess, canUseFeature, getUserPlan } from '@/lib/utils/subscription';

// Check if user has access to a feature
const hasAccess = await hasFeatureAccess(userId, 'product_portfolio_template');

// Check if user can use a feature (within limits)
const { allowed, current, limit } = await canUseFeature(userId, 'pm_emails_discovered');

// Get user's plan
const plan = await getUserPlan(userId);
```

## Pages

- `/dashboard/billing` - View billing status and manage subscription
- `/dashboard/billing/plans` - Compare and select plans
- `/dashboard/billing/checkout` - Checkout flow (emphasizes Accelerate yearly)
- `/dashboard/billing/transfer` - Transfer from Bubble flow

## Testing

1. Use Stripe test cards: https://stripe.com/docs/testing
2. Test webhook events using Stripe CLI
3. Verify subscription sync in database
4. Test feature gating with different plans

## Security Notes

- Never expose secret keys in client-side code
- Always verify webhook signatures
- Use service role key only in server-side code
- Implement proper error handling and logging

