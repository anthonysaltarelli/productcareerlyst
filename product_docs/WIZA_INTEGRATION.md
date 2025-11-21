# Wiza Integration for Contact Discovery

## Overview

This document describes the Wiza API integration for finding and importing contacts from companies into the application. The integration allows users to discover product management contacts at companies they're applying to.

## Architecture

### Components

1. **API Utility Functions** (`lib/utils/wiza.ts`)
   - Handles all Wiza API communication
   - Provides typed interfaces for requests/responses
   - Includes polling logic for async operations

2. **API Routes** (`app/api/jobs/wiza/`)
   - `/create-list` - Creates a prospect list in Wiza
   - `/list-contacts` - Fetches contacts from a Wiza list
   - `/import-contacts` - Imports selected contacts to database

3. **Frontend Component** (`app/components/jobs/WizaContactImport.tsx`)
   - UI for searching and importing contacts
   - Handles async operations with polling
   - Allows users to select which contacts to import

### Flow

1. User clicks "Find from Wiza" button in Contacts tab
2. Modal opens with search interface
3. User sets max profiles and clicks "Search Contacts"
4. System creates prospect list in Wiza (async operation)
5. System polls Wiza API for list completion
6. System displays found contacts for user selection
7. User selects contacts and clicks "Import"
8. System imports selected contacts to database
9. Contacts appear in the Contacts tab

## API Endpoints

### POST /api/jobs/wiza/create-list

Creates a prospect list in Wiza for finding contacts.

**Request Body:**
```json
{
  "company_name": "Google",
  "job_titles": ["Product Manager", "Director of Product"] // Optional
}
```

**Note:** `max_profiles` is fixed at 10 and cannot be changed.

**Response:**
```json
{
  "list_id": "abc123",
  "status": "processing",
  "message": "Prospect list created. Use the list_id to fetch contacts when ready."
}
```

### GET /api/jobs/wiza/list-contacts?list_id=<id>&wait=true

Fetches contacts from a Wiza prospect list.

**Query Parameters:**
- `list_id` (required) - The Wiza list ID
- `wait` (optional) - If "true", polls for list completion before returning

**Response:**
```json
{
  "contacts": [
    {
      "id": "contact123",
      "full_name": "John Doe",
      "title": "Senior Product Manager",
      "email": "john@company.com",
      "phone": "+1234567890",
      "linkedin_url": "https://linkedin.com/in/johndoe"
    }
  ],
  "list_id": "abc123"
}
```

### POST /api/jobs/wiza/import-contacts

Imports selected contacts from Wiza into the database.

**Request Body:**
```json
{
  "list_id": "abc123",
  "company_id": "uuid",
  "application_id": "uuid", // Optional
  "contact_ids": ["contact1", "contact2"] // Optional, imports all if omitted
}
```

**Response:**
```json
{
  "imported": 2,
  "contacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "title": "Senior Product Manager",
      "email": "john@company.com",
      // ... other contact fields
    }
  ]
}
```

## Timeout Handling

### Vercel Limitations

- **Hobby Plan**: 10 second timeout for serverless functions
- **Pro Plan**: 60 second timeout for serverless functions

### Solution

The implementation uses a **polling pattern** to handle async operations:

1. **Create List** - Returns immediately with `list_id`
2. **Poll for Completion** - Client-side polling (or server-side with `wait=true`)
3. **Fetch Contacts** - Only called when list is ready

This approach:
- Avoids Vercel timeout limits
- Provides better UX with progress indication
- Handles long-running operations gracefully

### Polling Configuration

- **Max Attempts**: 30
- **Interval**: 2 seconds
- **Total Max Wait**: 60 seconds

If timeout is reached, the system will still attempt to fetch contacts (may be partially ready).

## Environment Variables

Add to your `.env.local` (and Vercel environment variables):

```bash
WIZA_API_KEY=your_wiza_api_key_here
```

## Testing

### Local Testing with cURL

Use the provided test script:

```bash
export WIZA_API_KEY=your_api_key
./scripts/test-wiza-api.sh
```

### Manual Testing

1. Navigate to a job application detail page
2. Click on the "Contacts" tab
3. Click "Find from Wiza" button
4. Click "Search Contacts" (searches for up to 10 contacts)
5. Wait for contacts to load (may take 30-60 seconds)
6. Select contacts to import
7. Click "Import X Contacts"
8. Verify contacts appear in the Contacts tab

## Error Handling

The implementation handles:

- **Missing API Key**: Returns clear error message
- **Invalid Company**: Validates company exists before import
- **Wiza API Errors**: Catches and displays error messages
- **Timeout**: Gracefully handles timeout scenarios
- **Network Errors**: Shows user-friendly error messages

## Job Title Filters

By default, the system searches for these product management titles:

- Product Manager
- Director of Product
- Chief Product Officer
- VP of Product
- Associate Product Manager
- Product Owner
- Vice President of Product Management
- Sr. Director Product Management
- Technical Product Manager
- Director of Product Management
- Director of Product Operations

Users can provide custom job titles in the API request.

## Future Enhancements

Potential improvements:

1. **Individual Reveals**: Support for finding specific people by name/LinkedIn
2. **Background Jobs**: Use queue system for very long operations
3. **Caching**: Cache Wiza results to avoid duplicate API calls
4. **Bulk Operations**: Import all contacts with one click
5. **Contact Deduplication**: Better handling of duplicate contacts
6. **Progress Indicators**: Real-time progress updates during polling

## Troubleshooting

### Contacts Not Appearing

- Check Wiza API key is set correctly
- Verify company name matches exactly in Wiza
- Check browser console for errors
- Verify network requests in browser DevTools

### Timeout Issues

- Check Wiza API status
- Try again after a few minutes
- Note: Max profiles is fixed at 10 to optimize performance

### Import Errors

- Verify company exists in database
- Check user has permission to create contacts
- Review server logs for detailed error messages

