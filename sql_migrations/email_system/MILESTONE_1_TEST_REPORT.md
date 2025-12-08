# Milestone 1: Database Schema & Migrations - Test Report

## Migration File Created

✅ **File:** `sql_migrations/email_system/001_create_tables.sql`

This migration creates the complete email system schema with:
- 4 Enum types
- 9 Tables
- 30+ Indexes
- 9 RLS Policies
- 5 Triggers
- Comprehensive comments

## How to Run the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `sql_migrations/email_system/001_create_tables.sql`
6. Copy ALL the contents
7. Paste into Supabase SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)

✅ You should see "Success. No rows returned"

### Option 2: Supabase CLI (if installed)

```bash
supabase db push sql_migrations/email_system/001_create_tables.sql
```

## Testing Steps

After running the migration, execute these verification queries in Supabase SQL Editor:

### Test 1: Verify All Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'email%'
ORDER BY table_name;
```

**Expected Result:** 9 rows
- email_events
- email_flow_steps
- email_flows
- email_suppressions
- email_template_versions
- email_templates
- email_unsubscribe_tokens
- scheduled_emails
- user_email_preferences

### Test 2: Verify Enum Types Exist

```sql
SELECT typname 
FROM pg_type 
WHERE typname IN ('email_type', 'scheduled_email_status', 'email_event_type', 'suppression_reason')
ORDER BY typname;
```

**Expected Result:** 4 rows

### Test 3: Verify Indexes Exist

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename LIKE 'email%' 
ORDER BY tablename, indexname;
```

**Expected Result:** 30+ indexes

**Critical Indexes to Verify:**
- `idx_scheduled_emails_idempotency_key` (UNIQUE)
- `idx_scheduled_emails_user_id`
- `idx_scheduled_emails_status`
- `idx_scheduled_emails_flow_trigger_id`
- `idx_user_email_preferences_user_id`
- `idx_email_suppressions_email_address` (UNIQUE)
- `idx_email_unsubscribe_tokens_token` (UNIQUE)

### Test 4: Verify Unique Constraints

```sql
-- Check idempotency_key unique constraint
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'scheduled_emails'::regclass 
  AND conname LIKE '%idempotency%';
```

**Expected Result:** Should show unique constraint on `idempotency_key`

```sql
-- Check flow_trigger_id unique constraint (partial)
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'scheduled_emails'::regclass 
  AND conname LIKE '%flow_trigger%';
```

**Expected Result:** Should show unique constraint on `(flow_id, flow_trigger_id)` with WHERE clause

### Test 5: Test JSONB Fields Accept Valid JSON

```sql
-- Test insert into email_templates with JSONB
INSERT INTO email_templates (name, subject, metadata)
VALUES ('test-json', 'Test Subject', '{"component": "TestEmail", "props": {"test": true}}'::jsonb)
RETURNING id, name, metadata;
```

**Expected Result:** Should insert successfully with JSONB data

```sql
-- Clean up test data
DELETE FROM email_templates WHERE name = 'test-json';
```

### Test 6: Verify RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'email%'
ORDER BY tablename;
```

**Expected Result:** All 9 tables should have `rowsecurity = true`

### Test 7: Verify Triggers Exist

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table LIKE 'email%'
ORDER BY event_object_table, trigger_name;
```

**Expected Result:** 5 triggers (one for each table with `updated_at`)

### Test 8: Test Sample Inserts

```sql
-- Insert a template (no dependencies)
INSERT INTO email_templates (name, subject, html_content, version)
VALUES ('test-template', 'Test Subject', '<p>Test</p>', 1)
RETURNING id, name, version;

-- Insert a flow (depends on nothing)
INSERT INTO email_flows (name, trigger_event, description)
VALUES ('test-flow', 'test_event', 'Test flow')
RETURNING id, name, trigger_event;

-- Insert a flow step (depends on flow and template)
INSERT INTO email_flow_steps (
  flow_id, 
  step_order, 
  time_offset_minutes, 
  template_id, 
  template_version,
  email_type
)
SELECT 
  (SELECT id FROM email_flows WHERE name = 'test-flow'),
  1,
  0,
  (SELECT id FROM email_templates WHERE name = 'test-template'),
  1,
  'marketing'::email_type
RETURNING id, step_order, email_type;

-- Clean up test data
DELETE FROM email_flow_steps WHERE flow_id IN (SELECT id FROM email_flows WHERE name = 'test-flow');
DELETE FROM email_flows WHERE name = 'test-flow';
DELETE FROM email_templates WHERE name = 'test-template';
```

**Expected Result:** All inserts should succeed

### Test 9: Verify Foreign Key Constraints

```sql
-- Try to insert invalid foreign key (should fail)
INSERT INTO email_flow_steps (
  flow_id, 
  step_order, 
  time_offset_minutes, 
  template_id, 
  template_version,
  email_type
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- Invalid flow_id
  1,
  0,
  '00000000-0000-0000-0000-000000000000'::uuid, -- Invalid template_id
  1,
  'marketing'::email_type
);
```

**Expected Result:** Should fail with foreign key constraint error

### Test 10: Verify Enum Values Work

```sql
-- Test email_type enum
INSERT INTO email_flow_steps (
  flow_id, 
  step_order, 
  time_offset_minutes, 
  template_id, 
  template_version,
  email_type
)
SELECT 
  (SELECT id FROM email_flows LIMIT 1),
  1,
  0,
  (SELECT id FROM email_templates LIMIT 1),
  1,
  'transactional'::email_type
WHERE EXISTS (SELECT 1 FROM email_flows LIMIT 1)
  AND EXISTS (SELECT 1 FROM email_templates LIMIT 1);

-- Test invalid enum value (should fail)
-- This will fail if you try to insert 'invalid'::email_type
```

## Automated Test Script

A test script has been created at `scripts/test-email-migration.ts` that can verify the migration programmatically.

To run it:

```bash
npm run tsx scripts/test-email-migration.ts
```

Or with ts-node:

```bash
npx ts-node scripts/test-email-migration.ts
```

## Migration Checklist

- [x] Migration file created: `sql_migrations/email_system/001_create_tables.sql`
- [x] All 9 tables defined with correct fields
- [x] All 4 enum types defined
- [x] All indexes created (30+ indexes)
- [x] Unique constraints on `idempotency_key` and `flow_trigger_id`
- [x] RLS policies enabled on all tables
- [x] Triggers for `updated_at` columns
- [x] Foreign key constraints with proper CASCADE/SET NULL behavior
- [x] Comprehensive comments on tables and columns
- [ ] Migration executed in Supabase
- [ ] All tests passed

## Next Steps

Once all tests pass:

1. ✅ Mark Milestone 1 as complete
2. Proceed to Milestone 2: Resend Client Integration

## Notes

- The migration requires the `update_updated_at_column()` function from `sql_migrations/_shared/001_create_updated_at_function.sql`
- Make sure to run the shared function migration first if it hasn't been run already
- All tables use UUID primary keys with `gen_random_uuid()`
- All timestamps use `TIMESTAMP WITH TIME ZONE`
- JSONB fields default to empty objects/arrays where appropriate

