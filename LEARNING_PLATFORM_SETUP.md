# Learning Platform Setup Guide

This guide will help you set up the learning platform with your course content.

## Overview

The learning platform includes:
- **Categories**: Organize courses into logical groups
- **Courses**: Collection of lessons on a specific topic
- **Lessons**: Individual video lessons with Loom video player
- **User Progress**: Track which lessons users have completed (future enhancement)

## Database Setup

### Step 1: Create the Database Schema

Run the following SQL in your Supabase SQL Editor to create all necessary tables:

```sql
-- Copy and paste the entire content from database/schema.sql
```

Or run it via the Supabase CLI:

```bash
# If you have Supabase CLI installed
supabase db push
```

**What this creates:**
- `categories` table - Course categories (Career Preparation, Interview Mastery, etc.)
- `courses` table - Individual courses with title, description, and metadata
- `lessons` table - Video lessons linked to courses
- `user_progress` table - Track user completion (for future use)
- Row Level Security (RLS) policies for secure access
- Indexes for better query performance
- Triggers for automatic timestamp updates

### Step 2: Seed the Data

After creating the schema, seed your database with the existing course content:

```sql
-- Copy and paste the entire content from database/seed_data.sql
```

**What this seeds:**
- 4 categories (Career Preparation, Interview Mastery, Product Fundamentals, Compensation)
- 7 courses with all metadata
- 120+ lessons with Loom video IDs

### Verify the Data

After running both scripts, verify the data was created:

```sql
-- Check categories
SELECT name, slug, (SELECT COUNT(*) FROM courses WHERE category_id = categories.id) as course_count
FROM categories
ORDER BY display_order;

-- Check courses
SELECT title, length, (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id) as lesson_count
FROM courses
ORDER BY prioritization;

-- Check a sample of lessons
SELECT c.title as course, l.prioritization, l.title, l.requires_subscription
FROM lessons l
JOIN courses c ON l.course_id = c.id
ORDER BY c.prioritization, l.prioritization
LIMIT 20;
```

## Features Implemented

### 1. Courses Page (`/dashboard/courses`)
- Displays all courses organized by category
- Beautiful card-based UI matching your dashboard design
- Shows course duration and lesson count
- Click any course to view its lessons

### 2. Course Detail Page (`/dashboard/courses/[slug]`)
- Lists all lessons in the course
- Shows lesson order and premium status
- Automatically redirects to first lesson

### 3. Lesson Player (`/dashboard/courses/[slug]/lessons/[lessonId]`)
- Embedded Loom video player
- Lesson navigation (Previous/Next)
- Course sidebar with all lessons
- Breadcrumb navigation
- Premium lesson indicator
- Responsive design

### 4. Loom Video Integration
- Videos are embedded using Loom's embed URL
- Format: `https://www.loom.com/embed/{video_url}`
- Full video controls (play, pause, speed, etc.)
- Responsive 16:9 aspect ratio

## File Structure

```
app/
├── dashboard/
│   └── courses/
│       ├── page.tsx                          # Main courses page
│       └── [slug]/
│           ├── page.tsx                      # Course detail (redirects to first lesson)
│           └── lessons/
│               └── [lessonId]/
│                   └── page.tsx              # Lesson player page
└── components/
    └── LessonPlayer.tsx                      # Loom video player component

database/
├── schema.sql                                # Database schema
└── seed_data.sql                             # Seed data

lib/
└── database-types.ts                         # TypeScript types
```

## Adding New Content

### Add a New Course

```sql
-- 1. First, get the category ID
SELECT id FROM categories WHERE slug = 'career-preparation';

-- 2. Insert the course
INSERT INTO courses (title, slug, description, length, prioritization, category_id, is_published)
VALUES (
  'New Course Title',
  'new-course-slug',
  'Course description',
  '2 hours',
  10,
  'category-uuid-here',
  true
);
```

### Add New Lessons to a Course

```sql
-- 1. Get the course ID
SELECT id FROM courses WHERE slug = 'your-course-slug';

-- 2. Insert lessons
INSERT INTO lessons (course_id, title, video_url, prioritization, requires_subscription)
VALUES
  ('course-uuid-here', 'Lesson Title', 'loom-video-id', '1', false),
  ('course-uuid-here', 'Another Lesson', 'loom-video-id', '2', true);
```

## Loom Video URLs

The `video_url` field in the lessons table should contain only the Loom video ID, not the full URL.

Example:
- ❌ Wrong: `https://www.loom.com/share/79273cdab48f4443a7ddf51cf0fc00d5`
- ✅ Correct: `79273cdab48f4443a7ddf51cf0fc00d5`

The component will automatically construct the embed URL.

## Future Enhancements

1. **User Progress Tracking**
   - Mark lessons as complete
   - Show progress bars on course cards
   - Track watch time

2. **Subscription Management**
   - Gate premium lessons behind subscription check
   - Display upgrade prompts for premium content

3. **Search & Filters**
   - Search lessons by title
   - Filter by category
   - Filter by completion status

4. **Lesson Notes**
   - Allow users to take notes per lesson
   - Export notes

5. **Course Completion Certificates**
   - Generate certificates when course is completed

## Troubleshooting

### Videos not loading?
- Check that the Loom video IDs are correct
- Verify the videos are publicly accessible
- Check browser console for errors

### Courses not appearing?
- Verify data was seeded correctly
- Check that `is_published` is `true`
- Check RLS policies in Supabase

### Database connection errors?
- Verify Supabase client configuration
- Check environment variables
- Ensure Supabase project is active

## Support

For questions or issues:
1. Check the Supabase logs
2. Review the browser console
3. Verify database queries in Supabase SQL Editor

