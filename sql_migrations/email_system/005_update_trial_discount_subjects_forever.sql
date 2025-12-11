-- Migration: Update trial discount email subjects to reference "forever" instead of "first month"
-- Description: Updates Day 21 and Day 28 trial email template subjects to reflect that the discount is forever, not just for the first month
-- Created: 2025-01-XX

-- ============================================================================
-- UPDATE EMAIL TEMPLATE SUBJECTS
-- ============================================================================

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

-- Verify subjects were updated
DO $$
DECLARE
  v_day21_subject TEXT;
  v_day28_subject TEXT;
BEGIN
  SELECT subject INTO v_day21_subject
  FROM email_templates
  WHERE name = 'trial_day21_discount' AND version = 1
  LIMIT 1;

  SELECT subject INTO v_day28_subject
  FROM email_templates
  WHERE name = 'trial_day28_discount_reminder' AND version = 1
  LIMIT 1;

  IF v_day21_subject = 'Special Offer: 25% Off Forever' AND v_day28_subject = 'Last Chance: 25% Off Forever' THEN
    RAISE NOTICE 'Successfully updated trial discount email subjects to reference "forever"';
  ELSE
    RAISE WARNING 'Subject update verification failed. Day 21: %, Day 28: %', v_day21_subject, v_day28_subject;
  END IF;
END $$;

