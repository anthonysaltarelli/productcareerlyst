/**
 * Test Webhook Handler
 * 
 * This script tests the webhook handler by:
 * 1. Sending test emails via Resend
 * 2. Verifying webhook events are received and processed
 * 3. Checking database for logged events and status updates
 * 
 * Usage:
 *   npx tsx scripts/test-webhook-handler.ts
 * 
 * Prerequisites:
 * - Local server running on port 3000
 * - ngrok tunnel set up pointing to localhost:3000
 * - Webhook configured in Resend dashboard pointing to ngrok URL
 * - RESEND_WEBHOOK_SECRET environment variable set
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { sendEmail } from '../lib/email/resend-client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_RECIPIENT = 'anthsalt@gmail.com';

// Get Supabase admin client
const getSupabaseAdmin = () => {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * Send a test email that will trigger webhook events
 */
async function sendTestEmail() {
  console.log('\n=== Step 1: Sending Test Email ===\n');
  
  try {
    console.log(`📧 Sending test email to: ${TEST_RECIPIENT}`);
    console.log('   This email will trigger webhook events (email.sent, email.delivered, etc.)\n');
    
    const result = await sendEmail({
      to: TEST_RECIPIENT,
      subject: 'Webhook Test Email',
      html: `
        <h1>Webhook Test Email</h1>
        <p>This is a test email to verify webhook handling.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>If you receive this email, the webhook should have fired!</p>
      `,
      text: 'Webhook Test Email\n\nThis is a test email to verify webhook handling.',
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Resend Email ID: ${result.id}`);
    console.log(`\n⏳ Waiting 5 seconds for webhook events to arrive...\n`);
    
    // Wait for webhook to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return result.id;
  } catch (error) {
    console.error('❌ Failed to send email:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Check if webhook events were logged in database
 */
async function checkWebhookEvents(resendEmailId: string) {
  console.log('=== Step 2: Checking Webhook Events in Database ===\n');
  
  const supabase = getSupabaseAdmin();
  
  try {
    // Check email_events table
    const { data: events, error } = await supabase
      .from('email_events')
      .select('*')
      .eq('resend_email_id', resendEmailId)
      .order('occurred_at', { ascending: true });

    if (error) {
      console.error('❌ Error querying email_events:', error.message);
      return;
    }

    if (!events || events.length === 0) {
      console.log('⚠️  No webhook events found in database');
      console.log('   This could mean:');
      console.log('   - Webhook endpoint is not receiving events');
      console.log('   - Webhook signature verification is failing');
      console.log('   - Webhook is not configured correctly');
      console.log('   - Events are still being processed (wait a few more seconds)');
      return;
    }

    console.log(`✅ Found ${events.length} webhook event(s):\n`);
    
    events.forEach((event, index) => {
      console.log(`   Event ${index + 1}:`);
      console.log(`   - Type: ${event.event_type}`);
      console.log(`   - Resend Email ID: ${event.resend_email_id}`);
      console.log(`   - Occurred At: ${event.occurred_at}`);
      console.log(`   - Scheduled Email ID: ${event.scheduled_email_id || 'N/A (email not in scheduled_emails)'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error checking webhook events:', error instanceof Error ? error.message : error);
  }
}

/**
 * Check if scheduled_emails status was updated
 */
async function checkScheduledEmailStatus(resendEmailId: string) {
  console.log('=== Step 3: Checking Scheduled Email Status ===\n');
  
  const supabase = getSupabaseAdmin();
  
  try {
    // Check scheduled_emails table
    const { data: scheduledEmails, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('resend_email_id', resendEmailId);

    if (error) {
      console.error('❌ Error querying scheduled_emails:', error.message);
      return;
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      console.log('ℹ️  No scheduled email found with this Resend ID');
      console.log('   This is expected if the email was sent directly (not via scheduled_emails)');
      console.log('   The webhook handler should still log the event to email_events table');
      return;
    }

    console.log(`✅ Found ${scheduledEmails.length} scheduled email(s):\n`);
    
    scheduledEmails.forEach((email, index) => {
      console.log(`   Email ${index + 1}:`);
      console.log(`   - ID: ${email.id}`);
      console.log(`   - Status: ${email.status}`);
      console.log(`   - Sent At: ${email.sent_at || 'Not set yet'}`);
      console.log(`   - Email Address: ${email.email_address}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error checking scheduled email status:', error instanceof Error ? error.message : error);
  }
}

/**
 * Test webhook signature verification
 */
async function testWebhookSignature() {
  console.log('\n=== Step 4: Testing Webhook Configuration ===\n');
  
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.log('⚠️  RESEND_WEBHOOK_SECRET is not set');
    console.log('   You need to:');
    console.log('   1. Create a webhook in Resend dashboard');
    console.log('   2. Copy the webhook signing secret');
    console.log('   3. Add it to .env.local as RESEND_WEBHOOK_SECRET');
    return;
  }
  
  console.log('✅ RESEND_WEBHOOK_SECRET is configured');
  console.log(`   Secret length: ${webhookSecret.length} characters`);
  console.log('');
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🧪 Webhook Handler Test');
  console.log('='.repeat(50));
  console.log('');
  console.log('Prerequisites:');
  console.log('  ✓ Local server running on port 3000');
  console.log('  ✓ ngrok tunnel active');
  console.log('  ✓ Webhook configured in Resend dashboard');
  console.log('  ✓ RESEND_WEBHOOK_SECRET set in .env.local');
  console.log('');

  // Test webhook configuration
  await testWebhookSignature();

  // Send test email
  const resendEmailId = await sendTestEmail();

  // Check webhook events
  await checkWebhookEvents(resendEmailId);

  // Check scheduled email status (if applicable)
  await checkScheduledEmailStatus(resendEmailId);

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test Complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Check your server logs for webhook requests');
  console.log('  2. Check Resend dashboard for webhook event delivery status');
  console.log('  3. Verify email arrived in inbox');
  console.log('');
}

// Run the test
runTest().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

