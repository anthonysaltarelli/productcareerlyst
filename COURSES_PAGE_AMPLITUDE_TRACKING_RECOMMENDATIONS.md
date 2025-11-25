# Courses Page - Comprehensive Amplitude Tracking Recommendations

## Overview

This document provides comprehensive tracking recommendations for the `/courses` page to understand user behavior, conversion funnels, engagement patterns, and user states. The goal is to enable detailed analysis of how users discover, explore, and interact with courses.

---

## 1. User State Context (User Properties)

**CRITICAL**: All events should include user state context to enable segmentation and analysis.

### Authentication & Subscription State
- `Is Authenticated`: Boolean (true/false)
- `Subscription Status`: `null` | `free` | `learn` | `accelerate`
- `Subscription Active`: Boolean (true if has active subscription)
- `Has Trial`: Boolean (true if user is on trial)
- `Days Since Sign Up`: Number (for onboarding analysis)
- `User Account Age`: String (`new` < 7 days, `returning` 7-30 days, `established` > 30 days)

### Onboarding State
- `Onboarding Stage`: `not_started` | `browsing` | `first_course_viewed` | `first_lesson_started` | `first_lesson_completed`
- `Courses Viewed Count`: Number (total courses user has viewed)
- `Lessons Started Count`: Number (total lessons user has started)
- `Lessons Completed Count`: Number (total lessons user has completed)
- `Courses Completed Count`: Number (total courses user has completed)

### Engagement State
- `First Visit to Courses Page`: Boolean (true if first time visiting /courses)
- `Returning Visitor`: Boolean (true if visited /courses before)
- `Previous Course Interactions`: Number (how many courses they've interacted with before)
- `Time Since Last Visit`: Number (days since last visit to /courses)

### Device & Platform
- `Device Type`: `mobile` | `tablet` | `desktop`
- `Screen Size`: String (e.g., `small` < 768px, `medium` 768-1024px, `large` > 1024px)
- `Browser`: String (Chrome, Safari, Firefox, etc.)
- `OS`: String (iOS, Android, macOS, Windows, etc.)

---

## 2. Page-Level Events

### 2.1 User Viewed Courses Page
**Event**: `User Viewed Courses Page`

**Properties**:
- `Page Route`: `/courses`
- `Page Name`: `Courses`
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `First Visit to Courses Page`: Boolean
- `Returning Visitor`: Boolean
- `Time Since Last Visit`: Number (days) | null
- `Previous Course Interactions`: Number
- `Referrer URL`: String
- `Referrer Domain`: String
- `Traffic Source`: String (Direct, Google, Facebook, UTM, etc.)
- `UTM Source`: String | null
- `UTM Medium`: String | null
- `UTM Campaign`: String | null
- `UTM Term`: String | null
- `UTM Content`: String | null
- `Device Type`: String
- `Screen Size`: String
- `Viewport Width`: Number
- `Viewport Height`: Number
- `Total Categories Visible`: Number
- `Total Courses Visible`: Number
- `Page Load Time`: Number (milliseconds)

**When to Fire**: On page mount (via PageTracking component)

**Already Implemented**: ✅ Yes (via PageTracking)

---

### 2.2 Courses Page Loaded
**Event**: `Courses Page Loaded`

**Properties**:
- `Page Route`: `/courses`
- `Loading Duration`: Number (milliseconds from page load to data ready)
- `Categories Loaded`: Number (count of categories)
- `Courses Loaded`: Number (total count of courses)
- `Load Success`: Boolean (true if data loaded successfully)
- `Load Error`: String | null (error message if failed)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null

**When to Fire**: After courses data is fetched and rendered

**Status**: ❌ Not implemented

---

### 2.3 User Scrolled Courses Page
**Event**: `User Scrolled Courses Page`

**Properties**:
- `Page Route`: `/courses`
- `Scroll Depth Percentage`: Number (0-100)
- `Scroll Depth Category`: String (`0-25%`, `25-50%`, `50-75%`, `75-100%`)
- `Time on Page`: Number (seconds)
- `Categories Visible`: Number (how many categories are in viewport)
- `Courses Visible`: Number (how many courses are in viewport)
- `Reached Bottom CTA`: Boolean (true if scrolled to bottom CTA section)

**When to Fire**: 
- At scroll milestones: 25%, 50%, 75%, 100%
- When bottom CTA comes into viewport
- On page exit (if scrolled at all)

**Status**: ❌ Not implemented

---

### 2.4 Courses Page Time on Page
**Event**: `Courses Page Time on Page`

**Properties**:
- `Page Route`: `/courses`
- `Time on Page`: Number (seconds)
- `Time Category`: String (`0-10s`, `10-30s`, `30-60s`, `1-3min`, `3-5min`, `5min+`)
- `Interactions Count`: Number (total clicks/interactions on page)
- `Courses Expanded`: Number (how many courses were expanded)
- `Lessons Clicked`: Number (how many lessons were clicked)
- `Reached Bottom`: Boolean (scrolled to bottom)

**When to Fire**: On page exit/unload

**Status**: ❌ Not implemented

---

## 3. Category-Level Events

### 3.1 User Viewed Category
**Event**: `User Viewed Category`

**Properties**:
- `Page Route`: `/courses`
- `Category ID`: String
- `Category Name`: String
- `Category Slug`: String
- `Category Description`: String
- `Category Display Order`: Number
- `Category Position`: Number (1st, 2nd, 3rd category on page)
- `Courses in Category`: Number (total courses in this category)
- `Is First Category`: Boolean
- `Is Last Category`: Boolean
- `Viewport Position`: String (`above_fold`, `below_fold`)
- `Time on Page Before View`: Number (seconds)

**When to Fire**: When category section enters viewport (Intersection Observer)

**Status**: ❌ Not implemented

---

### 3.2 User Expanded Category (if implemented)
**Event**: `User Expanded Category`

**Properties**:
- `Page Route`: `/courses`
- `Category ID`: String
- `Category Name`: String
- `Category Position`: Number
- `Courses in Category`: Number
- `Action`: String (`expand` | `collapse`)

**When to Fire**: If category expansion/collapse is added

**Status**: ❌ Not implemented (feature doesn't exist yet)

---

## 4. Course-Level Events

### 4.1 User Viewed Course Card
**Event**: `User Viewed Course Card`

**Properties**:
- `Page Route`: `/courses`
- `Course ID`: String
- `Course Title`: String
- `Course Slug`: String
- `Course Description`: String (truncated if long)
- `Course Category`: String
- `Course Category Slug`: String
- `Course Lesson Count`: Number
- `Course Length`: String
- `Course Prioritization`: Number
- `Category Position`: Number (which category, 1st, 2nd, etc.)
- `Course Position in Category`: Number (1st, 2nd course in category)
- `Course Position Overall`: Number (overall position on page)
- `Color Scheme`: String (blue, purple, green, orange, violet, pink, teal)
- `Viewport Position`: String (`above_fold`, `below_fold`)
- `Time on Page Before View`: Number (seconds)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Can Access Course`: Boolean (based on subscription requirements)

**When to Fire**: When course card enters viewport (Intersection Observer)

**Status**: ❌ Not implemented

---

### 4.2 User Clicked Course Card
**Event**: `User Clicked Course Card`

**Properties**:
- `Page Route`: `/courses`
- `Course ID`: String
- `Course Title`: String
- `Course Slug`: String
- `Course Category`: String
- `Course Lesson Count`: Number
- `Course Position in Category`: Number
- `Course Position Overall`: Number
- `Color Scheme`: String
- `Click Position X`: Number (pixel)
- `Click Position Y`: Number (pixel)
- `Click Position Horizontal`: String (`left`, `center`, `right`)
- `Click Position Vertical`: String (`top`, `middle`, `bottom`)
- `Click Target`: String (`card_body`, `title`, `description`, `metadata`, `button`)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Time on Page Before Click`: Number (seconds)

**When to Fire**: On click anywhere on course card (if card becomes clickable)

**Status**: ❌ Not implemented (cards are not clickable, only button is)

---

### 4.3 User Expanded Course
**Event**: `User Expanded Course`

**Properties**:
- `Page Route`: `/courses`
- `Course ID`: String
- `Course Title`: String
- `Course Slug`: String
- `Course Category`: String
- `Course Category Slug`: String
- `Course Description`: String
- `Course Lesson Count`: Number
- `Course Length`: String
- `Course Position in Category`: Number
- `Course Position Overall`: Number
- `Color Scheme`: String
- `Action`: String (`expand` | `collapse`)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Time on Page Before Expand`: Number (seconds)
- `Time on Course Card Before Expand`: Number (seconds)
- `Referrer URL`: String
- `Referrer Domain`: String
- `UTM Source`: String | null
- `UTM Medium`: String | null
- `UTM Campaign`: String | null

**When to Fire**: When "View Lessons →" button is clicked

**Already Implemented**: ✅ Yes (as "User Expanded Course")

**Improvements Needed**:
- Add `Action` property (`expand` vs `collapse`)
- Add `Time on Course Card Before Expand`
- Add course position properties
- Add color scheme

---

### 4.4 User Clicked View Lessons Button
**Event**: `User Clicked View Lessons Button`

**Properties**:
- `Page Route`: `/courses`
- `Button ID`: `courses-view-lessons-button` (needs to be unique per course!)
- `Button Section`: `Courses Landing Page`
- `Button Position`: `Course Card`
- `Button Type`: `Course Action Button`
- `Button Text`: String (`View Lessons →` or `Hide Lessons`)
- `Button Context`: `Below course description and metadata`
- `Course ID`: String
- `Course Title`: String
- `Course Category`: String
- `Course Lesson Count`: Number
- `Course Position in Category`: Number
- `Course Position Overall`: Number
- `Is Expanded`: Boolean (true if expanding, false if collapsing)
- `Click Position X`: Number
- `Click Position Y`: Number
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null

**When to Fire**: On "View Lessons →" / "Hide Lessons" button click

**Already Implemented**: ✅ Yes

**Improvements Needed**:
- Make `buttonId` unique per course: `courses-view-lessons-button-${courseId}`
- Add `Is Expanded` property
- Add click position coordinates
- Add course position properties

---

## 5. Lesson-Level Events

### 5.1 User Viewed Lesson in List
**Event**: `User Viewed Lesson in List`

**Properties**:
- `Page Route`: `/courses`
- `Lesson ID`: String
- `Lesson Title`: String
- `Lesson Prioritization`: String (e.g., "1.1", "2.3")
- `Lesson Requires Subscription`: Boolean
- `Course ID`: String
- `Course Title`: String
- `Course Category`: String
- `Lesson Position in Course`: Number (1st, 2nd, 3rd lesson)
- `Total Lessons in Course`: Number
- `Is Premium Lesson`: Boolean
- `Viewport Position`: String (`above_fold`, `below_fold`)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Can Access Lesson`: Boolean (based on subscription)

**When to Fire**: When lesson item enters viewport in expanded course list

**Status**: ❌ Not implemented

---

### 5.2 User Clicked Lesson
**Event**: `User Clicked Lesson`

**Properties**:
- `Page Route`: `/courses`
- `Lesson ID`: String
- `Lesson Title`: String
- `Lesson Prioritization`: String
- `Lesson Requires Subscription`: Boolean
- `Course ID`: String
- `Course Title`: String
- `Course Category`: String
- `Course Slug`: String
- `Lesson Position in Course`: Number
- `Total Lessons in Course`: Number
- `Is Premium Lesson`: Boolean
- `Click Context`: String (`Expanded course lessons list`)
- `Course Position in Category`: Number
- `Course Position Overall`: Number
- `Click Position X`: Number
- `Click Position Y`: Number
- `Click Target`: String (`lesson_title`, `lesson_number`, `premium_badge`, `lesson_card`)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Can Access Lesson`: Boolean
- `Time on Page Before Click`: Number (seconds)
- `Time Since Course Expanded`: Number (seconds)
- `Referrer URL`: String
- `Referrer Domain`: String
- `UTM Source`: String | null
- `UTM Medium`: String | null
- `UTM Campaign`: String | null

**When to Fire**: On lesson item click

**Already Implemented**: ✅ Yes (as "User Clicked Lesson")

**Improvements Needed**:
- Add `Lesson ID` (currently missing)
- Add `Lesson Position in Course`
- Add `Total Lessons in Course`
- Add `Click Target` (where exactly they clicked)
- Add `Time Since Course Expanded`
- Add course position properties
- Add click coordinates

---

### 5.3 User Clicked Premium Badge
**Event**: `User Clicked Premium Badge`

**Properties**:
- `Page Route`: `/courses`
- `Lesson ID`: String
- `Lesson Title`: String
- `Course ID`: String
- `Course Title`: String
- `Course Category`: String
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Has Active Subscription`: Boolean
- `Click Position X`: Number
- `Click Position Y`: Number

**When to Fire**: On click of "Premium" badge on lesson

**Status**: ❌ Not implemented (badge is not clickable, but should track if it becomes clickable)

---

## 6. Modal Events

### 6.1 Sign Up Modal Opened
**Event**: `Sign Up Modal Opened`

**Properties**:
- `Page Route`: `/courses`
- `Modal Trigger`: String (`lesson_click`, `manual` - if close button exists)
- `Lesson ID`: String | null
- `Lesson Title`: String | null
- `Course ID`: String | null
- `Course Title`: String | null
- `Modal Title`: String
- `Modal Description`: String
- `Is Authenticated`: Boolean
- `Time on Page Before Modal`: Number (seconds)
- `Courses Expanded Before Modal`: Number
- `Lessons Clicked Before Modal`: Number

**When to Fire**: When SignUpModal opens

**Status**: ❌ Not implemented

---

### 6.2 Sign Up Modal Closed
**Event**: `Sign Up Modal Closed`

**Properties**:
- `Page Route`: `/courses`
- `Modal Trigger`: String (`lesson_click`, `manual`)
- `Close Method`: String (`close_button`, `backdrop_click`, `escape_key`, `sign_up_click`)
- `Time Modal Open`: Number (seconds)
- `Lesson ID`: String | null
- `Lesson Title`: String | null
- `Course ID`: String | null
- `Course Title`: String | null
- `User Signed Up`: Boolean (true if clicked "Sign Up Now →")

**When to Fire**: When SignUpModal closes

**Status**: ❌ Not implemented

---

### 6.3 User Clicked Sign Up in Modal
**Event**: `User Clicked Sign Up in Modal`

**Properties**:
- `Page Route`: `/courses`
- `Button ID`: `courses-signup-modal-cta`
- `Button Section`: `Sign Up Modal`
- `Button Position`: `Center of Modal`
- `Button Type`: `Modal CTA`
- `Button Text`: `Sign Up Now →`
- `Modal Trigger`: String (`lesson_click`, `manual`)
- `Lesson ID`: String | null
- `Lesson Title`: String | null
- `Course ID`: String | null
- `Course Title`: String | null
- `Time Modal Open Before Click`: Number (seconds)
- `Is Authenticated`: Boolean

**When to Fire**: On "Sign Up Now →" button click in modal

**Status**: ❌ Not implemented (modal button not tracked)

---

### 6.4 User Clicked Close Modal Button
**Event**: `User Clicked Close Modal Button`

**Properties**:
- `Page Route`: `/courses`
- `Button ID`: `courses-signup-modal-close`
- `Button Section`: `Sign Up Modal`
- `Button Position`: `Top Right of Modal`
- `Button Type`: `Close Button`
- `Modal Trigger`: String
- `Time Modal Open`: Number (seconds)
- `Lesson ID`: String | null
- `Course ID`: String | null

**When to Fire**: On modal close button (×) click

**Status**: ❌ Not implemented

---

### 6.5 User Clicked Sign In Link in Modal
**Event**: `User Clicked Sign In Link in Modal`

**Properties**:
- `Page Route`: `/courses`
- `Link ID`: `courses-signup-modal-signin-link`
- `Link Section`: `Sign Up Modal`
- `Link Position`: `Bottom of Modal`
- `Link Type`: `Text Link`
- `Link Text`: `Sign in`
- `Modal Trigger`: String
- `Time Modal Open Before Click`: Number (seconds)
- `Lesson ID`: String | null
- `Course ID`: String | null

**When to Fire**: On "Sign in" link click in modal

**Status**: ❌ Not implemented

---

## 7. CTA Section Events

### 7.1 User Viewed Bottom CTA
**Event**: `User Viewed Bottom CTA`

**Properties**:
- `Page Route`: `/courses`
- `CTA Section`: `Courses Landing Page CTA Section`
- `CTA Theme`: `Dark slate background with purple gradient button`
- `Time on Page Before View`: Number (seconds)
- `Scroll Depth Percentage`: Number (0-100)
- `Courses Expanded Before View`: Number
- `Lessons Clicked Before View`: Number
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null

**When to Fire**: When bottom CTA section enters viewport

**Status**: ❌ Not implemented

---

### 7.2 User Clicked Sign Up Button (Bottom CTA)
**Event**: `User Clicked Sign Up Button`

**Properties**:
- `Page Route`: `/courses`
- `Button ID`: `courses-page-bottom-cta`
- `Button Section`: `Courses Landing Page CTA Section`
- `Button Position`: `Bottom of page after all courses`
- `Button Type`: `Courses CTA`
- `Button Text`: `Sign Up for Free →`
- `Button Context`: `After browsing all courses and categories`
- `Page Section`: `Bottom of page`
- `CTA Theme`: `Dark slate background with purple gradient button`
- `Time on Page Before Click`: Number (seconds)
- `Scroll Depth Percentage`: Number
- `Courses Expanded Before Click`: Number
- `Lessons Clicked Before Click`: Number
- `Click Position X`: Number
- `Click Position Y`: Number
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Referrer URL`: String
- `Referrer Domain`: String
- `UTM Source`: String | null
- `UTM Medium`: String | null
- `UTM Campaign`: String | null

**When to Fire**: On bottom CTA "Sign Up for Free →" button click

**Already Implemented**: ✅ Yes

**Improvements Needed**:
- Add click coordinates
- Add engagement metrics (courses expanded, lessons clicked)
- Add scroll depth

---

## 8. Navigation & Entry Point Events

### 8.1 User Clicked Courses Link (Navigation)
**Event**: `User Clicked Courses Link`

**Properties**:
- `Link ID`: String (varies by location)
- `Link Section`: String (`Navigation`, `Mobile Menu`, `Features Section`, etc.)
- `Link Position`: String (`Desktop navigation`, `Mobile menu`, `PM Courses Feature Card`, etc.)
- `Link Type`: String (`Navigation Link`, `Feature Card CTA`, etc.)
- `Link Text`: String (`Courses`, `Browse Courses →`, etc.)
- `Source Page`: String (where they clicked from)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null

**When to Fire**: On any link to /courses

**Already Implemented**: ✅ Yes (in Navigation, MobileMenu, Homepage)

**Note**: Multiple entry points already tracked with unique IDs

---

## 9. Error & Edge Case Events

### 9.1 Courses Page Load Error
**Event**: `Courses Page Load Error`

**Properties**:
- `Page Route`: `/courses`
- `Error Type`: String (`database_error`, `network_error`, `unknown`)
- `Error Message`: String
- `Is Authenticated`: Boolean
- `Retry Attempt`: Number (if user refreshes)

**When to Fire**: When courses fail to load

**Status**: ❌ Not implemented

---

### 9.2 User Viewed Empty State
**Event**: `User Viewed Empty State`

**Properties**:
- `Page Route`: `/courses`
- `Empty State Type`: String (`no_courses`, `no_categories`)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Time on Page Before View`: Number (seconds)

**When to Fire**: When "No Courses Available" state is shown

**Status**: ❌ Not implemented

---

### 9.3 User Viewed Loading State
**Event**: `User Viewed Loading State`

**Properties**:
- `Page Route`: `/courses`
- `Loading Duration`: Number (milliseconds)
- `Is Authenticated`: Boolean

**When to Fire**: When loading spinner is shown (and track duration)

**Status**: ❌ Not implemented

---

## 10. Engagement & Behavior Events

### 10.1 User Completed Course Exploration
**Event**: `User Completed Course Exploration`

**Properties**:
- `Page Route`: `/courses`
- `Total Time on Page`: Number (seconds)
- `Categories Viewed`: Number
- `Courses Viewed`: Number
- `Courses Expanded`: Number
- `Lessons Viewed`: Number
- `Lessons Clicked`: Number
- `Reached Bottom CTA`: Boolean
- `Clicked Bottom CTA`: Boolean
- `Modal Opened`: Boolean
- `Modal Closed`: Boolean
- `Signed Up`: Boolean
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Engagement Score`: Number (calculated: views + expands + clicks)

**When to Fire**: On page exit (if user spent > 10 seconds on page)

**Status**: ❌ Not implemented

---

### 10.2 User Bounced from Courses Page
**Event**: `User Bounced from Courses Page`

**Properties**:
- `Page Route`: `/courses`
- `Time on Page`: Number (seconds)
- `Scroll Depth Percentage`: Number
- `Categories Viewed`: Number
- `Courses Viewed`: Number
- `Interactions`: Number
- `Bounce Reason`: String (`quick_exit`, `no_scroll`, `no_interaction`)
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Referrer URL`: String
- `Traffic Source`: String

**When to Fire**: On page exit if:
- Time on page < 10 seconds AND
- Scroll depth < 25% AND
- No interactions

**Status**: ❌ Not implemented

---

## 11. Conversion Funnel Events

### 11.1 Courses Page Funnel Step
**Event**: `Courses Page Funnel Step`

**Properties**:
- `Page Route`: `/courses`
- `Funnel Step`: String (`page_view`, `category_view`, `course_view`, `course_expand`, `lesson_click`, `modal_open`, `sign_up_click`)
- `Step Number`: Number (1-7)
- `Time to Step`: Number (seconds from page load)
- `Previous Step`: String | null
- `Is Authenticated`: Boolean
- `Subscription Status`: String | null
- `Completed Funnel`: Boolean (true if reached sign_up_click)

**When to Fire**: At each major funnel step

**Status**: ❌ Not implemented

---

## 12. Implementation Priority

### High Priority (Implement First)
1. ✅ User State Context (add to all existing events)
2. ❌ User Viewed Course Card (impressions)
3. ❌ User Viewed Lesson in List (impressions)
4. ❌ Sign Up Modal Opened/Closed
5. ❌ User Clicked Sign Up in Modal
6. ❌ Scroll depth tracking
7. ❌ Time on page tracking
8. ❌ User Viewed Bottom CTA

### Medium Priority
9. ❌ User Viewed Category
10. ❌ User Scrolled Courses Page
11. ❌ Courses Page Loaded
12. ❌ User Clicked Premium Badge (if becomes clickable)
13. ❌ Engagement score calculation
14. ❌ Conversion funnel tracking

### Low Priority (Nice to Have)
15. ❌ User Bounced from Courses Page
16. ❌ Courses Page Load Error
17. ❌ User Viewed Empty State
18. ❌ User Viewed Loading State
19. ❌ User Completed Course Exploration

---

## 13. Key Metrics to Build Reports

### Discovery Metrics
- **Course Discovery Rate**: % of users who view at least one course card
- **Category Discovery Rate**: % of users who view at least one category
- **Average Courses Viewed per Session**: Mean courses viewed
- **Most Popular Categories**: Which categories get most views
- **Most Popular Courses**: Which courses get most views/expansions

### Engagement Metrics
- **Course Expansion Rate**: % of viewed courses that get expanded
- **Lesson Click Rate**: % of expanded courses where user clicks a lesson
- **Average Time on Page**: Mean time spent on /courses
- **Scroll Depth Distribution**: % of users reaching 25%, 50%, 75%, 100%
- **Engagement Score Distribution**: How engaged users are

### Conversion Metrics
- **Modal Open Rate**: % of users who open sign-up modal
- **Sign Up Conversion Rate**: % of users who click sign-up (modal or CTA)
- **Funnel Completion Rate**: % of users completing full funnel
- **Time to Conversion**: Average time from page view to sign-up click

### User Segment Analysis
- **Conversion by Auth Status**: Free vs authenticated users
- **Conversion by Subscription**: Free vs Learn vs Accelerate
- **Conversion by Onboarding Stage**: New vs returning users
- **Conversion by Device**: Mobile vs desktop behavior
- **Conversion by Traffic Source**: Where best users come from

### Course Performance
- **Course Click-Through Rate**: % of views → expansions
- **Course to Lesson Conversion**: % of expansions → lesson clicks
- **Premium Lesson Interest**: % of premium lessons clicked
- **Course Completion Intent**: % of users who start a course journey

---

## 14. Implementation Notes

### User State Context Helper
Create a utility function to fetch and attach user state to all events:

```typescript
// lib/utils/courses-tracking-context.ts
export async function getCoursesTrackingContext(userId?: string) {
  // Fetch user state, subscription, onboarding, etc.
  // Return object with all context properties
}
```

### Intersection Observer for Impressions
Use Intersection Observer API to track when course cards, categories, and lessons enter viewport.

### Scroll Tracking
Use scroll event listeners (throttled) to track scroll depth and time-based events.

### Modal Tracking
Add tracking to SignUpModal component for open/close events.

### Unique Button IDs
Ensure all buttons have unique IDs, especially the "View Lessons" button which should be: `courses-view-lessons-button-${courseId}`

---

## 15. Testing Checklist

- [ ] All events fire with correct properties
- [ ] User state context is included in all events
- [ ] Unique identifiers are present (course IDs, lesson IDs, button IDs)
- [ ] Click coordinates are captured
- [ ] Scroll depth is accurate
- [ ] Time tracking is accurate
- [ ] Modal events fire correctly
- [ ] No duplicate events
- [ ] Events are non-blocking (don't affect UI)
- [ ] Events work on mobile and desktop
- [ ] Events work for authenticated and unauthenticated users

---

## Summary

This comprehensive tracking plan enables:
1. **Complete user journey analysis** from entry to conversion
2. **Detailed engagement metrics** to understand what users find interesting
3. **Conversion funnel optimization** by identifying drop-off points
4. **User segmentation** by auth status, subscription, onboarding stage
5. **Course performance analysis** to understand which content drives engagement
6. **A/B testing capabilities** for different layouts, CTAs, and content

The key is to track **impressions** (what users see), **interactions** (what users click), and **context** (user state, position, timing) for every element on the page.




