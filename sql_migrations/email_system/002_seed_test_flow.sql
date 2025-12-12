-- Migration: Seed test email flow for debugging
-- Description: Creates a simple test sequence with 6 emails (steps 1-6) that are easy to debug
-- Created: 2025-01-XX

-- ============================================================================
-- TEST EMAIL TEMPLATES
-- ============================================================================

-- Create test sequence email template (used for all steps)
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  version,
  is_active,
  metadata
) VALUES (
  'test_sequence_email',
  'Test Sequence Email - Step {{stepOrder}}',
  NULL, -- Will use React Email component
  NULL,
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TestSequenceEmail',
    'component_props', jsonb_build_object(),
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
) ON CONFLICT (name, version) DO NOTHING;

-- ============================================================================
-- TEST EMAIL FLOW
-- ============================================================================

-- Create test sequence flow
INSERT INTO email_flows (
  name,
  description,
  trigger_event,
  cancel_events,
  is_active
) VALUES (
  'test_sequence',
  'Test email sequence for debugging. 6 emails sent at 0, 1, 2, 3, 4, 5 minutes.',
  'manual_test_trigger',
  '[]'::jsonb, -- No cancel events for test flow
  true
) ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    trigger_event = EXCLUDED.trigger_event,
    cancel_events = EXCLUDED.cancel_events,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Get the flow ID and template ID for creating steps
DO $$
DECLARE
  v_flow_id UUID;
  v_template_id UUID;
BEGIN
  -- Get flow ID
  SELECT id INTO v_flow_id
  FROM email_flows
  WHERE name = 'test_sequence'
  LIMIT 1;

  -- Get template ID
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE name = 'test_sequence_email' AND version = 1
  LIMIT 1;

  -- Create 6 test sequence steps (0, 1, 2, 3, 4, 5 minutes)
  -- Step 1: Immediate (0 minutes)
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
    v_template_id,
    1,
    'Test Sequence - Step 1 (Immediate)',
    'marketing',
    jsonb_build_object('step_name', 'Step 1 - Immediate')
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 2: +1 minute
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
    1, -- +1 minute
    v_template_id,
    1,
    'Test Sequence - Step 2 (+1 minute)',
    'marketing',
    jsonb_build_object('step_name', 'Step 2 - +1 minute')
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 3: +2 minutes
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
    2, -- +2 minutes
    v_template_id,
    1,
    'Test Sequence - Step 3 (+2 minutes)',
    'marketing',
    jsonb_build_object('step_name', 'Step 3 - +2 minutes')
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 4: +3 minutes
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
    3, -- +3 minutes
    v_template_id,
    1,
    'Test Sequence - Step 4 (+3 minutes)',
    'marketing',
    jsonb_build_object('step_name', 'Step 4 - +3 minutes')
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 5: +4 minutes
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
    4, -- +4 minutes
    v_template_id,
    1,
    'Test Sequence - Step 5 (+4 minutes)',
    'marketing',
    jsonb_build_object('step_name', 'Step 5 - +4 minutes')
  ) ON CONFLICT (flow_id, step_order) DO UPDATE
  SET time_offset_minutes = EXCLUDED.time_offset_minutes,
      template_id = EXCLUDED.template_id,
      template_version = EXCLUDED.template_version,
      subject_override = EXCLUDED.subject_override,
      email_type = EXCLUDED.email_type,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

  -- Step 6: +5 minutes
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
    5, -- +5 minutes
    v_template_id,
    1,
    'Test Sequence - Step 6 (+5 minutes)',
    'marketing',
    jsonb_build_object('step_name', 'Step 6 - +5 minutes')
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
BEGIN
  SELECT COUNT(*) INTO v_flow_count
  FROM email_flows
  WHERE name = 'test_sequence';

  SELECT COUNT(*) INTO v_step_count
  FROM email_flow_steps
  WHERE flow_id IN (SELECT id FROM email_flows WHERE name = 'test_sequence');

  IF v_flow_count = 0 THEN
    RAISE EXCEPTION 'Test flow was not created';
  END IF;

  IF v_step_count < 6 THEN
    RAISE EXCEPTION 'Test flow should have 6 steps, but found %', v_step_count;
  END IF;

  RAISE NOTICE 'Test flow created successfully with % steps', v_step_count;
END $$;


