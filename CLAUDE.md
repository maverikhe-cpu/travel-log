# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

漫行记（WanderLog) is a collaborative trip planning and logging web application for group travel to the Sichuan-Chongqing region. Built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

## Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# E2E Testing (Playwright)
npm test              # Run all Playwright tests
npm run test:headed   # Run tests with visible browser
npm run test:ui       # Run tests with Playwright UI
npm run test:debug    # Run tests in debug mode
npm run test:report   # Open test report

# Database Setup
# After creating a Supabase project, run the migration files in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_storage_bucket.sql
# 3. supabase/migrations/003_fix_rls_policies.sql
# 4. supabase/migrations/004_add_log_privacy.sql
# 5. supabase/migrations/005_create_avatars_bucket.sql
# 6. supabase/migrations/006_create_test_users.sql
# 7. supabase/migrations/007_add_location_columns.sql
# 8. supabase/migrations/008_add_expenses_tables.sql
# 9. supabase/migrations/009_upgrade_travel_logs.sql

# Test Users Setup
npm run test:users:create   # Create test users in Supabase

# Development Tools
npm run seed:activities    # Fill test trip with activity data
node scripts/check-trips.js # Check database trips and activities
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AMap 高德地图 (required for map features)
NEXT_PUBLIC_AMAP_KEY=your-amap-web-api-key
NEXT_PUBLIC_AMAP_SECURITY_JS_CODE=your-amap-security-js-code
```

Get AMap credentials from https://console.amap.com/dev/key/app

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript 5, Tailwind CSS 3
- **State**: Zustand (client state) - `src/store/`
- **Backend**: Supabase (auth, PostgreSQL, Storage)
- **Maps**: AMap (高德地图) via `@amap/amap-jsapi-loader`
- **Rich Text**: Tiptap editor
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

**State Management (Zustand)**:
- `src/store/authStore.ts` - User authentication state
- `src/store/tripStore.ts` - Current trip data (activities, logs, images, members)

**Route Structure**:
- `/` - Landing page (public)
- `/login`, `/register` - Auth pages (public)
- `/dashboard` - User's trip list (protected)
- `/profile` - User profile settings (protected)
- `/trips/new` - Create new trip (protected)
- `/trips/[id]` - Trip detail hub with links to:
  - `/trips/[id]/calendar` - Daily schedule view
  - `/trips/[id]/logs` - Travel journal entries
  - `/trips/[id]/gallery` - Photo gallery
  - `/trips/[id]/map` - Map view of activities
  - `/trips/[id]/expenses` - Expense tracking and settlement (protected)
  - `/trips/[id]/members` - Team member management
  - `/trips/[id]/activities/new` - Add new activity
  - `/trips/[id]/activities/[activityId]` - Edit activity
- `/join/[code]` - Join trip via share code (public)

**Mobile Navigation**: Protected trip pages include a fixed bottom nav bar (hidden on desktop) with tabs for Calendar, Logs, and Gallery.

### AMap 高德地图 Integration

The app uses AMap (高德地图) for Chinese location services. Key files:
- `src/lib/amap.ts` - Main API wrapper with loadAMap, searchPOI, createMap, etc.
- `src/components/map/trip-map.tsx` - Map display component
- `src/components/map/poi-search.tsx` - Location search component

**Important**: AMap requires dynamic import to avoid SSR errors. The security code must be set via `window._AMapSecurityConfig` before loading the API.

### Database Schema (Supabase)

Core tables with RLS (Row Level Security):
- `profiles` - User profiles (linked to auth.users via trigger)
- `trips` - Trip records with auto-generated `share_code`
- `trip_members` - Junction table with role: `owner` | `editor` | `viewer`
- `activities` - Scheduled activities with category enum, location coordinates
- `travel_logs` - Daily journal entries (unique per trip+date)
- `trip_images` - Image metadata (files in Supabase Storage)
- `expenses` - Expense records with category, amount, payer
- `expense_splits` - Expense split details per user (for settlement calculation)
- `preset_locations` - Pre-populated Sichuan-Chongqing attractions/food (200+ locations in `src/lib/constants.ts`)

**Important**: When querying trips, always join with `trip_members` to check user access, as RLS policies are based on membership.

### Trip Cover & Edit Features

**Cover Image Upload**:
- Trips support cover images stored in `trips.cover_image_url`
- Cover images uploaded to `trip-images` bucket at `{tripId}/covers/` path
- Two upload methods:
  1. Local file upload with automatic compression (max 2000px, 92% quality)
  2. Select from trip's photo gallery
- Cover displayed prominently on trip detail page

**Trip Editing**:
- Only trip creator can edit trip information
- Edit button (pencil icon) shown only to creator in header
- Editable fields: name, description, start_date, end_date, cover_image_url
- RLS policy: `created_by` or `role='owner'` can update trips
- Key components:
  - `src/components/trip/EditTripModal.tsx` - Modal for editing trip info
  - `src/components/trip/PhotoSelectorModal.tsx` - Modal for selecting cover from gallery

**Permission Check**:
```typescript
const isCreator = trip.created_by === userId;
```

### Color System (川渝 Theme)

Use these Tailwind classes for UI consistency:
- `primary-500` (#FA5252) - Main actions, CTAs (朱红)
- `secondary-500` (#38A169) - Success states (竹青)
- `ink-900` (#1A1B1E) - Primary text (水墨灰极浓)
- `ink-600` (#868E96) - Secondary text (水墨灰次要)

Activity category colors are defined in `ACTIVITY_CATEGORIES` constant in `src/lib/constants.ts`.

Expense category colors:
- `food` (餐饮) - orange
- `transport` (交通) - blue
- `accommodation` (住宿) - purple
- `ticket` (门票) - pink
- `shopping` (购物) - emerald
- `other` (其他) - gray

### Gallery Module (照片库)

The gallery module (`/trips/[id]/gallery`) provides photo management with filtering and lightbox viewing.

**Key Files**:
- `src/components/gallery/GalleryClient.tsx` - Main client component with state management
- `src/components/gallery/GalleryStats.tsx` - Statistics panel (total photos, user breakdown)
- `src/components/gallery/GalleryFilter.tsx` - User filter dropdown
- `src/components/gallery/PhotoCard.tsx` - Individual photo card with delete option
- `src/components/gallery/PhotoLightbox.tsx` - Full-screen lightbox with rotation/zoom

**Features**:
- **View Modes**: Toggle between "all dates" (expandable) and single date view
- **User Filtering**: Filter photos by member (shows upload counts per user)
- **Lightbox**: Full-screen viewer with keyboard shortcuts:
  - Arrow keys: Navigate between photos
  - R/E: Rotate clockwise/counter-clockwise
  - Escape: Close lightbox
  - Zoom in/out buttons, rotation controls, download
- **Delete**: Photo owner can delete their photos (removes from storage and database)
- **Date Grouping**: Photos grouped by `day_date` with expand/collapse
- **Mobile Navigation**: Bottom nav bar with Calendar/Logs/Gallery tabs

**Image Optimization**:
- Uses `compressImage()` utility from `src/lib/utils.ts`
- Client-side compression before upload (max 2000px, 92% quality)
- Preserves PNG transparency, converts others to JPEG
- Priority loading for first 8 images in first date group (LCP optimization)

### Expense Module (费用管理)

The expense module (`/trips/[id]/expenses`) provides group expense tracking and settlement.

**Key Files**:
- `src/lib/expenses.ts` - Expense CRUD service (create, update, delete, fetch)
- `src/lib/settlement.ts` - Settlement calculation algorithm (debtor-creditor optimization)
- `src/components/expenses/ExpenseDashboard.tsx` - Statistics panel (total, my spending, my advances)
- `src/components/expenses/ExpenseList.tsx` - Expense list with filtering and sorting
- `src/components/expenses/ExpenseFormModal.tsx` - Unified modal for add/edit
- `src/components/expenses/SettlementReport.tsx` - Settlement report modal

**Data Model**:
- `Expense` - Main expense record (id, trip_id, title, amount, category, payer_id, expense_date, created_by, updated_by, created_at, updated_at)
- `ExpenseSplit` - Per-user split amount (links expense to user)

**Features**:
- **Create Expense**: Add new expenses with category, amount, payer, and participants
- **Edit Expense**: Modify expense details (creator and editors only)
- **Delete Expense**: Remove expenses (creator or owner only)
- **Filtering**: Filter by category, payer, and date range
- **Sorting**: Toggle between newest-first and oldest-first
- **Statistics**: View total trip expenses, personal spending, and personal advances
- **Settlement**: Auto-calculate optimal settlement plan

**Settlement Algorithm**:
- Uses greedy approach to minimize number of transactions
- Calculates each user's balance: (amount paid) - (amount consumed)
- Matches debtors to creditors optimally

**Expense Categories**:
- `food` (餐饮) - orange
- `transport` (交通) - blue
- `accommodation` (住宿) - purple
- `ticket` (门票) - pink
- `shopping` (购物) - emerald
- `other` (其他) - gray

### Travel Logs Module (旅行记录)

The travel logs module (`/trips/[id]/logs`) provides multi-entry daily journaling with image support.

**Key Files**:
- `src/components/logs/TravelLogForm.tsx` - Form for creating/editing logs with images
- `src/components/logs/LogsClient.tsx` - Client component displaying multiple logs per day
- `src/app/trips/[id]/logs/page.tsx` - Server component fetching all logs
- `src/app/trips/[id]/logs/new/page.tsx` - New log creation page
- `src/app/trips/[id]/logs/[logId]/edit/page.tsx` - Log editing page

**Data Model**:
- `travel_logs` table fields:
  - `id` (UUID) - Primary key
  - `trip_id` (UUID) - Foreign key to trips
  - `day_date` (DATE) - Date of the log
  - `title` (TEXT, optional) - Log title
  - `content` (TEXT) - Rich text content (required)
  - `images` (TEXT[]) - Array of image URLs (max 10)
  - `is_private` (BOOLEAN) - Privacy flag (default: false)
  - `created_by` (UUID) - Creator user ID
  - `created_at` (TIMESTAMP) - Creation timestamp
  - `updated_at` (TIMESTAMP) - Last update timestamp

- `trip_images` relationship:
  - `source` (TEXT) - 'gallery' or 'log' (indicates image source)
  - `log_id` (UUID, nullable) - Links to travel_logs.id if source='log'

**Features**:
- **Multiple Entries**: Each member can create multiple logs per day (no unique constraint)
- **Image Upload**: Upload up to 10 images per log (auto-compressed to max 2000px, 92% quality)
- **Gallery Integration**: Images from logs automatically appear in trip photo gallery
- **Rich Editing**: Edit log title, content, and manage images
- **Image Sync**: Removing images in edit mode deletes from both travel_logs and trip_images tables
- **Sorted Display**: Logs displayed by creation time (newest first)
- **Date Navigation**: View logs by specific date

**Image Upload Flow**:
1. User selects images (max 10, 5MB each)
2. Images compressed client-side using `compressImage()`
3. For new logs: Create log record first to obtain `logId`
4. Upload images to Supabase Storage at `{tripId}/logs/{date}/{filename}`
5. Save to both:
   - `travel_logs.images` array (for quick access)
   - `trip_images` table with `source='log'` and `log_id` (for gallery display)

**Edit Mode Image Deletion**:
When removing images in edit mode:
1. Compare `initialData.images` with current `images` state
2. Query `trip_images` for removed URLs by `log_id`
3. Delete from Storage
4. Delete from `trip_images` table
5. Update `travel_logs.images` array

**RLS Policies**:
- **Insert**: Any trip member can create logs
- **Update**: Creator or owner/editor can update
- **Delete**: Creator or owner can delete
- **Select**: Trip members can view logs

**Migration**: `009_upgrade_travel_logs.sql`
- Removed `UNIQUE(trip_id, day_date)` constraint
- Added `title`, `images`, `is_private` columns
- Added `source`, `log_id` columns to `trip_images`
- Updated RLS policies for multi-entry support

### Date Handling

- Dates stored as `DATE` type in PostgreSQL (YYYY-MM-DD format)
- Use `getDaysRange()` from `src/lib/utils.ts` to generate date array for trip duration
- Date formats in `DATE_FORMATS` constant (src/lib/constants.ts)

### Utility Functions (`src/lib/utils.ts`)

- `cn(...inputs)` - Merge Tailwind classes with clsx and tailwind-merge
- `generateShareCode()` - Generate 6-character alphanumeric share code (excludes ambiguous chars)
- `formatDate(date, format)` - Format dates as 'short' (M/D), 'long' (M月D日), or 'weekday' (周X)
- `getDaysRange(startDate, endDate)` - Generate array of Date objects between two dates
- `compressImage(file, maxWidth, quality)` - Client-side image compression for uploads
- `formatFileSize(bytes)` - Human-readable file size (B, KB, MB)

### Mobile-First Constraints

- Touch targets must be min `44×44px` - use `className="p-2"` or larger padding on buttons
- Bottom nav on mobile, responsive layouts with Tailwind breakpoints (`md:`, `lg:`)
- Forms should have large inputs suitable for touch interaction
- Mobile navigation bar is rendered on pages with `/trips/[id]` prefix (Calendar, Logs, Gallery tabs)

### Testing

**E2E Tests** (Playwright):
- Test files in `e2e/` directory
- Helper functions in `e2e/helpers.ts` (login, register, createTrip, etc.)
- Test users defined in `TEST_USERS` constant
- Configure `AUTO_REGISTER=true` to auto-register test users

**Lighthouse CI**:
- `npm run lhci` - Run Lighthouse performance audits
- Configuration in `lighthouserc.json`

**Running Single Tests**:
- `npx playwright test e2e/gallery/gallery.spec.ts` - Run specific test file
- `npx playwright test e2e/gallery/gallery.spec.ts -g "查看照片库"` - Run tests matching grep pattern
- `npx playwright test --project=chromium` - Run tests in specific browser
