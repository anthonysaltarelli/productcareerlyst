/**
 * Seed Lesson Descriptions Script
 *
 * Reads short descriptions from CSV and updates the lessons table in Supabase.
 * Matches lessons by video_url (Loom video ID).
 *
 * Usage: npx tsx scripts/seed-lesson-descriptions.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CSV_PATH = path.join(process.cwd(), 'public/Files/Untitled spreadsheet - Supabase Snippet Recent Scheduled Emails.csv');

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

  // Parse CSV with headers
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} rows in CSV`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;

  for (const row of records) {
    const typedRow = row as Record<string, string>;
    const videoUrl = typedRow['video_url'];
    const shortDescription = typedRow['Short Description'];

    // Skip if no video URL or description
    if (!videoUrl || !shortDescription || shortDescription.trim() === '') {
      skipped++;
      continue;
    }

    // Update the lesson in the database
    const { data, error } = await supabase
      .from('lessons')
      .update({ short_description: shortDescription })
      .eq('video_url', videoUrl)
      .select('id, title');

    if (error) {
      console.error(`Error updating lesson with video_url ${videoUrl}:`, error.message);
      errors++;
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`No lesson found with video_url: ${videoUrl}`);
      notFound++;
      continue;
    }

    console.log(`✓ Updated: ${data[0].title}`);
    updated++;
  }

  console.log('\n========================================');
  console.log('Complete!');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no description): ${skipped}`);
  console.log(`  Not found in DB: ${notFound}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(console.error);
