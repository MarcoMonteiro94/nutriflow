/**
 * Cleanup utilities for E2E tests that modify database state.
 *
 * Uses the Supabase service role client to clean up test data
 * created during E2E test runs.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local for local runs (CI injects env vars directly)
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Remove all organizations and memberships for the noOrg test user.
 * Call this in afterAll/afterEach when tests create orgs for this user.
 */
export async function cleanupNoOrgUser(): Promise<void> {
  const supabase = getServiceClient();

  const { data: users } = await supabase.auth.admin.listUsers();
  const noOrgUser = users?.users?.find((u) => u.email === 'test-noorg@example.com');
  if (!noOrgUser) return;

  // Delete organizations owned by this user
  const { data: ownedOrgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', noOrgUser.id);

  if (ownedOrgs && ownedOrgs.length > 0) {
    for (const org of ownedOrgs) {
      await supabase.from('organization_invites').delete().eq('organization_id', org.id);
      await supabase.from('organization_members').delete().eq('organization_id', org.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    }
  }

  // Remove any lingering memberships
  await supabase.from('organization_members').delete().eq('user_id', noOrgUser.id);
}
