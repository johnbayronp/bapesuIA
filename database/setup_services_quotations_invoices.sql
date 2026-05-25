-- ===================================================================
-- Migración: Servicios, Cotizaciones y Cuentas de Cobro (multi-tenant)
-- ===================================================================
-- Crea el catálogo de servicios de cada empresa y persiste tanto las
-- cotizaciones como las cuentas de cobro generadas desde el dashboard.
-- Todo aislado por company_id usando la función `current_user_company_id()`
-- creada en setup_multitenant.sql.
-- ===================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. Catálogo de servicios
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_services (
    id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id    UUID         NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,

    name          TEXT         NOT NULL,
    description   TEXT,
    default_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    unit          TEXT,                 -- 'hora', 'mes', 'pieza', etc.
    is_active     BOOLEAN      DEFAULT TRUE,

    created_by    UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bapesu_services_company_id ON public.bapesu_services(company_id);
CREATE INDEX IF NOT EXISTS idx_bapesu_services_name       ON public.bapesu_services(name);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bapesu_services_updated_at ON public.bapesu_services;
CREATE TRIGGER trg_bapesu_services_updated_at
    BEFORE UPDATE ON public.bapesu_services
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- 2. Cotizaciones
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_quotations (
    id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id      UUID         NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id       UUID         REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,

    -- Datos del cliente (snapshot al momento de generar)
    client_name     TEXT,
    client_nit      TEXT,
    client_email    TEXT,
    client_phone    TEXT,

    -- Cotización
    number          TEXT,
    issue_date      DATE         DEFAULT CURRENT_DATE,
    valid_days      INT          DEFAULT 30,
    project_type    TEXT,
    objective       TEXT,
    signature_name  TEXT,
    terms           TEXT,

    include_iva     BOOLEAN      DEFAULT FALSE,
    iva_rate        NUMERIC(5,2) DEFAULT 19,
    subtotal        NUMERIC(14,2) DEFAULT 0,
    iva_amount      NUMERIC(14,2) DEFAULT 0,
    total           NUMERIC(14,2) DEFAULT 0,

    status          TEXT         DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),

    created_by      UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_company_id ON public.bapesu_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id  ON public.bapesu_quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.bapesu_quotations(created_at DESC);

DROP TRIGGER IF EXISTS trg_bapesu_quotations_updated_at ON public.bapesu_quotations;
CREATE TRIGGER trg_bapesu_quotations_updated_at
    BEFORE UPDATE ON public.bapesu_quotations
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bapesu_quotation_items (
    id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id  UUID         NOT NULL REFERENCES public.bapesu_quotations(id) ON DELETE CASCADE,
    service_id    UUID         REFERENCES public.bapesu_services(id) ON DELETE SET NULL,

    description   TEXT         NOT NULL,
    quantity      NUMERIC(10,2) DEFAULT 1,
    price         NUMERIC(14,2) DEFAULT 0,
    position      INT          DEFAULT 0,

    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.bapesu_quotation_items(quotation_id);

-- ───────────────────────────────────────────────────────────────────
-- 3. Cuentas de cobro (invoices)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_invoices (
    id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id       UUID         NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id        UUID         REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,

    client_name      TEXT,
    client_nit       TEXT,
    client_email     TEXT,
    client_phone     TEXT,
    client_address   TEXT,

    number           TEXT,
    issue_date       DATE         DEFAULT CURRENT_DATE,
    due_date         DATE,
    concept          TEXT,
    notes            TEXT,
    payment_info     TEXT,

    include_iva      BOOLEAN      DEFAULT FALSE,
    iva_rate         NUMERIC(5,2) DEFAULT 19,
    include_retefuente BOOLEAN    DEFAULT FALSE,
    retefuente_rate  NUMERIC(5,2) DEFAULT 4,

    subtotal         NUMERIC(14,2) DEFAULT 0,
    iva_amount       NUMERIC(14,2) DEFAULT 0,
    retefuente_amount NUMERIC(14,2) DEFAULT 0,
    total            NUMERIC(14,2) DEFAULT 0,

    status           TEXT         DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),

    created_by       UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.bapesu_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON public.bapesu_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.bapesu_invoices(created_at DESC);

DROP TRIGGER IF EXISTS trg_bapesu_invoices_updated_at ON public.bapesu_invoices;
CREATE TRIGGER trg_bapesu_invoices_updated_at
    BEFORE UPDATE ON public.bapesu_invoices
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bapesu_invoice_items (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id   UUID         NOT NULL REFERENCES public.bapesu_invoices(id) ON DELETE CASCADE,
    service_id   UUID         REFERENCES public.bapesu_services(id) ON DELETE SET NULL,

    description  TEXT         NOT NULL,
    quantity     NUMERIC(10,2) DEFAULT 1,
    price        NUMERIC(14,2) DEFAULT 0,
    position     INT          DEFAULT 0,

    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.bapesu_invoice_items(invoice_id);

-- ===================================================================
-- 4. ROW LEVEL SECURITY (todo basado en company_id)
-- ===================================================================
ALTER TABLE public.bapesu_services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_quotations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_quotation_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_invoice_items    ENABLE ROW LEVEL SECURITY;

-- ── SERVICIOS ──
DROP POLICY IF EXISTS "services_select" ON public.bapesu_services;
DROP POLICY IF EXISTS "services_insert" ON public.bapesu_services;
DROP POLICY IF EXISTS "services_update" ON public.bapesu_services;
DROP POLICY IF EXISTS "services_delete" ON public.bapesu_services;

CREATE POLICY "services_select" ON public.bapesu_services FOR SELECT
    USING (company_id = public.current_user_company_id());
CREATE POLICY "services_insert" ON public.bapesu_services FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "services_update" ON public.bapesu_services FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "services_delete" ON public.bapesu_services FOR DELETE
    USING (company_id = public.current_user_company_id());

-- ── COTIZACIONES ──
DROP POLICY IF EXISTS "quotations_select" ON public.bapesu_quotations;
DROP POLICY IF EXISTS "quotations_insert" ON public.bapesu_quotations;
DROP POLICY IF EXISTS "quotations_update" ON public.bapesu_quotations;
DROP POLICY IF EXISTS "quotations_delete" ON public.bapesu_quotations;

CREATE POLICY "quotations_select" ON public.bapesu_quotations FOR SELECT
    USING (company_id = public.current_user_company_id());
CREATE POLICY "quotations_insert" ON public.bapesu_quotations FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "quotations_update" ON public.bapesu_quotations FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "quotations_delete" ON public.bapesu_quotations FOR DELETE
    USING (company_id = public.current_user_company_id());

-- ── ITEMS DE COTIZACIONES ── (por relación con quotation)
DROP POLICY IF EXISTS "quotation_items_select" ON public.bapesu_quotation_items;
DROP POLICY IF EXISTS "quotation_items_insert" ON public.bapesu_quotation_items;
DROP POLICY IF EXISTS "quotation_items_update" ON public.bapesu_quotation_items;
DROP POLICY IF EXISTS "quotation_items_delete" ON public.bapesu_quotation_items;

CREATE POLICY "quotation_items_select" ON public.bapesu_quotation_items FOR SELECT
    USING (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));
CREATE POLICY "quotation_items_insert" ON public.bapesu_quotation_items FOR INSERT
    WITH CHECK (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));
CREATE POLICY "quotation_items_update" ON public.bapesu_quotation_items FOR UPDATE
    USING (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));
CREATE POLICY "quotation_items_delete" ON public.bapesu_quotation_items FOR DELETE
    USING (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));

-- ── CUENTAS DE COBRO ──
DROP POLICY IF EXISTS "invoices_select" ON public.bapesu_invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.bapesu_invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.bapesu_invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.bapesu_invoices;

CREATE POLICY "invoices_select" ON public.bapesu_invoices FOR SELECT
    USING (company_id = public.current_user_company_id());
CREATE POLICY "invoices_insert" ON public.bapesu_invoices FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "invoices_update" ON public.bapesu_invoices FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "invoices_delete" ON public.bapesu_invoices FOR DELETE
    USING (company_id = public.current_user_company_id());

-- ── ITEMS DE CUENTAS DE COBRO ──
DROP POLICY IF EXISTS "invoice_items_select" ON public.bapesu_invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.bapesu_invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.bapesu_invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.bapesu_invoice_items;

CREATE POLICY "invoice_items_select" ON public.bapesu_invoice_items FOR SELECT
    USING (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));
CREATE POLICY "invoice_items_insert" ON public.bapesu_invoice_items FOR INSERT
    WITH CHECK (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));
CREATE POLICY "invoice_items_update" ON public.bapesu_invoice_items FOR UPDATE
    USING (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));
CREATE POLICY "invoice_items_delete" ON public.bapesu_invoice_items FOR DELETE
    USING (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));

-- ===================================================================
-- LISTO. Es idempotente. Ejecuta DESPUÉS de setup_multitenant.sql.
-- ===================================================================
