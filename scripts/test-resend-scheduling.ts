/**
 * Test script to verify email scheduling works correctly
 * This version does NOT cancel the scheduled email so we can verify it arrives
 */

import { sendEmail, scheduleEmail, calculateScheduledAt } from '../lib/email/resend-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_RECIPIENT = process.env.TEST_EMAIL || 'anthsalt+test@gmail.com';

async function testScheduledEmailOnly() {
  console.log('\n=== Testing Scheduled Email (NO CANCELLATION) ===\n');
  
  try {
    // Schedule email 2 minutes from now
    const scheduledAt = calculateScheduledAt(new Date(), 2);
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    console.log(`Current time: ${now.toLocaleString()}`);
    console.log(`Scheduling email to: ${TEST_RECIPIENT}`);
    console.log(`Scheduled for: ${scheduledDate.toLocaleString()}`);
    console.log(`Time difference: ${Math.round((scheduledDate.getTime() - now.getTime()) / 1000 / 60)} minutes\n`);
    
    const result = await scheduleEmail({
      to: TEST_RECIPIENT,
      subject: 'Test Email - Scheduled (NOT CANCELLED)',
      html: '<h1>Scheduled Test Email</h1><p>This email was scheduled 2 minutes in the future and should arrive at the scheduled time.</p><p>If you receive this immediately, scheduling is not working correctly.</p>',
      text: 'Scheduled Test Email\n\nThis email was scheduled 2 minutes in the future and should arrive at the scheduled time.\n\nIf you receive this immediately, scheduling is not working correctly.',
      scheduledAt,
    });

    console.log('✅ Email scheduled successfully!');
    console.log(`   Email ID: ${result.id}`);
    console.log(`   Scheduled ID: ${result.scheduledId || 'N/A'}`);
    console.log(`\n📧 Email should arrive at: ${scheduledDate.toLocaleString()}`);
    console.log('   ⚠️  This email was NOT cancelled - it should arrive at the scheduled time');
    console.log('   Check your inbox and Resend dashboard to verify\n');
    
    return result.id;
  } catch (error) {
    console.error('❌ Failed to schedule email:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function runTest() {
  console.log('🚀 Testing Email Scheduling (No Cancellation)\n');
  console.log(`Test recipient: ${TEST_RECIPIENT}\n`);
  
  try {
    await testScheduledEmailOnly();
    
    console.log('✅ Test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check Resend dashboard to verify email is scheduled');
    console.log('   2. Wait for the scheduled time');
    console.log('   3. Verify email arrives at the correct time (not immediately)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run test
runTest().catch(console.error);

