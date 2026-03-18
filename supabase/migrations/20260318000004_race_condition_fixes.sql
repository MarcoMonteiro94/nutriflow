-- Fix #52: Race condition fixes

-- Add unique constraint on patient_tokens.patient_id for upsert support
-- (currently allows multiple tokens per patient, causing delete+insert race condition)
alter table patient_tokens
  add constraint patient_tokens_patient_id_unique unique (patient_id);
