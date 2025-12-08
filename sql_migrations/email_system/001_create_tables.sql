-- Migration: Create email system tables
-- Description: Complete email outreach system with Resend integration, templates, flows, scheduling, preferences, and webhooks
-- Created: 2025-01-XX

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Email type enum (transactional vs marketing)
CREATE TYPE email_type AS ENUM (
  'transactional',
  'marketing'
);

-- Scheduled email status enum
CREATE TYPE scheduled_email_status AS ENUM (
  'pending',
  'scheduled',
  'sent',
  'cancelled',
  'failed',
  'suppressed'
);

-- Email event type enum (from Resend webhooks)
CREATE TYPE email_event_type AS ENUM (
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained'
);

-- Email suppression reason enum
CREATE TYPE suppression_reason AS ENUM (
  'bounced',
  'complained',
  'unsubscribed'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- email_templates: Store email templates with versioning
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb, -- Store React Email component path + props
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_templates_name_version_unique UNIQUE(name, version)
);

-- email_flows: Define email sequences/flows
CREATE TABLE IF NOT EXISTS email_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., "trial_sequence", "onboarding_followup"
  description TEXT,
  trigger_event TEXT NOT NULL, -- Event that triggers this flow
  cancel_events JSONB DEFAULT '[]'::jsonb, -- Array of events that cancel the flow
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- email_flow_steps: Individual emails within a sequence
CREATE TABLE IF NOT EXISTS email_flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES email_flows(id) ON DELETE CASCADE,
  step_order INT NOT NULL, -- Order of this step in the flow
  time_offset_minutes INT NOT NULL, -- Minutes from trigger event (0 = immediate, 1440 = +1 day)
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE RESTRICT,
  template_version INT NOT NULL, -- Lock version at step creation time
  subject_override TEXT, -- Optional subject override for this step
  email_type email_type NOT NULL DEFAULT 'marketing', -- transactional or marketing
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_flow_steps_flow_order_unique UNIQUE(flow_id, step_order)
);

-- scheduled_emails: Track all scheduled emails
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  flow_id UUID REFERENCES email_flows(id) ON DELETE SET NULL,
  flow_step_id UUID REFERENCES email_flow_steps(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE RESTRICT,
  template_version INT NOT NULL, -- Version used at scheduling time
  template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb, -- Complete template data at scheduling (version locking)
  resend_email_id TEXT, -- Resend email ID from API response
  resend_scheduled_id TEXT, -- Resend scheduled email ID (for cancellation)
  status scheduled_email_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When email should be sent
  sent_at TIMESTAMP WITH TIME ZONE, -- When email was actually sent
  cancelled_at TIMESTAMP WITH TIME ZONE, -- When email was cancelled
  suppression_reason suppression_reason, -- Reason if status is 'suppressed'
  is_test BOOLEAN DEFAULT false, -- Distinguishes test emails from production
  flow_trigger_id TEXT, -- Unique identifier for flow trigger instance (prevents duplicates)
  triggered_at TIMESTAMP WITH TIME ZONE, -- When the flow was triggered
  retry_count INT DEFAULT 0, -- Number of retry attempts
  last_retry_at TIMESTAMP WITH TIME ZONE, -- Last retry attempt timestamp
  idempotency_key TEXT UNIQUE NOT NULL, -- Unique key for idempotent operations
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- email_events: Track webhook events from Resend
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_email_id UUID REFERENCES scheduled_emails(id) ON DELETE SET NULL,
  resend_email_id TEXT NOT NULL, -- Resend email ID (for emails not yet in database)
  event_type email_event_type NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb, -- Full webhook payload
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When event occurred (from webhook)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_events_resend_id_type_unique UNIQUE(resend_email_id, event_type, occurred_at)
);

-- email_template_versions: Track template changes for A/B testing
CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL, -- e.g., "v1", "v2", "A", "B"
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  is_active BOOLEAN DEFAULT false, -- Only one version per template should be active
  test_group TEXT, -- A/B test group identifier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_template_versions_template_name_unique UNIQUE(template_id, version_name)
);

-- user_email_preferences: Store user email preferences and unsubscribe status
CREATE TABLE IF NOT EXISTS user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  marketing_emails_enabled BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE, -- When user unsubscribed
  unsubscribe_reason TEXT, -- Reason for unsubscribe
  email_topics JSONB DEFAULT '[]'::jsonb, -- Array of topic preferences, e.g., ["trial_sequence", "product_updates", "newsletter"]
  convertkit_subscriber_id TEXT, -- ConvertKit subscriber ID for newsletter sync
  convertkit_synced_at TIMESTAMP WITH TIME ZONE, -- Last ConvertKit sync timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_email_preferences_user_email_unique UNIQUE(user_id, email_address)
);

-- email_suppressions: Track suppressed email addresses (bounced, complained, unsubscribed)
CREATE TABLE IF NOT EXISTS email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL UNIQUE,
  reason suppression_reason NOT NULL,
  suppressed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional user reference
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- email_unsubscribe_tokens: Secure tokens for unsubscribe links
CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE, -- Secure random token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Token expiration (30 days)
  used_at TIMESTAMP WITH TIME ZONE, -- When token was used (one-time use)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- email_templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- email_flows indexes
CREATE INDEX IF NOT EXISTS idx_email_flows_trigger_event ON email_flows(trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_flows_is_active ON email_flows(is_active);

-- email_flow_steps indexes
CREATE INDEX IF NOT EXISTS idx_email_flow_steps_flow_id ON email_flow_steps(flow_id);
CREATE INDEX IF NOT EXISTS idx_email_flow_steps_template_id ON email_flow_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_email_flow_steps_email_type ON email_flow_steps(email_type);

-- scheduled_emails indexes (as specified in architecture)
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_resend_email_id ON scheduled_emails(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_flow_status ON scheduled_emails(flow_id, status) WHERE flow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status_scheduled_at ON scheduled_emails(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_flow_triggered ON scheduled_emails(user_id, flow_id, triggered_at) WHERE user_id IS NOT NULL AND flow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_idempotency_key ON scheduled_emails(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_email_address ON scheduled_emails(email_address);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_is_test ON scheduled_emails(is_test);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_flow_trigger_id ON scheduled_emails(flow_trigger_id) WHERE flow_trigger_id IS NOT NULL;

-- Partial unique index for flow_trigger_id (prevents duplicate flow triggers)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_emails_flow_trigger_unique 
  ON scheduled_emails(flow_id, flow_trigger_id) 
  WHERE flow_id IS NOT NULL AND flow_trigger_id IS NOT NULL;

-- email_events indexes
CREATE INDEX IF NOT EXISTS idx_email_events_scheduled_email_id ON email_events(scheduled_email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_email_id ON email_events(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at);

-- email_template_versions indexes
CREATE INDEX IF NOT EXISTS idx_email_template_versions_template_id ON email_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_email_template_versions_is_active ON email_template_versions(template_id, is_active);

-- user_email_preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user_id ON user_email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_email_address ON user_email_preferences(email_address);
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_marketing_enabled ON user_email_preferences(marketing_emails_enabled);

-- email_suppressions indexes
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email_address ON email_suppressions(email_address);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_reason ON email_suppressions(reason);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_suppressed_at ON email_suppressions(suppressed_at);

-- email_unsubscribe_tokens indexes
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_token ON email_unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_user_id ON email_unsubscribe_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_email_address ON email_unsubscribe_tokens(email_address);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_expires_at ON email_unsubscribe_tokens(expires_at) WHERE used_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- email_templates: Service role only (admin-managed)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email templates"
  ON email_templates FOR ALL
  USING (auth.role() = 'service_role');

-- email_flows: Service role only (admin-managed)
ALTER TABLE email_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email flows"
  ON email_flows FOR ALL
  USING (auth.role() = 'service_role');

-- email_flow_steps: Service role only (admin-managed)
ALTER TABLE email_flow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email flow steps"
  ON email_flow_steps FOR ALL
  USING (auth.role() = 'service_role');

-- scheduled_emails: Users can view their own, service role can manage all
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own scheduled emails"
  ON scheduled_emails FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all scheduled emails"
  ON scheduled_emails FOR ALL
  USING (auth.role() = 'service_role');

-- email_events: Service role only (system-managed via webhooks)
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email events"
  ON email_events FOR ALL
  USING (auth.role() = 'service_role');

-- email_template_versions: Service role only (admin-managed)
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email template versions"
  ON email_template_versions FOR ALL
  USING (auth.role() = 'service_role');

-- user_email_preferences: Users can manage their own, service role can manage all
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own email preferences"
  ON user_email_preferences FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all email preferences"
  ON user_email_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- email_suppressions: Service role only (system-managed)
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email suppressions"
  ON email_suppressions FOR ALL
  USING (auth.role() = 'service_role');

-- email_unsubscribe_tokens: Service role only (system-managed)
ALTER TABLE email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage unsubscribe tokens"
  ON email_unsubscribe_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- updated_at triggers (requires update_updated_at_column() function from _shared)
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_flows_updated_at
  BEFORE UPDATE ON email_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_flow_steps_updated_at
  BEFORE UPDATE ON email_flow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_email_preferences_updated_at
  BEFORE UPDATE ON user_email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_templates IS 'Email templates with versioning support. Stores React Email component paths and props in metadata.';
COMMENT ON COLUMN email_templates.metadata IS 'Stores React Email component path + props for rendering';

COMMENT ON TABLE email_flows IS 'Email sequence/flows triggered by user events. Examples: trial_sequence, onboarding_followup, upgrade_welcome';
COMMENT ON COLUMN email_flows.cancel_events IS 'JSONB array of events that cancel this flow (e.g., ["user_upgraded", "subscription_created"])';

COMMENT ON TABLE email_flow_steps IS 'Individual emails within a sequence. time_offset_minutes: 0 = immediate, 1440 = +1 day';
COMMENT ON COLUMN email_flow_steps.time_offset_minutes IS 'Minutes from trigger event. In test mode: 1 minute = 1 day. In production: actual minutes (1440 = 1 day)';
COMMENT ON COLUMN email_flow_steps.email_type IS 'transactional (no unsubscribe) or marketing (unsubscribe required)';

COMMENT ON TABLE scheduled_emails IS 'Tracks all scheduled emails with full lifecycle: pending → scheduled → sent/cancelled/failed';
COMMENT ON COLUMN scheduled_emails.template_snapshot IS 'Complete template data at scheduling time (for version locking - updates dont affect scheduled emails)';
COMMENT ON COLUMN scheduled_emails.is_test IS 'Distinguishes test emails from production. Test emails use minutes instead of days for time_offset';
COMMENT ON COLUMN scheduled_emails.flow_trigger_id IS 'Unique identifier for flow trigger instance (prevents duplicate flow triggers)';
COMMENT ON COLUMN scheduled_emails.idempotency_key IS 'Unique key for idempotent operations (prevents duplicate sends)';

COMMENT ON TABLE email_events IS 'Webhook events from Resend. Tracks sent, delivered, opened, clicked, bounced, complained events';
COMMENT ON COLUMN email_events.resend_email_id IS 'Resend email ID (for emails not yet in database when webhook arrives)';

COMMENT ON TABLE email_template_versions IS 'Template versions for A/B testing. Only one version per template should be active';
COMMENT ON COLUMN email_template_versions.test_group IS 'A/B test group identifier (e.g., "A", "B", "control", "variant")';

COMMENT ON TABLE user_email_preferences IS 'User email preferences and unsubscribe status. Supports topic-level preferences';
COMMENT ON COLUMN user_email_preferences.email_topics IS 'Array of topic preferences, e.g., ["trial_sequence", "product_updates", "newsletter"]';
COMMENT ON COLUMN user_email_preferences.convertkit_subscriber_id IS 'ConvertKit subscriber ID for newsletter sync (Form ID: 7348426)';

COMMENT ON TABLE email_suppressions IS 'Suppressed email addresses (bounced, complained, unsubscribed). Prevents sending to these addresses';
COMMENT ON COLUMN email_suppressions.reason IS 'Reason for suppression: bounced, complained, or unsubscribed';

COMMENT ON TABLE email_unsubscribe_tokens IS 'Secure tokens for unsubscribe links. One-time use, expires after 30 days';
COMMENT ON COLUMN email_unsubscribe_tokens.token IS 'Secure random token for unsubscribe links (one-time use)';
COMMENT ON COLUMN email_unsubscribe_tokens.expires_at IS 'Token expiration (30 days from creation)';

