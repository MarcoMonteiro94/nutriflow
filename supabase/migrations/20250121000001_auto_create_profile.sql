-- Auto-create profile when user signs up
-- This solves the RLS issue where auth.uid() is not available immediately after signup

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
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

-- Trigger to call the function after user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Note: The signup action should no longer manually create the profile
-- as the trigger will handle it automatically
