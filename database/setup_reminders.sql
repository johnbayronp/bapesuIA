-- ===================================================================
-- Módulo de Recordatorios (multi-tenant)
-- Ejecutar DESPUÉS de setup_multitenant.sql
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.bapesu_reminders (
    id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id     UUID         NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id      UUID         REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,

    type           TEXT         NOT NULL CHECK (type IN ('payment', 'promotion', 'new_service')),
    title          TEXT         NOT NULL,
    message        TEXT,
    scheduled_date DATE,
    status         TEXT         DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'done')),

    created_by     UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ  DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_company_id      ON public.bapesu_reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_date  ON public.bapesu_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status          ON public.bapesu_reminders(status);

DROP TRIGGER IF EXISTS trg_bapesu_reminders_updated_at ON public.bapesu_reminders;
CREATE TRIGGER trg_bapesu_reminders_updated_at
    BEFORE UPDATE ON public.bapesu_reminders
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.bapesu_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_select" ON public.bapesu_reminders;
DROP POLICY IF EXISTS "reminders_insert" ON public.bapesu_reminders;
DROP POLICY IF EXISTS "reminders_update" ON public.bapesu_reminders;
DROP POLICY IF EXISTS "reminders_delete" ON public.bapesu_reminders;

CREATE POLICY "reminders_select" ON public.bapesu_reminders FOR SELECT
    USING (company_id = public.current_user_company_id());
CREATE POLICY "reminders_insert" ON public.bapesu_reminders FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "reminders_update" ON public.bapesu_reminders FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "reminders_delete" ON public.bapesu_reminders FOR DELETE
    USING (company_id = public.current_user_company_id());

-- ===================================================================
-- LISTO. Idempotente.
-- ===================================================================
