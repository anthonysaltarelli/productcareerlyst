# SQL Migrations

This directory contains all database migrations organized by table.

## Structure

```
sql_migrations/
├── _shared/                    # Shared functions and utilities
│   ├── 001_*.sql              # Run FIRST - updated_at function
│   └── 002_*.sql              # Run SECOND - enum types
├── categories/                # Categories table migrations
├── courses/                   # Courses table migrations
├── lessons/                   # Lessons table migrations
├── user_progress/             # User progress table migrations
├── companies/                 # Companies table (shared)
├── company_research/          # Company research table (shared)
├── job_applications/          # Job applications table (user-private)
├── interviews/                # Interviews table (user-private)
├── interview_questions/       # Interview questions table
├── contacts/                  # Contacts table
├── interview_interviewers/    # Interview-interviewer junction table
└── contact_interactions/      # Contact interactions table
```

## Running Migrations

### First Time Setup

1. **Run shared functions and enum types first:**
   ```sql
   -- In Supabase SQL Editor, run in order:
   -- sql_migrations/_shared/001_create_updated_at_function.sql
   -- sql_migrations/_shared/002_create_enum_types.sql
   ```

2. **Run table migrations in order:**
   
   Each table folder contains numbered migrations. Run them in order:
   
   **Categories:**
   - `categories/001_create_table.sql`
   - `categories/002_enable_rls.sql`
   - `categories/003_create_policies.sql`
   - `categories/004_create_triggers.sql`
   
   **Courses:**
   - `courses/001_create_table.sql`
   - `courses/002_create_indexes.sql`
   - `courses/003_enable_rls.sql`
   - `courses/004_create_policies.sql`
   - `courses/005_create_triggers.sql`
   
   **Lessons:**
   - `lessons/001_create_table.sql`
   - `lessons/002_create_indexes.sql`
   - `lessons/003_enable_rls.sql`
   - `lessons/004_create_policies.sql`
   - `lessons/005_create_triggers.sql`
   
   **User Progress:**
   - `user_progress/001_create_table.sql`
   - `user_progress/002_create_indexes.sql`
   - `user_progress/003_enable_rls.sql`
   - `user_progress/004_create_policies.sql`
   - `user_progress/005_create_triggers.sql`
   
   **Job Applications (Shared Tables):**
   - `companies/001_create_table.sql`
   - `companies/002_create_indexes.sql`
   - `companies/003_enable_rls.sql`
   - `companies/004_create_policies.sql`
   - `companies/005_create_triggers.sql`
   - `company_research/001_create_table.sql`
   - `company_research/002_create_indexes.sql`
   - `company_research/003_enable_rls.sql`
   - `company_research/004_create_policies.sql`
   - `company_research/005_create_triggers.sql`
   
   **Job Applications (User-Private Tables):**
   - `job_applications/001_create_table.sql`
   - `job_applications/002_create_indexes.sql`
   - `job_applications/003_enable_rls.sql`
   - `job_applications/004_create_policies.sql`
   - `job_applications/005_create_triggers.sql`
   - `interviews/001_create_table.sql`
   - `interviews/002_create_indexes.sql`
   - `interviews/003_enable_rls.sql`
   - `interviews/004_create_policies.sql`
   - `interviews/005_create_triggers.sql`
   - `interview_questions/001_create_table.sql`
   - `interview_questions/002_create_indexes.sql`
   - `interview_questions/003_enable_rls.sql`
   - `interview_questions/004_create_policies.sql`
   - `interview_questions/005_create_triggers.sql`
   - `contacts/001_create_table.sql`
   - `contacts/002_create_indexes.sql`
   - `contacts/003_enable_rls.sql`
   - `contacts/004_create_policies.sql`
   - `contacts/005_create_triggers.sql`
   - `interview_interviewers/001_create_table.sql`
   - `interview_interviewers/002_create_indexes.sql`
   - `interview_interviewers/003_enable_rls.sql`
   - `interview_interviewers/004_create_policies.sql`
   - `contact_interactions/001_create_table.sql`
   - `contact_interactions/002_create_indexes.sql`
   - `contact_interactions/003_enable_rls.sql`
   - `contact_interactions/004_create_policies.sql`

3. **Run seed data:**
   ```sql
   -- Run: database/seed_data.sql
   ```

### Quick Setup (All at Once)

You can also run the complete setup files for faster deployment:
- `database/schema.sql` - Creates all tables, indexes, policies, triggers
- `database/seed_data.sql` - Loads all course data

## Migration Naming Convention

Each migration follows this pattern:
```
{number}_{description}.sql
```

Examples:
- `001_create_table.sql`
- `002_create_indexes.sql`
- `003_enable_rls.sql`
- `004_create_policies.sql`
- `005_create_triggers.sql`

## Adding New Migrations

When modifying a table:

1. Go to that table's folder (e.g., `courses/`)
2. Create a new file with the next number (e.g., `006_add_featured_column.sql`)
3. Write your migration with clear comments
4. Document what changed in this README

## Migration History

### 2025-11-15 - Initial Setup
- Created all tables (categories, courses, lessons, user_progress)
- Added indexes for performance
- Enabled Row Level Security (RLS)
- Created RLS policies
- Added automatic updated_at triggers
- Seeded initial course data (7 courses, 120+ lessons)

### 2025-11-15 - Job Applications Feature
- Created enum types for job application statuses and categories
- Created shared tables (companies, company_research)
- Created user-private tables (job_applications, interviews, contacts)
- Created supporting tables (interview_questions, interview_interviewers, contact_interactions)
- Added comprehensive RLS policies for data privacy
- Added indexes for query optimization
- Updated TypeScript types to match database schema

## Rolling Back

To roll back a specific migration:
1. Write a rollback SQL file
2. Name it like: `{number}_rollback_{description}.sql`
3. Place it in the same folder as the original migration

Example:
```sql
-- 006_rollback_add_featured_column.sql
ALTER TABLE courses DROP COLUMN IF EXISTS featured;
```

## Best Practices

1. **Always number migrations sequentially** within each table folder
2. **Include clear descriptions** in the filename and SQL comments
3. **Test migrations** in a development environment first
4. **Document dependencies** if a migration depends on another table
5. **Keep migrations focused** - one logical change per file
6. **Add rollback instructions** for complex migrations

## Dependencies

Migrations may depend on other tables existing. The recommended order is:
1. `_shared/` (functions and enum types - RUN FIRST)
2. `categories/` (no dependencies)
3. `courses/` (depends on categories)
4. `lessons/` (depends on courses)
5. `user_progress/` (depends on lessons and auth.users)
6. `companies/` (no dependencies - shared table)
7. `company_research/` (depends on companies)
8. `job_applications/` (depends on companies and auth.users)
9. `interviews/` (depends on job_applications)
10. `interview_questions/` (depends on interviews)
11. `contacts/` (depends on companies, optionally job_applications)
12. `interview_interviewers/` (depends on interviews and contacts)
13. `contact_interactions/` (depends on contacts)

