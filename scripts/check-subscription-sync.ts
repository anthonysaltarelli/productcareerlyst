/**
 * Subscription Sync Check Script
 * 
 * Compares subscription records in Supabase with Stripe to identify
 * stale or mismatched data.
 * 
 * Run with: npx tsx scripts/check-subscription-sync.ts
 */

import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripeClient } from '@/lib/stripe/client';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface SubscriptionComparison {
  stripe_subscription_id: string;
  user_id: string;
  stripe_customer_id: string;
  field: string;
  supabase_value: any;
  stripe_value: any;
  match: boolean;
}

interface SyncReport {
  total_checked: number;
  total_matches: number;
  total_mismatches: number;
  missing_in_stripe: number;
  missing_in_supabase: number;
  discrepancies: SubscriptionComparison[];
}

// Map Stripe status to our enum
const statusMap: Record<string, 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'paused'> = {
  active: 'active',
  canceled: 'canceled',
  incomplete: 'incomplete',
  incomplete_expired: 'incomplete_expired',
  past_due: 'past_due',
  trialing: 'trialing',
  unpaid: 'unpaid',
  paused: 'paused',
};

function timestampToISO(timestamp: number | null | undefined): string | null {
  if (timestamp === null || timestamp === undefined) {
    return null;
  }
  if (typeof timestamp !== 'number') {
    return null;
  }
  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function compareField(
  field: string,
  supabaseValue: any,
  stripeValue: any,
  stripeSubId: string,
  userId: string,
  customerId: string
): SubscriptionComparison | null {
  // Normalize values for comparison
  let normalizedSupabase = supabaseValue;
  let normalizedStripe = stripeValue;

  // Handle null/undefined
  if (supabaseValue === null || supabaseValue === undefined) {
    normalizedSupabase = null;
  }
  if (stripeValue === null || stripeValue === undefined) {
    normalizedStripe = null;
  }

  // Handle timestamps
  if (field.includes('_at') || field.includes('_start') || field.includes('_end')) {
    if (typeof stripeValue === 'number') {
      normalizedStripe = timestampToISO(stripeValue);
    }
  }

  // Handle status mapping
  if (field === 'status' && typeof stripeValue === 'string') {
    normalizedStripe = statusMap[stripeValue] || stripeValue;
  }

  // Compare
  const match = normalizedSupabase === normalizedStripe;

  if (!match) {
    return {
      stripe_subscription_id: stripeSubId,
      user_id: userId,
      stripe_customer_id: customerId,
      field,
      supabase_value: normalizedSupabase,
      stripe_value: normalizedStripe,
      match: false,
    };
  }

  return null;
}

async function checkSubscriptionSync(): Promise<SyncReport> {
  console.log('🔍 Checking subscription sync between Supabase and Stripe...\n');

  const stripe = getStripeClient();
  const discrepancies: SubscriptionComparison[] = [];
  let totalChecked = 0;
  let totalMatches = 0;
  let missingInStripe = 0;
  let missingInSupabase = 0;

  // Get all subscriptions from Supabase
  const { data: supabaseSubscriptions, error: supabaseError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (supabaseError) {
    throw new Error(`Failed to fetch Supabase subscriptions: ${supabaseError.message}`);
  }

  if (!supabaseSubscriptions || supabaseSubscriptions.length === 0) {
    console.log('⚠️  No subscriptions found in Supabase');
    return {
      total_checked: 0,
      total_matches: 0,
      total_mismatches: 0,
      missing_in_stripe: 0,
      missing_in_supabase: 0,
      discrepancies: [],
    };
  }

  console.log(`📊 Found ${supabaseSubscriptions.length} subscriptions in Supabase\n`);
  console.log('Checking each subscription against Stripe...\n');

  // Check each subscription
  for (const sub of supabaseSubscriptions) {
    if (!sub.stripe_subscription_id) {
      console.log(`⚠️  Skipping subscription ${sub.id} - no stripe_subscription_id`);
      continue;
    }

    totalChecked++;

    try {
      // Fetch from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

      // Compare key fields
      const fieldsToCheck = [
        'status',
        'current_period_start',
        'current_period_end',
        'cancel_at_period_end',
        'canceled_at',
        'trial_start',
        'trial_end',
      ];

      let subscriptionMatches = true;

      for (const field of fieldsToCheck) {
        const supabaseValue = (sub as any)[field];
        let stripeValue: any;

        if (field === 'status') {
          stripeValue = stripeSubscription.status;
        } else if (field === 'current_period_start') {
          stripeValue = stripeSubscription.current_period_start;
        } else if (field === 'current_period_end') {
          stripeValue = stripeSubscription.current_period_end;
        } else if (field === 'cancel_at_period_end') {
          stripeValue = (stripeSubscription as any).cancel_at_period_end || false;
        } else if (field === 'canceled_at') {
          stripeValue = stripeSubscription.canceled_at;
        } else if (field === 'trial_start') {
          stripeValue = stripeSubscription.trial_start;
        } else if (field === 'trial_end') {
          stripeValue = stripeSubscription.trial_end;
        }

        const discrepancy = compareField(
          field,
          supabaseValue,
          stripeValue,
          sub.stripe_subscription_id,
          sub.user_id,
          sub.stripe_customer_id
        );

        if (discrepancy) {
          discrepancies.push(discrepancy);
          subscriptionMatches = false;
        }
      }

      if (subscriptionMatches) {
        totalMatches++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      if (error.code === 'resource_missing') {
        console.log(`❌ Subscription ${sub.stripe_subscription_id} not found in Stripe (may be deleted or test mode)`);
        missingInStripe++;
        discrepancies.push({
          stripe_subscription_id: sub.stripe_subscription_id,
          user_id: sub.user_id,
          stripe_customer_id: sub.stripe_customer_id,
          field: 'subscription_exists',
          supabase_value: 'exists',
          stripe_value: 'not_found',
          match: false,
        });
      } else if (error.message?.includes('test mode')) {
        console.log(`⚠️  Subscription ${sub.stripe_subscription_id} exists in test mode but we're using live mode`);
        // Don't count this as an error, just a mode mismatch
      } else {
        console.error(`❌ Error checking subscription ${sub.stripe_subscription_id}:`, error.message);
      }
    }
  }

  // Check for subscriptions in Stripe that aren't in Supabase
  // (This is more expensive, so we'll do a sample check)
  console.log('\n📋 Checking for subscriptions in Stripe not in Supabase (sample check)...\n');
  
  try {
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all',
    });

    const supabaseSubIds = new Set(
      supabaseSubscriptions
        .map(s => s.stripe_subscription_id)
        .filter(Boolean)
    );

    for (const stripeSub of stripeSubscriptions.data) {
      if (!supabaseSubIds.has(stripeSub.id)) {
        // Check if it has user_id in metadata (our subscriptions should have this)
        const userId = stripeSub.metadata?.user_id;
        if (userId) {
          console.log(`⚠️  Subscription ${stripeSub.id} exists in Stripe but not in Supabase (user_id: ${userId})`);
          missingInSupabase++;
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error checking Stripe subscriptions:', error.message);
  }

  const totalMismatches = discrepancies.length;

  return {
    total_checked: totalChecked,
    total_matches: totalMatches,
    total_mismatches: totalMismatches,
    missing_in_stripe: missingInStripe,
    missing_in_supabase: missingInSupabase,
    discrepancies,
  };
}

async function main() {
  try {
    const report = await checkSubscriptionSync();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 Subscription Sync Report');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📈 Summary:');
    console.log(`   Total Checked: ${report.total_checked}`);
    console.log(`   ✅ Fully Matched: ${report.total_matches}`);
    console.log(`   ❌ Mismatches: ${report.total_mismatches}`);
    console.log(`   ⚠️  Missing in Stripe: ${report.missing_in_stripe}`);
    console.log(`   ⚠️  Missing in Supabase: ${report.missing_in_supabase}\n`);

    if (report.discrepancies.length > 0) {
      console.log('🔍 Discrepancies Found:\n');
      
      // Group by subscription
      const bySubscription = new Map<string, SubscriptionComparison[]>();
      for (const disc of report.discrepancies) {
        if (!bySubscription.has(disc.stripe_subscription_id)) {
          bySubscription.set(disc.stripe_subscription_id, []);
        }
        bySubscription.get(disc.stripe_subscription_id)!.push(disc);
      }

      for (const [subId, discs] of bySubscription.entries()) {
        console.log(`   Subscription: ${subId}`);
        console.log(`   User ID: ${discs[0].user_id}`);
        console.log(`   Customer ID: ${discs[0].stripe_customer_id}`);
        for (const disc of discs) {
          console.log(`     - ${disc.field}:`);
          console.log(`       Supabase: ${disc.supabase_value}`);
          console.log(`       Stripe:   ${disc.stripe_value}`);
        }
        console.log('');
      }
    } else {
      console.log('✅ No discrepancies found! All subscriptions are in sync.\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

    if (report.total_mismatches > 0 || report.missing_in_stripe > 0 || report.missing_in_supabase > 0) {
      console.log('⚠️  Action Required:');
      console.log('   Consider running the sync-subscription API endpoint for mismatched subscriptions.');
      console.log('   Or trigger a webhook sync from Stripe.\n');
      process.exit(1);
    } else {
      console.log('✅ All subscriptions are in sync!\n');
    }

  } catch (error) {
    console.error('❌ Error checking subscription sync:', error);
    process.exit(1);
  }
}

// Run the check
if (require.main === module) {
  main();
}

export { checkSubscriptionSync, type SyncReport, type SubscriptionComparison };

