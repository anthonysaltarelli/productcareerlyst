# Company Research Implementation

## Overview

Implemented Option 4 (Sidebar Layout) for displaying company research with 12 research vectors. Research generation runs on the backend (Next.js API routes) so it continues even if users navigate away.

## Architecture Decision: Backend Execution

### Why Backend (Next.js API Routes)?

**✅ Chosen Approach: Next.js API Routes**
- Research generation runs on the server
- Continues even if user navigates away
- Results stored in database immediately
- Frontend polls for updates
- No timeout issues for long-running operations

**❌ Not Using: Supabase Edge Functions**
- Edge Functions have timeout limits (typically 60 seconds)
- 12 research vectors would take longer than timeout
- More complex error handling
- Less control over execution

**❌ Not Using: Frontend Execution**
- Would stop if user navigates away
- Browser timeout issues
- Poor user experience
- Can't cache results properly

### How It Works

1. **User triggers research generation** → Frontend calls API
2. **API starts async processing** → Returns immediately with status
3. **Backend processes each vector** → Calls Perplexity API sequentially/parallel
4. **Results stored in DB** → As each vector completes
5. **Frontend polls for updates** → Every 5 seconds until all complete
6. **UI updates automatically** → Shows new research as it arrives

## Database Schema

### Updated Table Structure

```sql
company_research (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  research_type TEXT NOT NULL,  -- NEW: mission, values, origin_story, etc.
  perplexity_response JSONB NOT NULL,
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,  -- 7 days from generated_at
  UNIQUE(company_id, research_type)  -- One record per company per vector
)
```

### Research Types

1. `mission` - Company mission statement
2. `values` - Core values and culture
3. `origin_story` - Founding story
4. `product` - Product portfolio
5. `user_types` - Target users
6. `competition` - Competitive landscape
7. `risks` - Business risks
8. `recent_launches` - Recent product launches
9. `strategy` - Strategic direction
10. `funding` - Funding history
11. `partnerships` - Key partnerships
12. `customer_feedback` - Customer reviews
13. `business_model` - Revenue model

## API Endpoints

### GET `/api/jobs/companies/[id]/research`

Fetch all research vectors for a company.

**Response:**
```json
{
  "research": {
    "mission": {
      "id": "uuid",
      "company_id": "uuid",
      "research_type": "mission",
      "perplexity_response": { ... },
      "generated_at": "2025-01-XX...",
      "expires_at": "2025-01-XX...",
      "is_valid": true
    },
    ...
  },
  "company_name": "Airbnb"
}
```

### POST `/api/jobs/companies/[id]/research`

Trigger research generation.

**Request (all vectors):**
```json
{}
```

**Request (single vector):**
```json
{
  "research_type": "mission"
}
```

**Response (single vector - synchronous):**
```json
{
  "success": true,
  "research": { ... }
}
```

**Response (all vectors - asynchronous):**
```json
{
  "success": true,
  "message": "Started research generation for 13 vectors",
  "types": ["mission", "values", ...]
}
```

## UI Component

### CompanyResearch Component

**Location:** `app/components/jobs/CompanyResearch.tsx`

**Features:**
- Empty state with "Generate All Research" button
- Sidebar navigation with all 13 vectors
- Status indicators (Ready, Loading, Stale, Missing)
- Main content area with markdown rendering
- Sources section with rich metadata
- Auto-refresh polling during generation
- Individual vector refresh capability

**States:**
- **Empty:** No research generated yet
- **Loading:** Fetching research data
- **Generating:** Research generation in progress
- **Ready:** Research available and displayed

## Caching Strategy

### 7-Day Cache

- Research is valid for 7 days from `generated_at`
- Stale research (>7 days) shows warning indicator
- Users can manually refresh individual vectors
- "Refresh All" button available

### Cost Optimization

- Only generate when needed
- Cache shared across all users
- 7-day expiration reduces API calls
- Lazy loading (generate on demand)

## Perplexity API Integration

### Utility Functions

**Location:** `lib/utils/perplexity.ts`

**Functions:**
- `generateResearch(companyName, researchType)` - Call Perplexity API
- `isResearchValid(generatedAt)` - Check if within 7 days
- `getResearchQuery(companyName, researchType)` - Generate query

**Model:** `sonar` (lightweight, cost-effective)

**Parameters:**
- `temperature: 0.2` - More focused responses
- `max_tokens: 1000` - Reasonable length

## Migration Required

Run the database migration before using:

```sql
-- sql_migrations/company_research/006_update_for_per_vector.sql
```

This migration:
- Adds `research_type` column
- Removes unique constraint on `company_id`
- Adds unique constraint on `(company_id, research_type)`
- Adds indexes for performance

## Usage

1. Navigate to Job Details page
2. Click "Research" tab
3. If empty, click "Generate All Research"
4. Wait for research to complete (polls automatically)
5. Select any vector from sidebar to view details
6. Click "Refresh" to regenerate stale research

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Batch refresh for multiple vectors
- [ ] Export research as PDF
- [ ] Search within research content
- [ ] Research comparison across companies
- [ ] Custom research queries

