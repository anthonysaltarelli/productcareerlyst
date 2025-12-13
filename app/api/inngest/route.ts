import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { triggerTrialSequence, cancelTrialSequence } from '@/lib/inngest/functions/trial-emails';
import {
  triggerOnboardingAbandonedSequence,
  cancelOnboardingAbandonedSequence,
} from '@/lib/inngest/functions/onboarding-abandoned-emails';

// Serve the Inngest functions
// This creates the webhook endpoint that Inngest uses to discover and execute functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    triggerTrialSequence,
    cancelTrialSequence,
    triggerOnboardingAbandonedSequence,
    cancelOnboardingAbandonedSequence,
  ],
});
