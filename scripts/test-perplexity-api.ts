/**
 * Test script for Perplexity API
 * Tests the API response with a sample company research query
 * 
 * Usage: tsx scripts/test-perplexity-api.ts
 */

import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  console.error('Error: PERPLEXITY_API_KEY environment variable is not set');
  console.error('Please set it in your .env.local file or export it:');
  console.error('  export PERPLEXITY_API_KEY=your_api_key_here');
  process.exit(1);
}

const query = "Provide a detailed summary of the mission statement for Airbnb. Focus on what the company aims to achieve, its purpose, and how it seeks to impact its customers or the broader community. If available, include direct quotes from the company's official resources or leadership.";

console.log('==========================================');
console.log('Testing Perplexity API with sonar model');
console.log('==========================================');
console.log('');
console.log('Query:', query);
console.log('');
console.log('Making API request...');
console.log('');

const testPerplexityAPI = async () => {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    console.log('HTTP Status Code:', response.status);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Response:', errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log('=== Full Response ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    console.log('=== Key Fields ===');
    console.log('');
    console.log('Content:');
    console.log(data.choices?.[0]?.message?.content || 'N/A');
    console.log('');
    console.log('Search Results:');
    console.log(JSON.stringify(data.search_results || [], null, 2));
    console.log('');
    console.log('Usage:');
    console.log(JSON.stringify(data.usage || {}, null, 2));
    console.log('');
    console.log('==========================================');
    console.log('Test complete!');
    console.log('==========================================');
  } catch (error) {
    console.error('Error making API request:', error);
    process.exit(1);
  }
};

testPerplexityAPI();

