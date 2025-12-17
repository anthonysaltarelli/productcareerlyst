import { Inngest } from 'inngest';

// Create Inngest client instance
// App ID is used to identify this application in the Inngest dashboard
export const inngest = new Inngest({
  id: 'productcareerlyst',
});

// Define event types for type safety
export type TrialSubscriptionCreatedEvent = {
  name: 'trial/subscription.created';
  data: {
    userId: string;
    email: string;
    subscriptionId: string;
  };
};

export type TrialSubscriptionCancelledEvent = {
  name: 'trial/subscription.cancelled';
  data: {
    userId: string;
  };
};

export type OnboardingStartedEvent = {
  name: 'onboarding/started';
  data: {
    userId: string;
    email: string;
  };
};

export type OnboardingCompletedEvent = {
  name: 'onboarding/completed';
  data: {
    userId: string;
  };
};

export type InterviewEvaluationRequestedEvent = {
  name: 'interview/evaluation.requested';
  data: {
    interviewId: string;
    userId: string;
    interviewMode: 'full' | 'quick_question';
  };
};

// Union type of all events
export type InngestEvents =
  | TrialSubscriptionCreatedEvent
  | TrialSubscriptionCancelledEvent
  | OnboardingStartedEvent
  | OnboardingCompletedEvent
  | InterviewEvaluationRequestedEvent;
