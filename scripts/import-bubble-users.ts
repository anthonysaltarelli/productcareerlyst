import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Use service role for importing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface BubbleUser {
  email: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Stripe Customer ID'?: string;
  'Current Plan'?: string;
  'Subscription Status'?: string;
  'Subscription ID'?: string;
  'Subscription Start'?: string;
  'Subscription End'?: string;
  'Subscription Frequency'?: string;
  'unique id'?: string;
}

const importBubbleUsers = async () => {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'public', 'users.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const users: BubbleUser[] = JSON.parse(fileContent);

    console.log(`Found ${users.length} users in JSON file`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Skip if no email
        if (!user.email || !user.email.trim()) {
          skipped++;
          continue;
        }

        // Normalize email to lowercase
        const email = user.email.toLowerCase().trim();

        // Check if already imported
        const { data: existing } = await supabase
          .from('bubble_users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping ${email} - already imported`);
          skipped++;
          continue;
        }

        // Prepare data
        const bubbleUserData = {
          email,
          first_name: user['First Name'] || null,
          last_name: user['Last Name'] || null,
          stripe_customer_id: user['Stripe Customer ID'] || null,
          current_plan: user['Current Plan'] || null,
          subscription_status: user['Subscription Status'] || null,
          subscription_id: user['Subscription ID'] || null,
          subscription_start: user['Subscription Start'] || null,
          subscription_end: user['Subscription End'] || null,
          subscription_frequency: user['Subscription Frequency'] || null,
          bubble_unique_id: user['unique id'] || null,
        };

        // Only import if they have a Stripe customer ID (active subscriber)
        if (!bubbleUserData.stripe_customer_id || bubbleUserData.stripe_customer_id.trim() === '') {
          console.log(`Skipping ${email} - no Stripe customer ID`);
          skipped++;
          continue;
        }

        // Insert into database
        const { error } = await supabase
          .from('bubble_users')
          .insert(bubbleUserData);

        if (error) {
          console.error(`Error importing ${email}:`, error.message);
          errors++;
        } else {
          console.log(`✓ Imported ${email} (Customer: ${bubbleUserData.stripe_customer_id})`);
          imported++;
        }
      } catch (err) {
        console.error(`Error processing user:`, err);
        errors++;
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total users in file: ${users.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Run the import
importBubbleUsers()
  .then(() => {
    console.log('\nImport completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });

