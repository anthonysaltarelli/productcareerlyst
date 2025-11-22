/**
 * ConvertKit API Utility Functions
 * 
 * Handles communication with ConvertKit API for subscriber management
 */

const CONVERTKIT_API_BASE = 'https://api.convertkit.com/v3';
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;

if (!CONVERTKIT_API_KEY) {
  console.warn('CONVERTKIT_API_KEY is not set in environment variables');
}

interface ConvertKitSubscribeResponse {
  subscription?: {
    id: number;
    state: string;
    created_at: string;
    source: string;
    referrer: string | null;
    subscribable_id: number;
    subscribable_type: string;
    subscriber: {
      id: number;
      first_name: string | null;
      email_address: string;
      state: string;
      created_at: string;
      fields: Record<string, unknown>;
    };
  };
}

/**
 * Add a subscriber to a ConvertKit form
 */
export const addSubscriberToForm = async (
  formId: number,
  email: string,
  firstName?: string
): Promise<ConvertKitSubscribeResponse> => {
  if (!CONVERTKIT_API_KEY) {
    throw new Error('CONVERTKIT_API_KEY is not configured');
  }

  const response = await fetch(`${CONVERTKIT_API_BASE}/forms/${formId}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      api_key: CONVERTKIT_API_KEY,
      email,
      first_name: firstName || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ConvertKit form subscription failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

/**
 * Add a subscriber to a ConvertKit sequence
 */
export const addSubscriberToSequence = async (
  sequenceId: number,
  email: string,
  firstName?: string
): Promise<ConvertKitSubscribeResponse> => {
  if (!CONVERTKIT_API_KEY) {
    throw new Error('CONVERTKIT_API_KEY is not configured');
  }

  const response = await fetch(`${CONVERTKIT_API_BASE}/sequences/${sequenceId}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      api_key: CONVERTKIT_API_KEY,
      email,
      first_name: firstName || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ConvertKit sequence subscription failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

/**
 * Add a subscriber to both a form and sequence
 * This is the main function to use when a user verifies their email
 */
export const addSubscriberToFormAndSequence = async (
  formId: number,
  sequenceId: number,
  email: string,
  firstName?: string
): Promise<{
  formResult?: ConvertKitSubscribeResponse;
  sequenceResult?: ConvertKitSubscribeResponse;
  errors?: string[];
}> => {
  const errors: string[] = [];
  let formResult: ConvertKitSubscribeResponse | undefined;
  let sequenceResult: ConvertKitSubscribeResponse | undefined;

  // Add to form
  try {
    formResult = await addSubscriberToForm(formId, email, firstName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Form subscription failed: ${errorMessage}`);
    console.error('[ConvertKit] Failed to add subscriber to form:', error);
  }

  // Add to sequence
  try {
    sequenceResult = await addSubscriberToSequence(sequenceId, email, firstName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Sequence subscription failed: ${errorMessage}`);
    console.error('[ConvertKit] Failed to add subscriber to sequence:', error);
  }

  return {
    formResult,
    sequenceResult,
    errors: errors.length > 0 ? errors : undefined,
  };
};

