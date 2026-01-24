# Database Migration Required

## Issue

The `anthropometry_assessments` table needs to be created in your Supabase database.

**Error**: `POST /rest/v1/anthropometry_assessments 404 (Not Found)`

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Open the Supabase SQL Editor:
   https://supabase.com/dashboard/project/jqwnrvxdzxyvqlfwqewh/sql/new

2. Copy the entire contents of:
   `supabase/migrations/20250124000001_anthropometry.sql`

3. Paste into the SQL Editor and click **Run**

4. Verify success by checking the Tables list for `anthropometry_assessments`

### Option 2: Use Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link your project (requires login)
supabase login
supabase link --project-ref jqwnrvxdzxyvqlfwqewh

# Push migrations
supabase db push
```

### Option 3: Direct Database Connection

```bash
# Get your DATABASE_URL from Supabase Dashboard:
# Settings > Database > Connection string > URI

# Install pg package
npm install pg

# Run migration script
DATABASE_URL="your-connection-string" node scripts/apply-migration.mjs
```

## Migration File

The migration creates:
- `anthropometry_assessments` table with:
  - 7 skinfold measurement fields
  - 13 circumference measurement fields
  - Calculated fields (BMI, body fat %, waist-hip ratio)
  - Proper indexes and RLS policies

Location: `supabase/migrations/20250124000001_anthropometry.sql`

## Verification

After applying the migration, test by:

1. Navigate to http://localhost:3000/patients/[id]/anthropometry/new
2. Fill in the form and submit
3. The assessment should save without 404 errors
