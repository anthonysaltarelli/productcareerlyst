import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { triggerTrialSequence, cancelTrialSequence } from '@/lib/inngest/functions/trial-emails';

// Serve the Inngest functions
// This creates the webhook endpoint that Inngest uses to discover and execute functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [triggerTrialSequence, cancelTrialSequence],
});
