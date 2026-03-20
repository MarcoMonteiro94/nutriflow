-- Meal templates: allow nutritionists to save and reuse meal configurations.

CREATE TABLE meal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutri_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  time text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE meal_template_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES food_items(id),
  amount numeric(8,2) NOT NULL,
  is_substitution boolean DEFAULT false,
  parent_content_id uuid REFERENCES meal_template_contents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_contents ENABLE ROW LEVEL SECURITY;

-- meal_templates policies
CREATE POLICY "Nutris can view own templates"
  ON meal_templates FOR SELECT
  USING (auth.uid() = nutri_id);

CREATE POLICY "Nutris can create templates"
  ON meal_templates FOR INSERT
  WITH CHECK (auth.uid() = nutri_id);

CREATE POLICY "Nutris can delete own templates"
  ON meal_templates FOR DELETE
  USING (auth.uid() = nutri_id);

-- meal_template_contents policies
CREATE POLICY "Users can view template contents"
  ON meal_template_contents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = template_id
      AND meal_templates.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Users can create template contents"
  ON meal_template_contents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = template_id
      AND meal_templates.nutri_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete template contents"
  ON meal_template_contents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = template_id
      AND meal_templates.nutri_id = auth.uid()
    )
  );
