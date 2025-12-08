import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

/**
 * Flow Service for Email System
 * 
 * Handles email flow retrieval, step management, and cancellation logic.
 */

// Get service role Supabase client for admin operations
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
 * Email flow record from database
 */
export interface EmailFlow {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  cancel_events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Email flow step record from database
 */
export interface EmailFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  time_offset_minutes: number;
  template_id: string;
  template_version: number;
  subject_override: string | null;
  email_type: 'transactional' | 'marketing';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get flow by trigger event name
 * 
 * @param triggerEvent Trigger event name (e.g., "onboarding_completed")
 * @returns Flow record or null if not found
 */
export const getFlowByTrigger = async (triggerEvent: string): Promise<EmailFlow | null> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_flows')
      .select('*')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get flow: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Parse cancel_events JSONB array
    const flow: EmailFlow = {
      ...data,
      cancel_events: Array.isArray(data.cancel_events) ? data.cancel_events : [],
    };

    return flow;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get flow: ${error.message}`);
    }
    throw new Error(`Failed to get flow: ${String(error)}`);
  }
};

/**
 * Get flow by ID
 * 
 * @param flowId Flow UUID
 * @returns Flow record or null if not found
 */
export const getFlowById = async (flowId: string): Promise<EmailFlow | null> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_flows')
      .select('*')
      .eq('id', flowId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get flow: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Parse cancel_events JSONB array
    const flow: EmailFlow = {
      ...data,
      cancel_events: Array.isArray(data.cancel_events) ? data.cancel_events : [],
    };

    return flow;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get flow: ${error.message}`);
    }
    throw new Error(`Failed to get flow: ${String(error)}`);
  }
};

/**
 * Get all steps for a flow
 * 
 * @param flowId Flow UUID
 * @returns Array of flow steps, ordered by step_order
 */
export const getFlowSteps = async (flowId: string): Promise<EmailFlowStep[]> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_flow_steps')
      .select('*')
      .eq('flow_id', flowId)
      .order('step_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get flow steps: ${error.message}`);
    }

    return (data || []) as EmailFlowStep[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get flow steps: ${error.message}`);
    }
    throw new Error(`Failed to get flow steps: ${String(error)}`);
  }
};

/**
 * Get all active flows
 * 
 * @returns Array of active flow records
 */
export const getAllFlows = async (): Promise<EmailFlow[]> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_flows')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to get flows: ${error.message}`);
    }

    // Parse cancel_events JSONB arrays
    const flows: EmailFlow[] = (data || []).map((flow) => ({
      ...flow,
      cancel_events: Array.isArray(flow.cancel_events) ? flow.cancel_events : [],
    }));

    return flows;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get flows: ${error.message}`);
    }
    throw new Error(`Failed to get flows: ${String(error)}`);
  }
};

/**
 * Check if flow should be cancelled based on user events
 * 
 * @param flow Flow record
 * @param userEvents Array of user event names that have occurred
 * @returns true if flow should be cancelled
 */
export const shouldCancelFlow = (flow: EmailFlow, userEvents: string[]): boolean => {
  if (!flow.cancel_events || flow.cancel_events.length === 0) {
    return false;
  }

  // Check if any cancel event has occurred
  return flow.cancel_events.some((cancelEvent) => userEvents.includes(cancelEvent));
};

/**
 * Generate flow trigger ID
 * 
 * Creates a unique identifier for a flow trigger instance to prevent duplicates.
 * Format: `{userId}_{flowId}_{triggerEventId}`
 * 
 * @param userId User UUID
 * @param flowId Flow UUID
 * @param triggerEventId Optional trigger event ID (e.g., onboarding completion ID)
 * @returns Unique flow trigger ID
 */
export const generateFlowTriggerId = (
  userId: string,
  flowId: string,
  triggerEventId?: string
): string => {
  if (triggerEventId) {
    return `${userId}_${flowId}_${triggerEventId}`;
  }
  return `${userId}_${flowId}_${Date.now()}`;
};

