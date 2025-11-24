import Stripe from 'stripe';

import { type BillingCadence, type PlanType } from '@/lib/stripe/client';

type PlanInfo = {
  plan: PlanType;
  billingCadence: BillingCadence;
};

const PRICE_PLAN_MAP: Record<string, PlanInfo> = {
  // Accelerate plan price IDs
  price_accelerate_monthly_20: { plan: 'accelerate', billingCadence: 'monthly' },
  price_accelerate_quarterly_48: { plan: 'accelerate', billingCadence: 'quarterly' },
  price_accelerate_yearly_144: { plan: 'accelerate', billingCadence: 'yearly' },
  // Learn plan price IDs (supporting legacy aliases)
  price_learn_monthly_12: { plan: 'learn', billingCadence: 'monthly' },
  price_l_monthly_12: { plan: 'learn', billingCadence: 'monthly' },
  price_learn_quarterly_27: { plan: 'learn', billingCadence: 'quarterly' },
  price_l_quarterly_27: { plan: 'learn', billingCadence: 'quarterly' },
  price_learn_yearly_84: { plan: 'learn', billingCadence: 'yearly' },
  price_l_yearly_84: { plan: 'learn', billingCadence: 'yearly' },
};

const normalizeId = (value?: string | null) => value?.trim().toLowerCase();

const parseMetadataPlan = (value?: string): PlanType | null => {
  if (!value) {
    return null;
  }
  const normalized = value.toLowerCase();
  if (normalized === 'learn' || normalized === 'accelerate') {
    return normalized as PlanType;
  }
  return null;
};

const parseMetadataCadence = (value?: string): BillingCadence | null => {
  if (!value) {
    return null;
  }
  const normalized = value.toLowerCase();
  if (normalized === 'monthly' || normalized === 'quarterly' || normalized === 'yearly') {
    return normalized as BillingCadence;
  }
  return null;
};

const inferFromPrice = (
  price?: Stripe.Price | null
): PlanInfo | null => {
  if (!price) {
    return null;
  }
  const lookupId = normalizeId(price.id);
  if (!lookupId) {
    return null;
  }
  return PRICE_PLAN_MAP[lookupId] || null;
};

export const resolvePlanAndCadenceFromSubscription = (
  subscription: Stripe.Subscription
): PlanInfo => {
  const firstPrice = subscription.items?.data?.[0]?.price ?? null;
  const pricePlan = inferFromPrice(firstPrice);
  if (pricePlan) {
    return pricePlan;
  }

  const metadata = subscription.metadata || {};
  const metadataPlan = parseMetadataPlan(metadata.plan);
  const metadataCadence = parseMetadataCadence(metadata.billing_cadence);

  let plan: PlanType = metadataPlan ?? 'learn';
  let billingCadence: BillingCadence = metadataCadence ?? 'monthly';

  if (!metadataCadence && firstPrice?.recurring?.interval) {
    if (firstPrice.recurring.interval === 'month') {
      billingCadence = 'monthly';
    } else if (firstPrice.recurring.interval === 'year') {
      billingCadence = 'yearly';
    }
  }

  return { plan, billingCadence };
};

