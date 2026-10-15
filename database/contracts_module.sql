-- Contratos para Bapesu IA. Ejecutar una vez en el SQL Editor de Supabase,
-- después del schema principal. No requiere el servidor Python.

CREATE TABLE IF NOT EXISTS public.bapesu_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_identification TEXT NOT NULL,
  client_snapshot JSONB NOT NULL,
  co_buyer_name TEXT,
  co_buyer_identification TEXT,
  lot TEXT NOT NULL,
  area_m2 NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (area_m2 >= 0),
  price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_in_words TEXT NOT NULL,
  payment_start_day SMALLINT NOT NULL CHECK (payment_start_day BETWEEN 1 AND 31),
  payment_deadline_day SMALLINT NOT NULL CHECK (payment_deadline_day BETWEEN 1 AND 31),
  initial_payment NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (initial_payment >= 0),
  monthly_installment_count SMALLINT NOT NULL DEFAULT 0 CHECK (monthly_installment_count >= 0),
  monthly_installment NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (monthly_installment >= 0),
  semiannual_installment_count SMALLINT NOT NULL DEFAULT 0 CHECK (semiannual_installment_count >= 0),
  semiannual_months TEXT NOT NULL,
  semiannual_installment NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (semiannual_installment >= 0),
  extraordinary_payment NUMERIC(14,2) CHECK (extraordinary_payment IS NULL OR extraordinary_payment >= 0),
  final_payment NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (final_payment >= 0),
  signing_date DATE NOT NULL,
  signing_city TEXT NOT NULL DEFAULT 'Yopal, Casanare',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'READY', 'SIGNED')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bapesu_contracts_company_created
  ON public.bapesu_contracts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bapesu_contracts_client
  ON public.bapesu_contracts(client_id);

DROP TRIGGER IF EXISTS trg_bapesu_contracts_updated_at ON public.bapesu_contracts;
CREATE TRIGGER trg_bapesu_contracts_updated_at
  BEFORE UPDATE ON public.bapesu_contracts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.bapesu_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bapesu_contracts_select ON public.bapesu_contracts;
DROP POLICY IF EXISTS bapesu_contracts_insert ON public.bapesu_contracts;
DROP POLICY IF EXISTS bapesu_contracts_update ON public.bapesu_contracts;
DROP POLICY IF EXISTS bapesu_contracts_delete ON public.bapesu_contracts;
CREATE POLICY bapesu_contracts_select ON public.bapesu_contracts FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY bapesu_contracts_insert ON public.bapesu_contracts FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY bapesu_contracts_update ON public.bapesu_contracts FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY bapesu_contracts_delete ON public.bapesu_contracts FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE TABLE IF NOT EXISTS public.bapesu_contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.bapesu_contracts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('LOT_MAP', 'BUYER_ID', 'PAYMENT_PLAN')),
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  storage_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contract_id, kind)
);

ALTER TABLE public.bapesu_contract_attachments
  DROP CONSTRAINT IF EXISTS bapesu_contract_attachments_kind_check;
ALTER TABLE public.bapesu_contract_attachments
  ADD CONSTRAINT bapesu_contract_attachments_kind_check CHECK (kind IN ('LOT_MAP', 'BUYER_ID', 'PAYMENT_PLAN'));

CREATE INDEX IF NOT EXISTS idx_bapesu_contract_attachments_contract
  ON public.bapesu_contract_attachments(contract_id);
ALTER TABLE public.bapesu_contract_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bapesu_contract_attachments_select ON public.bapesu_contract_attachments;
DROP POLICY IF EXISTS bapesu_contract_attachments_insert ON public.bapesu_contract_attachments;
DROP POLICY IF EXISTS bapesu_contract_attachments_delete ON public.bapesu_contract_attachments;
CREATE POLICY bapesu_contract_attachments_select ON public.bapesu_contract_attachments FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY bapesu_contract_attachments_insert ON public.bapesu_contract_attachments FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND EXISTS (SELECT 1 FROM public.bapesu_contracts c WHERE c.id = bapesu_contract_attachments.contract_id AND c.company_id = bapesu_contract_attachments.company_id)
  );
CREATE POLICY bapesu_contract_attachments_delete ON public.bapesu_contract_attachments FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

UPDATE public.bapesu_plans
SET modules = CASE WHEN modules @> '["contratos"]'::jsonb THEN modules ELSE modules || '["contratos"]'::jsonb END,
    updated_at = NOW()
WHERE id IN ('free', 'pro', 'enterprise');
