# Wiza Status Model

## Overview

This document explains the status model for Wiza integration, which separates three distinct concerns:
1. **Wiza API Status** (`wiza_status`) - Raw status from Wiza API
2. **Internal Business Status** (`status`) - Our application's business logic status
3. **Outcome/Stats** - Detailed statistics about the search results

## Status Fields

### `wiza_status` (TEXT)
Raw status directly from Wiza API. Possible values:
- `queued` - List is queued for processing
- `scraping` - Wiza is scraping LinkedIn profiles
- `resolving` - Wiza is resolving/enriching contact data
- `finished` - List processing is complete
- `failed` - List processing failed (if applicable)

**Purpose**: Track the exact state of the list in Wiza's system.

### `status` (TEXT)
Internal business status for our application. Possible values:
- `pending` - Request created but not yet started
- `processing` - Request is being processed (maps to queued/scraping/resolving)
- `completed` - Request completed successfully with contacts found
- `failed` - Request failed
- `no_contacts` - Request completed but no contacts were found

**Purpose**: Track the business state of the request in our system.

### Stats Fields (Outcome)
Detailed statistics extracted from Wiza API when list is finished:
- `stats_people_count` - Total number of people found
- `stats_valid_count` - Number of contacts with valid email addresses
- `stats_risky_count` - Number of contacts with risky email addresses
- `stats_unfound_count` - Number of contacts where email could not be found
- `stats_duplicate_count` - Number of duplicate contacts
- `stats_emails_count` - Total number of email addresses found
- `stats_phones_count` - Total number of phone numbers found

**Purpose**: Provide detailed outcome metrics for the search.

## Status Mapping

The mapping between Wiza status and internal status is handled by `mapWizaStatusToInternal()` in `lib/utils/wiza-status.ts`:

| Wiza Status | Internal Status | Notes |
|------------|----------------|-------|
| `queued` | `processing` | List is queued |
| `scraping` | `processing` | Actively scraping |
| `resolving` | `processing` | Enriching data |
| `finished` | `completed` or `no_contacts` | Depends on stats (if people_count > 0) |
| `failed` | `failed` | Error occurred |

## Status Flow

```
1. Create List
   → status: 'processing'
   → wiza_status: 'queued' (or initial status from API)

2. Polling (Wiza processing)
   → status: 'processing'
   → wiza_status: 'scraping' → 'resolving' → 'finished'

3. Finished
   → status: 'completed' (if contacts found) or 'no_contacts' (if none)
   → wiza_status: 'finished'
   → Stats fields populated from API response
```

## Usage

### In API Routes

Use the utility functions from `lib/utils/wiza-status.ts`:

```typescript
import { extractWizaStatus, extractWizaStats, prepareStatusUpdate } from '@/lib/utils/wiza-status';

// Extract status and stats from Wiza API response
const wizaStatus = extractWizaStatus(listData);
const stats = extractWizaStats(listData);

// Prepare database update
const updateData = prepareStatusUpdate(wizaStatus, stats, listData);
updateData.updated_at = new Date().toISOString();

// Update database
await supabase
  .from('wiza_requests')
  .update(updateData)
  .eq('id', requestId);
```

### In Components

The `WizaRequestHistory` component displays:
- Internal `status` (with color coding)
- `wiza_status` (for debugging)
- Stats fields (valid, risky, unfound counts)

## Database Schema

See `sql_migrations/wiza_requests/002_add_stats_fields.sql` for the complete schema.

## Migration

To apply the new stats fields:

```sql
-- Run the migration
\i sql_migrations/wiza_requests/002_add_stats_fields.sql
```

Existing records will have default values (0) for stats fields.

