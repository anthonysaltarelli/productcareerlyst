-- Migration: Update trial email subjects to remove emojis and match updated copy
-- Description: Updates all 12 trial email template subjects to match the activation-focused copy updates
-- Created: 2025-01-XX

-- ============================================================================
-- UPDATE EMAIL TEMPLATE SUBJECTS
-- ============================================================================

-- Template 1: Welcome Email
UPDATE email_templates
SET subject = 'Welcome! Let''s Get You Moving Forward',
    updated_at = NOW()
WHERE name = 'trial_welcome_v3' AND version = 1;

-- Template 2: Day 1 - Lessons
UPDATE email_templates
SET subject = 'Your First Win is 3 Minutes Away',
    updated_at = NOW()
WHERE name = 'trial_day1_lessons' AND version = 1;

-- Template 3: Day 2 - Contacts
UPDATE email_templates
SET subject = 'The Secret to Landing Your Next Role',
    updated_at = NOW()
WHERE name = 'trial_day2_contacts' AND version = 1;

-- Template 4: Day 3 - Resume
UPDATE email_templates
SET subject = 'Make Your Resume Stand Out',
    updated_at = NOW()
WHERE name = 'trial_day3_resume' AND version = 1;

-- Template 5: Day 4 - Portfolio
UPDATE email_templates
SET subject = 'Tell Your Story Beyond the Resume',
    updated_at = NOW()
WHERE name = 'trial_day4_portfolio' AND version = 1;

-- Template 6: Day 5 - Jobs
UPDATE email_templates
SET subject = 'Stay Organized, Stay Ahead',
    updated_at = NOW()
WHERE name = 'trial_day5_jobs' AND version = 1;

-- Template 7: Day 6 - Trial Ends Soon
UPDATE email_templates
SET subject = 'Don''t Let Your Momentum Stop',
    updated_at = NOW()
WHERE name = 'trial_day6_ends_soon' AND version = 1;

-- Template 8: Day 7 - Trial Ended
UPDATE email_templates
SET subject = 'Your Progress Doesn''t Have to Stop',
    updated_at = NOW()
WHERE name = 'trial_day7_ended' AND version = 1;

-- Template 9: Day 10 - Still Interested
UPDATE email_templates
SET subject = 'Ready to Pick Up Where You Left Off?',
    updated_at = NOW()
WHERE name = 'trial_day10_still_interested' AND version = 1;

-- Template 10: Day 14 - Need Help
UPDATE email_templates
SET subject = 'Not Sure Where to Start? We''re Here',
    updated_at = NOW()
WHERE name = 'trial_day14_need_help' AND version = 1;

-- Template 11: Day 21 - Discount
UPDATE email_templates
SET subject = 'Special Offer: 25% Off Forever',
    updated_at = NOW()
WHERE name = 'trial_day21_discount' AND version = 1;

-- Template 12: Day 28 - Discount Reminder
UPDATE email_templates
SET subject = 'Last Chance: 25% Off Forever',
    updated_at = NOW()
WHERE name = 'trial_day28_discount_reminder' AND version = 1;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all subjects were updated
DO $$
DECLARE
  v_updated_count INT;
  v_expected_count INT := 12;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM email_templates
  WHERE name LIKE 'trial_%'
    AND version = 1
    AND subject NOT LIKE '%🚀%'
    AND subject NOT LIKE '%📚%'
    AND subject NOT LIKE '%🤝%'
    AND subject NOT LIKE '%📄%'
    AND subject NOT LIKE '%🏆%'
    AND subject NOT LIKE '%💼%'
    AND subject NOT LIKE '%⏰%'
    AND subject NOT LIKE '%🤔%'
    AND subject NOT LIKE '%🎉%'
    AND subject NOT LIKE '%🎯%';

  IF v_updated_count < v_expected_count THEN
    RAISE WARNING 'Expected % templates without emojis, but found %', v_expected_count, v_updated_count;
  ELSE
    RAISE NOTICE 'Successfully updated % trial email subjects (removed emojis)', v_updated_count;
  END IF;
END $$;

