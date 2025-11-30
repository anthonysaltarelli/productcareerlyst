/**
 * Seed Onboarding Plans for Existing Users
 *
 * This script seeds the new onboarding plan tables for all existing users
 * who don't have a user_plans record yet.
 *
 * Tables seeded:
 * - user_plans
 * - user_baseline_actions
 * - user_weekly_goals
 * - user_weekly_progress
 * - goal_events
 *
 * Usage:
 *   npx ts-node scripts/seed-onboarding-plans.ts --dry-run  # Preview only
 *   npx ts-node scripts/seed-onboarding-plans.ts            # Execute
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Use service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

// ============================================================================
// Generic Plan Content
// ============================================================================

const GENERIC_SUMMARY = `Welcome to Product Careerlyst! We've set up a personalized action plan to help you land your next product role. Complete the baseline actions below to build a strong foundation, then stay consistent with your weekly goals to maintain momentum. Let's go!`;

const GENERIC_WEEKLY_GOALS_DESCRIPTION = `Stay disciplined every week with your job search strategy. Networking for referrals and applying consistently is the best path to landing your next role.`;

const BASELINE_ACTIONS = [
  {
    title: 'Stand Out with a Product Portfolio',
    description:
      'A product portfolio showcases your thinking and helps you stand out from other candidates.',
    actions: [
      { id: 'portfolio-create', label: 'Create a Product Portfolio', completed: false },
      { id: 'portfolio-profile', label: 'Fill out your profile & bio', completed: false },
      { id: 'portfolio-first-case', label: 'Publish your first case study', completed: false },
      { id: 'portfolio-publish', label: 'Publish your Portfolio', completed: false },
    ],
  },
  {
    title: 'Optimize Your Resume',
    description:
      'Your resume is your first impression. Make sure it highlights your product skills effectively.',
    actions: [
      { id: 'resume-import', label: 'Import your resume', completed: false },
      { id: 'resume-analyze', label: 'Get your resume analyzed', completed: false },
      { id: 'resume-export', label: 'Export your improved resume', completed: false },
    ],
  },
  {
    title: 'Build Your PM Knowledge',
    description: 'Level up your product management skills with our curated courses.',
    actions: [
      { id: 'course-pm-fundamentals', label: 'Complete PM Fundamentals course', completed: false },
      { id: 'course-resume-linkedin', label: 'Complete Resume & LinkedIn course', completed: false },
      { id: 'course-secure-referral', label: 'Complete Secure a Referral course', completed: false },
    ],
  },
];

const WEEKLY_GOALS = [
  { id: 'weekly-applications', label: 'Apply to 10 quality roles per week', target: 10 },
  { id: 'weekly-networking-calls', label: 'Schedule 3 networking calls per week', target: 3 },
  { id: 'weekly-outreach-emails', label: 'Send 20 outreach emails per week', target: 20 },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the Monday of the current week (YYYY-MM-DD format)
 */
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

/**
 * Flatten baseline actions into individual action rows
 */
function flattenBaselineActions(userId: string) {
  const rows: Array<{
    user_id: string;
    action_id: string;
    label: string;
    section_title: string;
    is_completed: boolean;
  }> = [];

  for (const section of BASELINE_ACTIONS) {
    for (const action of section.actions) {
      rows.push({
        user_id: userId,
        action_id: action.id,
        label: action.label,
        section_title: section.title,
        is_completed: false,
      });
    }
  }

  return rows;
}

/**
 * Create weekly goal rows for a user
 */
function createWeeklyGoalRows(userId: string) {
  return WEEKLY_GOALS.map((goal) => ({
    user_id: userId,
    goal_id: goal.id,
    label: goal.label,
    target_count: goal.target,
    is_enabled: true,
  }));
}

/**
 * Create weekly progress rows for current week
 */
function createWeeklyProgressRows(userId: string, weekStart: string) {
  return WEEKLY_GOALS.map((goal) => ({
    user_id: userId,
    goal_id: goal.id,
    week_start: weekStart,
    current_count: 0,
    target_count: goal.target,
  }));
}

// ============================================================================
// Main Seeding Logic
// ============================================================================

async function seedOnboardingPlans() {
  console.log('='.repeat(60));
  console.log('Seed Onboarding Plans for Existing Users');
  console.log('='.repeat(60));

  if (isDryRun) {
    console.log('\n*** DRY RUN MODE - No data will be inserted ***\n');
  }

  // Step 1: Get all users without a user_plans record
  console.log('\n[1/6] Finding users without onboarding plans...');

  const { data: usersWithoutPlans, error: queryError } = await supabase.rpc('get_users_without_plans');

  // If RPC doesn't exist, fall back to raw query approach
  let userIds: string[] = [];

  if (queryError) {
    console.log('  RPC not available, using direct query...');

    // Get all user IDs from auth.users via profiles (since we can't query auth.users directly)
    // We'll use a different approach - get users from various tables
    const { data: allUserPlans } = await supabase.from('user_plans').select('user_id');
    const existingPlanUserIds = new Set((allUserPlans || []).map((p) => p.user_id));

    // Get all unique user_ids from onboarding_progress (users who have gone through onboarding)
    const { data: onboardingUsers } = await supabase
      .from('onboarding_progress')
      .select('user_id');

    // Get all unique user_ids from profiles
    const { data: profileUsers } = await supabase.from('profiles').select('user_id');

    // Get all unique user_ids from subscriptions
    const { data: subscriptionUsers } = await supabase.from('subscriptions').select('user_id');

    // Combine all user IDs
    const allUserIds = new Set<string>();
    (onboardingUsers || []).forEach((u) => allUserIds.add(u.user_id));
    (profileUsers || []).forEach((u) => allUserIds.add(u.user_id));
    (subscriptionUsers || []).forEach((u) => allUserIds.add(u.user_id));

    // Filter out users who already have plans
    userIds = Array.from(allUserIds).filter((id) => !existingPlanUserIds.has(id));
  } else {
    userIds = (usersWithoutPlans || []).map((u: { id: string }) => u.id);
  }

  console.log(`  Found ${userIds.length} users without onboarding plans`);

  if (userIds.length === 0) {
    console.log('\n  No users to seed. All users already have plans!');
    return;
  }

  if (isDryRun) {
    console.log('\n  User IDs that would be seeded:');
    userIds.slice(0, 10).forEach((id) => console.log(`    - ${id}`));
    if (userIds.length > 10) {
      console.log(`    ... and ${userIds.length - 10} more`);
    }
  }

  // Step 2: Prepare data for all tables
  console.log('\n[2/6] Preparing data for insertion...');

  const weekStart = getCurrentWeekStart();
  const now = new Date().toISOString();

  // Prepare user_plans rows
  const userPlansRows = userIds.map((userId) => ({
    user_id: userId,
    plan_version: 1,
    onboarding_snapshot: {},
    summary: GENERIC_SUMMARY,
    baseline_actions: BASELINE_ACTIONS,
    weekly_goals_description: GENERIC_WEEKLY_GOALS_DESCRIPTION,
    target_role: null,
    target_date: null,
    timeline_selection: null,
    baseline_all_complete: false,
  }));

  // Prepare user_baseline_actions rows
  const baselineActionsRows = userIds.flatMap((userId) => flattenBaselineActions(userId));

  // Prepare user_weekly_goals rows
  const weeklyGoalsRows = userIds.flatMap((userId) => createWeeklyGoalRows(userId));

  // Prepare user_weekly_progress rows
  const weeklyProgressRows = userIds.flatMap((userId) => createWeeklyProgressRows(userId, weekStart));

  // Prepare goal_events rows
  const goalEventsRows = userIds.map((userId) => ({
    user_id: userId,
    event_type: 'plan_created',
    goal_id: 'seed',
    metadata: {
      source: 'migration_script',
      seeded_at: now,
    },
  }));

  console.log(`  Prepared:`);
  console.log(`    - ${userPlansRows.length} user_plans rows`);
  console.log(`    - ${baselineActionsRows.length} user_baseline_actions rows`);
  console.log(`    - ${weeklyGoalsRows.length} user_weekly_goals rows`);
  console.log(`    - ${weeklyProgressRows.length} user_weekly_progress rows`);
  console.log(`    - ${goalEventsRows.length} goal_events rows`);

  if (isDryRun) {
    console.log('\n*** DRY RUN COMPLETE - No data was inserted ***');
    console.log('\nRun without --dry-run to execute the seeding.');
    return;
  }

  // Step 3: Insert user_plans
  console.log('\n[3/6] Inserting user_plans...');
  const { error: plansError } = await supabase
    .from('user_plans')
    .insert(userPlansRows)
    .select();

  if (plansError) {
    console.error('  Error inserting user_plans:', plansError.message);
    throw plansError;
  }
  console.log(`  ✓ Inserted ${userPlansRows.length} user_plans rows`);

  // Step 4: Insert user_baseline_actions
  console.log('\n[4/6] Inserting user_baseline_actions...');
  const { error: actionsError } = await supabase
    .from('user_baseline_actions')
    .insert(baselineActionsRows);

  if (actionsError) {
    console.error('  Error inserting user_baseline_actions:', actionsError.message);
    throw actionsError;
  }
  console.log(`  ✓ Inserted ${baselineActionsRows.length} user_baseline_actions rows`);

  // Step 5: Insert user_weekly_goals
  console.log('\n[5/6] Inserting user_weekly_goals...');
  const { error: goalsError } = await supabase.from('user_weekly_goals').insert(weeklyGoalsRows);

  if (goalsError) {
    console.error('  Error inserting user_weekly_goals:', goalsError.message);
    throw goalsError;
  }
  console.log(`  ✓ Inserted ${weeklyGoalsRows.length} user_weekly_goals rows`);

  // Step 6: Insert user_weekly_progress
  console.log('\n[6/6] Inserting user_weekly_progress and goal_events...');
  const { error: progressError } = await supabase
    .from('user_weekly_progress')
    .insert(weeklyProgressRows);

  if (progressError) {
    console.error('  Error inserting user_weekly_progress:', progressError.message);
    throw progressError;
  }
  console.log(`  ✓ Inserted ${weeklyProgressRows.length} user_weekly_progress rows`);

  // Insert goal_events
  const { error: eventsError } = await supabase.from('goal_events').insert(goalEventsRows);

  if (eventsError) {
    console.error('  Error inserting goal_events:', eventsError.message);
    throw eventsError;
  }
  console.log(`  ✓ Inserted ${goalEventsRows.length} goal_events rows`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SEEDING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal users seeded: ${userIds.length}`);
  console.log(`Week start date: ${weekStart}`);
  console.log('\nRows inserted:');
  console.log(`  - user_plans: ${userPlansRows.length}`);
  console.log(`  - user_baseline_actions: ${baselineActionsRows.length}`);
  console.log(`  - user_weekly_goals: ${weeklyGoalsRows.length}`);
  console.log(`  - user_weekly_progress: ${weeklyProgressRows.length}`);
  console.log(`  - goal_events: ${goalEventsRows.length}`);
}

// Run the script
seedOnboardingPlans()
  .then(() => {
    console.log('\nScript completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
