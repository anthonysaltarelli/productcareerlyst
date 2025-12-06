# Company Research: 12 Vectors UI Organization Plan

## Research Vectors

1. **Mission** - Company mission statement and purpose
2. **Values** - Core values and culture principles
3. **Origin Story** - Company founding story and history
4. **Product** - Product portfolio and offerings
5. **User Types and Attributes** - Target users and customer segments
6. **Competition** - Competitive landscape and positioning
7. **Risks** - Business risks and challenges
8. **Recent Launches** - Recent product launches and updates
9. **Strategy** - Strategic direction and priorities
10. **Funding and Investment Overview** - Funding history and investors
11. **Partnerships** - Key partnerships and alliances
12. **Customer Feedback** - Customer reviews and sentiment
13. **Business Model** - Revenue model and monetization

## Database Schema Considerations

### Option A: Single Record with JSONB Structure
```sql
company_research {
  company_id: UUID,
  research_data: JSONB {
    mission: { content, sources, generated_at, expires_at },
    values: { content, sources, generated_at, expires_at },
    origin_story: { ... },
    ...
  },
  generated_at: TIMESTAMP,
  expires_at: TIMESTAMP
}
```

**Pros**: 
- Single query to get all research
- Atomic updates
- Simpler cache management

**Cons**:
- Large JSONB field
- Harder to query individual vectors
- All vectors expire together

### Option B: Separate Records per Vector (Recommended)
```sql
company_research {
  id: UUID,
  company_id: UUID,
  research_type: ENUM (mission, values, origin_story, ...),
  perplexity_response: JSONB,
  generated_at: TIMESTAMP,
  expires_at: TIMESTAMP,
  UNIQUE(company_id, research_type)
}
```

**Pros**:
- Independent cache expiration per vector
- Can fetch only needed vectors
- Better query performance
- Can show loading states per vector
- More flexible

**Cons**:
- More records (12 per company)
- Need to query multiple records

**Recommendation**: **Option B** - More flexible and scalable

---

## UI Organization Options

### Option 1: Two-Level Navigation (Recommended)
**Structure**: Categories → Vectors

```
┌─────────────────────────────────────────────────┐
│ Company Research: Airbnb                        │
├─────────────────────────────────────────────────┤
│ [Company Info] [Market] [Operations] [Finance]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Company Info (Selected)                        │
│ ┌───────────────────────────────────────────┐ │
│ │ ✓ Mission          [View] [Refresh]        │ │
│ │ ✓ Values           [View] [Refresh]         │ │
│ │ ✓ Origin Story     [View] [Refresh]        │ │
│ │ ⏳ Product         [Loading...]            │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ Market                                          │
│ ┌───────────────────────────────────────────┐ │
│ │ ✓ Competition      [View] [Refresh]       │ │
│ │ ✓ User Types       [View] [Refresh]       │ │
│ │ ✓ Customer Feedback [View] [Refresh]      │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ Operations                                      │
│ ┌───────────────────────────────────────────┐ │
│ │ ✓ Recent Launches  [View] [Refresh]      │ │
│ │ ✓ Strategy         [View] [Refresh]       │ │
│ │ ✓ Partnerships     [View] [Refresh]       │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ Finance                                         │
│ ┌───────────────────────────────────────────┐ │
│ │ ✓ Funding          [View] [Refresh]       │ │
│ │ ✓ Business Model   [View] [Refresh]       │ │
│ │ ✓ Risks            [View] [Refresh]       │ │
│ └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Categories**:
- **Company Info**: Mission, Values, Origin Story, Product
- **Market**: Competition, User Types, Customer Feedback
- **Operations**: Recent Launches, Strategy, Partnerships
- **Finance**: Funding, Business Model, Risks

**Pros**:
- Logical grouping
- Not overwhelming
- Easy to scan
- Can show progress per category

**Cons**:
- Need to define categories
- Some vectors might fit multiple categories

---

### Option 2: Sidebar Navigation
**Structure**: Left sidebar with vector list, main content area

```
┌──────────────┬──────────────────────────────────┐
│              │ Company Research: Airbnb          │
│ Mission      │                                  │
│ Values       │ [Selected Vector Content]         │
│ Origin Story │                                  │
│ Product      │ [Markdown content rendered]      │
│ User Types   │                                  │
│ Competition  │                                  │
│ Risks        │                                  │
│ Recent       │                                  │
│ Launches     │                                  │
│ Strategy     │                                  │
│ Funding      │                                  │
│ Partnerships │                                  │
│ Customer     │                                  │
│ Feedback     │                                  │
│ Business     │                                  │
│ Model        │                                  │
└──────────────┴──────────────────────────────────┘
```

**Pros**:
- Always visible navigation
- Clean separation
- Good for desktop

**Cons**:
- Takes up horizontal space
- Poor mobile experience
- 12 items in sidebar might be long

---

### Option 3: Grid of Cards
**Structure**: All vectors as cards in a grid

```
┌─────────────────────────────────────────────────┐
│ Company Research: Airbnb                        │
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Mission  │ │ Values   │ │ Origin   │        │
│ │ ✓ Ready  │ │ ✓ Ready  │ │ ✓ Ready  │        │
│ │ [View]   │ │ [View]   │ │ [View]   │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Product  │ │ User     │ │ Compete   │        │
│ │ ⏳ Load  │ │ ✓ Ready  │ │ ✓ Ready  │        │
│ │          │ │ [View]   │ │ [View]   │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│ ... (more cards)                                │
└─────────────────────────────────────────────────┘
```

**Pros**:
- Visual overview of all vectors
- Easy to see what's loaded
- Modern card-based UI

**Cons**:
- Takes up vertical space
- Need to click to view content
- Might feel cluttered with 12 cards

---

### Option 4: Accordion with Search/Filter
**Structure**: Expandable accordion with search

```
┌─────────────────────────────────────────────────┐
│ Company Research: Airbnb                        │
│ [Search vectors...] [Filter: All]               │
├─────────────────────────────────────────────────┤
│ ▼ Mission (2 days old)                          │
│   [Content displayed when expanded]              │
│                                                 │
│ ▶ Values (2 days old)                           │
│                                                 │
│ ▶ Origin Story (2 days old)                     │
│                                                 │
│ ▼ Product (Loading...)                          │
│   [Loading spinner]                             │
│                                                 │
│ ... (all 12 vectors)                            │
└─────────────────────────────────────────────────┘
```

**Pros**:
- All vectors visible
- Can expand multiple
- Search/filter capability
- Compact

**Cons**:
- Long scroll if all expanded
- Need to expand to see content

---

### Option 5: Tabbed Interface (Not Recommended)
**Structure**: One tab per vector

**Why Not**: 12 tabs is too many, poor UX

---

## Recommended Approach: **Option 1 (Two-Level Navigation)**

### Implementation Details

#### 1. Category Tabs (Top Level)
```
[Company Info] [Market] [Operations] [Finance]
```

#### 2. Vector Cards (Second Level)
Each category shows cards for its vectors:
- Status indicator (✓ Ready, ⏳ Loading, ⚠️ Stale, ❌ Error)
- Last updated timestamp
- "View" button to expand content
- "Refresh" button to force update

#### 3. Content Display (Modal or Expandable)
When "View" is clicked:
- Show content in modal or expandable section
- Display markdown content
- Show sources with rich metadata
- Show citations

#### 4. Loading States
- Per-vector loading indicators
- Can load multiple vectors simultaneously
- Show progress for batch operations

#### 5. Cache Management
- Show "Last updated: X days ago" per vector
- "Refresh" button if > 7 days old
- "Refresh All" button for category
- Visual indicator for stale data (yellow) vs fresh (green)

---

## Component Structure

```
CompanyResearchPage
├── CompanyResearchHeader
│   ├── Company name
│   ├── Last full refresh date
│   └── "Refresh All" button
│
├── CategoryTabs
│   ├── Company Info tab
│   ├── Market tab
│   ├── Operations tab
│   └── Finance tab
│
├── VectorGrid (per category)
│   └── VectorCard (x4 per category)
│       ├── Status indicator
│       ├── Last updated
│       ├── "View" button
│       └── "Refresh" button
│
├── ResearchContentModal (or Expandable)
│   ├── ResearchContentDisplay
│   │   ├── Markdown content
│   │   └── Accordion sections
│   └── SourcesSection
│       └── SourceCard (x12)
│
└── LoadingStates
    ├── Per-vector loading
    └── Batch loading progress
```

---

## User Flow

1. **User navigates to Research tab** on job detail page
2. **See category tabs** with vector cards
3. **Click "View" on a vector** → See content in modal/expandable
4. **Content shows**:
   - Formatted markdown
   - Expandable sections (if parsed)
   - Sources with metadata
   - Citations
5. **If vector is stale (>7 days)**:
   - Show warning indicator
   - "Refresh" button available
   - Auto-refresh on view (optional)
6. **User can refresh individual vectors** or entire category

---

## Cost Optimization Strategy

1. **Lazy Loading**: Only fetch vectors when viewed
2. **7-Day Cache**: Don't refresh if < 7 days old
3. **Batch Refresh**: Allow refreshing multiple vectors at once
4. **Smart Defaults**: Pre-load most important vectors (Mission, Values, Product)
5. **User Control**: Let users choose which vectors to load

---

## Mobile Considerations

- **Category tabs**: Horizontal scroll on mobile
- **Vector cards**: Stack vertically, 1 per row
- **Content modal**: Full screen on mobile
- **Sources**: Collapsible list on mobile

---

## Next Steps

1. **Update database schema** to support per-vector records
2. **Create category definitions** and vector mappings
3. **Build component structure** (CategoryTabs, VectorCard, ResearchContent)
4. **Implement API endpoints** for fetching/refreshing vectors
5. **Add loading states** and error handling
6. **Test with real Perplexity responses**

