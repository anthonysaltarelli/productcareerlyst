# Company Research Display Options

Based on the Perplexity API response structure, here are the display options for company research:

## Response Structure Analysis

From the test response, we have:
- **Content**: Well-formatted markdown text (690 tokens, ~690 words)
- **Search Results**: 12 sources with title, URL, date, snippet
- **Citations**: Array of citation URLs (13 URLs)
- **Usage Info**: Token counts and cost (for admin/debugging)

## Display Options

### Option 1: Simple Markdown Display (Minimal)
**Best for**: Quick implementation, direct content display

**Layout**:
```
┌─────────────────────────────────────┐
│ Company Research: Airbnb           │
├─────────────────────────────────────┤
│ [Markdown content rendered]           │
│                                     │
│ Sources:                           │
│ • Source 1 (link)                  │
│ • Source 2 (link)                  │
└─────────────────────────────────────┘
```

**Pros**:
- Fastest to implement
- Content is already well-formatted
- Minimal UI complexity

**Cons**:
- No rich source metadata display
- Citations shown as simple list
- Less engaging visually

**Implementation**:
- Use `react-markdown` or similar library
- Simple card container
- Basic source list at bottom

---

### Option 2: Card-Based Layout with Expandable Sections
**Best for**: Better UX, organized information

**Layout**:
```
┌─────────────────────────────────────┐
│ Company Research: Airbnb            │
│ Last updated: 2 days ago            │
├─────────────────────────────────────┤
│                                     │
│ [Main Content Card]                 │
│ ┌───────────────────────────────┐   │
│ │ Purpose and Vision            │   │
│ │ [Expandable section]          │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Impact on Customers           │   │
│ │ [Expandable section]          │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Sources & Citations            │   │
│ │ [12 sources with metadata]     │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Pros**:
- Better organization
- Users can focus on specific sections
- Matches existing UI patterns (ResumeAnalysisContent)
- Sources get proper display

**Cons**:
- More complex implementation
- Need to parse markdown sections
- More state management

**Implementation**:
- Parse markdown headings to create sections
- Use expandable cards (like ResumeAnalysisContent)
- Rich source cards with metadata

---

### Option 3: Tabbed Interface
**Best for**: Multiple research types, organized by category

**Layout**:
```
┌─────────────────────────────────────┐
│ Company Research: Airbnb            │
├─────────────────────────────────────┤
│ [Overview] [Sources] [Citations]    │
├─────────────────────────────────────┤
│                                     │
│ [Tab Content Area]                  │
│                                     │
│ Overview: Full markdown content     │
│ Sources: Rich source cards          │
│ Citations: Citation list             │
│                                     │
└─────────────────────────────────────┘
```

**Pros**:
- Clean separation of content types
- Easy to add more tabs (Mission, Values, Culture, etc.)
- Matches job detail page pattern
- Sources get dedicated space

**Cons**:
- More clicks to see all info
- Tabs might be overkill for single research

**Implementation**:
- Similar to job detail page tabs
- Separate components for each tab
- Rich source display component

---

### Option 4: Sidebar Layout
**Best for**: Desktop-focused, content + sources simultaneously

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Company Research: Airbnb                    │
├──────────────────────┬──────────────────────┤
│                      │                      │
│ Main Content         │ Sources Sidebar      │
│ (70% width)          │ (30% width)          │
│                      │                      │
│ [Markdown content]  │ ┌──────────────────┐ │
│                     │ │ Source 1         │ │
│                     │ │ Title + Date     │ │
│                     │ │ [Link]           │ │
│                     │ └──────────────────┘ │
│                     │ ┌──────────────────┐ │
│                     │ │ Source 2         │ │
│                     │ └──────────────────┘ │
│                     │                      │
└──────────────────────┴──────────────────────┘
```

**Pros**:
- Content and sources visible together
- Professional layout
- Good for desktop

**Cons**:
- Poor mobile experience
- More complex responsive design
- Might feel cramped

**Implementation**:
- Two-column layout (responsive)
- Sticky sidebar on desktop
- Stack on mobile

---

### Option 5: Accordion Style (Recommended)
**Best for**: Balance of simplicity and organization

**Layout**:
```
┌─────────────────────────────────────┐
│ Company Research: Airbnb           │
│ Generated: 2 days ago              │
├─────────────────────────────────────┤
│ ▼ Overview                          │
│   [Full markdown content]           │
│                                     │
│ ▶ Key Quotes                        │
│                                     │
│ ▶ Strategic Pillars                     │
│                                     │
│ ▼ Sources & Citations               │
│   ┌───────────────────────────────┐  │
│   │ Source Card 1                │  │
│   │ Title, Date, Snippet         │  │
│   │ [View Source]                │  │
│   └───────────────────────────────┘  │
│   ┌───────────────────────────────┐  │
│   │ Source Card 2                │  │
│   └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Pros**:
- Clean, organized
- Easy to scan
- Expandable sections
- Sources get rich display
- Matches existing patterns

**Cons**:
- Need to parse markdown for sections
- Some state management

**Implementation**:
- Parse markdown headings (H2, H3) into accordion items
- Rich source cards
- Expandable/collapsible sections

---

## Recommendation: **Option 5 (Accordion Style)**

### Why?
1. **Matches existing patterns**: Similar to ResumeAnalysisContent expandable sections
2. **Good UX**: Users can focus on what they need
3. **Rich source display**: Sources get proper cards with metadata
4. **Scalable**: Easy to add more research types later
5. **Mobile-friendly**: Works well on all screen sizes

### Implementation Plan

1. **Parse Markdown Sections**:
   - Extract H2/H3 headings as section titles
   - Group content under each heading
   - Create accordion items

2. **Source Cards Component**:
   - Display title, date, snippet
   - Clickable links
   - Visual cards with hover states

3. **Research Type Support**:
   - Support different research types (mission, values, culture, etc.)
   - Each type can have different sections
   - Cache indicator (7-day freshness)

4. **Loading States**:
   - Show loading when fetching new research
   - Show "Refreshing..." when updating stale research
   - Display cache age

### Component Structure

```
CompanyResearchDisplay
├── ResearchHeader (company name, last updated, refresh button)
├── ResearchContent
│   ├── AccordionSection (for each markdown section)
│   └── SourcesSection
│       └── SourceCard (for each source)
└── LoadingState / ErrorState
```

---

## Alternative: Hybrid Approach

Combine **Option 1** (simple markdown) with **Option 5** (accordion sources):

- Main content: Direct markdown rendering (simple)
- Sources: Accordion/collapsible section with rich cards
- Citations: Simple list or expandable

This gives us:
- Fast content display
- Rich source metadata
- Minimal complexity

---

## Next Steps

1. **Choose display option** (recommend Option 5 or Hybrid)
2. **Install markdown library** (if needed): `react-markdown` or `marked`
3. **Create component structure**
4. **Implement source cards**
5. **Add accordion functionality**
6. **Test with real Perplexity responses**

