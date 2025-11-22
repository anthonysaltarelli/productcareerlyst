/**
 * ConvertKit API Utility Functions
 * 
 * Handles communication with ConvertKit API for subscriber management
 */

const CONVERTKIT_API_BASE = 'https://api.kit.com/v4';
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY?.trim();

if (!CONVERTKIT_API_KEY) {
  console.warn('CONVERTKIT_API_KEY is not set in environment variables');
} else {
  // Log masked API key for debugging (first 4 and last 4 chars)
  const maskedKey = CONVERTKIT_API_KEY.length > 8 
    ? `${CONVERTKIT_API_KEY.substring(0, 4)}...${CONVERTKIT_API_KEY.substring(CONVERTKIT_API_KEY.length - 4)}`
    : '***';
  console.log(`[ConvertKit] V4 API Key loaded: ${maskedKey} (length: ${CONVERTKIT_API_KEY.length})`);
}

interface ConvertKitSubscribeResponse {
  subscriber?: {
    id: number;
    first_name: string | null;
    email_address: string;
    state: string;
    created_at: string;
    fields: Record<string, unknown>;
  };
  // V3 compatibility
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
 * Create a ConvertKit subscriber
 * Uses POST /v4/subscribers to create a new subscriber
 */
const createSubscriber = async (
  email: string,
  firstName?: string
): Promise<ConvertKitSubscribeResponse> => {
  if (!CONVERTKIT_API_KEY) {
    throw new Error('CONVERTKIT_API_KEY is not configured');
  }

  const requestBody: Record<string, string> = {
    email_address: email,
  };

  if (firstName) {
    requestBody.first_name = firstName;
  }

  console.log(`[ConvertKit] Creating subscriber ${email}`);

  const response = await fetch(`${CONVERTKIT_API_BASE}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Kit-Api-Key': CONVERTKIT_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = JSON.stringify(errorJson, null, 2);
      console.error(`[ConvertKit] Create subscriber error details:`, {
        status: response.status,
        error: errorJson.error,
        message: errorJson.message,
      });
    } catch {
      console.error(`[ConvertKit] Create subscriber error (raw):`, errorText);
    }
    
    throw new Error(`ConvertKit create subscriber failed: ${response.status} ${errorDetails}`);
  }

  const result = await response.json();
  console.log(`[ConvertKit] Successfully created subscriber ${email}`);
  return result;
};

/**
 * Add a subscriber to a ConvertKit form
 * Uses the correct V4 API endpoint: POST /v4/forms/{form_id}/subscribers
 * Note: Subscriber must already exist (created via createSubscriber or create subscriber endpoint)
 */
export const addSubscriberToForm = async (
  formId: number,
  email: string,
  firstName?: string
): Promise<ConvertKitSubscribeResponse> => {
  if (!CONVERTKIT_API_KEY) {
    throw new Error('CONVERTKIT_API_KEY is not configured');
  }

  // V4 API: POST /v4/forms/{form_id}/subscribers with email_address in body
  const requestBody: Record<string, string> = {
    email_address: email,
  };

  console.log(`[ConvertKit] Adding ${email} to form ${formId}`);

  const response = await fetch(`${CONVERTKIT_API_BASE}/forms/${formId}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Kit-Api-Key': CONVERTKIT_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    
    // Try to parse as JSON for better error messages
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = JSON.stringify(errorJson, null, 2);
      console.error(`[ConvertKit] Form subscription error details:`, {
        status: response.status,
        error: errorJson.error,
        message: errorJson.message,
        apiKeyLength: CONVERTKIT_API_KEY.length,
        apiKeyPrefix: CONVERTKIT_API_KEY.substring(0, 4),
      });
    } catch {
      // Not JSON, use raw text
      console.error(`[ConvertKit] Form subscription error (raw):`, errorText);
    }
    
    throw new Error(`ConvertKit form subscription failed: ${response.status} ${errorDetails}`);
  }

  const result = await response.json();
  console.log(`[ConvertKit] Successfully added ${email} to form ${formId}`);
  return result;
};

/**
 * Add a subscriber to a ConvertKit sequence
 * Uses the correct V4 API endpoint: POST /v4/sequences/{sequence_id}/subscribers
 * Note: Subscriber must already exist (created via form subscription or create subscriber endpoint)
 */
export const addSubscriberToSequence = async (
  sequenceId: number,
  email: string
): Promise<ConvertKitSubscribeResponse> => {
  if (!CONVERTKIT_API_KEY) {
    throw new Error('CONVERTKIT_API_KEY is not configured');
  }

  // V4 API: POST /v4/sequences/{sequence_id}/subscribers with email_address in body
  const requestBody: Record<string, string> = {
    email_address: email,
  };

  console.log(`[ConvertKit] Adding ${email} to sequence ${sequenceId}`);

  const response = await fetch(`${CONVERTKIT_API_BASE}/sequences/${sequenceId}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Kit-Api-Key': CONVERTKIT_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    
    // Try to parse as JSON for better error messages
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = JSON.stringify(errorJson, null, 2);
      console.error(`[ConvertKit] Sequence subscription error details:`, {
        status: response.status,
        error: errorJson.error,
        message: errorJson.message,
        apiKeyLength: CONVERTKIT_API_KEY.length,
        apiKeyPrefix: CONVERTKIT_API_KEY.substring(0, 4),
      });
    } catch {
      // Not JSON, use raw text
      console.error(`[ConvertKit] Sequence subscription error (raw):`, errorText);
    }
    
    throw new Error(`ConvertKit sequence subscription failed: ${response.status} ${errorDetails}`);
  }

  const result = await response.json();
  console.log(`[ConvertKit] Successfully added ${email} to sequence ${sequenceId}`);
  return result;
};

/**
 * Add a subscriber to both a form and sequence
 * This is the main function to use when a user verifies their email
 * 
 * Flow:
 * 1. Create subscriber first (if they don't exist)
 * 2. Add to form using email address
 * 3. Add to sequence using email address
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

  // Step 1: Create subscriber first (required before adding to form/sequence)
  // If subscriber already exists, the API will return 200/201, so we continue regardless
  try {
    await createSubscriber(email, firstName);
  } catch (error) {
    // If creation fails, subscriber might already exist - continue anyway
    // The form/sequence endpoints will handle the case if subscriber doesn't exist
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[ConvertKit] Create subscriber warning (may already exist, continuing): ${errorMessage}`);
  }

  // Step 2: Add to form (subscriber now exists)
  try {
    formResult = await addSubscriberToForm(formId, email);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Form subscription failed: ${errorMessage}`);
    console.error('[ConvertKit] Failed to add subscriber to form:', error);
    // Continue to sequence even if form fails
  }

  // Step 3: Add to sequence (subscriber exists from step 1)
  try {
    sequenceResult = await addSubscriberToSequence(sequenceId, email);
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

