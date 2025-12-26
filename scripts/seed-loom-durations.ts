/**
 * Script to fetch Loom video durations and update the lessons table
 *
 * Usage: npx tsx scripts/seed-loom-durations.ts
 *
 * This uses Loom's oembed API to get video metadata including duration,
 * then updates the duration_minutes column in the lessons table.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LoomOembedResponse {
  type: string;
  version: string;
  html: string;
  height: number;
  width: number;
  provider_name: string;
  provider_url: string;
  thumbnail_height: number;
  thumbnail_width: number;
  thumbnail_url: string;
  duration: number; // Duration in seconds
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  duration_minutes: number | null;
}

async function fetchLoomDuration(videoId: string): Promise<number | null> {
  const loomUrl = `https://www.loom.com/share/${videoId}`;
  const oembedUrl = `https://www.loom.com/v1/oembed?url=${encodeURIComponent(loomUrl)}`;

  try {
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      console.error(`  Failed to fetch oembed for ${videoId}: ${response.status}`);
      return null;
    }

    const data: LoomOembedResponse = await response.json();
    return data.duration; // Returns duration in seconds
  } catch (error) {
    console.error(`  Error fetching oembed for ${videoId}:`, error);
    return null;
  }
}

async function main() {
  console.log('Fetching lessons with null duration...\n');

  // Get all lessons that don't have a duration set
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, video_url, duration_minutes')
    .is('duration_minutes', null)
    .order('course_id')
    .order('prioritization');

  if (error) {
    console.error('Error fetching lessons:', error);
    process.exit(1);
  }

  if (!lessons || lessons.length === 0) {
    console.log('All lessons already have durations set!');
    return;
  }

  console.log(`Found ${lessons.length} lessons without duration.\n`);

  let updated = 0;
  let failed = 0;

  for (const lesson of lessons as Lesson[]) {
    console.log(`Processing: ${lesson.title}`);
    console.log(`  Video ID: ${lesson.video_url}`);

    const durationSeconds = await fetchLoomDuration(lesson.video_url);

    if (durationSeconds === null) {
      failed++;
      continue;
    }

    // Convert seconds to minutes (rounded up)
    const durationMinutes = Math.ceil(durationSeconds / 60);

    console.log(`  Duration: ${durationSeconds}s (${durationMinutes} min)`);

    // Update the lesson
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ duration_minutes: durationMinutes })
      .eq('id', lesson.id);

    if (updateError) {
      console.error(`  Failed to update: ${updateError.message}`);
      failed++;
    } else {
      console.log(`  Updated successfully!`);
      updated++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n--- Summary ---');
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${lessons.length}`);
}

main().catch(console.error);
