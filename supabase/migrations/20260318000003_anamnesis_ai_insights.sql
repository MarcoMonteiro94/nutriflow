-- Issue #10: Add AI insights/analysis field to anamnesis_reports
-- Stores structured AI-generated insights, suggestions, and recommendations.

alter table anamnesis_reports
  add column if not exists ai_insights jsonb default null;

comment on column anamnesis_reports.ai_insights is
  'AI-generated insights: summary, attention_points, dietary_patterns, suggestions, risk_factors';
