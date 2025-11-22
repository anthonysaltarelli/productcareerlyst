/**
 * Test script to verify ConvertKit API key and connection
 * Run with: npx tsx scripts/test-convertkit.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const CONVERTKIT_API_BASE = 'https://api.kit.com/v4';
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;

async function testConvertKitAPI() {
  console.log('=== ConvertKit API Test ===\n');

  // Check if API key is set
  if (!CONVERTKIT_API_KEY) {
    console.error('❌ CONVERTKIT_API_KEY is not set in environment variables');
    console.log('\nMake sure you have CONVERTKIT_API_KEY in your .env.local file');
    process.exit(1);
  }

  // Show masked API key for debugging
  const maskedKey = CONVERTKIT_API_KEY.length > 8 
    ? `${CONVERTKIT_API_KEY.substring(0, 4)}...${CONVERTKIT_API_KEY.substring(CONVERTKIT_API_KEY.length - 4)}`
    : '***';
  console.log(`✓ API Key found: ${maskedKey}`);
  console.log(`✓ API Key length: ${CONVERTKIT_API_KEY.length} characters`);
  console.log(`✓ API Key has whitespace: ${CONVERTKIT_API_KEY.trim() !== CONVERTKIT_API_KEY}`);
  console.log('');

  // Test with a simple API call - get account info (V4 uses header-based auth)
  console.log('Testing API connection with V4 API...');
  try {
    const response = await fetch(`${CONVERTKIT_API_BASE}/account`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': CONVERTKIT_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid!');
      console.log(`   Account: ${data.account?.name || 'Unknown'}`);
      console.log(`   Email: ${data.account?.email || 'Unknown'}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ API Key validation failed: ${response.status}`);
      console.error(`   Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function testFormSubscriptionWithEmail(email: string, formId: number) {
  console.log('\n=== Testing Form Subscription ===\n');
  
  if (!CONVERTKIT_API_KEY) {
    console.error('❌ CONVERTKIT_API_KEY is not set');
    return false;
  }

  console.log(`Testing subscription to form ${formId} with email: ${email}`);

  try {
    // V4 API: POST /v4/subscribers with form_id creates subscriber and adds to form
    const response = await fetch(`${CONVERTKIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Kit-Api-Key': CONVERTKIT_API_KEY,
      },
      body: JSON.stringify({
        email_address: email,
        form_id: formId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Form subscription successful!');
      console.log(`   Subscriber ID: ${data.subscriber?.id || 'N/A'}`);
      console.log(`   Email: ${data.subscriber?.email_address || 'N/A'}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Form subscription failed: ${response.status}`);
      console.error(`   Response: ${errorText}`);
      
      // Try parsing as JSON for better error display
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`   Error: ${errorJson.error || 'Unknown'}`);
        console.error(`   Message: ${errorJson.message || 'No message'}`);
      } catch {
        // Not JSON, already logged
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function testSequenceSubscription(email: string) {
  console.log('\n=== Testing Sequence Subscription ===\n');
  
  if (!CONVERTKIT_API_KEY) {
    console.error('❌ CONVERTKIT_API_KEY is not set');
    return false;
  }

  if (!email) {
    console.error('❌ Email is required for sequence subscription');
    return false;
  }

  const sequenceId = 2100454;

  console.log(`Testing subscription to sequence ${sequenceId} with email: ${email}`);

  try {
    // V4 API: POST /v4/sequences/{sequence_id}/subscribers with email_address in body
    const response = await fetch(`${CONVERTKIT_API_BASE}/sequences/${sequenceId}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Kit-Api-Key': CONVERTKIT_API_KEY,
      },
      body: JSON.stringify({
        email_address: email,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sequence subscription successful!');
      console.log(`   Subscriber ID: ${data.subscriber?.id || 'N/A'}`);
      console.log(`   Email: ${data.subscriber?.email_address || 'N/A'}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Sequence subscription failed: ${response.status}`);
      console.error(`   Response: ${errorText}`);
      
      // Try parsing as JSON for better error display
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`   Error: ${errorJson.error || 'Unknown'}`);
        console.error(`   Message: ${errorJson.message || 'No message'}`);
      } catch {
        // Not JSON, already logged
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Run tests
async function runTests() {
  const apiValid = await testConvertKitAPI();
  
  if (!apiValid) {
    console.log('\n⚠️  API key validation failed. Please check your CONVERTKIT_API_KEY.');
    console.log('   Make sure:');
    console.log('   1. The key is correct (no extra spaces)');
    console.log('   2. The key is from ConvertKit Settings > Advanced');
    console.log('   3. The key has not been revoked or regenerated');
    process.exit(1);
  }

  // Test form subscription first (creates subscriber)
  const testEmail = `test-${Date.now()}@example.com`;
  const formId = 7348426;
  
  console.log(`\nTesting with email: ${testEmail}`);
  
  // First add to form to create subscriber
  const formSuccess = await testFormSubscriptionWithEmail(testEmail, formId);
  
  // Test sequence subscription using the email (subscriber now exists from form subscription)
  if (formSuccess) {
    await testSequenceSubscription(testEmail);
  } else {
    console.log('\n⚠️  Skipping sequence subscription test - form subscription failed');
  }
  
  console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);

