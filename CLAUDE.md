# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Product Careerlyst** is a Next.js-based web application focused on helping product managers level up their careers through AI-powered tools, interview preparation, career tracking, and compensation intelligence. The project uses a bold, colorful design system with gradient backgrounds and shadow effects to create an engaging landing page experience.

## Key Technologies

- **Next.js 16** (App Router architecture)
- **React 19**
- **TypeScript** (strict mode enabled)
- **Tailwind CSS 4** (with custom gradients and shadow utilities)
- **Supabase** (backend-as-a-service for database, auth, and storage)
- **Plus Jakarta Sans** (primary font family)

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Project Structure

```
/app
  ├── layout.tsx          # Root layout with font configuration and metadata
  ├── page.tsx            # Landing page with marketing copy and CTAs
  ├── globals.css         # Global styles and Tailwind imports
  └── /components         # Reusable React components (currently empty)

/lib
  ├── supabase.ts         # Supabase client initialization
  └── supabase-types.ts   # TypeScript types for Supabase database schema

/public                   # Static assets
```

## Architecture Notes

### Next.js App Router
- Uses the modern App Router (not Pages Router)
- Server components by default
- File-based routing in the `/app` directory
- TypeScript path alias `@/*` maps to project root
- **CRITICAL**: In Next.js 16, `params` in dynamic routes is a Promise and MUST be awaited:
  ```typescript
  // ✅ CORRECT
  export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // use slug...
  }

  // ❌ WRONG - will cause runtime errors
  export default async function Page({ params }: { params: { slug: string } }) {
    const course = await getCourse(params.slug); // Error: params is a Promise!
  }
  ```

### Styling System
- **Tailwind CSS 4** with PostCSS integration
- Custom CSS variables defined in `globals.css`:
  - `--background`: #ffffff
  - `--foreground`: #000000
  - `--accent`: #dc2626 (Red-600 for Swiss accent)
- Heavy use of gradient backgrounds and layered shadow effects for a "neo-brutalist" design style
- Font: Plus Jakarta Sans with weights 400, 500, 600, 700, 800

### Supabase Integration
- Client configured in `lib/supabase.ts`
- Environment variables required in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- To generate TypeScript types from Supabase schema:
  ```bash
  npx supabase gen types typescript --project-id jshyrizjqtvhiwmmraqp > lib/supabase-types.ts
  ```

### Design Patterns
- **Gradient backgrounds**: Uses `bg-gradient-to-br` with vibrant color combinations (purple/pink, orange/yellow, green/emerald, etc.)
- **Shadow effects**: Custom box shadows with color offsets for depth (`shadow-[0_20px_0_0_rgba(...)]`)
- **Rounded corners**: Large border radius values (`rounded-[3rem]`, `rounded-[2.5rem]`)
- **Bold typography**: Heavy font weights (700-800) and large text sizes for impact
- **Inline badges**: Small pill-shaped elements with gradients for emphasis

## Important Context

### Product Focus
The application is a career development platform for product managers, featuring:
- AI Interview Coach
- Career Progression Tracker
- Impact Portfolio Builder
- Compensation Intelligence Engine
- AI PM Assistant

### Marketing Approach
- Direct, conversational tone addressing PM pain points
- Social proof with testimonials and statistics
- Urgency-driven CTAs (limited beta access, countdown timers)
- High contrast, colorful design to stand out

### Current State
This is an early-stage project with:
- A complete landing page design
- Supabase backend configured but not yet integrated into UI
- No authentication flow implemented yet
- Empty components directory ready for future feature development

## TypeScript Configuration
- Strict mode enabled
- JSX runtime: `react-jsx` (no need to import React)
- Module resolution: `bundler`
- Path alias: `@/*` for imports from project root
