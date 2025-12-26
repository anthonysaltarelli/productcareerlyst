/**
 * Generate Lesson Descriptions Script
 *
 * Processes a CSV file containing lesson transcripts, sends each transcript
 * to OpenAI's GPT-5.2 model to generate concise descriptions, and saves results.
 *
 * Rate limited to 1 request per second to avoid API limits.
 *
 * Usage: npx tsx scripts/generate-lesson-descriptions.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPEN_AI_SECRET_KEY;
const MODEL = 'gpt-5.2';
const CSV_PATH = path.join(process.cwd(), 'public/Files/Untitled spreadsheet - Supabase Snippet Recent Scheduled Emails.csv');
const RATE_LIMIT_MS = 1000; // 1 second between requests

const PROMPT_TEMPLATE = `You are helping write concise lesson descriptions for a SaaS-based course platform.

Input: A raw video transcript of a single lesson.

Task:
Read the transcript and identify the primary outcome of the lesson (what the learner will be able to do, understand, or decide after watching).
Write exactly one sentence that describes the lesson.
Follow this exact format:
"Learn how to [specific action or understanding] so you can [practical outcome or benefit]."

Rules:
Be concrete and specific (avoid vague phrases like "understand the basics" or "learn about").
Focus on learner value, not instructor actions.
Do not mention timestamps, examples, or side discussions unless they are central to the lesson.
Do not use marketing language, hype, or emojis.
Keep the sentence under 25 words.

Transcript:
`;

async function generateDescription(transcript: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: PROMPT_TEMPLATE + transcript,
        },
      ],
      max_completion_tokens: 100,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('Error: OPEN_AI_SECRET_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

  // Parse CSV with headers
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} rows to process`);
  console.log(`Rate limit: 1 request per second`);
  console.log(`Estimated time: ~${Math.ceil(records.length / 60)} minutes\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i] as Record<string, string>;
    const transcript = row['Transcript'];
    const title = row['title'] || 'Unknown';

    // Skip if no transcript
    if (!transcript || transcript.trim() === '') {
      console.log(`[${i + 1}/${records.length}] Skipping "${title}" - no transcript`);
      skipped++;
      continue;
    }

    // Skip if already has a description
    if (row['Short Description'] && row['Short Description'].trim() !== '') {
      console.log(`[${i + 1}/${records.length}] Skipping "${title}" - already has description`);
      skipped++;
      continue;
    }

    try {
      console.log(`[${i + 1}/${records.length}] Processing "${title}"...`);
      const description = await generateDescription(transcript);
      row['Short Description'] = description;
      console.log(`  → ${description}`);
      processed++;
    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : error}`);
      errors++;
    }

    // Rate limit: wait 1 second before next request
    if (i < records.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Get column headers from first record
  const columns = Object.keys(records[0] as Record<string, string>);

  // Write back to CSV
  const output = stringify(records, {
    header: true,
    columns: columns,
  });

  fs.writeFileSync(CSV_PATH, output);

  console.log('\n========================================');
  console.log('Complete!');
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Output: ${CSV_PATH}`);
}

main().catch(console.error);
