import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n=== Checking Database ===\n');

  // Check courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*');

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
  } else {
    console.log(`Found ${courses?.length || 0} courses:`);
    courses?.forEach(course => {
      console.log(`  - ${course.slug}: ${course.title}`);
    });
  }

  console.log('\n');

  // Check lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*');

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
  } else {
    console.log(`Found ${lessons?.length || 0} lessons`);
  }

  console.log('\n');

  // Try to fetch the specific course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      length,
      lessons (
        id,
        title,
        video_url,
        prioritization,
        requires_subscription
      )
    `)
    .eq('slug', 'resume-linkedin')
    .eq('is_published', true)
    .single();

  if (courseError) {
    console.error('Error fetching resume-linkedin course:', courseError);
  } else {
    console.log('resume-linkedin course:', course);
  }
}

checkDatabase();
