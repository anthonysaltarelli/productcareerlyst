# Amplitude Events Implementation

This document lists all Amplitude events currently implemented in the application.

## Event Naming Convention

All events follow the pattern: **"User [Action] [Object]"** in Title Case.

Examples:
- ✅ `User Viewed Homepage`
- ✅ `User Clicked Sign Up Button`
- ✅ `User Expanded Course`
- ❌ `Page Viewed` (too generic)
- ❌ `clicked signup` (wrong format)

## All Implemented Events

### Homepage (`/`)

#### 1. User Viewed Homepage
- **Event Name**: `User Viewed Homepage`
- **Trigger**: When homepage loads
- **Properties**:
  - `Page Route`: `/`
  - `Page Type`: `Landing Page`
- **Location**: `app/components/HomePageTracking.tsx`

#### 2. User Clicked Sign Up Button (Hero)
- **Event Name**: `User Clicked Sign Up Button`
- **Trigger**: When user clicks sign up button in hero section
- **Properties**:
  - `Page Route`: Current page route
  - `Page Name`: Formatted page name
  - `Button URL`: `/auth/sign-up`
  - `Button Location`: `Hero Section`
  - `Button Type`: `Primary CTA`
- **Location**: `app/page.tsx` (Hero section)

#### 3. User Clicked Sign Up Button (Final CTA)
- **Event Name**: `User Clicked Sign Up Button`
- **Trigger**: When user clicks sign up button in final CTA section
- **Properties**:
  - `Page Route`: Current page route
  - `Page Name`: Formatted page name
  - `Button URL`: `/auth/sign-up`
  - `Button Location`: `Final CTA Section`
  - `Button Type`: `Secondary CTA`
- **Location**: `app/page.tsx` (Final CTA section)

#### 4. User Clicked Courses Link
- **Event Name**: `User Clicked Courses Link`
- **Trigger**: When user clicks courses link in features section
- **Properties**:
  - `Page Route`: Current page route
  - `Page Name`: Formatted page name
  - `Link URL`: `/courses`
  - `Link Destination`: `/courses`
  - `Section`: `Features`
  - `Link Context`: `PM Courses Feature Card`
- **Location**: `app/page.tsx` (Features section)

---

### Courses Landing Page (`/courses`)

#### 5. User Viewed Courses Landing Page
- **Event Name**: `User Viewed Courses Landing Page`
- **Trigger**: When courses page loads
- **Properties**:
  - `Page Route`: `/courses`
  - `Page Name`: `Courses`
- **Location**: `app/components/PageTracking.tsx` + `app/courses/page.tsx`

#### 6. User Expanded Course
- **Event Name**: `User Expanded Course`
- **Trigger**: When user expands a course to view lessons
- **Properties**:
  - `Page Route`: `/courses`
  - `Course ID`: Course database ID
  - `Course Title`: Full course title
  - `Course Category`: Category name (e.g., "Career Preparation")
  - `Course Slug`: Course URL slug
- **Location**: `app/courses/page.tsx` (`handleCourseClick`)

#### 7. User Clicked Lesson
- **Event Name**: `User Clicked Lesson`
- **Trigger**: When user clicks on a lesson (opens sign up modal)
- **Properties**:
  - `Page Route`: `/courses`
  - `Lesson Title`: Full lesson title
- **Location**: `app/courses/page.tsx` (`handleLessonClick`)

#### 8. User Clicked Sign Up Button (Courses CTA)
- **Event Name**: `User Clicked Sign Up Button`
- **Trigger**: When user clicks sign up from courses page CTA
- **Properties**:
  - `Page Route`: `/courses`
  - `Page Name`: Formatted page name
  - `Button URL`: `/auth/sign-up`
  - `Button Location`: `Courses Landing Page CTA`
  - `Button Type`: `Courses CTA`
- **Location**: `app/courses/page.tsx` (CTA section)

---

### Sign Up Page (`/auth/sign-up`)

#### 9. User Viewed Sign Up Page
- **Event Name**: `User Viewed Sign Up Page`
- **Trigger**: When sign up page loads
- **Properties**:
  - `Page Route`: `/auth/sign-up`
  - `Page Name`: `Sign Up`
- **Location**: `app/components/PageTracking.tsx` + `app/auth/sign-up/page.tsx`

#### 10. User Completed Sign Up
- **Event Name**: `User Completed Sign Up`
- **Trigger**: When user successfully creates an account
- **Properties**:
  - `Page Route`: `/auth/sign-up`
  - `Sign Up Method`: `Email`
- **Location**: `app/components/sign-up-form.tsx`

#### 11. User Failed Sign Up
- **Event Name**: `User Failed Sign Up`
- **Trigger**: When sign up fails (validation error, etc.)
- **Properties**:
  - `Page Route`: `/auth/sign-up`
  - `Error Message`: Full error message
  - `Error Type`: Categorized error type (e.g., `Email Error`, `Unknown Error`)
- **Location**: `app/components/sign-up-form.tsx`

---

### Login Page (`/auth/login`)

#### 12. User Viewed Login Page
- **Event Name**: `User Viewed Login Page`
- **Trigger**: When login page loads
- **Properties**:
  - `Page Route`: `/auth/login`
  - `Page Name`: `Login`
- **Location**: `app/components/PageTracking.tsx` + `app/auth/login/page.tsx`

#### 13. User Completed Login
- **Event Name**: `User Completed Login`
- **Trigger**: When user successfully logs in
- **Properties**:
  - `Page Route`: `/auth/login`
  - `Login Method`: `Email`
- **Location**: `app/components/login-form.tsx`

#### 14. User Failed Login
- **Event Name**: `User Failed Login`
- **Trigger**: When login fails (wrong credentials, etc.)
- **Properties**:
  - `Page Route`: `/auth/login`
  - `Error Message`: Full error message
  - `Error Type`: Categorized error type (e.g., `Invalid Credentials`, `Unknown Error`)
- **Location**: `app/components/login-form.tsx`

---

## Common Properties

All events automatically include:
- **User ID**: User's email address (if authenticated)
- **Device ID**: Generated device ID (if anonymous)
- **Page Route**: Current page URL path
- **Page Name**: Formatted page name (for click events)

## Event Properties Best Practices

1. **Always include context**: Every click event includes `Page Route` and `Button Location` or `Link Context`
2. **Use descriptive names**: Properties like `Button Location` are specific (e.g., "Hero Section" not just "Hero")
3. **Categorize errors**: Error events include both `Error Message` and `Error Type` for easier analysis
4. **Include identifiers**: Course/Lesson events include both IDs and titles for cross-referencing

## Future Events to Add

Consider adding these events in the future:
- `User Selected Stage Of PM` (with `stage_type` property like "Associate PM")
- `User Started Course` (when user begins watching a course)
- `User Completed Lesson` (when user finishes a lesson)
- `User Searched Jobs` (if job search functionality exists)
- `User Applied To Job` (if job application functionality exists)

