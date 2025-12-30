# App Gap - Setup Guide

## Prerequisites

1. **Node.js 18+** - Required for Next.js 14
2. **Supabase Account** - Sign up at [supabase.com](https://supabase.com) (free tier)
3. **Apify Account** - Sign up at [apify.com](https://apify.com) (free tier has $5 credit)

## Step 1: Supabase Setup

1. Create a new Supabase project
2. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

3. Go to **SQL Editor** and run the contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```

## Step 2: Apify Setup

1. Sign up at apify.com
2. Go to **Settings → Integrations** and copy your API token

## Step 3: Environment Variables

Create a `.env.local` file in the project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Apify Configuration
APIFY_API_TOKEN=your-apify-token
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run Development Server

```bash
npm run dev
```

## Step 6: Seed Initial Data

```bash
npx tsx src/scripts/seed-apps.ts
```

## Database Schema

The database includes:

- **categories** - iOS App Store categories
- **apps** - App metadata and details
- **app_metrics** - Daily metrics snapshots (downloads, ratings, ranks)
- **reviews** - User reviews
- **review_insights** - AI-generated insights from reviews
- **opportunity_scores** - Calculated opportunity scores
- **similar_apps** - App similarity mappings

## Apify Actors Used

- `epctex/app-store-scraper` - For app details and rankings
- `epctex/app-store-reviews-scraper` - For user reviews

