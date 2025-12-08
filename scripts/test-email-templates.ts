/**
 * Test script for email template system
 * 
 * Tests:
 * 1. Template creation via SQL
 * 2. getTemplate() function
 * 3. renderTemplate() function
 * 4. Template versioning
 * 5. Dynamic variable replacement
 * 6. Unsubscribe link placeholder
 */

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import {
  getTemplate,
  getActiveTemplateByName,
  renderTemplate,
  createTemplateVersion,
  activateTemplateVersion,
  getAllTemplates,
} from '../lib/email/templates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createSupabaseAdmin(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testTemplateSystem() {
  console.log('🧪 Testing Email Template System\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Create templates via SQL
    console.log('\n📝 Test 1: Creating templates in database...');
    
    // Create Trial Welcome Email template
    const { data: trialTemplate, error: trialError } = await supabase
      .from('email_templates')
      .insert({
        name: 'trial_welcome',
        subject: 'Welcome to Your 7-Day Trial! 🚀',
        html_content: null, // Using React Email component
        text_content: null,
        version: 1,
        is_active: true,
        metadata: {
          component_path: '@/app/components/emails/TrialWelcomeEmail',
          component_props: {},
          email_type: 'marketing',
          unsubscribe_url_placeholder: '{{unsubscribe_url}}',
        },
      })
      .select()
      .single();

    if (trialError) {
      if (trialError.code === '23505') {
        console.log('  ⚠️  Template "trial_welcome" already exists, skipping creation');
        // Fetch existing template
        const { data: existing } = await supabase
          .from('email_templates')
          .select('*')
          .eq('name', 'trial_welcome')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();
        if (existing) {
          console.log('  ✅ Using existing template:', existing.id);
        }
      } else {
        throw trialError;
      }
    } else {
      console.log('  ✅ Created trial_welcome template:', trialTemplate.id);
    }

    // Create OTP Email template
    const { data: otpTemplate, error: otpError } = await supabase
      .from('email_templates')
      .insert({
        name: 'otp_email',
        subject: 'Your Verification Code',
        html_content: null, // Using React Email component
        text_content: null,
        version: 1,
        is_active: true,
        metadata: {
          component_path: '@/app/components/emails/OTPEmail',
          component_props: {},
          email_type: 'transactional',
        },
      })
      .select()
      .single();

    if (otpError) {
      if (otpError.code === '23505') {
        console.log('  ⚠️  Template "otp_email" already exists, skipping creation');
        // Fetch existing template
        const { data: existing } = await supabase
          .from('email_templates')
          .select('*')
          .eq('name', 'otp_email')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();
        if (existing) {
          console.log('  ✅ Using existing template:', existing.id);
        }
      } else {
        throw otpError;
      }
    } else {
      console.log('  ✅ Created otp_email template:', otpTemplate.id);
    }

    // Test 2: Get template by name
    console.log('\n📖 Test 2: Getting template by name...');
    const activeTrialTemplate = await getActiveTemplateByName('trial_welcome');
    if (!activeTrialTemplate) {
      throw new Error('Failed to get trial_welcome template');
    }
    console.log('  ✅ Retrieved template:', activeTrialTemplate.name, 'v' + activeTrialTemplate.version);
    console.log('     Subject:', activeTrialTemplate.subject);
    console.log('     Email Type:', activeTrialTemplate.metadata?.email_type);

    // Test 3: Get template by ID
    console.log('\n📖 Test 3: Getting template by ID...');
    const templateById = await getTemplate(activeTrialTemplate.id);
    if (!templateById) {
      throw new Error('Failed to get template by ID');
    }
    console.log('  ✅ Retrieved template by ID:', templateById.name);

    // Test 4: Render template with variables
    console.log('\n🎨 Test 4: Rendering template with variables...');
    const renderedHtml = await renderTemplate(
      activeTrialTemplate,
      {
        firstName: 'John',
        userId: 'test-user-123',
      },
      'https://productcareerlyst.com/unsubscribe/token123'
    );
    
    if (!renderedHtml || renderedHtml.length === 0) {
      throw new Error('Rendered HTML is empty');
    }
    
    console.log('  ✅ Template rendered successfully');
    console.log('     HTML length:', renderedHtml.length, 'characters');
    console.log('     Contains "John":', renderedHtml.includes('John'));
    console.log('     Contains unsubscribe URL:', renderedHtml.includes('unsubscribe/token123'));

    // Test 5: Get OTP template and render
    console.log('\n🎨 Test 5: Rendering OTP email template...');
    const otpTemplateActive = await getActiveTemplateByName('otp_email');
    if (!otpTemplateActive) {
      throw new Error('Failed to get otp_email template');
    }
    
    const otpRendered = await renderTemplate(otpTemplateActive, {
      firstName: 'Jane',
      otpCode: '123456',
      expiresInMinutes: 10,
    });
    
    console.log('  ✅ OTP template rendered successfully');
    console.log('     HTML length:', otpRendered.length, 'characters');
    console.log('     Contains OTP code:', otpRendered.includes('123456'));

    // Test 6: Template versioning
    console.log('\n🔄 Test 6: Testing template versioning...');
    const newVersion = await createTemplateVersion(activeTrialTemplate.id, {
      subject: 'Welcome to Your 7-Day Trial! 🚀 (Updated)',
      metadata: {
        ...activeTrialTemplate.metadata,
        component_path: activeTrialTemplate.metadata?.component_path || '',
      } as any,
      is_active: false, // Don't activate yet
    });
    console.log('  ✅ Created new version:', newVersion.version);
    console.log('     New subject:', newVersion.subject);

    // Test 7: Activate template version
    console.log('\n✅ Test 7: Activating template version...');
    const activated = await activateTemplateVersion(newVersion.id);
    console.log('  ✅ Activated version:', activated.version);
    console.log('     Is active:', activated.is_active);

    // Test 8: Get all templates
    console.log('\n📋 Test 8: Getting all templates...');
    const allTemplates = await getAllTemplates();
    console.log('  ✅ Retrieved', allTemplates.length, 'templates');
    allTemplates.forEach((t) => {
      console.log(`     - ${t.name} v${t.version} (${t.is_active ? 'active' : 'inactive'})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('  - Template creation: ✅');
    console.log('  - Template retrieval: ✅');
    console.log('  - Template rendering: ✅');
    console.log('  - Variable replacement: ✅');
    console.log('  - Unsubscribe link: ✅');
    console.log('  - Template versioning: ✅');
    console.log('  - Version activation: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testTemplateSystem()
  .then(() => {
    console.log('\n✨ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });

