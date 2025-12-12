-- Migration: Create trial email sequence
-- Description: Creates complete trial email flow with 12 emails (welcome + 5 activation emails + 6 conversion emails)
-- Created: 2025-01-XX

-- ============================================================================
-- TRIAL EMAIL TEMPLATES
-- ============================================================================

-- Template 1: Welcome Email (Immediate)
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_welcome_v3',
  'Welcome to Your 7-Day Trial! 🚀',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialWelcomeEmailV3',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 2: Day 1 - Lessons
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day1_lessons',
  'Start Learning Today 📚',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay1LessonsEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 3: Day 2 - Contacts
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day2_contacts',
  'Build Your Network 🤝',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay2ContactsEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 4: Day 3 - Resume
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day3_resume',
  'Get AI-Powered Resume Feedback 📄',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay3ResumeEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 5: Day 4 - Portfolio
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day4_portfolio',
  'Showcase Your Impact 🏆',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay4PortfolioEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 6: Day 5 - Jobs
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day5_jobs',
  'Track Your Job Applications 💼',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay5JobsEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 7: Day 6 - Trial Ends Soon
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day6_ends_soon',
  'Your Trial Ends Tomorrow! ⏰',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay6EndsSoonEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 8: Day 7 - Trial Ended
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day7_ended',
  'Your Trial Has Ended',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay7EndedEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 9: Day 10 - Still Interested
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day10_still_interested',
  'Still Interested? 🤔',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay10StillInterestedEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 10: Day 14 - Need Help
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day14_need_help',
  'Need Help Getting Started? 🚀',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay14NeedHelpEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 11: Day 21 - Discount
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day21_discount',
  'Special Offer: 25% Off! 🎉',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay21DiscountEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- Template 12: Day 28 - Discount Reminder
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'trial_day28_discount_reminder',
  'Last Chance: 25% Off! ⏰',
  NULL,
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialDay28DiscountReminderEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- ============================================================================
-- TRIAL EMAIL FLOW
-- ============================================================================

-- Create trial sequence flow
INSERT INTO email_flows (
  name,
  description,
  trigger_event,
  cancel_events,
  is_active
) VALUES (
  'trial_sequence',
  'Trial email sequence: 12 emails over 28 days (welcome + 5 activation emails + 6 conversion emails)',
  'trial_started',
  '["user_upgraded", "subscription_created"]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    trigger_event = EXCLUDED.trigger_event,
    cancel_events = EXCLUDED.cancel_events,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- TRIAL EMAIL FLOW STEPS
-- ============================================================================

-- Get the flow ID and template IDs for creating steps
DO $$
DECLARE
  v_flow_id UUID;
  v_template_welcome UUID;
  v_template_day1 UUID;
  v_template_day2 UUID;
  v_template_day3 UUID;
  v_template_day4 UUID;
  v_template_day5 UUID;
  v_template_day6 UUID;
  v_template_day7 UUID;
  v_template_day10 UUID;
  v_template_day14 UUID;
  v_template_day21 UUID;
  v_template_day28 UUID;
BEGIN
  -- Get flow ID
  SELECT id INTO v_flow_id
  FROM email_flows
  WHERE name = 'trial_sequence'
  LIMIT 1;

  -- Get template IDs
  SELECT id INTO v_template_welcome FROM email_templates WHERE name = 'trial_welcome_v3' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day1 FROM email_templates WHERE name = 'trial_day1_lessons' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day2 FROM email_templates WHERE name = 'trial_day2_contacts' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day3 FROM email_templates WHERE name = 'trial_day3_resume' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day4 FROM email_templates WHERE name = 'trial_day4_portfolio' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day5 FROM email_templates WHERE name = 'trial_day5_jobs' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day6 FROM email_templates WHERE name = 'trial_day6_ends_soon' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day7 FROM email_templates WHERE name = 'trial_day7_ended' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day10 FROM email_templates WHERE name = 'trial_day10_still_interested' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day14 FROM email_templates WHERE name = 'trial_day14_need_help' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day21 FROM email_templates WHERE name = 'trial_day21_discount' AND version = 1 LIMIT 1;
  SELECT id INTO v_template_day28 FROM email_templates WHERE name = 'trial_day28_discount_reminder' AND version = 1 LIMIT 1;

  -- Step 1: Welcome (Immediate - 0 minutes)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    1,
    0, -- Immediate
    v_template_welcome,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Welcome Email', 'day', 0)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 2: Day 1 - Lessons (1440 minutes = 1 day in prod, 1 minute in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    2,
    1440, -- Day 1
    v_template_day1,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 1 - Lessons', 'day', 1)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 3: Day 2 - Contacts (2880 minutes = 2 days in prod, 2 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    3,
    2880, -- Day 2
    v_template_day2,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 2 - Contacts', 'day', 2)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 4: Day 3 - Resume (4320 minutes = 3 days in prod, 3 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    4,
    4320, -- Day 3
    v_template_day3,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 3 - Resume', 'day', 3)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 5: Day 4 - Portfolio (5760 minutes = 4 days in prod, 4 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    5,
    5760, -- Day 4
    v_template_day4,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 4 - Portfolio', 'day', 4)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 6: Day 5 - Jobs (7200 minutes = 5 days in prod, 5 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    6,
    7200, -- Day 5
    v_template_day5,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 5 - Jobs', 'day', 5)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 7: Day 6 - Trial Ends Soon (8640 minutes = 6 days in prod, 6 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    7,
    8640, -- Day 6
    v_template_day6,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 6 - Trial Ends Soon', 'day', 6)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 8: Day 7 - Trial Ended (10080 minutes = 7 days in prod, 7 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    8,
    10080, -- Day 7
    v_template_day7,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 7 - Trial Ended', 'day', 7)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 9: Day 10 - Still Interested (14400 minutes = 10 days in prod, 10 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    9,
    14400, -- Day 10
    v_template_day10,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 10 - Still Interested', 'day', 10)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 10: Day 14 - Need Help (20160 minutes = 14 days in prod, 14 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    10,
    20160, -- Day 14
    v_template_day14,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 14 - Need Help', 'day', 14)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 11: Day 21 - Discount (30240 minutes = 21 days in prod, 21 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    11,
    30240, -- Day 21
    v_template_day21,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 21 - Discount', 'day', 21)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 12: Day 28 - Discount Reminder (40320 minutes = 28 days in prod, 28 minutes in test)
  INSERT INTO email_flow_steps (
    flow_id,
    step_order,
    time_offset_minutes,
    template_id,
    template_version,
    subject_override,
    email_type,
    metadata
  ) VALUES (
    v_flow_id,
    12,
    40320, -- Day 28
    v_template_day28,
    1,
    NULL,
    'marketing',
    jsonb_build_object('step_name', 'Day 28 - Discount Reminder', 'day', 28)
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify flow was created
DO $$
DECLARE
  v_flow_count INT;
  v_step_count INT;
  v_template_count INT;
BEGIN
  SELECT COUNT(*) INTO v_flow_count
  FROM email_flows
  WHERE name = 'trial_sequence';

  SELECT COUNT(*) INTO v_step_count
  FROM email_flow_steps
  WHERE flow_id IN (SELECT id FROM email_flows WHERE name = 'trial_sequence');

  SELECT COUNT(*) INTO v_template_count
  FROM email_templates
  WHERE name LIKE 'trial_%';

  IF v_flow_count = 0 THEN
    RAISE EXCEPTION 'Trial flow was not created';
  END IF;

  IF v_step_count < 12 THEN
    RAISE EXCEPTION 'Trial flow should have 12 steps, but found %', v_step_count;
  END IF;

  IF v_template_count < 12 THEN
    RAISE EXCEPTION 'Trial flow should have 12 templates, but found %', v_template_count;
  END IF;

  RAISE NOTICE 'Trial flow created successfully with % steps and % templates', v_step_count, v_template_count;
END $$;


