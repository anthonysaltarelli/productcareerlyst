/**
 * Wiza Status Mapping Utilities
 * 
 * Handles mapping between Wiza API status and internal business status,
 * and extracting outcome statistics from Wiza responses.
 */

/**
 * Wiza API status values (raw from API)
 */
export type WizaStatus = 'queued' | 'scraping' | 'resolving' | 'finished' | 'failed' | string;

/**
 * Internal business status values
 */
export type InternalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'no_contacts';

/**
 * Wiza stats structure from API response
 */
export interface WizaStats {
  people?: number;
  valid?: number;
  risky?: number;
  unfound?: number;
  duplicate?: number | null;
  emails?: number;
  phones?: number;
  export_credits?: number;
  credits?: {
    export_credits?: number;
  };
}

/**
 * Maps Wiza API status to internal business status
 * 
 * @param wizaStatus - Raw status from Wiza API
 * @param stats - Optional stats object to determine if contacts were found
 * @returns Internal business status
 */
export const mapWizaStatusToInternal = (
  wizaStatus: WizaStatus,
  stats?: WizaStats
): InternalStatus => {
  const statusLower = String(wizaStatus).toLowerCase().trim();

  // Terminal states
  if (statusLower === 'finished' || statusLower === 'completed' || statusLower === 'ready' || statusLower === 'done') {
    // Check if we have contacts
    if (stats) {
      const peopleCount = stats.people || stats.valid || 0;
      if (peopleCount === 0) {
        return 'no_contacts';
      }
    }
    return 'completed';
  }

  if (statusLower === 'failed' || statusLower === 'error') {
    return 'failed';
  }

  // Processing states
  if (
    statusLower === 'queued' ||
    statusLower === 'scraping' ||
    statusLower === 'resolving' ||
    statusLower === 'processing'
  ) {
    return 'processing';
  }

  // Default to processing for unknown statuses
  return 'processing';
};

/**
 * Extracts stats from Wiza API response
 * 
 * @param listData - List data from Wiza API
 * @returns Stats object or null if not available
 */
export const extractWizaStats = (listData: any): WizaStats | null => {
  if (!listData) return null;

  // Stats can be at listData.stats or listData.data.stats
  const stats = listData.stats || listData.data?.stats || null;
  
  if (!stats || typeof stats !== 'object') {
    return null;
  }

  return {
    people: stats.people ?? undefined,
    valid: stats.valid ?? undefined,
    risky: stats.risky ?? undefined,
    unfound: stats.unfound ?? undefined,
    duplicate: stats.duplicate ?? undefined,
    emails: stats.emails ?? undefined,
    phones: stats.phones ?? undefined,
    export_credits: stats.export_credits ?? stats.credits?.export_credits ?? undefined,
  };
};

/**
 * Extracts Wiza status from API response
 * 
 * @param listData - List data from Wiza API
 * @returns Wiza status string
 */
export const extractWizaStatus = (listData: any): WizaStatus => {
  if (!listData) return 'unknown';

  // Status can be at various locations in the response
  const status = listData.status || 
                 listData.data?.status || 
                 listData.wiza_status || 
                 listData.state ||
                 'unknown';

  return String(status).toLowerCase().trim();
};

/**
 * Prepares database update object with status and stats
 * 
 * @param wizaStatus - Raw Wiza status
 * @param stats - Stats object from Wiza
 * @param listData - Full list data from Wiza (for storing in wiza_response)
 * @returns Object with fields to update in database
 */
export const prepareStatusUpdate = (
  wizaStatus: WizaStatus,
  stats: WizaStats | null,
  listData?: any
): {
  wiza_status: string;
  status: InternalStatus;
  stats_people_count: number;
  stats_valid_count: number;
  stats_risky_count: number;
  stats_unfound_count: number;
  stats_duplicate_count: number;
  stats_emails_count: number;
  stats_phones_count: number;
  contacts_found: number;
  completed_at?: string;
  wiza_response?: any;
} => {
  const internalStatus = mapWizaStatusToInternal(wizaStatus, stats || undefined);

  const updateData: any = {
    wiza_status: wizaStatus,
    status: internalStatus,
    stats_people_count: stats?.people ?? 0,
    stats_valid_count: stats?.valid ?? 0,
    stats_risky_count: stats?.risky ?? 0,
    stats_unfound_count: stats?.unfound ?? 0,
    stats_duplicate_count: stats?.duplicate ?? 0,
    stats_emails_count: stats?.emails ?? 0,
    stats_phones_count: stats?.phones ?? 0,
    contacts_found: stats?.people ?? stats?.valid ?? 0,
  };

  // Set completed_at when finished
  if (internalStatus === 'completed' || internalStatus === 'no_contacts') {
    updateData.completed_at = new Date().toISOString();
  }

  // Store full response if provided
  if (listData) {
    updateData.wiza_response = listData;
  }

  return updateData;
};

