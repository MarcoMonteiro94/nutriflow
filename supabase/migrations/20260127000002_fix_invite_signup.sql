-- Migration: Fix signup to also skip profile creation for invite signups
-- Extends the previous migration to handle user_type='invite'

-- Update the handle_new_user function to check for both patient and invite
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_type text;
begin
  v_user_type := new.raw_user_meta_data->>'user_type';

  -- Skip profile creation for:
  -- 1. Patients (user_type='patient') - they don't need a nutri profile
  -- 2. Invites (user_type='invite') - profile/role handled by invite acceptance
  if v_user_type in ('patient', 'invite') then
    return new;
  end if;

  -- For direct signups (nutritionists), create a profile
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
    'nutri'::public.user_role
  );
  return new;
end;
$$;
