-- Synchronizes the live constraint with the attachment kinds sent by the app.
-- Run this once in the Supabase SQL editor for the affected project.
BEGIN;

ALTER TABLE public.bapesu_contract_attachments
  DROP CONSTRAINT IF EXISTS bapesu_contract_attachments_kind_check;

ALTER TABLE public.bapesu_contract_attachments
  ADD CONSTRAINT bapesu_contract_attachments_kind_check
  CHECK (kind IN ('LOT_MAP', 'BUYER_ID', 'PAYMENT_PLAN'));

COMMIT;
