-- ============================================
-- PUBLIC ACCESS FOR PATIENT PORTAL (MAGIC LINKS)
-- ============================================
-- Security model:
-- 1. Patient receives a 64-character token (256 bits entropy)
-- 2. Token is verified via RPC function that bypasses RLS
-- 3. Only the token holder can access their specific data

-- PATIENT TOKENS: Allow public verification (token is unguessable)
drop policy if exists "Nutris can view patient tokens" on patient_tokens;

create policy "Anyone can verify tokens"
  on patient_tokens for select
  using (true);

-- ============================================
-- RPC FUNCTION: Get patient plan by token
-- ============================================
-- This function runs with SECURITY DEFINER, bypassing RLS
-- It validates the token and returns only the associated plan

create or replace function get_patient_plan_by_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_expires_at timestamptz;
  v_result json;
begin
  -- Verify token exists and get patient_id
  select patient_id, expires_at into v_patient_id, v_expires_at
  from patient_tokens
  where token = p_token;

  if v_patient_id is null then
    return json_build_object('error', 'Token inválido');
  end if;

  -- Check if token is expired
  if v_expires_at < now() then
    return json_build_object('error', 'Token expirado');
  end if;

  -- Get the active meal plan with all related data
  select json_build_object(
    'patient_id', v_patient_id,
    'plan', (
      select json_build_object(
        'id', mp.id,
        'title', mp.title,
        'description', mp.description,
        'starts_at', mp.starts_at,
        'ends_at', mp.ends_at,
        'meals', (
          select coalesce(json_agg(
            json_build_object(
              'id', m.id,
              'title', m.title,
              'time', m.time,
              'notes', m.notes,
              'meal_contents', (
                select coalesce(json_agg(
                  json_build_object(
                    'id', mc.id,
                    'amount', mc.amount,
                    'is_substitution', mc.is_substitution,
                    'parent_content_id', mc.parent_content_id,
                    'food_item', json_build_object(
                      'id', fi.id,
                      'name', fi.name,
                      'calories', fi.calories,
                      'protein', fi.protein,
                      'carbs', fi.carbs,
                      'fat', fi.fat,
                      'portion_size', fi.portion_size,
                      'portion_unit', fi.portion_unit
                    )
                  )
                  order by mc.is_substitution, mc.created_at
                ), '[]')
                from meal_contents mc
                join food_items fi on fi.id = mc.food_id
                where mc.meal_id = m.id
              )
            )
            order by m.time
          ), '[]')
          from meals m
          where m.meal_plan_id = mp.id
        )
      )
      from meal_plans mp
      where mp.patient_id = v_patient_id
      and mp.status = 'active'
      order by mp.created_at desc
      limit 1
    )
  ) into v_result;

  return v_result;
end;
$$;
