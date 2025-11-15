# Database Setup - Quick Start

## Step 1: Create Tables

Copy and paste this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql):

```sql
-- Run the contents of schema.sql
```

Open `schema.sql` and run the entire file.

## Step 2: Seed Data

After tables are created, run:

```sql
-- Run the contents of seed_data.sql
```

Open `seed_data.sql` and run the entire file.

## Step 3: Verify

Check that everything was created:

```sql
-- Count categories
SELECT COUNT(*) as categories FROM categories;
-- Should return: 4

-- Count courses
SELECT COUNT(*) as courses FROM courses;
-- Should return: 7

-- Count lessons
SELECT COUNT(*) as lessons FROM lessons;
-- Should return: 120+

-- View courses by category
SELECT 
  cat.name as category,
  c.title as course,
  c.length,
  (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
FROM courses c
JOIN categories cat ON c.category_id = cat.id
ORDER BY cat.display_order, c.prioritization;
```

## That's it!

Your learning platform is now set up. Visit `/dashboard/courses` to see your courses.

