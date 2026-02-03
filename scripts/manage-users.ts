/**
 * User Management Script for NutriFlow
 *
 * Usage:
 *   npx tsx scripts/manage-users.ts <command> [options]
 *
 * Commands:
 *   create-nutri     Create a new nutritionist with their own clinic
 *   create-super     Create or promote a user to super admin
 *   list-super       List all super admins
 *   list-orgs        List all organizations
 *
 * Examples:
 *   npx tsx scripts/manage-users.ts create-nutri --email="nutri@example.com" --password="123456" --name="Dr. João" --clinic="Clínica Nutrição"
 *   npx tsx scripts/manage-users.ts create-super --email="admin@example.com"
 *   npx tsx scripts/manage-users.ts list-super
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function createNutri(email: string, password: string, fullName: string, clinicName: string) {
  console.log(`\nCreating nutritionist: ${email}`);
  console.log(`Clinic: ${clinicName}`);

  // Check if user already exists
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find(u => u.email === email);

  let userId: string;

  if (existingUser) {
    console.log('User already exists, updating password...');
    userId = existingUser.id;

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Error updating user:', error.message);
      return;
    }
  } else {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return;
    }

    userId = authData.user.id;
    console.log('Auth user created:', userId);
  }

  // Check/create profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'nutri',
        full_name: fullName,
        email: email,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      return;
    }
    console.log('Profile created');
  } else {
    console.log('Profile already exists');
  }

  // Check if user already has an organization
  const { data: existingMembership } = await supabase
    .from('organization_members')
    .select('*, organizations(*)')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (existingMembership) {
    console.log('User already has organization:', (existingMembership.organizations as any)?.name);
  } else {
    // Create organization
    const slug = generateSlug(clinicName);
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: clinicName,
        slug,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError.message);
      return;
    }

    console.log('Organization created:', org.name);

    // Add user as admin member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'admin',
        status: 'active',
      });

    if (memberError) {
      console.error('Error adding member:', memberError.message);
      return;
    }

    console.log('User added as admin member');
  }

  console.log('\n✅ Success!');
  console.log('---');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Clinic:', clinicName);
}

async function createOrPromoteSuperAdmin(email: string, password?: string, fullName?: string) {
  console.log(`\nProcessing super admin: ${email}`);

  // Check if user already exists
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users.find(u => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log('User already exists:', userId);

    if (password) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (error) {
        console.error('Error updating password:', error.message);
      } else {
        console.log('Password updated');
      }
    }
  } else {
    if (!password) {
      console.error('Password required for new user');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return;
    }

    userId = authData.user.id;
    console.log('Auth user created:', userId);
  }

  // Check/create profile with super admin flag
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_super_admin: true })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error.message);
      return;
    }
    console.log('Profile updated to super admin');
  } else {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'nutri',
        full_name: fullName || email.split('@')[0],
        email: email,
        is_super_admin: true,
      });

    if (error) {
      console.error('Error creating profile:', error.message);
      return;
    }
    console.log('Profile created as super admin');
  }

  console.log('\n✅ Success! User is now a super admin');
  console.log('Email:', email);
}

async function listSuperAdmins() {
  console.log('\nSuper Admins:');
  console.log('---');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_super_admin')
    .eq('is_super_admin', true);

  if (error) {
    console.error('Error listing super admins:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No super admins found');
    return;
  }

  profiles.forEach((p, i) => {
    console.log(`${i + 1}. ${p.full_name} (${p.email})`);
  });
}

async function listOrganizations() {
  console.log('\nOrganizations:');
  console.log('---');

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, owner_id, profiles!organizations_owner_id_fkey(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing organizations:', error.message);
    return;
  }

  if (!orgs || orgs.length === 0) {
    console.log('No organizations found');
    return;
  }

  orgs.forEach((org, i) => {
    const owner = org.profiles as any;
    console.log(`${i + 1}. ${org.name} (${org.slug})`);
    console.log(`   Owner: ${owner?.full_name || 'Unknown'} (${owner?.email || 'Unknown'})`);
    console.log('');
  });
}

// Parse command line arguments
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || 'true';
    }
  });
  return result;
}

async function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  const args = parseArgs(rawArgs);

  switch (command) {
    case 'create-nutri':
      if (!args.email || !args.password || !args.name || !args.clinic) {
        console.log('Usage: create-nutri --email="..." --password="..." --name="..." --clinic="..."');
        return;
      }
      await createNutri(args.email, args.password, args.name, args.clinic);
      break;

    case 'create-super':
      if (!args.email) {
        console.log('Usage: create-super --email="..." [--password="..."] [--name="..."]');
        return;
      }
      await createOrPromoteSuperAdmin(args.email, args.password, args.name);
      break;

    case 'list-super':
      await listSuperAdmins();
      break;

    case 'list-orgs':
      await listOrganizations();
      break;

    default:
      console.log(`
NutriFlow User Management Script

Commands:
  create-nutri     Create a new nutritionist with their own clinic
  create-super     Create or promote a user to super admin
  list-super       List all super admins
  list-orgs        List all organizations

Examples:
  npx tsx scripts/manage-users.ts create-nutri --email="nutri@example.com" --password="123456" --name="Dr. João" --clinic="Clínica Nutrição"
  npx tsx scripts/manage-users.ts create-super --email="admin@example.com" --password="123456" --name="Admin"
  npx tsx scripts/manage-users.ts list-super
  npx tsx scripts/manage-users.ts list-orgs
`);
  }
}

main();
