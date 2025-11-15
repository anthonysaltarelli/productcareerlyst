// Database types for the learning platform

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  length: string | null;
  prioritization: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  prioritization: string;
  requires_subscription: boolean;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
  watch_duration_seconds: number;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface CourseWithLessons extends Course {
  lessons: Lesson[];
  category?: Category;
}

export interface LessonWithCourse extends Lesson {
  course: Course;
}

export interface CategoryWithCourses extends Category {
  courses: Course[];
}

