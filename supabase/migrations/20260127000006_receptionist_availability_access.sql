-- =============================================
-- Receptionist Access to Nutri Availability
-- Allows receptionists to see nutri schedules for booking appointments
-- =============================================

-- Add receptionist access to nutri_availability
-- This allows receptionists to see nutri schedules for booking
create policy "Receptionists can view org nutri availability"
  on nutri_availability for select
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );

-- Add receptionist access to nutri_time_blocks
-- This allows receptionists to see blocked times for booking
create policy "Receptionists can view org nutri time blocks"
  on nutri_time_blocks for select
  using (
    is_receptionist()
    and is_nutri_in_my_org(nutri_id)
  );
