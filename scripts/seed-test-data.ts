/**
 * Seed script for E2E test data
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure .env.local has:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USERS = {
  admin: {
    email: 'test-admin@nutriflow.test',
    password: 'TestPassword123!',
    full_name: 'Test Admin',
    profile_role: 'nutri' as const, // Profile role (staff)
  },
  nutri: {
    email: 'test-nutri@nutriflow.test',
    password: 'TestPassword123!',
    full_name: 'Test Nutricionista',
    profile_role: 'nutri' as const,
  },
  receptionist: {
    email: 'test-receptionist@nutriflow.test',
    password: 'TestPassword123!',
    full_name: 'Test Recepcionista',
    profile_role: 'nutri' as const, // Profile role (staff)
  },
  patient: {
    email: 'test-patient@nutriflow.test',
    password: 'TestPassword123!',
    full_name: 'Test Paciente',
    profile_role: 'patient' as const,
  },
};

const TEST_ORG = {
  name: 'Clínica NutriTest',
  slug: 'nutritest',
};

async function createTestUser(userData: typeof TEST_USERS.admin) {
  // Check if user exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === userData.email);

  if (existingUser) {
    console.log(`  ✓ User ${userData.email} already exists`);

    // Ensure profile exists for existing user
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: existingUser.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.profile_role,
    }, {
      onConflict: 'id',
    });

    if (profileError) {
      console.error(`  ✗ Failed to create/update profile for ${userData.email}:`, profileError.message);
    }

    return existingUser;
  }

  // Create user
  const { data, error } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      full_name: userData.full_name,
    },
  });

  if (error) {
    console.error(`  ✗ Failed to create user ${userData.email}:`, error.message);
    return null;
  }

  console.log(`  ✓ Created user ${userData.email}`);

  // Create profile
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.profile_role,
    });

    if (profileError) {
      console.error(`  ✗ Failed to create profile for ${userData.email}:`, profileError.message);
    }
  }

  return data.user;
}

async function createTestOrganization(ownerId: string) {
  // Check if org exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', TEST_ORG.slug)
    .single();

  if (existingOrg) {
    console.log(`  ✓ Organization "${TEST_ORG.name}" already exists`);
    return existingOrg;
  }

  // Create organization
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: TEST_ORG.name,
      slug: TEST_ORG.slug,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (error) {
    console.error(`  ✗ Failed to create organization:`, error.message);
    return null;
  }

  console.log(`  ✓ Created organization "${TEST_ORG.name}"`);

  // Add owner as admin member
  await supabase.from('organization_members').upsert({
    organization_id: org.id,
    user_id: ownerId,
    role: 'admin',
    status: 'active',
    accepted_at: new Date().toISOString(),
  });

  return org;
}

async function addMemberToOrg(orgId: string, userId: string, role: string, email: string) {
  const { error } = await supabase.from('organization_members').upsert({
    organization_id: orgId,
    user_id: userId,
    role,
    status: 'active',
    accepted_at: new Date().toISOString(),
  }, {
    onConflict: 'organization_id,user_id',
  });

  if (error) {
    console.error(`  ✗ Failed to add ${email} as ${role}:`, error.message);
  } else {
    console.log(`  ✓ Added ${email} as ${role}`);
  }
}

async function main() {
  console.log('\n🌱 Seeding test data...\n');

  // Create test users
  console.log('Creating test users:');
  const adminUser = await createTestUser(TEST_USERS.admin);
  const nutriUser = await createTestUser(TEST_USERS.nutri);
  const receptionistUser = await createTestUser(TEST_USERS.receptionist);
  const patientUser = await createTestUser(TEST_USERS.patient);

  if (!nutriUser) {
    console.error('\n✗ Failed to create primary test user. Aborting.');
    process.exit(1);
  }

  // Create organization (owned by nutri user for backwards compatibility)
  console.log('\nCreating test organization:');
  const org = await createTestOrganization(nutriUser.id);

  if (!org) {
    console.error('\n✗ Failed to create organization. Aborting.');
    process.exit(1);
  }

  // Add members to organization
  console.log('\nAdding members to organization:');
  if (adminUser) {
    await addMemberToOrg(org.id, adminUser.id, 'admin', TEST_USERS.admin.email);
  }
  if (receptionistUser) {
    await addMemberToOrg(org.id, receptionistUser.id, 'receptionist', TEST_USERS.receptionist.email);
  }
  if (patientUser) {
    await addMemberToOrg(org.id, patientUser.id, 'patient', TEST_USERS.patient.email);
  }

  console.log('\n✅ Test data seeded successfully!\n');
  console.log('Test credentials:');
  console.log('  Email: test-nutri@nutriflow.test');
  console.log('  Password: TestPassword123!');
  console.log('');
}

main().catch(console.error);
