-- ===================================================================
-- Módulo de Facturación (facturas simples de venta)
-- Ejecutar DESPUÉS de setup_multitenant.sql y setup_services_quotations_invoices.sql
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.bapesu_facturas (
    id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id          UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id           UUID          REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,

    -- Snapshot del cliente
    client_name         TEXT,
    client_nit          TEXT,
    client_email        TEXT,
    client_phone        TEXT,
    client_address      TEXT,

    -- Identificación de la factura
    prefix              TEXT          DEFAULT 'FAC',
    number              TEXT,
    issue_date          DATE          DEFAULT CURRENT_DATE,
    due_date            DATE,

    -- Descripción
    concept             TEXT,
    notes               TEXT,
    payment_info        TEXT,

    -- Impuestos y retenciones
    include_iva         BOOLEAN       DEFAULT FALSE,
    iva_rate            NUMERIC(5,2)  DEFAULT 19,

    include_retefuente  BOOLEAN       DEFAULT FALSE,
    retefuente_rate     NUMERIC(5,2)  DEFAULT 4,

    include_reteiva     BOOLEAN       DEFAULT FALSE,
    reteiva_rate        NUMERIC(5,2)  DEFAULT 15,   -- % del IVA (no del subtotal)

    include_reteica     BOOLEAN       DEFAULT FALSE,
    reteica_rate        NUMERIC(7,4)  DEFAULT 0.414, -- por mil (‰), ej: 0.414 = 4.14‰

    -- Totales calculados
    subtotal            NUMERIC(14,2) DEFAULT 0,
    iva_amount          NUMERIC(14,2) DEFAULT 0,
    retefuente_amount   NUMERIC(14,2) DEFAULT 0,
    reteiva_amount      NUMERIC(14,2) DEFAULT 0,
    reteica_amount      NUMERIC(14,2) DEFAULT 0,
    total               NUMERIC(14,2) DEFAULT 0,

    status              TEXT          DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','paid','cancelled')),

    created_by          UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ   DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_company_id  ON public.bapesu_facturas(company_id);
CREATE INDEX IF NOT EXISTS idx_facturas_client_id   ON public.bapesu_facturas(client_id);
CREATE INDEX IF NOT EXISTS idx_facturas_created_at  ON public.bapesu_facturas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_status      ON public.bapesu_facturas(status);

DROP TRIGGER IF EXISTS trg_bapesu_facturas_updated_at ON public.bapesu_facturas;
CREATE TRIGGER trg_bapesu_facturas_updated_at
    BEFORE UPDATE ON public.bapesu_facturas
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Ítems de factura ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_factura_items (
    id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    factura_id  UUID          NOT NULL REFERENCES public.bapesu_facturas(id) ON DELETE CASCADE,
    service_id  UUID          REFERENCES public.bapesu_services(id) ON DELETE SET NULL,

    description TEXT          NOT NULL,
    quantity    NUMERIC(10,2) DEFAULT 1,
    price       NUMERIC(14,2) DEFAULT 0,
    position    INT           DEFAULT 0,

    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factura_items_factura_id ON public.bapesu_factura_items(factura_id);

-- ── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_facturas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_factura_items  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facturas_select" ON public.bapesu_facturas;
DROP POLICY IF EXISTS "facturas_insert" ON public.bapesu_facturas;
DROP POLICY IF EXISTS "facturas_update" ON public.bapesu_facturas;
DROP POLICY IF EXISTS "facturas_delete" ON public.bapesu_facturas;

CREATE POLICY "facturas_select" ON public.bapesu_facturas FOR SELECT
    USING (company_id = public.current_user_company_id());
CREATE POLICY "facturas_insert" ON public.bapesu_facturas FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "facturas_update" ON public.bapesu_facturas FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "facturas_delete" ON public.bapesu_facturas FOR DELETE
    USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "factura_items_select" ON public.bapesu_factura_items;
DROP POLICY IF EXISTS "factura_items_insert" ON public.bapesu_factura_items;
DROP POLICY IF EXISTS "factura_items_update" ON public.bapesu_factura_items;
DROP POLICY IF EXISTS "factura_items_delete" ON public.bapesu_factura_items;

CREATE POLICY "factura_items_select" ON public.bapesu_factura_items FOR SELECT
    USING (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));
CREATE POLICY "factura_items_insert" ON public.bapesu_factura_items FOR INSERT
    WITH CHECK (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));
CREATE POLICY "factura_items_update" ON public.bapesu_factura_items FOR UPDATE
    USING (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));
CREATE POLICY "factura_items_delete" ON public.bapesu_factura_items FOR DELETE
    USING (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));

-- ===================================================================
-- LISTO. Idempotente.
-- ===================================================================
