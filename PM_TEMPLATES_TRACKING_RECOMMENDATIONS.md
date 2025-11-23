# Product Portfolio Pages - Comprehensive Amplitude Tracking Recommendations

## Overview

This document provides comprehensive tracking recommendations for the Product Portfolio feature to understand user behavior, onboarding state, plan usage, feature engagement, and conversion funnels.

---

## Page View Events

### 1. User Viewed Product Portfolio Page
**Event**: `User Viewed Product Portfolio Page`  
**Location**: `/dashboard/portfolio/page.tsx`  
**When**: On initial page load

**Properties to Track**:
- `Page Route`: `/dashboard/portfolio`
- `Page Name`: `Product Portfolio`
- `User Plan`: `learn` | `accelerate` | `null`
- `Has Active Subscription`: `true` | `false`
- `Days Since Sign Up`: Number of days since user account creation
- `Has Pending Template Request`: `true` | `false`
- `Template Request Status`: `pending` | `fulfilled` | `cancelled` | `null`
- `Total Portfolio Requests`: Count of all portfolio idea requests user has made
- `Total Favorited Ideas`: Count of all favorited ideas
- `Has Completed Portfolio Course`: `true` | `false` (check if user completed "launch-product-portfolio" course)
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `Traffic Source`: Categorized source (Internal, Direct, UTM, etc.)
- `UTM Parameters`: All UTM tracking parameters

**Context**: This establishes baseline user state when they land on the portfolio page. Critical for understanding:
- Which plan users are on when they discover the feature
- Whether they've engaged with portfolio features before
- Their onboarding progress (course completion)
- Template request status (conversion opportunity)

---

### 2. User Viewed Portfolio Generate Ideas Page
**Event**: `User Viewed Portfolio Generate Ideas Page`  
**Location**: `/dashboard/portfolio/generate/page.tsx`  
**When**: On initial page load

**Properties to Track**:
- `Page Route`: `/dashboard/portfolio/generate`
- `Page Name`: `Portfolio Generate Ideas`
- `User Plan`: `learn` | `accelerate` | `null`
- `Has Active Subscription`: `true` | `false`
- `Total Previous Requests`: Count of portfolio idea requests
- `Total Favorited Ideas`: Count of favorited ideas
- `View Mode`: `discover` | `request_selected` | `favorites` (which view is active)
- `Selected Request ID`: ID of selected request (if any)
- `Is First Time User`: `true` if total_previous_requests === 0
- `Has Favorites`: `true` | `false`
- `Referrer URL`: Where user came from (likely `/dashboard/portfolio`)
- `Referrer Domain`: Domain of referrer
- `Traffic Source`: Categorized source
- `UTM Parameters`: All UTM tracking parameters

**Context**: Understanding entry point into idea generation and user's historical engagement level.

---

## Click Events - Main Portfolio Page

### 3. User Clicked Start Course Link (Learning Section)
**Event**: `User Clicked Start Course Link`  
**Location**: Learning section on `/dashboard/portfolio/page.tsx`  
**Button ID**: `portfolio-page-learning-start-course-link`

**Properties to Track**:
- `Button ID`: `portfolio-page-learning-start-course-link`
- `Button Section`: `Learning Section`
- `Button Position`: `Center of Learning Card`
- `Button Text`: `Start Course →`
- `Button Type`: `Learning CTA`
- `Button Context`: `Below "Learn About Product Portfolios" description`
- `Page Section`: `Above the fold` (first section after header)
- `Link Destination`: `/dashboard/courses/launch-product-portfolio`
- `Course Slug`: `launch-product-portfolio`
- `Course Name`: `Launch Product Portfolio`
- `User Plan`: `learn` | `accelerate` | `null`
- `Has Completed Course`: `true` | `false`
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures interest in learning about portfolios before generating ideas. Can track conversion from learning → generating.

---

### 4. User Clicked Generate Ideas Link
**Event**: `User Clicked Generate Ideas Link`  
**Location**: Generate Ideas section on `/dashboard/portfolio/page.tsx`  
**Button ID**: `portfolio-page-generate-ideas-link`

**Properties to Track**:
- `Button ID`: `portfolio-page-generate-ideas-link`
- `Button Section`: `Generate Ideas Section`
- `Button Position`: `Center of Generate Ideas Card`
- `Button Text`: `Generate Ideas →`
- `Button Type`: `Primary Feature CTA`
- `Button Context`: `Below "AI Case Study Idea Generator" description`
- `Page Section`: `Above the fold` (second section after header)
- `Link Destination`: `/dashboard/portfolio/generate`
- `User Plan`: `learn` | `accelerate` | `null`
- `Total Previous Requests`: Count of previous requests (engagement level)
- `Is First Time User`: `true` if total_previous_requests === 0
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Primary conversion event - user wants to generate ideas. Track by plan type and engagement level.

---

### 5. User Clicked Request Template Button
**Event**: `User Clicked Request Template Button`  
**Location**: Template Request section on `/dashboard/portfolio/page.tsx`  
**Button ID**: `portfolio-page-template-request-button`

**Properties to Track**:
- `Button ID`: `portfolio-page-template-request-button`
- `Button Section`: `Template Request Section`
- `Button Position`: `Center of Template Request Card`
- `Button Text`: `Request Template →`
- `Button Type`: `Premium Feature CTA`
- `Button Context`: `Below "Request Product Portfolio Template" description`
- `Page Section`: `Below the fold` (third section)
- `User Plan`: `learn` | `accelerate` | `null`
- `Has Active Subscription`: `true` | `false`
- `Has Pending Request`: `true` | `false`
- `Template Request Status`: `pending` | `fulfilled` | `cancelled` | `null`
- `Will Show Upgrade Modal`: `true` if user_plan !== 'accelerate`
- `Total Portfolio Requests`: Count of portfolio idea requests (engagement indicator)
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Critical conversion event. Track:
- How many Learn plan users click (upgrade opportunity)
- How many Accelerate users click (feature usage)
- Whether they already have pending request (prevents duplicate)

---

## Click Events - Generate Ideas Page

### 6. User Clicked Discover Ideas Button (New Chat)
**Event**: `User Clicked Discover Ideas Button`  
**Location**: Left sidebar on `/dashboard/portfolio/generate/page.tsx`  
**Button ID**: `portfolio-generate-discover-ideas-button`

**Properties to Track**:
- `Button ID`: `portfolio-generate-discover-ideas-button`
- `Button Section`: `Left Sidebar Header`
- `Button Position`: `Top of Sidebar`
- `Button Text`: `Discover Ideas`
- `Button Type`: `Primary Action Button`
- `Button Context`: `Above favorites and previous requests list`
- `View Mode Before Click`: `discover` | `request_selected` | `favorites`
- `Total Previous Requests`: Count of previous requests
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: User wants to start fresh idea generation. Track frequency of new idea generation.

---

### 7. User Clicked Favorites Tab
**Event**: `User Clicked Favorites Tab`  
**Location**: Left sidebar on `/dashboard/portfolio/generate/page.tsx`  
**Button ID**: `portfolio-generate-favorites-tab`

**Properties to Track**:
- `Button ID`: `portfolio-generate-favorites-tab`
- `Button Section`: `Left Sidebar Favorites Section`
- `Button Position`: `Below Discover Ideas Button`
- `Button Text`: `Favorites`
- `Button Type`: `Navigation Tab`
- `Button Context`: `Between Discover Ideas and Requests List`
- `Favorites Count`: Number of favorited ideas (shown in badge)
- `View Mode Before Click`: `discover` | `request_selected` | `favorites`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures engagement with favorited ideas. Track how often users return to favorites.

---

### 8. User Clicked Previous Request
**Event**: `User Clicked Previous Request`  
**Location**: Left sidebar requests list on `/dashboard/portfolio/generate/page.tsx`  
**Button ID**: `portfolio-generate-request-{requestId}`

**Properties to Track**:
- `Button ID`: `portfolio-generate-request-{requestId}`
- `Button Section`: `Left Sidebar Requests List`
- `Button Position`: `In Requests List`
- `Button Text`: Request input text (truncated)
- `Button Type`: `Request History Item`
- `Button Context`: `In chronological list of previous requests`
- `Request ID`: Database ID of the request
- `Request Input Text`: Original input text (truncated to 50 chars)
- `Request Created Date`: Date request was created
- `Request Age Days`: Days since request was created
- `Ideas Count`: Number of ideas in this request
- `Request Index`: Position in list (1st, 2nd, 3rd, etc.)
- `View Mode Before Click`: `discover` | `request_selected` | `favorites`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures return engagement with previous requests. Track which requests users revisit.

---

### 9. User Clicked Delete Request Button
**Event**: `User Clicked Delete Request Button`  
**Location**: Delete button on request item in sidebar  
**Button ID**: `portfolio-generate-delete-request-{requestId}`

**Properties to Track**:
- `Button ID`: `portfolio-generate-delete-request-{requestId}`
- `Button Section`: `Left Sidebar Requests List`
- `Button Position`: `Right side of request item (on hover)`
- `Button Text`: (Icon only - trash icon)
- `Button Type`: `Delete Action`
- `Button Context`: `Hover state on request item`
- `Request ID`: Database ID of the request
- `Request Input Text`: Original input text (truncated)
- `Request Age Days`: Days since request was created
- `Ideas Count`: Number of ideas in this request
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures request cleanup behavior. Track which requests users delete (may indicate low quality).

---

### 10. User Clicked Back to Portfolio Link
**Event**: `User Clicked Back to Portfolio Link`  
**Location**: Top of left sidebar on `/dashboard/portfolio/generate/page.tsx`  
**Link ID**: `portfolio-generate-back-to-portfolio-link`

**Properties to Track**:
- `Link ID`: `portfolio-generate-back-to-portfolio-link`
- `Link Section`: `Left Sidebar Header`
- `Link Position`: `Top of Sidebar`
- `Link Text`: `Back to Portfolio`
- `Link Type`: `Navigation Link`
- `Link Context`: `Above Discover Ideas button`
- `Link Destination`: `/dashboard/portfolio`
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Total Requests`: Count of requests
- `Total Favorites`: Count of favorites
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures navigation back to main portfolio page.

---

## Idea Generation Events

### 11. User Submitted Generate Ideas Form
**Event**: `User Submitted Generate Ideas Form`  
**Location**: Generate Ideas input form on `/dashboard/portfolio/generate/page.tsx`  
**Button ID**: `portfolio-generate-submit-button`

**Properties to Track**:
- `Button ID`: `portfolio-generate-submit-button`
- `Button Section`: `Main Content Area`
- `Button Position`: `Below input field`
- `Button Text`: `Generate`
- `Button Type`: `Primary Submit Button`
- `Button Context`: `Below "Enter an industry or company name" input`
- `Input Text`: The input text (truncated to 100 chars for privacy)
- `Input Text Length`: Character count of input
- `Input Text Word Count`: Word count of input
- `Is Regeneration`: `true` if selected_request_id exists (generating more for existing request)
- `Selected Request ID`: ID of existing request (if regenerating)
- `Previous Ideas Count`: Number of ideas in existing request (if regenerating)
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Total Previous Requests`: Count of all previous requests
- `Is First Time User`: `true` if total_previous_requests === 0
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Primary action event. Track:
- First-time vs returning users
- Regeneration behavior (users wanting more ideas)
- Input patterns (industry vs company names)

---

### 12. User Generated Portfolio Ideas Successfully
**Event**: `User Generated Portfolio Ideas Successfully`  
**Location**: After successful API response in `/dashboard/portfolio/generate/page.tsx`  
**When**: After ideas are generated and saved to database

**Properties to Track**:
- `Request ID`: Database ID of the request
- `Input Text`: The input text (truncated to 100 chars)
- `Input Text Length`: Character count
- `Is Regeneration`: `true` if this was generating more for existing request
- `Previous Request ID`: ID of existing request (if regenerating)
- `Ideas Generated Count`: Always 3 (fixed)
- `Total Ideas In Request`: Total ideas after generation (if regenerating, will be > 3)
- `Generation Time Seconds`: Time taken to generate (from API call start to completion)
- `Is First Time User`: `true` if this was user's first generation
- `Total Requests After`: Total requests user has now
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Success metric. Track:
- Generation success rate
- Time to generate (performance)
- Regeneration patterns
- First-time user conversion

---

### 13. User Generated Portfolio Ideas Failed
**Event**: `User Generated Portfolio Ideas Failed`  
**Location**: After failed API response in `/dashboard/portfolio/generate/page.tsx`  
**When**: When API returns error

**Properties to Track**:
- `Input Text`: The input text (truncated to 100 chars)
- `Input Text Length`: Character count
- `Error Message`: Error message from API (sanitized)
- `Error Type`: Categorized error type (`api_error`, `validation_error`, `timeout`, etc.)
- `Is Regeneration`: `true` if this was generating more for existing request
- `Previous Request ID`: ID of existing request (if regenerating)
- `User Plan`: `learn` | `accelerate` | `null`
- `Total Previous Requests`: Count of previous requests
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Error tracking. Monitor failure rates and error types.

---

## Idea Interaction Events

### 14. User Favorited Portfolio Idea
**Event**: `User Favorited Portfolio Idea`  
**Location**: Star button on idea card in `/dashboard/portfolio/generate/page.tsx`  
**Button ID**: `portfolio-idea-favorite-{ideaId}`

**Properties to Track**:
- `Button ID`: `portfolio-idea-favorite-{ideaId}`
- `Button Section`: `Idea Card`
- `Button Position`: `Top right of idea card`
- `Button Text`: (Icon only - star icon)
- `Button Type`: `Favorite Action`
- `Button Context`: `Top right corner of idea card`
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request (1, 2, 3, etc.)
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `Request Input Text`: Original input text (truncated)
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Total Favorites Before`: Count of favorites before this action
- `Total Favorites After`: Count of favorites after this action
- `Is First Favorite`: `true` if this is user's first favorite ever
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Engagement metric. Track:
- Which ideas users favorite (quality indicator)
- Favorite rate by company/industry
- First favorite behavior (conversion indicator)

---

### 15. User Unfavorited Portfolio Idea
**Event**: `User Unfavorited Portfolio Idea`  
**Location**: Star button on favorited idea card  
**Button ID**: `portfolio-idea-unfavorite-{ideaId}`

**Properties to Track**:
- `Button ID`: `portfolio-idea-unfavorite-{ideaId}`
- `Button Section`: `Idea Card` | `Favorites View`
- `Button Position`: `Top right of idea card`
- `Button Text`: (Icon only - filled star icon)
- `Button Type`: `Unfavorite Action`
- `Button Context`: `Top right corner of idea card`
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Total Favorites Before`: Count of favorites before this action
- `Total Favorites After`: Count of favorites after this action
- `Time Since Favorited`: Days since idea was favorited
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures idea quality reassessment. Track unfavorite patterns.

---

### 16. User Rated Idea Thumbs Up
**Event**: `User Rated Idea Thumbs Up`  
**Location**: Thumbs up button on idea card  
**Button ID**: `portfolio-idea-thumbs-up-{ideaId}`

**Properties to Track**:
- `Button ID`: `portfolio-idea-thumbs-up-{ideaId}`
- `Button Section`: `Idea Card Rating Section`
- `Button Position`: `Bottom of idea card, rating section`
- `Button Text`: (Icon only - thumbs up icon)
- `Button Type`: `Rating Action`
- `Button Context`: `In "Rate this idea:" section`
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `Previous Rating`: `up` | `down` | `null` (if changing rating)
- `Is Rating Change`: `true` if previous_rating exists
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Is Favorited`: `true` | `false`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Quality feedback. Track positive ratings to identify high-quality ideas.

---

### 17. User Rated Idea Thumbs Down
**Event**: `User Rated Idea Thumbs Down`  
**Location**: Thumbs down button on idea card  
**Button ID**: `portfolio-idea-thumbs-down-{ideaId}`

**Properties to Track**:
- `Button ID`: `portfolio-idea-thumbs-down-{ideaId}`
- `Button Section`: `Idea Card Rating Section`
- `Button Position`: `Bottom of idea card, rating section`
- `Button Text`: (Icon only - thumbs down icon)
- `Button Type`: `Rating Action`
- `Button Context`: `In "Rate this idea:" section`
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `Previous Rating`: `up` | `down` | `null` (if changing rating)
- `Is Rating Change`: `true` if previous_rating exists
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Is Favorited`: `true` | `false`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Quality feedback. Track negative ratings to identify low-quality ideas. Note: This opens feedback input.

---

### 18. User Submitted Idea Feedback
**Event**: `User Submitted Idea Feedback`  
**Location**: Submit feedback button after thumbs down  
**Button ID**: `portfolio-idea-submit-feedback-{ideaId}`

**Properties to Track**:
- `Button ID`: `portfolio-idea-submit-feedback-{ideaId}`
- `Button Section`: `Idea Card Feedback Section`
- `Button Position`: `Below feedback textarea`
- `Button Text`: `Submit Feedback` | `Update Feedback`
- `Button Type`: `Feedback Submit Button`
- `Button Context`: `In feedback input section after thumbs down`
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `Feedback Text Length`: Character count of feedback (not the actual text for privacy)
- `Feedback Word Count`: Word count of feedback
- `Is Update`: `true` if updating existing feedback
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Is Favorited`: `true` | `false`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Quality improvement data. Track feedback submission rate and length (engagement indicator).

---

### 19. User Removed Idea Rating
**Event**: `User Removed Idea Rating`  
**Location**: Clicking same rating button again (thumbs up/down)  
**When**: When user clicks a rating button that's already active

**Properties to Track**:
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `Removed Rating`: `up` | `down` (which rating was removed)
- `Had Feedback`: `true` | `false` (if thumbs down had feedback)
- `Time Since Rated`: Days since rating was created
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Is Favorited`: `true` | `false`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Measures rating reconsideration. Track how often users change their minds.

---

### 20. User Clicked Generate More Ideas Button
**Event**: `User Clicked Generate More Ideas Button`  
**Location**: "Generate More Ideas" button below ideas list  
**Button ID**: `portfolio-generate-more-ideas-button`

**Properties to Track**:
- `Button ID`: `portfolio-generate-more-ideas-button`
- `Button Section`: `Main Content Area`
- `Button Position`: `Below ideas list, centered`
- `Button Text`: `Generate More Ideas`
- `Button Type`: `Secondary Action Button`
- `Button Context`: `After viewing generated ideas`
- `Request ID`: Database ID of current request
- `Request Input Text`: Original input text (truncated)
- `Current Ideas Count`: Number of ideas in request before generating more
- `Request Age Days`: Days since request was created
- `View Mode`: `request_selected` (always, since button only shows for selected request)
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures demand for more ideas. Track regeneration patterns and satisfaction with initial ideas.

---

## Template Request Events

### 21. User Clicked Request Template Button (Template Request Component)
**Event**: `User Clicked Request Template Button`  
**Location**: Template Request component on `/dashboard/portfolio/page.tsx`  
**Button ID**: `portfolio-template-request-submit-button`

**Properties to Track**:
- `Button ID`: `portfolio-template-request-submit-button`
- `Button Section`: `Template Request Section`
- `Button Position`: `Center of Template Request Card`
- `Button Text`: `Request Template →`
- `Button Type`: `Premium Feature CTA`
- `Button Context`: `Below "Request Product Portfolio Template" description`
- `Page Section`: `Below the fold`
- `User Plan`: `learn` | `accelerate` | `null`
- `Has Active Subscription`: `true` | `false`
- `Has Pending Request`: `true` | `false`
- `Template Request Status`: `pending` | `fulfilled` | `cancelled` | `null`
- `Will Show Upgrade Modal`: `true` if user_plan !== 'accelerate'
- `Total Portfolio Requests`: Count of portfolio idea requests
- `Total Favorited Ideas`: Count of favorited ideas
- `Has Completed Portfolio Course`: `true` | `false`
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Same as event #5 but from the component itself. Track both for redundancy.

---

### 22. User Submitted Template Request Successfully
**Event**: `User Submitted Template Request Successfully`  
**Location**: After successful API response in PortfolioTemplateRequest component  
**When**: After template request is created in database

**Properties to Track**:
- `Request ID`: Database ID of the template request
- `User Plan`: `accelerate` (always, since only Accelerate users can submit)
- `Has Active Subscription`: `true`
- `Total Portfolio Requests`: Count of portfolio idea requests (engagement indicator)
- `Total Favorited Ideas`: Count of favorited ideas
- `Has Completed Portfolio Course`: `true` | `false`
- `Days Since Sign Up`: Number of days since user account creation
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Conversion event. Track successful template requests to measure feature usage.

---

### 23. User Clicked Template Request Upgrade Modal View Plans
**Event**: `User Clicked Template Request Upgrade Modal View Plans`  
**Location**: "View Plans" button in PortfolioTemplateRequestModal  
**Button ID**: `portfolio-template-upgrade-modal-view-plans-button`

**Properties to Track**:
- `Button ID`: `portfolio-template-upgrade-modal-view-plans-button`
- `Button Section`: `Upgrade Modal`
- `Button Position`: `Primary CTA in modal`
- `Button Text`: `View Plans` | `Manage Subscription`
- `Button Type`: `Primary Modal CTA`
- `Button Context`: `In Accelerate Plan Required modal`
- `Has Subscription`: `true` | `false` (whether user has any subscription)
- `User Plan`: `learn` | `null` (always, since Accelerate users don't see modal)
- `Link Destination`: `/dashboard/billing/plans` | `/dashboard/billing`
- `Total Portfolio Requests`: Count of portfolio idea requests
- `Total Favorited Ideas`: Count of favorited ideas
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Critical conversion funnel event. Track upgrade intent from template request feature.

---

### 24. User Clicked Template Request Upgrade Modal Cancel
**Event**: `User Clicked Template Request Upgrade Modal Cancel`  
**Location**: "Cancel" button in PortfolioTemplateRequestModal  
**Button ID**: `portfolio-template-upgrade-modal-cancel-button`

**Properties to Track**:
- `Button ID`: `portfolio-template-upgrade-modal-cancel-button`
- `Button Section`: `Upgrade Modal`
- `Button Position`: `Secondary button in modal`
- `Button Text`: `Cancel`
- `Button Type`: `Secondary Modal Button`
- `Button Context`: `In Accelerate Plan Required modal`
- `Has Subscription`: `true` | `false`
- `User Plan`: `learn` | `null`
- `Total Portfolio Requests`: Count of portfolio idea requests
- `Total Favorited Ideas`: Count of favorited ideas
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters
- `Click Position X/Y`: Exact pixel coordinates
- `Click Position Horizontal/Vertical`: Left/Center/Right, Top/Middle/Bottom
- `Viewport Width/Height`: Screen size

**Context**: Measures abandonment in upgrade funnel. Track cancel rate.

---

## Input/Interaction Events

### 25. User Typed in Generate Ideas Input
**Event**: `User Typed in Generate Ideas Input`  
**Location**: Input field on `/dashboard/portfolio/generate/page.tsx`  
**When**: On input change (debounced to every 500ms or on blur)

**Properties to Track**:
- `Input Field ID`: `portfolio-generate-ideas-input`
- `Input Section`: `Main Content Area`
- `Input Position`: `Center of page (when in discover mode)`
- `Input Placeholder`: `Enter an industry or company name...`
- `Input Text Length`: Current character count
- `Input Text Word Count`: Current word count
- `Is Empty`: `true` if input is empty
- `View Mode`: `discover` | `request_selected` | `favorites`
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Measures input engagement. Track typing patterns and input length.

**Note**: This should be debounced to avoid excessive events. Only track on blur or after 500ms of no typing.

---

## Scroll/View Events

### 26. User Viewed Idea Card
**Event**: `User Viewed Idea Card`  
**Location**: When idea card comes into viewport  
**When**: On intersection observer trigger (when card is 50% visible)

**Properties to Track**:
- `Idea ID`: Database ID of the idea
- `Idea Number`: Idea number within request (1, 2, 3)
- `Company Name`: Company name from idea
- `Request ID`: Database ID of parent request
- `Request Input Text`: Original input text (truncated)
- `View Mode`: `discover` | `request_selected` | `favorites`
- `Is Favorited`: `true` | `false`
- `Has Rating`: `true` | `false`
- `Rating Type`: `up` | `down` | `null`
- `Card Position`: `1` | `2` | `3` (position in list)
- `Scroll Depth`: Percentage of page scrolled when card viewed
- `Time On Page Before View`: Seconds user was on page before viewing this card
- `User Plan`: `learn` | `accelerate` | `null`
- `Page Route`: `/dashboard/portfolio/generate`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Measures idea engagement. Track which ideas users actually view (not just generate).

**Note**: Use Intersection Observer API to track when card is 50% visible in viewport.

---

## Error Events

### 27. Template Request Error
**Event**: `Template Request Error`  
**Location**: PortfolioTemplateRequest component  
**When**: When API returns error

**Properties to Track**:
- `Error Message`: Error message from API (sanitized)
- `Error Type`: Categorized error type (`unauthorized`, `already_pending`, `plan_required`, `server_error`, etc.)
- `User Plan`: `learn` | `accelerate` | `null`
- `Has Active Subscription`: `true` | `false`
- `Has Pending Request`: `true` | `false`
- `Total Portfolio Requests`: Count of portfolio idea requests
- `Page Route`: `/dashboard/portfolio`
- `Referrer URL`: Where user came from
- `Referrer Domain`: Domain of referrer
- `UTM Parameters`: All UTM tracking parameters

**Context**: Error tracking. Monitor failure rates and error types.

---

## User State Properties (Always Include)

For ALL events, include these user state properties when available:

- `User Plan`: `learn` | `accelerate` | `null`
- `Has Active Subscription`: `true` | `false`
- `Days Since Sign Up`: Number of days since user account creation
- `Total Portfolio Requests`: Count of all portfolio idea requests
- `Total Favorited Ideas`: Count of all favorited ideas
- `Has Completed Portfolio Course`: `true` | `false`
- `Has Pending Template Request`: `true` | `false`
- `Template Request Status`: `pending` | `fulfilled` | `cancelled` | `null`

---

## Key Funnels to Track

### Funnel 1: Portfolio Discovery → Idea Generation
1. User Viewed Product Portfolio Page
2. User Clicked Generate Ideas Link
3. User Viewed Portfolio Generate Ideas Page
4. User Submitted Generate Ideas Form
5. User Generated Portfolio Ideas Successfully

**Metrics**:
- Conversion rate at each step
- Time between steps
- Drop-off points
- Plan type distribution at each step

### Funnel 2: Idea Generation → Engagement
1. User Generated Portfolio Ideas Successfully
2. User Viewed Idea Card (for each idea)
3. User Favorited Portfolio Idea
4. User Rated Idea (thumbs up/down)

**Metrics**:
- View rate (how many ideas viewed vs generated)
- Favorite rate (how many ideas favorited)
- Rating rate (how many ideas rated)
- Quality indicators (favorite + thumbs up rate)

### Funnel 3: Template Request Conversion
1. User Viewed Product Portfolio Page
2. User Clicked Request Template Button
3. User Clicked Template Request Upgrade Modal View Plans (if Learn plan)
4. User Submitted Template Request Successfully (if Accelerate plan)

**Metrics**:
- Click rate on template request button
- Upgrade modal view rate (Learn plan users)
- Upgrade conversion rate (Learn → Accelerate)
- Template request completion rate (Accelerate users)

### Funnel 4: Learning → Generation
1. User Viewed Product Portfolio Page
2. User Clicked Start Course Link
3. User Completed Portfolio Course (tracked separately)
4. User Clicked Generate Ideas Link
5. User Generated Portfolio Ideas Successfully

**Metrics**:
- Course click rate
- Course completion rate
- Post-course generation rate
- Time from course completion to first generation

---

## Key Reports to Build

### 1. Portfolio Feature Adoption
- **Metric**: % of users who generate at least one idea
- **Segments**: By plan type, days since sign up, course completion
- **Time Range**: Last 30 days, Last 90 days

### 2. Idea Generation Frequency
- **Metric**: Average ideas generated per user
- **Segments**: By plan type, user cohort
- **Time Range**: Weekly, Monthly

### 3. Idea Quality Metrics
- **Metric**: Favorite rate, Thumbs up rate, Thumbs down rate
- **Segments**: By company/industry, by request number
- **Time Range**: All time, Last 30 days

### 4. Template Request Conversion
- **Metric**: Template request click rate, Upgrade conversion rate
- **Segments**: By plan type, engagement level
- **Time Range**: Last 30 days, Last 90 days

### 5. Regeneration Behavior
- **Metric**: % of users who generate more ideas for same request
- **Segments**: By plan type, by request number
- **Time Range**: All time

### 6. Favorites Engagement
- **Metric**: Average favorites per user, Return rate to favorites
- **Segments**: By plan type, by generation count
- **Time Range**: Last 30 days, All time

### 7. Course → Generation Conversion
- **Metric**: % of course completers who generate ideas
- **Segments**: By time since course completion
- **Time Range**: All time

---

## Implementation Notes

1. **User State Context**: Fetch user state (plan, subscription, counts) on page load and include in all events
2. **Debouncing**: Debounce input tracking events to avoid excessive events
3. **Intersection Observer**: Use Intersection Observer for view tracking (idea cards)
4. **Error Handling**: Always track errors with context (user state, action attempted)
5. **Non-Blocking**: All tracking must be non-blocking (use setTimeout, fire-and-forget)
6. **Privacy**: Never track full input text or feedback text - only lengths and word counts
7. **Single Sending**: Use client library (`@/lib/amplitude/client`) to ensure single-sending strategy

---

## Event Naming Convention

All events follow the pattern: `User [Action] [Object]`

Examples:
- `User Viewed Product Portfolio Page`
- `User Clicked Generate Ideas Link`
- `User Favorited Portfolio Idea`
- `User Generated Portfolio Ideas Successfully`

---

## Button/Link ID Naming Convention

Format: `[page]-[section]-[element-type]-[descriptor]`

Examples:
- `portfolio-page-learning-start-course-link`
- `portfolio-page-generate-ideas-link`
- `portfolio-generate-discover-ideas-button`
- `portfolio-idea-favorite-{ideaId}`

---

## Next Steps

1. Implement PageTracking component on both portfolio pages
2. Replace all buttons/links with TrackedButton/TrackedLink components
3. Add custom tracking for form submissions, API responses, and interactions
4. Add Intersection Observer for idea card view tracking
5. Add user state context fetching on page load
6. Test all events in Amplitude dashboard
7. Build reports and dashboards based on key metrics above
