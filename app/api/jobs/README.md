# Job Applications API Documentation

## Overview

RESTful API routes for managing job applications, companies, interviews, and contacts. All routes require authentication via Supabase Auth.

## Base URL

```
/api/jobs
```

## Authentication

All endpoints require a valid Supabase session. Unauthorized requests return `401`.

---

## Companies

### GET /api/jobs/companies

Get all companies with optional filtering.

**Query Parameters:**
- `search` (optional): Search companies by name
- `approved` (optional): Filter by approval status (`true` | `false`)

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Google",
      "website": "https://google.com",
      "linkedin_url": "https://linkedin.com/company/google",
      "industry": "technology",
      "size": "5000+",
      "headquarters_city": "Mountain View",
      "headquarters_state": "CA",
      "headquarters_country": "USA",
      "description": "...",
      "founded_year": 1998,
      "is_approved": true,
      "created_by_user_id": null,
      "created_at": "2025-11-15T...",
      "updated_at": "2025-11-15T..."
    }
  ]
}
```

### POST /api/jobs/companies

Create a new company (requires admin approval).

**Request Body:**
```json
{
  "name": "Example Corp",
  "website": "https://example.com",
  "linkedin_url": "https://linkedin.com/company/example",
  "industry": "technology",
  "size": "51-200",
  "headquarters_city": "San Francisco",
  "headquarters_state": "CA",
  "headquarters_country": "USA",
  "description": "A technology company",
  "founded_year": 2020
}
```

**Response (201):**
```json
{
  "company": { /* company object */ },
  "message": "Company created successfully and pending admin approval"
}
```

### GET /api/jobs/companies/[id]

Get a specific company with research data.

**Response:**
```json
{
  "company": {
    /* company fields */,
    "research": {
      "id": "uuid",
      "company_id": "uuid",
      "perplexity_response": { /* JSONB data */ },
      "generated_at": "2025-11-15T...",
      "expires_at": "2025-12-15T..."
    }
  }
}
```

### PATCH /api/jobs/companies/[id]

Update a company (admin only).

**Request Body:** Partial company object

---

## Job Applications

### GET /api/jobs/applications

Get all job applications for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by application status

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "company_id": "uuid",
      "title": "Senior Product Manager",
      "location": "Remote",
      "work_mode": "remote",
      "salary_min": 150000,
      "salary_max": 200000,
      "salary_currency": "USD",
      "job_url": "https://...",
      "description": "...",
      "status": "interviewing",
      "priority": "high",
      "applied_date": "2025-11-01",
      "deadline": null,
      "notes": "...",
      "created_at": "2025-11-01T...",
      "updated_at": "2025-11-15T...",
      "company": {
        /* company object */
      }
    }
  ]
}
```

### POST /api/jobs/applications

Create a new job application.

**Request Body:**
```json
{
  "company_id": "uuid",
  "title": "Product Manager",
  "location": "San Francisco, CA",
  "work_mode": "hybrid",
  "salary_min": 140000,
  "salary_max": 180000,
  "salary_currency": "USD",
  "job_url": "https://...",
  "description": "...",
  "status": "wishlist",
  "priority": "medium",
  "applied_date": "2025-11-15",
  "deadline": "2025-12-01",
  "notes": "Found via LinkedIn"
}
```

**Response (201):**
```json
{
  "application": { /* application object with company */ }
}
```

### GET /api/jobs/applications/[id]

Get a specific job application.

### PATCH /api/jobs/applications/[id]

Update a job application.

**Request Body:** Partial application object

### DELETE /api/jobs/applications/[id]

Delete a job application.

**Response (200):**
```json
{
  "message": "Application deleted successfully"
}
```

---

## Interviews

### GET /api/jobs/interviews

Get interviews for the authenticated user.

**Query Parameters:**
- `application_id` (optional): Filter by application
- `status` (optional): Filter by interview status

**Response:**
```json
{
  "interviews": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "application_id": "uuid",
      "title": "Technical Interview",
      "type": "technical",
      "status": "scheduled",
      "scheduled_for": "2025-11-20T14:00:00Z",
      "duration_minutes": 60,
      "location": null,
      "meeting_link": "https://meet.google.com/...",
      "prep_notes": "Review system design",
      "feedback": null,
      "outcome": null,
      "created_at": "2025-11-15T...",
      "updated_at": "2025-11-15T...",
      "application": {
        /* application object with company */
      }
    }
  ]
}
```

### POST /api/jobs/interviews

Create a new interview.

**Request Body:**
```json
{
  "application_id": "uuid",
  "title": "Phone Screen",
  "type": "phone_screen",
  "status": "scheduled",
  "scheduled_for": "2025-11-25T10:00:00Z",
  "duration_minutes": 30,
  "meeting_link": "https://zoom.us/j/...",
  "prep_notes": "Prepare questions about the team"
}
```

### GET /api/jobs/interviews/[id]

Get a specific interview with questions.

**Response includes `questions` array:**
```json
{
  "interview": {
    /* interview fields */,
    "questions": [
      {
        "id": "uuid",
        "interview_id": "uuid",
        "question": "What is the team structure?",
        "answer": null
      }
    ]
  }
}
```

### PATCH /api/jobs/interviews/[id]

Update an interview.

### DELETE /api/jobs/interviews/[id]

Delete an interview.

---

## Contacts

### GET /api/jobs/contacts

Get contacts for the authenticated user.

**Query Parameters:**
- `company_id` (optional): Filter by company
- `application_id` (optional): Filter by application

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "company_id": "uuid",
      "application_id": null,
      "name": "John Smith",
      "title": "Senior Recruiter",
      "email": "john@company.com",
      "phone": "+1 (555) 123-4567",
      "linkedin_url": "https://linkedin.com/in/...",
      "relationship": "recruiter",
      "last_contact_date": "2025-11-10",
      "notes": "Very helpful",
      "created_at": "2025-11-01T...",
      "updated_at": "2025-11-10T...",
      "company": { /* company object */ },
      "interactions": [
        {
          "id": "uuid",
          "date": "2025-11-10",
          "type": "email",
          "summary": "Follow-up on application status",
          "notes": "Positive response"
        }
      ]
    }
  ]
}
```

### POST /api/jobs/contacts

Create a new contact.

**Request Body:**
```json
{
  "company_id": "uuid",
  "application_id": "uuid",
  "name": "Jane Doe",
  "title": "Engineering Manager",
  "email": "jane@company.com",
  "linkedin_url": "https://linkedin.com/in/...",
  "relationship": "hiring_manager",
  "notes": "Met at career fair"
}
```

### GET /api/jobs/contacts/[id]

Get a specific contact with interactions.

### PATCH /api/jobs/contacts/[id]

Update a contact.

### DELETE /api/jobs/contacts/[id]

Delete a contact.

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**409 Conflict:**
```json
{
  "error": "Resource already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Client-Side Hooks

Use the provided React hooks for data fetching:

### useJobApplications
```typescript
import { useJobApplications } from '@/lib/hooks/useJobApplications';

const { applications, loading, error, refetch } = useJobApplications();
// Or with status filter:
const { applications } = useJobApplications('interviewing');
```

### useInterviews
```typescript
import { useInterviews } from '@/lib/hooks/useInterviews';

const { interviews, loading, error, refetch } = useInterviews();
// Or filtered:
const { interviews } = useInterviews(applicationId, 'scheduled');
```

### useContacts
```typescript
import { useContacts } from '@/lib/hooks/useContacts';

const { contacts, loading, error, refetch } = useContacts();
// Or filtered by company:
const { contacts } = useContacts(companyId);
```

### useCompanies
```typescript
import { useCompanies } from '@/lib/hooks/useCompanies';

const { companies, loading, error, refetch } = useCompanies();
// Or with search:
const { companies } = useCompanies('Google', true);
```

---

## Mutation Functions

For create, update, and delete operations:

```typescript
import {
  createJobApplication,
  updateJobApplication,
  deleteJobApplication
} from '@/lib/hooks/useJobApplications';

// Create
const result = await createJobApplication({
  company_id: 'uuid',
  title: 'Product Manager',
  // ... other fields
});

// Update
await updateJobApplication('uuid', { status: 'interviewing' });

// Delete
await deleteJobApplication('uuid');
```

Similar functions are available for interviews, contacts, and companies.

---

## Rate Limiting

**Company Creation**: Consider implementing rate limiting to prevent abuse of company creation feature.

## Security

- All routes enforce RLS (Row Level Security) at the database level
- Users can only access their own applications, interviews, and contacts
- Company data is shared but requires approval for user-created entries
- Admin operations require service role or admin JWT claims

## Future Enhancements

- [ ] Pagination for large result sets
- [ ] Bulk operations
- [ ] File upload for documents
- [ ] Webhook integrations
- [ ] Email notifications
- [ ] Calendar sync

