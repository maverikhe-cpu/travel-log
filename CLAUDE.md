# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

川渝行迹 (Chuan-Yu Travel Log) is a collaborative trip planning and logging web application for group travel to the Sichuan-Chongqing region. Built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

## Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database Setup
# After creating a Supabase project, run the migration files in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_storage_bucket.sql
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript 5, Tailwind CSS 3
- **State**: Zustand (client state)
- **Backend**: Supabase (auth, PostgreSQL, Storage)
- **Icons**: lucide-react
- **Deployment**: Vercel

### Key Patterns

**Supabase Client**: Two separate client factories for browser vs server:
- `src/lib/supabase/client.ts` - For client components (`'use client'`)
- `src/lib/supabase/server.ts` - For server components (async, uses Next.js cookies)

**Authentication Flow**:
- `src/middleware.ts` handles auth redirects via `updateSession()`
- Protected pages redirect unauthenticated users to `/login`
- `/login` and `/register` redirect authenticated users to `/dashboard`
- Signout: POST form to `/auth/signout`

**Route Structure**:
- `/` - Landing page (public)
- `/login`, `/register` - Auth pages (public)
- `/dashboard` - User's trip list (protected)
- `/trips/new` - Create new trip (protected)
- `/trips/[id]` - Trip detail hub with links to:
  - `/trips/[id]/calendar` - Daily schedule view
  - `/trips/[id]/logs` - Travel journal entries
  - `/trips/[id]/gallery` - Photo gallery

**Mobile Navigation**: Protected trip pages include a fixed bottom nav bar (hidden on desktop) with tabs for Calendar, Logs, and Gallery.

### Database Schema (Supabase)

Core tables with RLS (Row Level Security):
- `profiles` - User profiles (linked to auth.users via trigger)
- `trips` - Trip records with auto-generated `share_code`
- `trip_members` - Junction table with role: `owner` | `editor` | `viewer`
- `activities` - Scheduled activities with category enum
- `travel_logs` - Daily journal entries (unique per trip+date)
- `trip_images` - Image metadata (files in Supabase Storage)
- `preset_locations` - Pre-populated Sichuan-Chongqing attractions/food

**Important**: When querying trips, always join with `trip_members` to check user access, as RLS policies are based on membership.

### Color System (川渝 Theme)

Use these Tailwind classes for UI consistency:
- `primary-500` (#DC2626) - Main actions, CTAs (辣椒红)
- `secondary-500` (#059669) - Success states (竹青)
- `accent-500` (#D97706) - Highlights, warnings (蜀锦金)

Activity category colors are defined in `ACTIVITY_CATEGORIES` constant in `src/lib/constants.ts`.

### Date Handling

- Dates stored as `DATE` type in PostgreSQL (YYYY-MM-DD format)
- Use `getDaysRange()` from `src/lib/utils.ts` to generate date array for trip duration
- Current trip date defaults to `2025-03-15` to `2025-03-21` (7 days)

### Mobile-First Constraints

- Touch targets must be min `44×44px` (use `.touch-target` utility class)
- Bottom nav on mobile, responsive layouts with Tailwind breakpoints (`md:`, `lg:`)
- Forms should have large inputs suitable for touch interaction
