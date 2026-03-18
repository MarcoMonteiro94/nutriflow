-- Activity level on patient (for TMB/TDEE calculation)
ALTER TABLE patients ADD COLUMN activity_level text;

-- Nutrient targets on meal plans
ALTER TABLE meal_plans
  ADD COLUMN target_calories numeric(8,2),
  ADD COLUMN target_protein numeric(8,2),
  ADD COLUMN target_carbs numeric(8,2),
  ADD COLUMN target_fat numeric(8,2);
