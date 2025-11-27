# Job Applications Database Schema

## Overview

The Job Applications feature uses a comprehensive database schema designed to track job search activities with privacy-first design. The schema includes shared company data and user-private application tracking.

## Key Design Principles

1. **Shared Company Data**: Company information and research are shared across all users to reduce duplication and AI API costs
2. **User Privacy**: All personal job search data is isolated per user with Row Level Security (RLS)
3. **Admin Moderation**: User-created companies require admin approval
4. **Type Safety**: PostgreSQL enums ensure data consistency
5. **Performance**: Strategic indexes for common query patterns

## Database Tables

### Shared Tables (Cross-User)

#### **companies**
Central directory of companies shared across all users.

**Purpose**: Normalize company data, reduce duplication

**Key Fields**:
- `name` (TEXT, UNIQUE) - Company name
- `linkedin_url` (TEXT) - Company LinkedIn profile
- `industry` (company_industry ENUM) - Industry classification
- `size` (company_size ENUM) - Company size range
- `headquarters_city`, `headquarters_state`, `headquarters_country` - Location
- `is_approved` (BOOLEAN) - Admin approval status
- `created_by_user_id` (UUID) - User who created the entry

**Access**: 
- Read: All authenticated users
- Insert: All authenticated users (requires approval)
- Update/Delete: Admins only

#### **company_research**
AI-generated research about companies (one per company).

**Purpose**: Share research costs across users, cache Perplexity API responses

**Key Fields**:
- `company_id` (UUID, UNIQUE) - Foreign key to companies
- `perplexity_response` (JSONB) - Full API response with content and citations
- `expires_at` (TIMESTAMP) - Cache expiration (e.g., 30 days)

**Access**:
- Read: All authenticated users
- Insert/Update: Service role (API) only

### User-Private Tables

#### **job_applications**
User's job applications.

**Purpose**: Track job applications with status, notes, and details

**Key Fields**:
- `user_id` (UUID) - Owner of the application
- `company_id` (UUID, NOT NULL) - Foreign key to companies
- `title` (TEXT) - Job title
- `status` (application_status ENUM) - Current status
- `priority` (priority_level ENUM) - User priority
- `salary_min`, `salary_max`, `salary_currency` - Compensation range
- `applied_date`, `deadline` (DATE) - Important dates
- `notes` (TEXT) - Private user notes

**Access**: Users can only access their own applications

#### **interviews**
Interview rounds for applications.

**Purpose**: Track interview schedule, prep notes, feedback

**Key Fields**:
- `user_id` (UUID) - Owner
- `application_id` (UUID) - Foreign key to job_applications
- `title` (TEXT) - Interview title (e.g., "Technical Round")
- `type` (interview_type ENUM) - Interview type
- `status` (interview_status ENUM) - scheduled/completed/cancelled
- `scheduled_for` (TIMESTAMP) - Interview date/time
- `meeting_link` (TEXT) - Virtual meeting URL
- `prep_notes`, `feedback` (TEXT) - Preparation and post-interview notes
- `outcome` (interview_outcome ENUM) - passed/failed/pending

**Access**: Users can only access their own interviews

#### **interview_questions**
Questions user prepares to ask interviewers.

**Purpose**: Prepare thoughtful questions for interviews

**Key Fields**:
- `user_id` (UUID) - Owner
- `interview_id` (UUID) - Foreign key to interviews
- `question` (TEXT) - Question to ask
- `answer` (TEXT) - Interviewer's response (filled after interview)

**Access**: Users can only access their own questions

#### **contacts**
Professional contacts at companies.

**Purpose**: Manage networking and relationships

**Key Fields**:
- `user_id` (UUID) - Owner
- `company_id` (UUID, NOT NULL) - Foreign key to companies
- `application_id` (UUID, NULLABLE) - Optional link to specific application
- `name`, `title`, `email`, `phone`, `linkedin_url` - Contact info
- `relationship` (contact_relationship ENUM) - Type of relationship
- `last_contact_date` (DATE) - Most recent interaction
- `notes` (TEXT) - Private notes about contact

**Access**: Users can only access their own contacts

**Note**: Contacts always belong to a company. When viewing interviews, contacts can be loaded by company_id.

#### **interview_interviewers**
Junction table linking interviews to contacts who are interviewers.

**Purpose**: Track who is interviewing you

**Key Fields**:
- `interview_id` (UUID) - Foreign key to interviews
- `contact_id` (UUID) - Foreign key to contacts
- `role` (interviewer_role ENUM) - interviewer/panel_member/observer

**Access**: Users can only access their own interview-interviewer links

#### **contact_interactions**
Communication history with contacts.

**Purpose**: Track networking activity and relationship building

**Key Fields**:
- `user_id` (UUID) - Owner
- `contact_id` (UUID) - Foreign key to contacts
- `date` (DATE) - Interaction date
- `type` (interaction_type ENUM) - email/linkedin/phone/coffee/etc.
- `summary` (TEXT) - Brief description
- `notes` (TEXT) - Additional details

**Access**: Users can only access their own interactions

## Enum Types

All categorical fields use PostgreSQL enums for type safety:

- `application_status`: wishlist, applied, interviewing, offer, rejected, accepted, withdrawn
- `priority_level`: low, medium, high
- `work_mode`: remote, hybrid, onsite
- `interview_type`: recruiter_screen, phone_screen, technical, behavioral, system_design, onsite, final, other
- `interview_status`: scheduled, completed, cancelled
- `interview_outcome`: passed, failed, pending
- `contact_relationship`: recruiter, hiring_manager, team_member, referral, peer, executive, other
- `interaction_type`: email, linkedin, phone, coffee, video_call, other
- `interviewer_role`: interviewer, panel_member, observer
- `company_industry`: technology, finance, healthcare, retail, consulting, education, manufacturing, media, other
- `company_size`: 1-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+
- `currency_code`: USD, EUR, GBP, CAD, AUD, JPY, INR

## Row Level Security (RLS)

All tables have RLS enabled with specific policies:

**Shared Tables (companies, company_research)**:
- Read: All authenticated users
- Write: Restricted (companies: insert allowed, research: service role only)

**User-Private Tables**:
- All operations: Users can only access rows where `user_id = auth.uid()`
- Ensures complete data privacy

**Junction Tables** (interview_interviewers):
- Access controlled via subquery checking ownership of parent interview

## Indexes

Strategic indexes for common query patterns:

**High-Priority Indexes**:
- `idx_job_applications_user_status` - Most common query (user's apps by status)
- `idx_interviews_user_status` - User's interviews by status
- `idx_contacts_user_company` - Contacts for a specific company
- `idx_companies_name` - Company search
- `idx_companies_is_approved` - Admin moderation

## Common Queries

### Get user's active applications with company info
```sql
SELECT ja.*, c.name as company_name, c.industry, c.size
FROM job_applications ja
JOIN companies c ON ja.company_id = c.id
WHERE ja.user_id = auth.uid()
  AND ja.status NOT IN ('rejected', 'withdrawn', 'accepted')
ORDER BY ja.priority DESC, ja.applied_date DESC;
```

### Get upcoming interviews for user
```sql
SELECT i.*, ja.title as job_title, c.name as company_name
FROM interviews i
JOIN job_applications ja ON i.application_id = ja.id
JOIN companies c ON ja.company_id = c.id
WHERE i.user_id = auth.uid()
  AND i.status = 'scheduled'
  AND i.scheduled_for >= NOW()
ORDER BY i.scheduled_for ASC;
```

### Get contacts at a specific company
```sql
SELECT c.*
FROM contacts c
WHERE c.user_id = auth.uid()
  AND c.company_id = :company_id
ORDER BY c.last_contact_date DESC NULLS LAST;
```

### Get company with research (if available)
```sql
SELECT c.*, cr.perplexity_response
FROM companies c
LEFT JOIN company_research cr ON c.id = cr.company_id
WHERE c.id = :company_id
  AND (cr.expires_at IS NULL OR cr.expires_at > NOW());
```

## Migration Order

Run migrations in this order to respect foreign key dependencies:

1. `_shared/001_create_updated_at_function.sql`
2. `_shared/002_create_enum_types.sql`
3. `companies/` (all files in order)
4. `company_research/` (all files in order)
5. `job_applications/` (all files in order)
6. `interviews/` (all files in order)
7. `interview_questions/` (all files in order)
8. `contacts/` (all files in order)
9. `interview_interviewers/` (all files in order)
10. `contact_interactions/` (all files in order)

## Future Enhancements

Potential improvements for future iterations:

1. **Company Research Vectors**: Break down `perplexity_response` into separate research types (culture, products, tech_stack, etc.)
2. **Document Storage**: Add table for resumes/cover letters with Supabase Storage integration
3. **Offer Tracking**: Separate table for detailed offer information (benefits, equity, etc.)
4. **Application Templates**: Reusable application materials and templates
5. **Analytics**: Aggregate views for success metrics and insights
6. **Reminders**: Table for deadline and follow-up reminders
7. **Tags**: Flexible tagging system for applications and companies

## TypeScript Integration

TypeScript types are defined in `/lib/types/jobs.ts` and match the database schema exactly. All enum types, table interfaces, and form input types are provided.

## Admin Features

**Company Moderation**:
- Users can create new companies (`is_approved = false`)
- Admins review and approve companies
- Unapproved companies visible to creator only (implement this in RLS if needed)

**Future Admin Needs**:
- Merge duplicate companies
- Edit company information
- Regenerate stale research
- User data export (GDPR compliance)

## Testing RLS Policies

To test RLS policies work correctly:

```sql
-- Test as specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';

-- Try to access another user's data (should return empty)
SELECT * FROM job_applications WHERE user_id != 'user-uuid-here';

-- Try to access your own data (should work)
SELECT * FROM job_applications WHERE user_id = 'user-uuid-here';

-- Reset
RESET role;
```

## Performance Considerations

1. **Batch Queries**: Use joins to fetch related data in single query
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Cache**: Cache company research aggressively (30-day expiration)
4. **Indexes**: Monitor query performance and add indexes as needed
5. **Aggregate Functions**: Use database aggregations instead of client-side calculations

## Security Notes

1. **User Isolation**: RLS ensures users cannot access each other's data
2. **Service Role**: Only service role can write company research (API-generated)
3. **Input Validation**: Validate all user input before database operations
4. **SQL Injection**: Use parameterized queries always
5. **Rate Limiting**: Implement rate limiting on company creation to prevent abuse

