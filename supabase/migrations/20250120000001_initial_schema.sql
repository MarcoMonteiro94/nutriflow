-- NutriFlow Initial Schema Migration
-- Creates all core tables for the meal planning application

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create custom enums
create type user_role as enum ('nutri', 'patient');
create type food_source as enum ('official', 'custom');
create type plan_status as enum ('active', 'archived');

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patients table (links patient profiles to nutritionists)
create table patients (
  id uuid primary key default uuid_generate_v4(),
  nutri_id uuid not null references profiles(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  gender text,
  goal text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Food items table (TACO database + custom foods)
create table food_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  calories numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  fiber numeric(8,2) default 0,
  sodium numeric(8,2) default 0,
  portion_size numeric(8,2) default 100,
  portion_unit text default 'g',
  category text,
  source food_source not null default 'official',
  creator_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Meal plans table (one active plan per patient)
create table meal_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  nutri_id uuid not null references profiles(id) on delete cascade,
  title text,
  description text,
  status plan_status not null default 'active',
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Meals table (individual meals within a plan)
create table meals (
  id uuid primary key default uuid_generate_v4(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  time time not null,
  title text not null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Meal contents table (foods within a meal)
create table meal_contents (
  id uuid primary key default uuid_generate_v4(),
  meal_id uuid not null references meals(id) on delete cascade,
  food_id uuid not null references food_items(id) on delete restrict,
  amount numeric(8,2) not null,
  is_substitution boolean not null default false,
  parent_content_id uuid references meal_contents(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Appointments table (for scheduling)
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  nutri_id uuid not null references profiles(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Measurements table (anthropometry data)
create table measurements (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight numeric(5,2),
  height numeric(5,2),
  body_fat_percentage numeric(5,2),
  muscle_mass numeric(5,2),
  waist_circumference numeric(5,2),
  hip_circumference numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

-- Patient access tokens (for magic links)
create table patient_tokens (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Create indexes for common queries
create index idx_patients_nutri_id on patients(nutri_id);
create index idx_meal_plans_patient_id on meal_plans(patient_id);
create index idx_meal_plans_nutri_id on meal_plans(nutri_id);
create index idx_meals_meal_plan_id on meals(meal_plan_id);
create index idx_meal_contents_meal_id on meal_contents(meal_id);
create index idx_food_items_name on food_items using gin(to_tsvector('portuguese', name));
create index idx_food_items_source on food_items(source);
create index idx_appointments_nutri_id on appointments(nutri_id);
create index idx_appointments_scheduled_at on appointments(scheduled_at);
create index idx_measurements_patient_id on measurements(patient_id);
create index idx_patient_tokens_token on patient_tokens(token);
create index idx_patient_tokens_expires_at on patient_tokens(expires_at);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_patients_updated_at
  before update on patients
  for each row execute function update_updated_at_column();

create trigger update_meal_plans_updated_at
  before update on meal_plans
  for each row execute function update_updated_at_column();

create trigger update_appointments_updated_at
  before update on appointments
  for each row execute function update_updated_at_column();
