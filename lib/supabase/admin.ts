import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client using the service role key.
 * This client bypasses Row Level Security (RLS) and should only be used
 * in server-side code or scripts.
 * 
 * @param supabaseUrl - The Supabase project URL
 * @param serviceRoleKey - The Supabase service role key (not the anon key)
 * @param options - Optional configuration options
 * @returns A Supabase client with admin privileges
 */
export const createSupabaseAdmin = (
  supabaseUrl: string,
  serviceRoleKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
    };
  }
): SupabaseClient => {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: options?.auth?.autoRefreshToken ?? false,
      persistSession: options?.auth?.persistSession ?? false,
    },
  });
};
