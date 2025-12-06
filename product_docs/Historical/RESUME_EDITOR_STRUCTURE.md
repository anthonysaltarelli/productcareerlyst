# Resume Editor Structure

This document describes the structural organization of the resume editor functionality.

## Overview

The resume editor uses a **version-based architecture** where each resume is stored as a complete, independent copy. Users can maintain multiple resume versions (e.g., "Master Resume", "Product Manager @ Google") with each version containing its own complete set of data.

## Resume Structure Hierarchy

A resume consists of the following main sections, organized hierarchically:

### 1. Resume Version (Top Level)
- **Metadata**: Each resume is a version with:
  - Unique identifier (`id`)
  - User ownership (`user_id`)
  - Name (e.g., "Master Resume", "Product Manager @ Google")
  - Slug (URL-friendly identifier)
  - Master flag (`is_master`) - only one master per user
  - Optional link to job application (`application_id`)
  - Timestamps (`created_at`, `updated_at`)

### 2. Contact Information
- **One per version** (1:1 relationship)
- Contains:
  - Full name (required)
  - Email (required)
  - Phone (optional)
  - Location (optional)
  - LinkedIn URL (optional)
  - Portfolio URL (optional)

### 3. Professional Summary
- **One per version** (1:1 relationship)
- Free-form text content describing professional background and key qualifications

### 4. Work Experience
- **Many per version** (1:many relationship)
- Each experience entry contains:
  - Job title (required)
  - Company name (required)
  - Location (optional)
  - Start date (optional, string format)
  - End date (optional, string format)
  - Display order (for sorting)
  - Optional grouping fields:
    - `role_group_id` - groups multiple roles at the same company
    - `bullet_mode` - controls how bullets are displayed (`per_role` or `per_experience`)
  
  **Experience Bullets** (nested within each experience):
  - **Many per experience** (1:many relationship)
  - Each bullet contains:
    - Content text (required)
    - Selection status (`is_selected`) - determines if bullet appears in final resume
    - Display order (for sorting)
    - Optional scoring/analysis:
      - Score (0-100)
      - Tags (array of strings)
      - Suggestions (for improvement)

### 5. Education
- **Many per version** (1:many relationship)
- Each education entry contains:
  - School name (required)
  - Degree (required)
  - Field of study (optional)
  - Location (optional)
  - Start date (optional)
  - End date (optional)
  - GPA (optional)
  - Display order (for sorting)
  
  **Education Achievements** (nested within each education):
  - **Many per education entry** (1:many relationship)
  - Each achievement contains:
    - Achievement text (required)
    - Display order (for sorting)

### 6. Skills
- **Many per version** (1:many relationship)
- Organized by category:
  - **Technical skills** (e.g., SQL, Python, Tableau)
  - **Product skills** (e.g., Product Strategy, Roadmap Planning)
  - **Soft skills** (e.g., Leadership, Communication)
- Each skill contains:
  - Skill name (required)
  - Category (required, must be one of: `technical`, `product`, `soft`)
  - Display order (for sorting within category)

### 7. Styling Configuration
- **One per version** (1:1 relationship)
- Controls visual formatting:
  - **Font settings**:
    - Font family (e.g., Arial, Georgia, Inter)
    - Font size (8-16px)
    - Line height (0.5-3.0 multiplier)
  - **Margins** (in inches):
    - Top, bottom, left, right margins
  - **Colors** (hex format):
    - Accent color
    - Heading color
    - Text color
  - **Display options**:
    - Experience display mode (`by_role` or `grouped`)

## Data Relationships

```
Resume Version (1)
  ├── Contact Info (1)
  ├── Summary (1)
  ├── Experiences (many)
  │   └── Bullets (many per experience)
  ├── Education (many)
  │   └── Achievements (many per education)
  ├── Skills (many, grouped by category)
  └── Styles (1)
```

## Key Features

### Version Management
- Users can create multiple resume versions
- One version can be designated as the "Master" resume
- Versions can be cloned from existing versions
- Each version maintains complete independence

### Experience Grouping
- Multiple roles at the same company can be grouped using `role_group_id`
- Bullet points can be organized either:
  - **Per role**: Bullets appear under each individual role
  - **Per experience**: All bullets for grouped roles appear together

### Bullet Point Management
- Each bullet can be individually selected/deselected for inclusion in the final resume
- Bullets support scoring and tagging for quality assessment
- Display order can be customized

### Skills Organization
- Skills are automatically grouped by category (technical, product, soft)
- Skills within each category maintain display order
- Batch operations allow updating all skills in a category at once

## Database Schema

The resume system uses 9 main database tables:
1. `resume_versions` - Version metadata
2. `resume_contact_info` - Contact details
3. `resume_summaries` - Professional summary
4. `resume_experiences` - Work experiences
5. `resume_experience_bullets` - Bullet points
6. `resume_education` - Education entries
7. `resume_education_achievements` - Education achievements
8. `resume_skills` - Skills (all categories)
9. `resume_styles` - Styling preferences

All tables use Row Level Security (RLS) to ensure users can only access their own resume data.

