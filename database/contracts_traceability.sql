-- Audit trail and controlled contract deletion. Run once after contracts_module.sql.
BEGIN;

ALTER TABLE public.bapesu_contracts
  ADD COLUMN IF NOT EXISTS audit_reason TEXT;

CREATE TABLE IF NOT EXISTS public.bapesu_contract_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id UUID NOT NULL,
  contract_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CONTRACT_CREATED', 'CONTRACT_DELETED')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  reason TEXT,
  client_name TEXT,
  lot TEXT,
  price NUMERIC(14,2),
  signing_date DATE
);

CREATE INDEX IF NOT EXISTS idx_bapesu_contract_audit_company_time
  ON public.bapesu_contract_audit_log(company_id, occurred_at DESC);

ALTER TABLE public.bapesu_contract_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bapesu_contract_audit_select ON public.bapesu_contract_audit_log;
CREATE POLICY bapesu_contract_audit_select ON public.bapesu_contract_audit_log
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());
REVOKE INSERT, UPDATE, DELETE ON public.bapesu_contract_audit_log FROM anon, authenticated;
GRANT SELECT ON public.bapesu_contract_audit_log TO authenticated;

-- Preserve creation metadata already stored on existing contracts.
INSERT INTO public.bapesu_contract_audit_log
  (company_id, contract_id, action, actor_id, actor_email, occurred_at, reason, client_name, lot, price, signing_date)
SELECT c.company_id, c.id, 'CONTRACT_CREATED', c.created_by,
       COALESCE(u.email, au.email), c.created_at, NULLIF(BTRIM(c.audit_reason), ''),
       c.client_name, c.lot, c.price, c.signing_date
FROM public.bapesu_contracts c
LEFT JOIN public.users u ON u.id = c.created_by
LEFT JOIN auth.users au ON au.id = c.created_by
WHERE NOT EXISTS (
  SELECT 1 FROM public.bapesu_contract_audit_log a
  WHERE a.contract_id = c.id AND a.action = 'CONTRACT_CREATED'
);

CREATE OR REPLACE FUNCTION public.log_contract_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_email TEXT;
  v_reason TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_actor_id := COALESCE(v_actor_id, NEW.created_by);
    SELECT email INTO v_actor_email FROM public.users WHERE id = v_actor_id;
    INSERT INTO public.bapesu_contract_audit_log
      (company_id, contract_id, action, actor_id, actor_email, reason, client_name, lot, price, signing_date)
    VALUES
      (NEW.company_id, NEW.id, 'CONTRACT_CREATED', v_actor_id, v_actor_email,
       NULLIF(BTRIM(NEW.audit_reason), ''), NEW.client_name, NEW.lot, NEW.price, NEW.signing_date);
    RETURN NEW;
  END IF;

  SELECT email INTO v_actor_email FROM public.users WHERE id = v_actor_id;
  v_reason := NULLIF(BTRIM(current_setting('app.contract_delete_reason', TRUE)), '');
  IF v_reason IS NULL THEN
    v_reason := 'Eliminación por cascada o proceso administrativo';
  END IF;

  INSERT INTO public.bapesu_contract_audit_log
    (company_id, contract_id, action, actor_id, actor_email, reason, client_name, lot, price, signing_date)
  VALUES
    (OLD.company_id, OLD.id, 'CONTRACT_DELETED', v_actor_id, v_actor_email, v_reason,
     OLD.client_name, OLD.lot, OLD.price, OLD.signing_date);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_audit_insert ON public.bapesu_contracts;
CREATE TRIGGER trg_contract_audit_insert
  AFTER INSERT ON public.bapesu_contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_contract_audit_event();

DROP TRIGGER IF EXISTS trg_contract_audit_delete ON public.bapesu_contracts;
CREATE TRIGGER trg_contract_audit_delete
  BEFORE DELETE ON public.bapesu_contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_contract_audit_event();

-- All contract deletions must pass through this function so the reason and audit
-- event are written atomically and direct authenticated DELETE is unavailable.
DROP POLICY IF EXISTS bapesu_contracts_delete ON public.bapesu_contracts;
REVOKE DELETE ON public.bapesu_contracts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_contract_with_audit(p_contract_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id UUID;
  v_reason TEXT := BTRIM(COALESCE(p_reason, ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar un contrato.';
  END IF;
  IF LENGTH(v_reason) < 5 THEN
    RAISE EXCEPTION 'Escribe un motivo de al menos 5 caracteres.';
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.bapesu_contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el contrato.';
  END IF;
  IF v_company_id IS DISTINCT FROM public.current_user_company_id() THEN
    RAISE EXCEPTION 'No puedes eliminar contratos de otra empresa.';
  END IF;

  PERFORM set_config('app.contract_delete_reason', LEFT(v_reason, 1000), TRUE);
  DELETE FROM public.bapesu_contracts WHERE id = p_contract_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_contract_with_audit(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_contract_with_audit(UUID, TEXT) TO authenticated;

COMMIT;
