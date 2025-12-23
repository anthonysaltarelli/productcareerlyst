import { createClient } from '@/lib/supabase/client';

/**
 * A fetch wrapper that ensures the Supabase auth session is fresh before making API calls.
 *
 * This fixes an issue in production where:
 * 1. Middleware (Edge Runtime) refreshes expired tokens
 * 2. But API routes (Node.js serverless) don't see the new cookies on the same request
 * 3. Causing auth failures that resolve after a page refresh
 *
 * By calling getUser() before the fetch, we ensure cookies are synchronized.
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const supabase = createClient();

  // This call ensures the auth token is fresh and cookies are synced
  // It's a lightweight call that validates/refreshes the session
  await supabase.auth.getUser();

  // Now make the actual fetch with fresh cookies
  return fetch(url, options);
}

/**
 * Helper for JSON API calls with authentication
 */
export async function authenticatedJsonFetch<T = unknown>(
  url: string,
  options?: RequestInit & { body?: unknown }
): Promise<{ data?: T; error?: string; response: Response }> {
  const supabase = createClient();

  // Ensure fresh auth
  await supabase.auth.getUser();

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  if (options?.body && typeof options.body !== 'string') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      error: errorData.error || `Request failed with status ${response.status}`,
      response
    };
  }

  const data = await response.json();
  return { data, response };
}
