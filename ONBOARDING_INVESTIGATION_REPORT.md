# Onboarding Completion Rate Investigation Report
**Date:** December 3, 2025  
**Investigation:** Deep analysis of onboarding completion rate drop

## Executive Summary

**YES, recent onboarding changes have significantly impacted conversion rates.**

The new onboarding flow (personal_info/goals/portfolio) has a **14.29% completion rate** compared to **60.87% for the old flow** (baseline/targets). This is a **76% drop in completion rate**.

---

## Key Findings

### 1. **CRITICAL: New Flow Performance Issue** 🔴

**New Flow Completion Rate: 14.29% (1 of 7 users)**
- Flow: personal_info → goals → portfolio → plan_display → confirm_goals → trial
- Users started: 7
- Users completed: 1
- **This is the primary cause of the drop**

**Old Flow Completion Rate: 60.87% (14 of 23 users)**
- Flow: baseline → targets → feature_interests → features → trial
- Users started: 23
- Users completed: 14

**Impact:** The new flow is performing **4.3x worse** than the old flow.

### 2. **Users Stuck at Trial Step** 🟡

**12 users have completed all required steps but are NOT marked as complete:**

**New Flow Users Stuck (3 users):**
- `gofranshukair@gmail.com` - Completed all 5 steps, stuck at trial since Dec 2
- `pietri.siana@gmail.com` - Completed all 5 steps, stuck at trial since Dec 2
- `d.dubikovskayaspam@gmail.com` - Completed all 5 steps, stuck at trial since Dec 1

**Old Flow Users Stuck (9 users):**
- Multiple users from Nov 24-30 who completed all steps but never marked complete

**Root Cause:** These users likely:
1. Skipped the trial step
2. `markComplete()` was called but failed silently
3. Or they abandoned at the trial step without clicking "skip"

### 3. **Data Consistency Bug** 🟡

**23 users marked as `is_complete = true` but still have `current_step = 'trial'`**

This is a cosmetic data issue - when onboarding is marked complete, `current_step` should be cleared to `null`. However, this doesn't affect functionality since `is_complete` is the source of truth.

**Fix Needed:** Update `markComplete()` to also set `current_step = null` when completing.

### 4. **Time to Complete Analysis** ✅

Users who DO complete typically finish within **0.01-0.98 hours** (less than 1 hour). This suggests:
- When users complete, they do it quickly
- The onboarding flow itself isn't too long
- The issue is users getting stuck/abandoning, not taking too long

---

## Detailed Breakdown

### Users Who Started But Haven't Completed (Last 10 Days)

| Date | Users Not Completed | Emails |
|------|-------------------|--------|
| Dec 3 | 1 | markomeyercalvo2@gmail.com (stuck at "goals") |
| Dec 2 | 4 | adyasa.mishrawork@gmail.com, gofranshukair@gmail.com, pietri.siana@gmail.com, ugur.yamaan@gmail.com |
| Dec 1 | 2 | brezos@outlook.com, d.dubikovskayaspam@gmail.com |
| Nov 30 | 1 | patilutkarsha18@gmail.com |
| Nov 29 | 1 | alumni.madhumanti.banerjee19@iimj.ac.in |
| Nov 28 | 2 | arundhathijoel@gmail.com, sshabaz.moinuddin@gmail.com |
| Nov 27 | 1 | hongducle96@gmail.com |
| Nov 26 | 2 | lucas.hale10@gmail.com, sreynolds1027@gmail.com |
| Nov 24 | 5 | 21917yash@gmail.com, ayonatomar31@gmail.com, hasson.petty120@gmail.com, omkarargiddi05@gmail.com, vishnuhs203@gmail.com |

**Total: 19 users stuck in onboarding**

### Current Step Distribution

| Step | Total Users | Completed | In Progress | Issue |
|------|------------|-----------|-------------|-------|
| trial | 36 | 23 | 13 | **13 users stuck here** |
| null | 4 | 4 | 0 | ✅ All completed |
| baseline | 2 | 0 | 2 | Old flow users |
| plan_display | 1 | 0 | 1 | New flow user stuck |
| confirm_goals | 1 | 0 | 1 | New flow user stuck |
| goals | 1 | 0 | 1 | New flow user stuck |
| targets | 1 | 0 | 1 | Old flow user stuck |

**Key Insight:** The "trial" step is the biggest bottleneck with 13 users stuck there.

---

## Root Cause Analysis

### Why New Flow Has Low Completion Rate

1. **More Steps = More Drop-off Points**
   - Old flow: ~4 steps
   - New flow: 6 steps (personal_info, goals, portfolio, plan_display, confirm_goals, trial)
   - Each additional step increases abandonment risk

2. **Plan Generation Step May Be Failing**
   - `plan_display` step requires AI plan generation
   - If plan generation fails or is slow, users may abandon
   - 1 user is currently stuck at `plan_display`

3. **Trial Step Abandonment**
   - 3 new flow users completed all steps but are stuck at trial
   - They may have:
     - Encountered payment form errors
     - Decided not to start trial
     - Clicked "skip" but `markComplete()` failed

4. **Missing "Skip Trial" Functionality**
   - Users might not realize they can skip the trial
   - Or the skip flow might not be working properly

### Why Users Are Stuck at Trial

**Hypothesis:** When users click "Yes, I don't want a free 7 day trial" in the skip confirmation modal:
1. `completeOnboarding()` is called (saves plan)
2. `markComplete()` is called (should mark complete)
3. But if `markComplete()` fails silently, user remains incomplete

**Evidence:**
- 12 users have all steps completed but `is_complete = false`
- All are at `current_step = 'trial'`
- Their `updated_at` timestamps show they were active recently

---

## Recommendations

### Immediate Fixes (High Priority)

1. **Fix `markComplete()` to clear `current_step`**
   ```typescript
   // In /api/onboarding/progress route.ts
   if (is_complete !== undefined) {
     updateData.is_complete = is_complete;
     if (is_complete) {
       updateData.completed_at = new Date().toISOString();
       updateData.current_step = null; // ADD THIS
     }
   }
   ```

2. **Add Error Handling to Trial Skip Flow**
   - Ensure `markComplete()` errors are logged
   - Add retry logic if `markComplete()` fails
   - Show user feedback if completion fails

3. **Investigate Plan Generation Failures**
   - Check logs for `/api/onboarding-test/generate-plan` errors
   - Add timeout handling
   - Show loading states during plan generation

### Medium Priority

4. **Add Analytics to Track Drop-off Points**
   - Track when users abandon at each step
   - Monitor plan generation success rate
   - Track trial step interactions (start vs skip)

5. **Improve Skip Trial UX**
   - Make "skip trial" more prominent
   - Add confirmation that skipping will complete onboarding
   - Show success message after skipping

6. **Add Progress Persistence**
   - Ensure progress is saved even if user closes browser
   - Add auto-save for each step completion

### Long-term Improvements

7. **A/B Test New vs Old Flow**
   - Run both flows in parallel
   - Measure completion rates
   - Identify which steps cause most drop-offs

8. **Simplify New Flow**
   - Consider combining steps
   - Make plan_display optional if generation fails
   - Reduce number of required fields

---

## Action Items

- [ ] Fix `markComplete()` to clear `current_step`
- [ ] Add error handling to trial skip flow
- [ ] Investigate plan generation API for failures
- [ ] Review TrialStep component for skip flow bugs
- [ ] Add analytics events for each step completion
- [ ] Create dashboard to monitor onboarding metrics
- [ ] Manually mark stuck users as complete (if appropriate)

---

## Data Sources

- Query: `002_onboarding_completion_rate_query.sql`
- Diagnostic: `003_onboarding_diagnostic_query.sql`
- Database: Supabase Project `jshyrizjqtvhiwmmraqp`
- Date Range: Nov 24 - Dec 3, 2025

