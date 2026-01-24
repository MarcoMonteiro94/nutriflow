-- =============================================
-- Public Booking RLS Policies
-- Allows anonymous users to access booking information
-- and create appointments through public booking pages
-- =============================================

-- =============================================
-- Public Read Access for Booking Information
-- =============================================

-- Organizations: Public can view organizations by slug (for /book/org/[slug])
-- RLS policy for public read access to organizations table
create policy "Public can view organizations by slug"
  on organizations for select
  to anon
  using (true);

-- Organization Members: Public can view active nutritionists in organizations
create policy "Public can view active nutritionists in organizations"
  on organization_members for select
  to anon
  using (
    status = 'active'
    and role in ('nutri', 'admin')
  );

-- Profiles: Public can view nutritionist profiles (limited fields)
-- Note: RLS policies don't filter columns, so frontend queries must select only public fields
-- Public fields: id, full_name, email (for nutritionists only)
create policy "Public can view nutritionist profiles"
  on profiles for select
  to anon
  using (role = 'nutri');

-- Nutri Availability: Public can view active availability slots
create policy "Public can view nutritionist availability"
  on nutri_availability for select
  to anon
  using (is_active = true);

-- =============================================
-- Public Write Access for Booking Creation
-- =============================================

-- Patients: Anonymous users can create patient records when booking
-- The frontend must validate and provide nutri_id
create policy "Public can create patients for booking"
  on patients for insert
  to anon
  with check (
    -- Must provide required fields
    full_name is not null
    and nutri_id is not null
    -- Nutri must exist and be a nutritionist
    and exists (
      select 1 from profiles
      where id = nutri_id
      and role = 'nutri'
    )
  );

-- Appointments: Anonymous users can create appointments
-- Conflict checking is handled by application logic before insert
create policy "Public can create appointments for booking"
  on appointments for insert
  to anon
  with check (
    -- Must provide required fields
    nutri_id is not null
    and patient_id is not null
    and scheduled_at is not null
    and duration_minutes > 0
    -- Nutri must exist and be a nutritionist
    and exists (
      select 1 from profiles
      where id = nutri_id
      and role = 'nutri'
    )
    -- Patient must exist
    and exists (
      select 1 from patients
      where id = patient_id
    )
    -- Appointment must be in the future
    and scheduled_at > now()
  );

-- =============================================
-- Comments for documentation
-- =============================================

comment on policy "Public can view organizations by slug" on organizations is
  'Allows anonymous users to find organizations for public booking pages';

comment on policy "Public can view active nutritionists in organizations" on organization_members is
  'Allows anonymous users to see available nutritionists in an organization';

comment on policy "Public can view nutritionist profiles" on profiles is
  'Allows anonymous users to view nutritionist information for booking. Frontend must select only public fields.';

comment on policy "Public can view nutritionist availability" on nutri_availability is
  'Allows anonymous users to see when nutritionists are available for booking';

comment on policy "Public can create patients for booking" on patients is
  'Allows anonymous users to create patient records when making a booking';

comment on policy "Public can create appointments for booking" on appointments is
  'Allows anonymous users to create appointments through public booking pages. Conflict checking must be done in application logic.';
