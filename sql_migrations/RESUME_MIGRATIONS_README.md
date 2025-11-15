# Resume Database Migrations

This directory contains database migrations for the resume versioning system using **Option 2: Full Duplication Per Version**.

## Design Philosophy

Each resume version is a complete, independent copy of all data. This provides:
- ✅ Simple queries (1-2 joins max)
- ✅ Clear mental model (one version = one complete resume)
- ✅ Fast read performance
- ✅ Easy maintenance and debugging
- ✅ True version independence

## Schema Overview

### Tables (9 total)

1. **resume_versions** - Version metadata (Master, Google PM, etc.)
2. **resume_contact_info** - Contact details per version
3. **resume_summaries** - Professional summary per version
4. **resume_experiences** - Work experiences per version
5. **resume_experience_bullets** - Bullet points per experience
6. **resume_education** - Education entries per version
7. **resume_education_achievements** - Achievements/honors per education
8. **resume_skills** - Skills per version (categorized)
9. **resume_styles** - Styling preferences per version

## Migration Execution Order

**IMPORTANT:** Execute migrations in this order to respect foreign key dependencies:

```bash
# 1. First: Create the main version table
psql -f sql_migrations/resume_versions/001_create_resume_versions.sql

# 2. Then: Create tables that directly reference resume_versions
psql -f sql_migrations/resume_contact_info/001_create_resume_contact_info.sql
psql -f sql_migrations/resume_summaries/001_create_resume_summaries.sql
psql -f sql_migrations/resume_experiences/001_create_resume_experiences.sql
psql -f sql_migrations/resume_education/001_create_resume_education.sql
psql -f sql_migrations/resume_skills/001_create_resume_skills.sql
psql -f sql_migrations/resume_styles/001_create_resume_styles.sql

# 3. Finally: Create tables that reference other resume tables
psql -f sql_migrations/resume_experience_bullets/001_create_resume_experience_bullets.sql
psql -f sql_migrations/resume_education_achievements/001_create_resume_education_achievements.sql
```

## Each Migration File Contains

- ✅ Table creation with all columns and constraints
- ✅ Indexes for query performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for `updated_at` timestamps
- ✅ Comprehensive comments

## Key Features

### Security
- All tables have RLS enabled
- Users can only access their own resume data
- Policies use `auth.uid()` for authentication
- Cascade deletes prevent orphaned data

### Performance
- Strategic indexes on foreign keys
- Indexes on commonly queried columns
- Compound indexes for sorting (e.g., `version_id, display_order`)

### Data Integrity
- NOT NULL constraints on required fields
- CHECK constraints for valid data (e.g., font size 8-16)
- UNIQUE constraints where appropriate
- Foreign keys with CASCADE delete

### Audit Trail
- All tables have `created_at` timestamp
- Most tables have `updated_at` with automatic trigger
- Enables tracking when data was modified

## Common Operations

### Create a New Resume Version
```sql
-- Insert version
INSERT INTO resume_versions (user_id, name, slug, is_master)
VALUES (auth.uid(), 'Google PM Resume', 'google-pm', false)
RETURNING id;

-- Insert associated data using the returned version_id
-- (contact_info, summary, experiences, education, skills, styles)
```

### Delete a Resume Version
```sql
-- Cascade delete removes all associated data automatically
DELETE FROM resume_versions WHERE id = $1 AND user_id = auth.uid();
```

### Clone a Resume Version
```sql
-- 1. Copy the version record
-- 2. Copy all associated tables with new version_id
-- 3. Maintain display_order values
```

## Testing Migrations

After running migrations, verify with:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'resume_%';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'resume_%';

-- Check policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename LIKE 'resume_%';
```

## Prerequisites

The migrations depend on:
- `auth.users` table (Supabase auth)
- `update_updated_at_column()` function (in `_shared/001_create_updated_at_function.sql`)

Make sure these exist before running resume migrations.

## Future Enhancements

Potential additions:
- Version cloning helper function
- Version comparison views
- Full-text search on bullet content
- Analytics/tracking tables
- Template system
- Sharing capabilities

