# Quick Database Setup - 2 Minutes ⚡

## The Problem
You're seeing 404 errors because the database tables don't exist yet.

## The Fix (2 Simple Steps)

### Step 1: Create Tables (30 seconds)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `database/schema.sql` in this project
6. Copy ALL the contents
7. Paste into Supabase SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)

✅ You should see "Success. No rows returned"

### Step 2: Add Course Data (30 seconds)
1. Still in Supabase SQL Editor
2. Click **New Query** again
3. Open the file `database/seed_data.sql` in this project
4. Copy ALL the contents
5. Paste into Supabase SQL Editor
6. Click **Run**

✅ You should see "Success. No rows returned"

### Step 3: Verify It Worked (10 seconds)
Run this query in SQL Editor:

```sql
SELECT 
  cat.name as category,
  c.title as course,
  (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lessons
FROM courses c
JOIN categories cat ON c.category_id = cat.id
ORDER BY c.prioritization;
```

You should see 7 courses with their lesson counts!

### Step 4: Refresh Your Browser
Go back to http://localhost:3000/dashboard/courses and refresh.

🎉 **You should now see all your courses!**

## What You Just Created

- ✅ 4 categories
- ✅ 7 courses
- ✅ 120+ lessons with Loom videos
- ✅ User progress tracking (ready for future use)

## Troubleshooting

**Still seeing errors?**
- Make sure you ran BOTH SQL files (schema.sql first, then seed_data.sql)
- Check the Supabase logs for any error messages
- Make sure you're using the correct Supabase project

**Courses showing but can't click into them?**
- The course detail pages will work once the data is seeded
- Each course page redirects to its first lesson automatically

**Videos not playing?**
- Loom videos embed automatically using the video IDs from your CSV
- Make sure the Loom videos are set to public
- Check browser console for any errors

## Need More Help?

See `LEARNING_PLATFORM_SETUP.md` for detailed documentation.

