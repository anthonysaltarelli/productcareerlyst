# Detailed Amplitude Events - Exact Click Locations

This document lists all Amplitude events with their exact click location properties.

## Click Event Properties

All click events now include:
- **Button ID** or **Link ID**: Unique identifier for the specific button/link instance
- **Button Section** or **Link Section**: Exact section of the page
- **Button Position** or **Link Position**: Exact position within that section
- **Button Text** or **Link Text**: The visible text on the button/link
- **Button Context** or **Link Context**: What's around the button/link
- **Page Section**: Above/below the fold, etc.
- **Click Position X/Y**: Exact pixel coordinates of the click
- **Click Position Horizontal/Vertical**: Left/Center/Right, Top/Middle/Bottom
- **Viewport Width/Height**: Screen size when clicked
- **Referrer URL/Domain**: Where the user came from
- **UTM Parameters**: All UTM tracking parameters

---

## Homepage (`/`)

### 1. User Clicked Sign Up Button (Hero Primary CTA)
- **Button ID**: `homepage-hero-primary-cta`
- **Button Section**: `Hero Section`
- **Button Position**: `Center of Hero Card`
- **Button Text**: `Start now for free →`
- **Button Context**: `Below headline and outcome highlights`
- **Page Section**: `Above the fold`
- **Location**: Main hero card, center, below the 4 outcome highlight boxes

### 2. User Clicked Courses Link (Features Section)
- **Link ID**: `homepage-features-pm-courses-link`
- **Link Section**: `Features Section`
- **Link Position**: `PM Courses Feature Card`
- **Link Type**: `Feature Card CTA`
- **Link Text**: `Browse Courses →`
- **Feature Card**: `PM Courses`
- **Card Color**: `Indigo to Purple Gradient`
- **Card Position**: `First Feature Card`
- **Location**: Inside the PM Courses feature card, bottom of the card

### 3. User Clicked Sign Up Button (Final CTA)
- **Button ID**: `homepage-final-cta-large-button`
- **Button Section**: `Final CTA Section`
- **Button Position**: `Center of Final CTA Card`
- **Button Text**: `YES, I'M READY TO LEVEL UP →`
- **Button Context**: `After all content sections, before footer`
- **Page Section**: `Below the fold`
- **CTA Theme**: `Dark slate background with purple gradient button`
- **Location**: Final dark CTA section at bottom of page, center

---

## Courses Landing Page (`/courses`)

### 4. User Expanded Course
- **Event**: `User Expanded Course`
- **Properties Include**:
  - `Course ID`: Database ID
  - `Course Title`: Full course name
  - `Course Category`: Category name (e.g., "Career Preparation")
  - `Course Slug`: URL slug
  - `Course Description`: Full description
  - `Course Lesson Count`: Number of lessons
  - `Course Length`: Duration string
  - `Category Slug`: Category URL slug
  - `Referrer URL/Domain`: Where user came from
  - `UTM Parameters`: Campaign tracking
- **Location**: "View Lessons →" button on any course card

### 5. User Clicked Lesson
- **Event**: `User Clicked Lesson`
- **Properties Include**:
  - `Lesson Title`: Full lesson name
  - `Course Title`: Parent course name
  - `Course ID`: Parent course database ID
  - `Click Context`: `Expanded course lessons list`
  - `Referrer URL/Domain`: Where user came from
  - `UTM Parameters`: Campaign tracking
- **Location**: Any lesson item in the expanded lessons list

### 6. User Clicked Sign Up Button (Courses CTA)
- **Button ID**: `courses-page-bottom-cta`
- **Button Section**: `Courses Landing Page CTA Section`
- **Button Position**: `Bottom of page after all courses`
- **Button Text**: `Sign Up for Free →`
- **Button Context**: `After browsing all courses and categories`
- **Page Section**: `Bottom of page`
- **CTA Theme**: `Dark slate background with purple gradient button`
- **Location**: Bottom CTA section after all course listings

---

## Sign Up Page (`/auth/sign-up`)

### 7. User Completed Sign Up
- **Event**: `User Completed Sign Up`
- **Properties Include**:
  - `Page Route`: `/auth/sign-up`
  - `Sign Up Method`: `Email`
  - `Referrer URL/Domain`: Where user came from
  - `UTM Parameters`: Campaign tracking (if present)
- **Location**: Form submission on sign up page

### 8. User Failed Sign Up
- **Event**: `User Failed Sign Up`
- **Properties Include**:
  - `Page Route`: `/auth/sign-up`
  - `Error Message`: Full error text
  - `Error Type`: Categorized (e.g., `Email Error`, `Unknown Error`)
  - `Referrer URL/Domain`: Where user came from
  - `UTM Parameters`: Campaign tracking (if present)
- **Location**: Form submission error on sign up page

---

## Login Page (`/auth/login`)

### 9. User Completed Login
- **Event**: `User Completed Login`
- **Properties Include**:
  - `Page Route`: `/auth/login`
  - `Login Method`: `Email`
  - `Referrer URL/Domain`: Where user came from
  - `UTM Parameters`: Campaign tracking (if present)
- **Location**: Form submission on login page

### 10. User Failed Login
- **Event**: `User Failed Login`
- **Properties Include**:
  - `Page Route`: `/auth/login`
  - `Error Message`: Full error text
  - `Error Type`: Categorized (e.g., `Invalid Credentials`, `Unknown Error`)
  - `Referrer URL/Domain`: Where user came from
  - `UTM Parameters`: Campaign tracking (if present)
- **Location**: Form submission error on login page

---

## Page View Events

All page view events include:
- `Page Route`: Current URL path
- `Page Name`: Formatted page name
- `Referrer URL`: Full referrer URL
- `Referrer Domain`: Referrer domain only
- `Traffic Source`: Categorized source (Direct, Google, Facebook, UTM, etc.)
- `Is Internal Referrer`: Boolean
- `UTM Source/Medium/Campaign/Term/Content`: All UTM parameters

---

## Key Improvements

1. **Unique Button/Link IDs**: Every clickable element has a unique identifier
2. **Exact Location**: Precise section, position, and context for each click
3. **Click Coordinates**: Exact pixel position and viewport context
4. **Full Referrer Data**: Complete source tracking with UTM parameters
5. **Rich Context**: Button text, surrounding content, page section (above/below fold)

This level of detail allows you to:
- Identify which exact button drives the most conversions
- Understand user behavior patterns (where they click on the page)
- Track complete user journeys from source to conversion
- A/B test different button placements and copy
- Optimize conversion funnels based on exact entry points

