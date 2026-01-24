#!/usr/bin/env node

/**
 * Apply Anthropometry Migration Script
 *
 * This script applies the anthropometry_assessments migration to your Supabase database.
 *
 * Usage:
 *   1. Get your DATABASE_URL from Supabase Dashboard:
 *      - Go to Settings > Database > Connection string
 *      - Copy the "URI" connection string
 *
 *   2. Run this script:
 *      DATABASE_URL="your-connection-string" node scripts/apply-migration.mjs
 *
 *   Or use npx with the Supabase CLI:
 *      npx supabase db push --db-url "your-connection-string"
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(`
=================================================
ERROR: DATABASE_URL environment variable not set
=================================================

To apply the migration, you need to provide your Supabase database connection string.

Option 1: Run with DATABASE_URL
  DATABASE_URL="postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" node scripts/apply-migration.mjs

Option 2: Apply manually via Supabase Dashboard
  1. Go to https://supabase.com/dashboard/project/jqwnrvxdzxyvqlfwqewh/sql
  2. Copy the contents of: supabase/migrations/20250124000001_anthropometry.sql
  3. Paste and execute in the SQL Editor

Option 3: Use Supabase CLI (if installed)
  npx supabase link --project-ref jqwnrvxdzxyvqlfwqewh
  npx supabase db push
  `);
  process.exit(1);
}

async function applyMigration() {
  // Dynamic import pg since it might not be installed
  let pg;
  try {
    pg = await import('pg');
  } catch (e) {
    console.error(`
ERROR: 'pg' package not installed.

Install it with:
  npm install pg

Then run this script again.
    `);
    process.exit(1);
  }

  const { Client } = pg.default || pg;

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250124000001_anthropometry.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Connecting to database...');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully.');

    console.log('Applying migration: 20250124000001_anthropometry.sql');
    await client.query(migrationSQL);

    console.log('Migration applied successfully!');
    console.log('The anthropometry_assessments table has been created.');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Migration already applied (table exists).');
    } else {
      console.error('Error applying migration:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

applyMigration();
