-- NutriFlow Row Level Security (RLS) Policies
-- Ensures data isolation between nutritionists and their patients

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table patients enable row level security;
alter table food_items enable row level security;
alter table meal_plans enable row level security;
alter table meals enable row level security;
alter table meal_contents enable row level security;
alter table appointments enable row level security;
alter table measurements enable row level security;
alter table patient_tokens enable row level security;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Allow insert for new user registration (triggered by auth)
create policy "Allow insert for auth users"
  on profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- PATIENTS POLICIES
-- ============================================

-- Nutris can view their own patients
create policy "Nutris can view own patients"
  on patients for select
  using (
    auth.uid() = nutri_id
    or auth.uid() = profile_id
  );

-- Nutris can create patients
create policy "Nutris can create patients"
  on patients for insert
  with check (
    auth.uid() = nutri_id
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'nutri'
    )
  );

-- Nutris can update their own patients
create policy "Nutris can update own patients"
  on patients for update
  using (auth.uid() = nutri_id);

-- Nutris can delete their own patients
create policy "Nutris can delete own patients"
  on patients for delete
  using (auth.uid() = nutri_id);

-- ============================================
-- FOOD_ITEMS POLICIES
-- ============================================

-- Everyone can view official food items
create policy "Everyone can view official foods"
  on food_items for select
  using (source = 'official');

-- Users can view their own custom foods
create policy "Users can view own custom foods"
  on food_items for select
  using (
    source = 'custom'
    and creator_id = auth.uid()
  );

-- Users can create custom foods
create policy "Users can create custom foods"
  on food_items for insert
  with check (
    source = 'custom'
    and creator_id = auth.uid()
  );

-- Users can update their own custom foods
create policy "Users can update own custom foods"
  on food_items for update
  using (
    source = 'custom'
    and creator_id = auth.uid()
  );

-- Users can delete their own custom foods
create policy "Users can delete own custom foods"
  on food_items for delete
  using (
    source = 'custom'
    and creator_id = auth.uid()
  );

-- ============================================
-- MEAL_PLANS POLICIES
-- ============================================

-- Nutris can view meal plans they created
create policy "Nutris can view own meal plans"
  on meal_plans for select
  using (auth.uid() = nutri_id);

-- Patients can view their own meal plans
create policy "Patients can view own meal plans"
  on meal_plans for select
  using (
    exists (
      select 1 from patients
      where patients.id = meal_plans.patient_id
      and patients.profile_id = auth.uid()
    )
  );

-- Nutris can create meal plans for their patients
create policy "Nutris can create meal plans"
  on meal_plans for insert
  with check (
    auth.uid() = nutri_id
    and exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can update their own meal plans
create policy "Nutris can update own meal plans"
  on meal_plans for update
  using (auth.uid() = nutri_id);

-- Nutris can delete their own meal plans
create policy "Nutris can delete own meal plans"
  on meal_plans for delete
  using (auth.uid() = nutri_id);

-- ============================================
-- MEALS POLICIES
-- ============================================

-- Users can view meals from plans they can access
create policy "Users can view accessible meals"
  on meals for select
  using (
    exists (
      select 1 from meal_plans
      where meal_plans.id = meals.meal_plan_id
      and (
        meal_plans.nutri_id = auth.uid()
        or exists (
          select 1 from patients
          where patients.id = meal_plans.patient_id
          and patients.profile_id = auth.uid()
        )
      )
    )
  );

-- Nutris can create meals in their meal plans
create policy "Nutris can create meals"
  on meals for insert
  with check (
    exists (
      select 1 from meal_plans
      where meal_plans.id = meal_plan_id
      and meal_plans.nutri_id = auth.uid()
    )
  );

-- Nutris can update meals in their meal plans
create policy "Nutris can update own meals"
  on meals for update
  using (
    exists (
      select 1 from meal_plans
      where meal_plans.id = meals.meal_plan_id
      and meal_plans.nutri_id = auth.uid()
    )
  );

-- Nutris can delete meals from their meal plans
create policy "Nutris can delete own meals"
  on meals for delete
  using (
    exists (
      select 1 from meal_plans
      where meal_plans.id = meals.meal_plan_id
      and meal_plans.nutri_id = auth.uid()
    )
  );

-- ============================================
-- MEAL_CONTENTS POLICIES
-- ============================================

-- Users can view meal contents from accessible meals
create policy "Users can view accessible meal contents"
  on meal_contents for select
  using (
    exists (
      select 1 from meals
      join meal_plans on meal_plans.id = meals.meal_plan_id
      where meals.id = meal_contents.meal_id
      and (
        meal_plans.nutri_id = auth.uid()
        or exists (
          select 1 from patients
          where patients.id = meal_plans.patient_id
          and patients.profile_id = auth.uid()
        )
      )
    )
  );

-- Nutris can create meal contents in their meals
create policy "Nutris can create meal contents"
  on meal_contents for insert
  with check (
    exists (
      select 1 from meals
      join meal_plans on meal_plans.id = meals.meal_plan_id
      where meals.id = meal_id
      and meal_plans.nutri_id = auth.uid()
    )
  );

-- Nutris can update their meal contents
create policy "Nutris can update own meal contents"
  on meal_contents for update
  using (
    exists (
      select 1 from meals
      join meal_plans on meal_plans.id = meals.meal_plan_id
      where meals.id = meal_contents.meal_id
      and meal_plans.nutri_id = auth.uid()
    )
  );

-- Nutris can delete their meal contents
create policy "Nutris can delete own meal contents"
  on meal_contents for delete
  using (
    exists (
      select 1 from meals
      join meal_plans on meal_plans.id = meals.meal_plan_id
      where meals.id = meal_contents.meal_id
      and meal_plans.nutri_id = auth.uid()
    )
  );

-- ============================================
-- APPOINTMENTS POLICIES
-- ============================================

-- Nutris can view their own appointments
create policy "Nutris can view own appointments"
  on appointments for select
  using (auth.uid() = nutri_id);

-- Patients can view their own appointments
create policy "Patients can view own appointments"
  on appointments for select
  using (
    exists (
      select 1 from patients
      where patients.id = appointments.patient_id
      and patients.profile_id = auth.uid()
    )
  );

-- Nutris can create appointments for their patients
create policy "Nutris can create appointments"
  on appointments for insert
  with check (
    auth.uid() = nutri_id
    and exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can update their own appointments
create policy "Nutris can update own appointments"
  on appointments for update
  using (auth.uid() = nutri_id);

-- Nutris can delete their own appointments
create policy "Nutris can delete own appointments"
  on appointments for delete
  using (auth.uid() = nutri_id);

-- ============================================
-- MEASUREMENTS POLICIES
-- ============================================

-- Nutris can view measurements of their patients
create policy "Nutris can view patient measurements"
  on measurements for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurements.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Patients can view their own measurements
create policy "Patients can view own measurements"
  on measurements for select
  using (
    exists (
      select 1 from patients
      where patients.id = measurements.patient_id
      and patients.profile_id = auth.uid()
    )
  );

-- Nutris can create measurements for their patients
create policy "Nutris can create measurements"
  on measurements for insert
  with check (
    exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can update measurements of their patients
create policy "Nutris can update patient measurements"
  on measurements for update
  using (
    exists (
      select 1 from patients
      where patients.id = measurements.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can delete measurements of their patients
create policy "Nutris can delete patient measurements"
  on measurements for delete
  using (
    exists (
      select 1 from patients
      where patients.id = measurements.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- ============================================
-- PATIENT_TOKENS POLICIES
-- ============================================

-- Nutris can view tokens for their patients
create policy "Nutris can view patient tokens"
  on patient_tokens for select
  using (
    exists (
      select 1 from patients
      where patients.id = patient_tokens.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can create tokens for their patients
create policy "Nutris can create patient tokens"
  on patient_tokens for insert
  with check (
    exists (
      select 1 from patients
      where patients.id = patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- Nutris can delete tokens for their patients
create policy "Nutris can delete patient tokens"
  on patient_tokens for delete
  using (
    exists (
      select 1 from patients
      where patients.id = patient_tokens.patient_id
      and patients.nutri_id = auth.uid()
    )
  );

-- ============================================
-- PUBLIC ACCESS FOR MAGIC LINKS (via service role)
-- ============================================
-- Note: Magic link token verification will use service role key
-- which bypasses RLS, allowing anonymous patients to access plans
