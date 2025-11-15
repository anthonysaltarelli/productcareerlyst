# SQL Migrations

This directory contains all database migrations organized by table.

## Structure

```
sql_migrations/
├── _shared/              # Shared functions and utilities
│   └── 001_*.sql        # Run these FIRST
├── categories/          # Categories table migrations
│   ├── 001_*.sql
│   ├── 002_*.sql
│   └── ...
├── courses/             # Courses table migrations
├── lessons/             # Lessons table migrations
└── user_progress/       # User progress table migrations
```

## Running Migrations

### First Time Setup

1. **Run shared functions first:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- sql_migrations/_shared/001_create_updated_at_function.sql
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
1. `_shared/` (functions and utilities)
2. `categories/` (no dependencies)
3. `courses/` (depends on categories)
4. `lessons/` (depends on courses)
5. `user_progress/` (depends on lessons and auth.users)

