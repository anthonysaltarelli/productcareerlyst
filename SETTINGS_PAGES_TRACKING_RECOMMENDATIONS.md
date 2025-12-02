# Settings Pages Amplitude Tracking Recommendations

## Overview

This document provides comprehensive recommendations for tracking user behavior on the Settings pages (`/dashboard/settings`). The goal is to understand:
- How users navigate and interact with settings
- What information they update and when
- User state context (onboarding, subscription, etc.)
- Drop-off points and friction areas
- Profile completion rates

## Page Structure

The Settings page has three main tabs:
1. **Profile Information** - First name, Last name, LinkedIn URL, Portfolio URL
2. **Account Information** - Email (read-only), Password change
3. **Log Out** - Logout confirmation flow

---

## 1. Page View Tracking

### Main Settings Page View

**Event**: `User Viewed Settings Page`

**Properties to Include**:
- Standard page view properties (from `PageTracking` component):
  - `Page Route`: `/dashboard/settings`
  - `Page Name`: `Settings`
  - `Referrer URL`: Where user came from
  - `Referrer Domain`: Domain of referrer
  - `Traffic Source`: Categorized source
  - `Is Internal Referrer`: Boolean
  - `UTM Source/Medium/Campaign/Term/Content`: UTM parameters

- **User State Context** (from `getDashboardTrackingContext`):
  - `Subscription Plan`: `learn` | `accelerate` | `null`
  - `Subscription Status`: `active` | `trialing` | `canceled` | etc.
  - `Is Subscription Active`: Boolean
  - `Onboarding Completion Percentage`: 0-100
  - `Milestones Completed Count`: Number
  - `Total Milestones`: 10
  - `Days Since Signup`: Number
  - `Lessons Completed`: Number
  - `Courses Completed`: Number
  - `Highest Resume Score`: Number
  - `Total Job Applications`: Number
  - `Resume Versions Count`: Number
  - `Contacts Count`: Number
  - `Companies Researched Count`: Number
  - Individual milestone booleans (e.g., `Milestone: First Lesson Watched`)
  - `Feature Flags Enabled`: Array of enabled flags

- **Settings-Specific Context**:
  - `Initial Active Tab`: Which tab is shown first (`profile` | `account` | `logout`)
  - `Profile Completion Status`: Whether profile has all fields filled
    - `Has First Name`: Boolean
    - `Has Last Name`: Boolean
    - `Has LinkedIn URL`: Boolean
    - `Has Portfolio URL`: Boolean
  - `Profile Fields Filled Count`: 0-4

**Implementation**: Use `DashboardPageTracking` component pattern with settings-specific context

---

## 2. Tab Navigation Tracking

### Tab Switch Events

**Event**: `User Switched Settings Tab`

**Properties to Include**:
- `From Tab`: Previous tab (`profile` | `account` | `logout`)
- `To Tab`: New tab (`profile` | `account` | `logout`)
- `Time Spent on Previous Tab`: Seconds spent on previous tab
- `Page Route`: `/dashboard/settings`
- User state context (same as page view)

**When to Track**:
- Every time user clicks a tab button in the sidebar navigation
- Track both the "from" and "to" states

**Button IDs**:
- `settings-tab-profile-button`
- `settings-tab-account-button`
- `settings-tab-logout-button`

**Implementation**: Track on `onClick` of tab buttons using `TrackedButton` component

---

## 3. Profile Information Section Tracking

### 3.1 Form Field Interactions

#### Field Focus Events

**Event**: `User Focused Profile Field`

**Properties to Include**:
- `Field Name`: `first_name` | `last_name` | `linkedin` | `portfolio`
- `Field Label`: Human-readable label
- `Field Had Value`: Boolean (was field already filled?)
- `Field Value Length`: Character count (0 if empty)
- `Is First Time Focusing`: Boolean (first time user has focused this field)
- `Active Tab`: `profile`
- `Page Route`: `/dashboard/settings`
- User state context

**When to Track**: On `onFocus` of each input field

#### Field Blur Events

**Event**: `User Blurred Profile Field`

**Properties to Include**:
- `Field Name`: `first_name` | `last_name` | `linkedin` | `portfolio`
- `Field Label`: Human-readable label
- `Field Value Changed`: Boolean (did user change the value?)
- `Field Value Length`: Final character count
- `Field Value Before`: Previous value (if changed)
- `Field Value After`: New value (if changed)
- `Time Spent in Field`: Seconds between focus and blur
- `Active Tab`: `profile`
- User state context

**When to Track**: On `onBlur` of each input field

#### Field Validation Errors

**Event**: `User Encountered Profile Field Error`

**Properties to Include**:
- `Field Name`: `first_name` | `last_name` | `linkedin` | `portfolio`
- `Error Type`: `invalid_url` | `required` | `max_length` | etc.
- `Error Message`: Displayed error message
- `Field Value`: Current field value
- `Active Tab`: `profile`
- User state context

**When to Track**: When validation fails (on blur or submit)

### 3.2 Form Submission

#### Form Submit Attempt

**Event**: `User Attempted Profile Update`

**Properties to Include**:
- `Form Fields Changed`: Array of field names that changed
- `Form Fields Changed Count`: Number of fields changed
- `First Name Changed`: Boolean
- `Last Name Changed`: Boolean
- `LinkedIn URL Changed`: Boolean
- `Portfolio URL Changed`: Boolean
- `Form Has Errors`: Boolean
- `Form Validation Errors`: Array of error messages
- `Active Tab`: `profile`
- `Profile Completion Before`: Fields filled count before update
- `Profile Completion After`: Fields filled count after update
- User state context

**When to Track**: On form `onSubmit` (before API call)

#### Form Submit Success

**Event**: `User Successfully Updated Profile`

**Properties to Include**:
- `Form Fields Changed`: Array of field names that were updated
- `Form Fields Changed Count`: Number of fields updated
- `First Name Updated`: Boolean
- `Last Name Updated`: Boolean
- `LinkedIn URL Updated`: Boolean
- `Portfolio URL Updated`: Boolean
- `Profile Completion Before`: Fields filled count before update
- `Profile Completion After`: Fields filled count after update
- `Profile Now Complete`: Boolean (all 4 fields filled)
- `Time to Submit`: Seconds from page load to submit
- `Active Tab`: `profile`
- User state context

**When to Track**: After successful API response

#### Form Submit Failure

**Event**: `User Failed to Update Profile`

**Properties to Include**:
- `Error Type`: `network_error` | `validation_error` | `server_error` | `unauthorized`
- `Error Message`: Error message displayed to user
- `Form Fields Changed`: Array of field names that were attempted
- `Form Fields Changed Count`: Number of fields attempted
- `Active Tab`: `profile`
- User state context

**When to Track**: After failed API response

### 3.3 Save Button Click

**Event**: `User Clicked Save Profile Changes Button`

**Properties to Include**:
- `Button ID`: `settings-profile-save-button`
- `Button Section`: `Profile Information Section`
- `Button Position`: `Bottom of Profile Form`
- `Button Text`: `Save Changes` | `Saving...`
- `Button Type`: `Primary Form Submit`
- `Button Context`: `Below all profile input fields`
- `Form Fields Changed Count`: Number of fields with changes
- `Form Has Validation Errors`: Boolean
- `Active Tab`: `profile`
- Standard click properties (from `TrackedButton`)
- User state context

**Implementation**: Use `TrackedButton` component

---

## 4. Account Information Section Tracking

### 4.1 Email Section View

**Event**: `User Viewed Email Section`

**Properties to Include**:
- `Email Address`: User's email (hashed or masked for privacy)
- `Email Domain`: Domain part of email (e.g., `gmail.com`)
- `Is Email Verified`: Boolean (if available from auth)
- `Active Tab`: `account`
- User state context

**When to Track**: When Account tab is opened and email section is visible

### 4.2 Password Change Form

#### Password Form Focus

**Event**: `User Focused Password Change Form`

**Properties to Include**:
- `Active Tab`: `account`
- `Has Previously Changed Password`: Boolean (if trackable)
- User state context

**When to Track**: When user focuses on new password or confirm password field

#### Password Change Attempt

**Event**: `User Attempted Password Change`

**Properties to Include**:
- `New Password Length`: Character count (don't track actual password)
- `Password Meets Minimum Length`: Boolean (>= 6 characters)
- `Passwords Match`: Boolean (new password === confirm password)
- `Form Has Validation Errors`: Boolean
- `Validation Error Type`: `password_too_short` | `passwords_dont_match` | null
- `Active Tab`: `account`
- User state context

**When to Track**: On form `onSubmit` (before API call)

#### Password Change Success

**Event**: `User Successfully Changed Password`

**Properties to Include**:
- `New Password Length`: Character count
- `Time to Change`: Seconds from form focus to successful change
- `Active Tab`: `account`
- User state context

**When to Track**: After successful API response

#### Password Change Failure

**Event**: `User Failed to Change Password`

**Properties to Include**:
- `Error Type`: `network_error` | `validation_error` | `server_error` | `unauthorized` | `weak_password`
- `Error Message`: Error message displayed
- `New Password Length`: Character count
- `Passwords Matched`: Boolean
- `Active Tab`: `account`
- User state context

**When to Track**: After failed API response

### 4.3 Update Password Button Click

**Event**: `User Clicked Update Password Button`

**Properties to Include**:
- `Button ID`: `settings-account-update-password-button`
- `Button Section`: `Account Information Section`
- `Button Position`: `Bottom of Password Change Form`
- `Button Text`: `Update Password` | `Updating Password...`
- `Button Type`: `Primary Form Submit`
- `Button Context`: `Below password input fields`
- `Form Has Validation Errors`: Boolean
- `Active Tab`: `account`
- Standard click properties (from `TrackedButton`)
- User state context

**Implementation**: Use `TrackedButton` component

---

## 5. Logout Section Tracking

### 5.1 Logout Button Click (Initial)

**Event**: `User Clicked Log Out Button`

**Properties to Include**:
- `Button ID`: `settings-logout-primary-button`
- `Button Section`: `Log Out Section`
- `Button Position`: `Center of Log Out Card`
- `Button Text`: `Log Out`
- `Button Type`: `Destructive Action`
- `Button Context`: `Inside red warning card`
- `Active Tab`: `logout`
- `Time on Settings Page`: Total seconds user spent on settings page
- `Tabs Visited`: Array of tabs user visited during session
- `Profile Updated During Session`: Boolean
- `Password Changed During Session`: Boolean
- Standard click properties (from `TrackedButton`)
- User state context

**Implementation**: Use `TrackedButton` component

**When to Track**: When user clicks the "Log Out" button in the Logout section

### 5.2 Logout Modal Interactions

#### Modal Opened

**Event**: `User Viewed Log Out Confirmation Modal`

**Properties to Include**:
- `Modal Trigger`: `settings-logout-primary-button`
- `Active Tab`: `logout`
- `Time on Settings Page`: Total seconds on settings page
- User state context

**When to Track**: When modal is displayed

#### Modal Cancel Click

**Event**: `User Cancelled Log Out`

**Properties to Include**:
- `Button ID`: `settings-logout-modal-cancel-button`
- `Button Section`: `Log Out Confirmation Modal`
- `Button Position`: `Left Side of Modal Footer`
- `Button Text`: `Cancel`
- `Button Type`: `Secondary Action`
- `Button Context`: `Next to Confirm Log Out button`
- `Time Modal Was Open`: Seconds modal was visible
- `Active Tab`: `logout`
- Standard click properties (from `TrackedButton`)
- User state context

**Implementation**: Use `TrackedButton` component

#### Modal Confirm Click

**Event**: `User Confirmed Log Out`

**Properties to Include**:
- `Button ID`: `settings-logout-modal-confirm-button`
- `Button Section`: `Log Out Confirmation Modal`
- `Button Position`: `Right Side of Modal Footer`
- `Button Text`: `Log Out` | `Logging out...`
- `Button Type`: `Destructive Primary Action`
- `Button Context`: `Next to Cancel button`
- `Time Modal Was Open`: Seconds modal was visible
- `Time on Settings Page`: Total seconds on settings page
- `Active Tab`: `logout`
- Standard click properties (from `TrackedButton`)
- User state context

**Implementation**: Use `TrackedButton` component

#### Logout Success

**Event**: `User Successfully Logged Out`

**Properties to Include**:
- `Logout Source`: `settings-page`
- `Time on Settings Page`: Total seconds on settings page
- `Tabs Visited`: Array of tabs visited
- `Profile Updated During Session`: Boolean
- `Password Changed During Session`: Boolean
- `Total Session Duration`: Seconds from login to logout (if trackable)
- User state context (final state before logout)

**When to Track**: After successful logout API call, before redirect

---

## 6. Session-Level Tracking

### Time Spent on Settings Page

**Event**: `User Left Settings Page`

**Properties to Include**:
- `Time Spent on Page`: Total seconds on settings page
- `Tabs Visited`: Array of tabs visited (`profile`, `account`, `logout`)
- `Time Spent on Profile Tab`: Seconds on profile tab
- `Time Spent on Account Tab`: Seconds on account tab
- `Time Spent on Logout Tab`: Seconds on logout tab
- `Tab Switches Count`: Number of tab switches
- `Profile Updated`: Boolean
- `Password Changed`: Boolean
- `Form Submissions Attempted`: Number of form submissions
- `Form Submissions Successful`: Number of successful submissions
- `Form Submissions Failed`: Number of failed submissions
- `Destination Route`: Where user navigated to (if trackable)
- User state context

**When to Track**: 
- On component unmount
- Before navigation away from page
- On logout

---

## 7. User State Context Properties

All events should include user state context from `getDashboardTrackingContext`. This provides:

### Subscription Context
- `Subscription Plan`: `learn` | `accelerate` | `null`
- `Subscription Status`: `active` | `trialing` | `canceled` | `past_due` | etc.
- `Is Subscription Active`: Boolean

### Onboarding Context
- `Onboarding Completion Percentage`: 0-100
- `Milestones Completed Count`: Number
- `Total Milestones`: 10
- Individual milestone booleans:
  - `Milestone: First Lesson Watched`
  - `Milestone: First Course Completed`
  - `Milestone: First Resume Imported`
  - `Milestone: Resume Score 70+`
  - `Milestone: Resume Score 80+`
  - `Milestone: Resume Score 90+`
  - `Milestone: First Template Accessed`
  - `Milestone: First Job Added`
  - `Milestone: First Contact Added`
  - `Milestone: First Research Viewed`

### Usage Metrics
- `Lessons Completed`: Number
- `Courses Completed`: Number
- `Highest Resume Score`: Number
- `Total Job Applications`: Number
- `Resume Versions Count`: Number
- `Contacts Count`: Number
- `Companies Researched Count`: Number

### Feature Flags
- `Feature Flags Enabled`: Array of enabled flags (`coach`, `compensation`, `impactPortfolio`, `careerTracker`)

### User Lifecycle
- `Days Since Signup`: Number

---

## 8. Implementation Notes

### Components to Use

1. **Page View Tracking**: Create `SettingsPageTracking` component similar to `DashboardPageTracking`
   - Fetch user stats and subscription
   - Include all user state context
   - Track on page load

2. **Button Tracking**: Use `TrackedButton` component for all buttons
   - Tab navigation buttons
   - Save/Update buttons
   - Logout buttons

3. **Form Tracking**: Use `trackEvent` directly for form events
   - Field focus/blur
   - Form submission
   - Validation errors

4. **Modal Tracking**: Use `TrackedButton` for modal buttons
   - Cancel and Confirm buttons in logout modal

### Data Privacy Considerations

- **Email Address**: Hash or mask email addresses in tracking
- **Password Values**: NEVER track actual password values, only length and validation status
- **Field Values**: For URL fields (LinkedIn, Portfolio), consider tracking domain only, not full URL

### Session State Tracking

Track session-level state to understand user journey:
- Which tabs were visited
- Whether profile/password was updated
- Time spent in each section
- Form submission attempts and outcomes

### Error Tracking

Track all validation and API errors to identify:
- Common validation failures
- Network issues
- Server errors
- User friction points

---

## 9. Key Metrics to Build Reports On

### User Engagement
- Settings page visit rate (% of users who visit settings)
- Time spent on settings page
- Tab navigation patterns
- Return visits to settings

### Profile Completion
- Profile completion rate (% with all 4 fields filled)
- Field-by-field completion rates
- Profile update frequency
- Fields most commonly updated

### Password Management
- Password change rate
- Password change success rate
- Password change failure reasons
- Time between password changes

### User Lifecycle
- Settings usage by onboarding completion %
- Settings usage by subscription plan
- Settings usage by days since signup
- Correlation between settings updates and engagement

### Friction Points
- Form submission failure rate
- Validation error frequency
- Tab abandonment (users who open tab but don't complete action)
- Modal abandonment (users who open logout modal but cancel)

### Segmentation
- Settings behavior by subscription plan
- Settings behavior by onboarding status
- Settings behavior by feature flag status
- Settings behavior by user engagement level

---

## 10. Event Summary

### Page Views (1 event)
1. `User Viewed Settings Page`

### Navigation (1 event)
2. `User Switched Settings Tab`

### Profile Section (8 events)
3. `User Focused Profile Field`
4. `User Blurred Profile Field`
5. `User Encountered Profile Field Error`
6. `User Attempted Profile Update`
7. `User Successfully Updated Profile`
8. `User Failed to Update Profile`
9. `User Clicked Save Profile Changes Button`

### Account Section (6 events)
10. `User Viewed Email Section`
11. `User Focused Password Change Form`
12. `User Attempted Password Change`
13. `User Successfully Changed Password`
14. `User Failed to Change Password`
15. `User Clicked Update Password Button`

### Logout Section (5 events)
16. `User Clicked Log Out Button`
17. `User Viewed Log Out Confirmation Modal`
18. `User Cancelled Log Out`
19. `User Confirmed Log Out`
20. `User Successfully Logged Out`

### Session (1 event)
21. `User Left Settings Page`

**Total: 21 events** covering all user interactions on the Settings pages.

---

## 11. Next Steps

1. Review and approve this tracking plan
2. Implement `SettingsPageTracking` component
3. Add tracking to all buttons using `TrackedButton`
4. Add form field tracking (focus/blur/submit)
5. Add session-level tracking
6. Test all events in development
7. Verify events in Amplitude dashboard
8. Build initial reports and dashboards
9. Set up alerts for key metrics
10. Iterate based on insights







