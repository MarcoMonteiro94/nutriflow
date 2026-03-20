/**
 * Seed script for E2E test data
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * This script is idempotent — it cleans up stateful test data
 * (invites, memberships for invite/noOrg users) on each run so
 * that E2E tests start from a known state.
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

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  profile_role: 'nutri' | 'patient';
  user_type?: 'invite' | 'patient';
}

const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'test-admin@example.com',
    password: 'TestPassword123!',
    full_name: 'Test Admin',
    profile_role: 'nutri',
  },
  nutri: {
    email: 'test-nutri@example.com',
    password: 'TestPassword123!',
    full_name: 'Test Nutricionista',
    profile_role: 'nutri',
  },
  receptionist: {
    email: 'test-receptionist@example.com',
    password: 'TestPassword123!',
    full_name: 'Test Recepcionista',
    profile_role: 'nutri',
  },
  patient: {
    email: 'test-patient@example.com',
    password: 'TestPassword123!',
    full_name: 'Test Paciente',
    profile_role: 'patient',
    user_type: 'patient',
  },
  noOrg: {
    email: 'test-noorg@example.com',
    password: 'TestPassword123!',
    full_name: 'Test Sem Org',
    profile_role: 'nutri',
  },
  invited: {
    email: 'test-invited@example.com',
    password: 'TestPassword123!',
    full_name: 'Test Convidado',
    profile_role: 'nutri',
    user_type: 'invite',
  },
};

const TEST_ORG = {
  name: 'Clínica NutriTest',
  slug: 'nutritest',
};

const TEST_INVITES = {
  pending: {
    email: 'test-invited@example.com',
    role: 'nutri',
    token: 'test-pending-invite-token-e2e-12345',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  expired: {
    email: 'test-expired@example.com',
    role: 'receptionist',
    token: 'test-expired-invite-token-e2e-99999',
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
};

async function createTestUser(userData: TestUser) {
  // Check if user exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === userData.email);

  if (existingUser) {
    console.log(`  ✓ User ${userData.email} already exists`);

    // Update user metadata (ensures user_type is set correctly)
    await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: {
        full_name: userData.full_name,
        ...(userData.user_type ? { user_type: userData.user_type } : {}),
      },
    });

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
      ...(userData.user_type ? { user_type: userData.user_type } : {}),
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

    // Update owner_id to current nutri user (may differ across seed runs)
    if (existingOrg.owner_id !== ownerId) {
      await supabase
        .from('organizations')
        .update({ owner_id: ownerId })
        .eq('id', existingOrg.id);
      console.log(`  ✓ Updated owner to current nutri user`);
    }

    // Ensure owner membership exists
    await supabase.from('organization_members').upsert({
      organization_id: existingOrg.id,
      user_id: ownerId,
      role: 'admin',
      status: 'active',
      accepted_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,user_id' });

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

async function cleanupNoOrgUser(userId: string, email: string) {
  // Delete any organizations owned by this user (created by create-org tests)
  const { data: ownedOrgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId);

  if (ownedOrgs && ownedOrgs.length > 0) {
    for (const org of ownedOrgs) {
      await supabase.from('organization_invites').delete().eq('organization_id', org.id);
      await supabase.from('organization_members').delete().eq('organization_id', org.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    }
  }

  // Remove any memberships
  await supabase.from('organization_members').delete().eq('user_id', userId);
  console.log(`  ✓ Ensured ${email} has no organization`);
}

async function cleanupInviteTestData(orgId: string) {
  // Remove invited user's membership (so invite flow can be re-tested)
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const invitedUser = existingUsers?.users?.find(u => u.email === TEST_USERS.invited.email);

  if (invitedUser) {
    await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', invitedUser.id);
    console.log(`  ✓ Cleaned up membership for ${TEST_USERS.invited.email}`);
  }

  // Delete existing test invites by token (so they can be re-created fresh)
  for (const invite of Object.values(TEST_INVITES)) {
    await supabase
      .from('organization_invites')
      .delete()
      .eq('token', invite.token);
  }
  console.log('  ✓ Cleaned up existing test invites');
}

async function createTestInvite(
  orgId: string,
  invitedById: string,
  inviteData: (typeof TEST_INVITES)[keyof typeof TEST_INVITES],
) {
  const { data: invite, error } = await supabase
    .from('organization_invites')
    .insert({
      organization_id: orgId,
      email: inviteData.email,
      role: inviteData.role,
      token: inviteData.token,
      expires_at: inviteData.expires_at,
      invited_by: invitedById,
    })
    .select()
    .single();

  if (error) {
    console.error(`  ✗ Failed to create invite for ${inviteData.email}:`, error.message);
    return null;
  }

  console.log(`  ✓ Created invite for ${inviteData.email} (${inviteData.role})`);
  return invite;
}

async function seedBasePatient(nutriId: string, orgId: string) {
  console.log('\nSeeding base patient:');

  const patientData = {
    full_name: 'Paciente Seed Test',
    email: 'seed-patient@test.com',
    phone: '(11) 99999-9999',
    birth_date: '1990-01-15',
    gender: 'masculino',
    goal: 'Emagrecimento',
    notes: 'Paciente criado pelo seed script para testes E2E',
  };

  // Check if patient already exists
  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('email', patientData.email)
    .eq('nutri_id', nutriId)
    .single();

  if (existing) {
    console.log(`  ✓ Base patient already exists (${existing.id})`);
    return existing.id;
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      ...patientData,
      nutri_id: nutriId,
      organization_id: orgId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('  ✗ Failed to create base patient:', error.message);
    return null;
  }

  console.log(`  ✓ Created base patient (${patient.id})`);
  return patient.id;
}

async function seedAvailability(nutriId: string) {
  console.log('\nSeeding nutri availability:');

  // Delete existing availability for this nutri (idempotent)
  await supabase
    .from('nutri_availability')
    .delete()
    .eq('nutri_id', nutriId);

  // Create Mon-Fri 08:00-18:00 availability
  const slots = [];
  for (let day = 1; day <= 5; day++) {
    slots.push({
      nutri_id: nutriId,
      day_of_week: day,
      start_time: '08:00',
      end_time: '18:00',
      is_active: true,
    });
  }

  const { error } = await supabase
    .from('nutri_availability')
    .insert(slots);

  if (error) {
    console.error('  ✗ Failed to seed availability:', error.message);
    return;
  }

  console.log('  ✓ Created Mon-Fri 08:00-18:00 availability');
}

async function seedMealPlanForPatient(patientId: string, nutriId: string) {
  console.log('\nSeeding meal plan for patient:');

  // Check if an active plan already exists
  const { data: existing } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('patient_id', patientId)
    .eq('nutri_id', nutriId)
    .eq('status', 'active')
    .single();

  if (existing) {
    console.log(`  ✓ Active meal plan already exists (${existing.id})`);
    return existing.id;
  }

  const startsAt = new Date().toISOString().split('T')[0];
  const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({
      title: 'Plano Seed Test',
      description: 'Plano criado pelo seed script para testes E2E',
      patient_id: patientId,
      nutri_id: nutriId,
      status: 'active',
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .select('id')
    .single();

  if (planError || !plan) {
    console.error('  ✗ Failed to create meal plan:', planError?.message);
    return null;
  }

  // Add one meal to the plan
  const { error: mealError } = await supabase
    .from('meals')
    .insert({
      meal_plan_id: plan.id,
      title: 'Café da Manhã Seed',
      time: '07:00',
      sort_order: 0,
    });

  if (mealError) {
    console.error('  ✗ Failed to create meal:', mealError.message);
  } else {
    console.log(`  ✓ Created meal plan with 1 meal (${plan.id})`);
  }

  return plan.id;
}

async function main() {
  console.log('\n🌱 Seeding test data...\n');

  // Create test users
  console.log('Creating test users:');
  const adminUser = await createTestUser(TEST_USERS.admin);
  const nutriUser = await createTestUser(TEST_USERS.nutri);
  const receptionistUser = await createTestUser(TEST_USERS.receptionist);
  const patientUser = await createTestUser(TEST_USERS.patient);
  const noOrgUser = await createTestUser(TEST_USERS.noOrg);
  const invitedUser = await createTestUser(TEST_USERS.invited);

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

  // Seed base patient for CRUD tests
  const patientId = await seedBasePatient(nutriUser.id, org.id);

  // Seed availability for schedule tests
  await seedAvailability(nutriUser.id);

  // Seed meal plan for patient portal tests
  if (patientId) {
    await seedMealPlanForPatient(patientId, nutriUser.id);
  }

  // Ensure noOrg user has no org (clean up any state from previous test runs)
  console.log('\nSetting up no-org user:');
  if (noOrgUser) {
    await cleanupNoOrgUser(noOrgUser.id, TEST_USERS.noOrg.email);
  }

  // Setup invite test data (cleanup + fresh invites)
  console.log('\nSetting up invite test data:');
  await cleanupInviteTestData(org.id);

  console.log('\nCreating test invites:');
  await createTestInvite(org.id, nutriUser.id, TEST_INVITES.pending);
  await createTestInvite(org.id, nutriUser.id, TEST_INVITES.expired);

  console.log('\n✅ Test data seeded successfully!\n');
  console.log('Test credentials:');
  console.log('  Nutri:        test-nutri@example.com / TestPassword123!');
  console.log('  Admin:        test-admin@example.com / TestPassword123!');
  console.log('  Receptionist: test-receptionist@example.com / TestPassword123!');
  console.log('  Patient:      test-patient@example.com / TestPassword123!');
  console.log('  No Org:       test-noorg@example.com / TestPassword123!');
  console.log('  Invited:      test-invited@example.com / TestPassword123!');
  console.log('');
  console.log('Test invite tokens:');
  console.log(`  Pending: ${TEST_INVITES.pending.token}`);
  console.log(`  Expired: ${TEST_INVITES.expired.token}`);
  console.log('');
}

main().catch(console.error);
