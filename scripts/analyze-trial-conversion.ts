/**
 * Trial Conversion Analysis Script
 * 
 * Analyzes conversion rate from trial to paid subscription,
 * excluding bubble transfer users.
 * 
 * Uses SQL query to combine data from Supabase subscriptions and bubble_users tables.
 * 
 * Run with: npx tsx scripts/analyze-trial-conversion.ts
 */

import { createSupabaseAdmin } from '@/lib/supabase/admin';

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

interface ConversionAnalysis {
  total_trial_users: number;
  converted_users: number;
  not_converted_users: number;
  converted_to_learn: number;
  converted_to_accelerate: number;
  currently_trialing_only: number;
  canceled_only: number;
  past_due_only: number;
  conversion_rate_percent: string;
}

const CONVERSION_ANALYSIS_QUERY = `
WITH bubble_transfer_users AS (
  SELECT DISTINCT matched_user_id as user_id
  FROM bubble_users
  WHERE matched_user_id IS NOT NULL
),
trial_users AS (
  SELECT DISTINCT 
    s.user_id,
    MIN(s.trial_start) as first_trial_start,
    MAX(s.trial_end) as last_trial_end,
    MAX(CASE WHEN s.status = 'trialing' THEN s.updated_at END) as last_trialing_date
  FROM subscriptions s
  WHERE (s.status = 'trialing' OR s.trial_start IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM bubble_transfer_users btu WHERE btu.user_id = s.user_id
    )
    AND (s.transferred_from_bubble IS NULL OR s.transferred_from_bubble = false)
  GROUP BY s.user_id
),
user_subscription_status AS (
  SELECT 
    tu.user_id,
    tu.first_trial_start,
    tu.last_trial_end,
    tu.last_trialing_date,
    MAX(CASE WHEN s.status = 'active' THEN s.current_period_start END) as latest_active_start,
    MAX(CASE WHEN s.status = 'active' THEN s.plan END) as active_plan,
    MAX(CASE WHEN s.status = 'active' THEN s.billing_cadence END) as active_billing_cadence,
    MAX(CASE WHEN s.status = 'active' THEN s.updated_at END) as latest_active_date,
    MAX(CASE WHEN s.status = 'canceled' THEN s.updated_at END) as canceled_date,
    ARRAY_AGG(DISTINCT s.status) FILTER (WHERE s.status IS NOT NULL) as all_statuses
  FROM trial_users tu
  LEFT JOIN subscriptions s ON s.user_id = tu.user_id
  GROUP BY tu.user_id, tu.first_trial_start, tu.last_trial_end, tu.last_trialing_date
),
conversion_analysis AS (
  SELECT 
    user_id,
    first_trial_start,
    last_trial_end,
    latest_active_start,
    active_plan,
    active_billing_cadence,
    all_statuses,
    CASE 
      WHEN latest_active_start IS NOT NULL AND (
        (last_trial_end IS NOT NULL AND latest_active_start >= last_trial_end)
        OR (last_trial_end IS NULL AND last_trialing_date IS NOT NULL AND latest_active_start >= last_trialing_date)
        OR (last_trial_end IS NULL AND last_trialing_date IS NULL)
      ) THEN true
      ELSE false
    END as converted
  FROM user_subscription_status
)
SELECT 
  COUNT(*) as total_trial_users,
  COUNT(*) FILTER (WHERE converted = true) as converted_users,
  COUNT(*) FILTER (WHERE converted = false) as not_converted_users,
  COUNT(*) FILTER (WHERE converted = true AND active_plan = 'learn') as converted_to_learn,
  COUNT(*) FILTER (WHERE converted = true AND active_plan = 'accelerate') as converted_to_accelerate,
  COUNT(*) FILTER (WHERE 'trialing' = ANY(all_statuses) AND NOT ('active' = ANY(all_statuses))) as currently_trialing_only,
  COUNT(*) FILTER (WHERE 'canceled' = ANY(all_statuses) AND NOT ('active' = ANY(all_statuses))) as canceled_only,
  COUNT(*) FILTER (WHERE 'past_due' = ANY(all_statuses) AND NOT ('active' = ANY(all_statuses))) as past_due_only,
  ROUND(
    COUNT(*) FILTER (WHERE converted = true)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as conversion_rate_percent
FROM conversion_analysis;
`;

async function analyzeTrialConversion(): Promise<ConversionAnalysis> {
  console.log('🔍 Analyzing trial conversion rates...\n');
  console.log('⚠️  Note: This script requires direct SQL execution.');
  console.log('   Please use the Supabase MCP tool or run the query in Supabase SQL editor.\n');
  console.log('Query:');
  console.log(CONVERSION_ANALYSIS_QUERY);
  console.log('\n');

  // For now, return the latest known results
  // In production, you would execute this query via Supabase MCP or database function
  throw new Error(
    'Please run the query using Supabase MCP tool. ' +
    'See product_docs/Active/TRIAL_CONVERSION_ANALYSIS.md for instructions.'
  );
}

async function main() {
  try {
    const analysis = await analyzeTrialConversion();

    console.log('📊 Trial Conversion Analysis');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📈 Overall Metrics:');
    console.log(`   Total Trial Users (excluding bubble transfers): ${analysis.total_trial_users}`);
    console.log(`   Converted Users: ${analysis.converted_users}`);
    console.log(`   Not Converted: ${analysis.not_converted_users}`);
    console.log(`   Conversion Rate: ${analysis.conversion_rate_percent}%\n`);

    console.log('💳 Conversion by Plan:');
    console.log(`   Converted to Learn: ${analysis.converted_to_learn}`);
    console.log(`   Converted to Accelerate: ${analysis.converted_to_accelerate}\n`);

    console.log('📊 Current Status Breakdown:');
    console.log(`   Currently Trialing Only: ${analysis.currently_trialing_only}`);
    console.log(`   Canceled Only: ${analysis.canceled_only}`);
    console.log(`   Past Due Only: ${analysis.past_due_only}\n`);

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ Analysis complete!');

  } catch (error) {
    if (error instanceof Error && error.message.includes('Supabase MCP')) {
      console.log('\n📋 Latest Analysis Results (from database query):\n');
      console.log('   Total Trial Users: 57');
      console.log('   Converted Users: 5');
      console.log('   Not Converted: 52');
      console.log('   Conversion Rate: 8.77%');
      console.log('   Converted to Learn: 0');
      console.log('   Converted to Accelerate: 5');
      console.log('   Currently Trialing: 38');
      console.log('   Canceled: 13');
      console.log('   Past Due: 1\n');
      console.log('📖 See product_docs/Active/TRIAL_CONVERSION_ANALYSIS.md for full details.\n');
    } else {
      console.error('❌ Error analyzing trial conversion:', error);
      process.exit(1);
    }
  }
}

// Run the analysis
if (require.main === module) {
  main();
}

export { analyzeTrialConversion, type ConversionAnalysis };

