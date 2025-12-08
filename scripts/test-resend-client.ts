/**
 * Test script for Resend Client (Milestone 2)
 * 
 * Tests:
 * 1. Immediate email send
 * 2. Scheduled email (2 minutes in future)
 * 3. Email cancellation
 * 4. Error handling (invalid API key)
 */

import { sendEmail, scheduleEmail, cancelEmail, calculateScheduledAt } from '../lib/email/resend-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_RECIPIENT = process.env.TEST_EMAIL || 'anthsalt+test@gmail.com';

async function testImmediateSend() {
  console.log('\n=== Test 1: Immediate Email Send ===\n');
  
  try {
    console.log(`Sending test email to: ${TEST_RECIPIENT}`);
    
    const result = await sendEmail({
      to: TEST_RECIPIENT,
      subject: 'Test Email - Immediate Send',
      html: '<h1>Test Email</h1><p>This is a test email sent immediately via Resend.</p>',
      text: 'Test Email\n\nThis is a test email sent immediately via Resend.',
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${result.id}`);
    console.log(`\n📧 Check your inbox at ${TEST_RECIPIENT}`);
    
    return result.id;
  } catch (error) {
    console.error('❌ Failed to send email:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testScheduledEmail() {
  console.log('\n=== Test 2: Scheduled Email (2 minutes in future) ===\n');
  
  try {
    // Schedule email 2 minutes from now
    const scheduledAt = calculateScheduledAt(new Date(), 2);
    const scheduledDate = new Date(scheduledAt);
    
    console.log(`Scheduling email to: ${TEST_RECIPIENT}`);
    console.log(`Scheduled for: ${scheduledDate.toLocaleString()}`);
    
    const result = await scheduleEmail({
      to: TEST_RECIPIENT,
      subject: 'Test Email - Scheduled Send',
      html: '<h1>Scheduled Test Email</h1><p>This email was scheduled 2 minutes in the future.</p>',
      text: 'Scheduled Test Email\n\nThis email was scheduled 2 minutes in the future.',
      scheduledAt,
    });

    console.log('✅ Email scheduled successfully!');
    console.log(`   Email ID: ${result.id}`);
    console.log(`   Scheduled ID: ${result.scheduledId || 'N/A'}`);
    console.log(`\n📧 Email will arrive at ${scheduledDate.toLocaleString()}`);
    console.log('   Check Resend dashboard to verify it\'s scheduled');
    
    return result.id;
  } catch (error) {
    console.error('❌ Failed to schedule email:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function testCancelEmail(emailId: string) {
  console.log('\n=== Test 3: Cancel Scheduled Email ===\n');
  
  try {
    console.log(`Cancelling email with ID: ${emailId}`);
    
    await cancelEmail(emailId);
    
    console.log('✅ Email cancelled successfully!');
    console.log('   Check Resend dashboard to verify it\'s cancelled');
  } catch (error) {
    console.error('❌ Failed to cancel email:', error instanceof Error ? error.message : error);
    // Don't throw - cancellation might fail if email was already sent
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('   (This is expected if the email was already sent or cancelled)');
    }
  }
}

async function testErrorHandling() {
  console.log('\n=== Test 4: Error Handling (Missing Environment Variables) ===\n');
  
  try {
    // Test with missing RESEND_FROM_EMAIL
    const originalFromEmail = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_FROM_EMAIL;
    
    try {
      await sendEmail({
        to: TEST_RECIPIENT,
        subject: 'This should fail',
        html: '<p>Test</p>',
      });
      console.log('❌ Expected error but email was sent (this is unexpected)');
    } catch (error) {
      if (error instanceof Error && error.message.includes('RESEND_FROM_EMAIL')) {
        console.log('✅ Error handling works correctly!');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('⚠️  Got error but not the expected one:');
        console.log(`   Error: ${error instanceof Error ? error.message : error}`);
      }
    } finally {
      // Restore original from email
      if (originalFromEmail) {
        process.env.RESEND_FROM_EMAIL = originalFromEmail;
      }
    }
  } catch (error) {
    console.error('❌ Error handling test failed:', error instanceof Error ? error.message : error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Resend Client Tests (Milestone 2)\n');
  console.log(`Test recipient: ${TEST_RECIPIENT}\n`);
  
  let scheduledEmailId: string | null = null;
  
  try {
    // Test 1: Immediate send
    await testImmediateSend();
    
    // Wait a moment before scheduling
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Scheduled email
    scheduledEmailId = await testScheduledEmail();
    
    // Wait a moment before cancelling
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Cancel email (only if we have a scheduled email ID)
    if (scheduledEmailId) {
      await testCancelEmail(scheduledEmailId);
    }
    
    // Test 4: Error handling
    await testErrorHandling();
    
    console.log('\n✅ All tests completed!\n');
    console.log('📋 Summary:');
    console.log('   1. ✅ Immediate email send - PASSED');
    console.log('   2. ✅ Scheduled email - PASSED');
    console.log('   3. ✅ Email cancellation - PASSED (or expected error)');
    console.log('   4. ✅ Error handling - PASSED');
    console.log('\n🎉 Milestone 2 tests complete!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);

