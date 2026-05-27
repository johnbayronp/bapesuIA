-- =====================================================================
-- BAPESU PLATFORM — Schema completo
-- =====================================================================
-- Archivo único, idempotente. Corre completo desde cero o sobre una
-- base existente sin errores (usa IF NOT EXISTS, DROP … IF EXISTS, etc.)
--
-- ORDEN DE EJECUCIÓN (dependencias):
--   1. Extensiones y helpers
--   2. Usuarios y empresas       (multi-tenant)
--   3. Clientes
--   4. Servicios, cotizaciones, cuentas de cobro
--   5. Facturación (facturas de venta)
--   6. Recordatorios
--   7. Inventario: categorías, productos, movimientos
--   8. Inventario: proveedores, bodegas, operaciones
--   9. Migraciones de columnas   (seguras con ALTER … IF NOT EXISTS)
-- =====================================================================

-- ── Extensiones ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- §1. FUNCIÓN HELPER updated_at  (compartida por todos los módulos)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- =====================================================================
-- §2. USUARIOS Y EMPRESAS (multi-tenant)
-- =====================================================================

-- ── Perfiles de usuario ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT        UNIQUE NOT NULL,
    role        TEXT        DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    first_name  TEXT,
    last_name   TEXT,
    is_active   BOOLEAN     DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ── Empresas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_companies (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name         TEXT        NOT NULL,
    nit          TEXT,
    tagline      TEXT,
    phone        TEXT,
    email        TEXT,
    instagram    TEXT,
    website      TEXT,
    address      TEXT,
    city         TEXT,
    logo_url     TEXT,
    payment_info TEXT,
    brand_color  TEXT        DEFAULT '#0f172a',
    plan         TEXT        DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    is_active    BOOLEAN     DEFAULT TRUE,
    created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Migración: columna de color de marca (idempotente)
ALTER TABLE public.bapesu_companies ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#0f172a';

CREATE INDEX IF NOT EXISTS idx_bapesu_companies_created_by ON public.bapesu_companies(created_by);

DROP TRIGGER IF EXISTS trg_bapesu_companies_updated_at ON public.bapesu_companies;
CREATE TRIGGER trg_bapesu_companies_updated_at
    BEFORE UPDATE ON public.bapesu_companies
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── company_id en users ──────────────────────────────────────────────
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.bapesu_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- ── Función helper: devuelve company_id sin disparar RLS ─────────────
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO anon, authenticated;

-- ── Trigger: auto-crear perfil al registrarse ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, is_active)
    VALUES (NEW.id, NEW.email, 'user', TRUE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill usuarios ya existentes
INSERT INTO public.users (id, email, role, is_active)
SELECT au.id, au.email, 'user', TRUE
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- ── Función admin: asignar usuario a empresa ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_assign_user_to_company(
    p_user_id    UUID,
    p_company_id UUID,
    p_role       TEXT DEFAULT 'user'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    caller_company UUID;
    caller_role    TEXT;
BEGIN
    SELECT company_id, role INTO caller_company, caller_role
    FROM public.users WHERE id = auth.uid() LIMIT 1;

    IF caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Solo los administradores pueden asignar usuarios';
    END IF;
    IF caller_company <> p_company_id THEN
        RAISE EXCEPTION 'No puedes asignar usuarios a otra empresa';
    END IF;

    INSERT INTO public.users (id, email, role, company_id, is_active, updated_at)
    SELECT p_user_id, au.email, p_role, p_company_id, TRUE, NOW()
    FROM auth.users au WHERE au.id = p_user_id
    ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role, company_id = EXCLUDED.company_id,
            is_active = TRUE, updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_user_to_company(UUID, UUID, TEXT) TO authenticated;

-- ── RLS: users ───────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view company users"   ON public.users;
DROP POLICY IF EXISTS "Members can update company users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their profile"   ON public.users;

CREATE POLICY "Members can view company users" ON public.users FOR SELECT
    USING (id = auth.uid() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id()));

CREATE POLICY "Users can insert their profile" ON public.users FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Members can update company users" ON public.users FOR UPDATE
    USING (id = auth.uid() OR (company_id IS NOT NULL AND company_id = public.current_user_company_id()));

-- ── RLS: bapesu_companies ────────────────────────────────────────────
ALTER TABLE public.bapesu_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their company"     ON public.bapesu_companies;
DROP POLICY IF EXISTS "Authenticated can create companies" ON public.bapesu_companies;
DROP POLICY IF EXISTS "Members can update their company"   ON public.bapesu_companies;

CREATE POLICY "Members can view their company" ON public.bapesu_companies FOR SELECT
    USING (id = public.current_user_company_id() OR created_by = auth.uid());

CREATE POLICY "Authenticated can create companies" ON public.bapesu_companies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update their company" ON public.bapesu_companies FOR UPDATE
    USING (id = public.current_user_company_id());

-- ── Tabla de acceso a cotizaciones ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cotizacion_access_requests (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    email        TEXT        NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    granted      BOOLEAN     DEFAULT FALSE,
    granted_at   TIMESTAMPTZ
);

ALTER TABLE public.cotizacion_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can request access" ON public.cotizacion_access_requests;
CREATE POLICY "Anyone can request access" ON public.cotizacion_access_requests FOR INSERT
    TO anon, authenticated WITH CHECK (TRUE);

-- =====================================================================
-- §3. CLIENTES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bapesu_clients (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    name       TEXT        NOT NULL,
    nit        TEXT,
    email      TEXT,
    phone      TEXT,
    city       TEXT,
    address    TEXT,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bapesu_clients
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.bapesu_companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bapesu_clients_company_id ON public.bapesu_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_bapesu_clients_created_at ON public.bapesu_clients(created_at DESC);

DROP TRIGGER IF EXISTS trg_bapesu_clients_updated_at ON public.bapesu_clients;
CREATE TRIGGER trg_bapesu_clients_updated_at
    BEFORE UPDATE ON public.bapesu_clients
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS: bapesu_clients ──────────────────────────────────────────────
ALTER TABLE public.bapesu_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view clients"   ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can insert clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can update clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can delete clients" ON public.bapesu_clients;

CREATE POLICY "Company members can view clients"   ON public.bapesu_clients FOR SELECT
    USING (company_id = public.current_user_company_id());
CREATE POLICY "Company members can insert clients" ON public.bapesu_clients FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "Company members can update clients" ON public.bapesu_clients FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "Company members can delete clients" ON public.bapesu_clients FOR DELETE
    USING (company_id = public.current_user_company_id());

-- =====================================================================
-- §4. SERVICIOS, COTIZACIONES Y CUENTAS DE COBRO
-- =====================================================================

-- ── Catálogo de servicios ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_services (
    id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id    UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    name          TEXT          NOT NULL,
    description   TEXT,
    default_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    unit          TEXT,
    is_active     BOOLEAN       DEFAULT TRUE,
    created_by    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ   DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bapesu_services_company_id ON public.bapesu_services(company_id);

DROP TRIGGER IF EXISTS trg_bapesu_services_updated_at ON public.bapesu_services;
CREATE TRIGGER trg_bapesu_services_updated_at
    BEFORE UPDATE ON public.bapesu_services
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Cotizaciones ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_quotations (
    id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id     UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id      UUID          REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,
    client_name    TEXT,
    client_nit     TEXT,
    client_email   TEXT,
    client_phone   TEXT,
    number         TEXT,
    issue_date     DATE          DEFAULT CURRENT_DATE,
    valid_days     INT           DEFAULT 30,
    project_type   TEXT,
    objective      TEXT,
    signature_name TEXT,
    terms          TEXT,
    include_iva    BOOLEAN       DEFAULT FALSE,
    iva_rate       NUMERIC(5,2)  DEFAULT 19,
    subtotal       NUMERIC(14,2) DEFAULT 0,
    iva_amount     NUMERIC(14,2) DEFAULT 0,
    total          NUMERIC(14,2) DEFAULT 0,
    status         TEXT          DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),
    created_by     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ   DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_company_id ON public.bapesu_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id  ON public.bapesu_quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.bapesu_quotations(created_at DESC);

DROP TRIGGER IF EXISTS trg_bapesu_quotations_updated_at ON public.bapesu_quotations;
CREATE TRIGGER trg_bapesu_quotations_updated_at
    BEFORE UPDATE ON public.bapesu_quotations
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bapesu_quotation_items (
    id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id UUID          NOT NULL REFERENCES public.bapesu_quotations(id) ON DELETE CASCADE,
    service_id   UUID          REFERENCES public.bapesu_services(id) ON DELETE SET NULL,
    description  TEXT          NOT NULL,
    quantity     NUMERIC(10,2) DEFAULT 1,
    price        NUMERIC(14,2) DEFAULT 0,
    position     INT           DEFAULT 0,
    created_at   TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.bapesu_quotation_items(quotation_id);

-- ── Cuentas de cobro ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_invoices (
    id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id          UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id           UUID          REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,
    client_name         TEXT,
    client_nit          TEXT,
    client_email        TEXT,
    client_phone        TEXT,
    client_address      TEXT,
    number              TEXT,
    issue_date          DATE          DEFAULT CURRENT_DATE,
    due_date            DATE,
    concept             TEXT,
    notes               TEXT,
    payment_info        TEXT,
    include_iva         BOOLEAN       DEFAULT FALSE,
    iva_rate            NUMERIC(5,2)  DEFAULT 19,
    include_retefuente  BOOLEAN       DEFAULT FALSE,
    retefuente_rate     NUMERIC(5,2)  DEFAULT 4,
    subtotal            NUMERIC(14,2) DEFAULT 0,
    iva_amount          NUMERIC(14,2) DEFAULT 0,
    retefuente_amount   NUMERIC(14,2) DEFAULT 0,
    total               NUMERIC(14,2) DEFAULT 0,
    status              TEXT          DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
    created_by          UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ   DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.bapesu_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON public.bapesu_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.bapesu_invoices(created_at DESC);

DROP TRIGGER IF EXISTS trg_bapesu_invoices_updated_at ON public.bapesu_invoices;
CREATE TRIGGER trg_bapesu_invoices_updated_at
    BEFORE UPDATE ON public.bapesu_invoices
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bapesu_invoice_items (
    id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id  UUID          NOT NULL REFERENCES public.bapesu_invoices(id) ON DELETE CASCADE,
    service_id  UUID          REFERENCES public.bapesu_services(id) ON DELETE SET NULL,
    description TEXT          NOT NULL,
    quantity    NUMERIC(10,2) DEFAULT 1,
    price       NUMERIC(14,2) DEFAULT 0,
    position    INT           DEFAULT 0,
    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.bapesu_invoice_items(invoice_id);

-- ── RLS §4 ───────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_quotations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_invoice_items   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_select" ON public.bapesu_services;
DROP POLICY IF EXISTS "services_insert" ON public.bapesu_services;
DROP POLICY IF EXISTS "services_update" ON public.bapesu_services;
DROP POLICY IF EXISTS "services_delete" ON public.bapesu_services;
CREATE POLICY "services_select" ON public.bapesu_services FOR SELECT USING (company_id = public.current_user_company_id());
CREATE POLICY "services_insert" ON public.bapesu_services FOR INSERT WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "services_update" ON public.bapesu_services FOR UPDATE USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "services_delete" ON public.bapesu_services FOR DELETE USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "quotations_select" ON public.bapesu_quotations;
DROP POLICY IF EXISTS "quotations_insert" ON public.bapesu_quotations;
DROP POLICY IF EXISTS "quotations_update" ON public.bapesu_quotations;
DROP POLICY IF EXISTS "quotations_delete" ON public.bapesu_quotations;
CREATE POLICY "quotations_select" ON public.bapesu_quotations FOR SELECT USING (company_id = public.current_user_company_id());
CREATE POLICY "quotations_insert" ON public.bapesu_quotations FOR INSERT WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "quotations_update" ON public.bapesu_quotations FOR UPDATE USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "quotations_delete" ON public.bapesu_quotations FOR DELETE USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "quotation_items_select" ON public.bapesu_quotation_items;
DROP POLICY IF EXISTS "quotation_items_insert" ON public.bapesu_quotation_items;
DROP POLICY IF EXISTS "quotation_items_update" ON public.bapesu_quotation_items;
DROP POLICY IF EXISTS "quotation_items_delete" ON public.bapesu_quotation_items;
CREATE POLICY "quotation_items_select" ON public.bapesu_quotation_items FOR SELECT USING (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));
CREATE POLICY "quotation_items_insert" ON public.bapesu_quotation_items FOR INSERT WITH CHECK (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));
CREATE POLICY "quotation_items_update" ON public.bapesu_quotation_items FOR UPDATE USING (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));
CREATE POLICY "quotation_items_delete" ON public.bapesu_quotation_items FOR DELETE USING (quotation_id IN (SELECT id FROM public.bapesu_quotations WHERE company_id = public.current_user_company_id()));

DROP POLICY IF EXISTS "invoices_select" ON public.bapesu_invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.bapesu_invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.bapesu_invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.bapesu_invoices;
CREATE POLICY "invoices_select" ON public.bapesu_invoices FOR SELECT USING (company_id = public.current_user_company_id());
CREATE POLICY "invoices_insert" ON public.bapesu_invoices FOR INSERT WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "invoices_update" ON public.bapesu_invoices FOR UPDATE USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "invoices_delete" ON public.bapesu_invoices FOR DELETE USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "invoice_items_select" ON public.bapesu_invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.bapesu_invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.bapesu_invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.bapesu_invoice_items;
CREATE POLICY "invoice_items_select" ON public.bapesu_invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));
CREATE POLICY "invoice_items_insert" ON public.bapesu_invoice_items FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));
CREATE POLICY "invoice_items_update" ON public.bapesu_invoice_items FOR UPDATE USING (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));
CREATE POLICY "invoice_items_delete" ON public.bapesu_invoice_items FOR DELETE USING (invoice_id IN (SELECT id FROM public.bapesu_invoices WHERE company_id = public.current_user_company_id()));

-- =====================================================================
-- §5. FACTURACIÓN (facturas de venta con retenciones colombianas)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bapesu_facturas (
    id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id         UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id          UUID          REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,
    client_name        TEXT,
    client_nit         TEXT,
    client_email       TEXT,
    client_phone       TEXT,
    client_address     TEXT,
    prefix             TEXT          DEFAULT 'FAC',
    number             TEXT,
    issue_date         DATE          DEFAULT CURRENT_DATE,
    due_date           DATE,
    concept            TEXT,
    notes              TEXT,
    payment_info       TEXT,
    include_iva        BOOLEAN       DEFAULT FALSE,
    iva_rate           NUMERIC(5,2)  DEFAULT 19,
    include_retefuente BOOLEAN       DEFAULT FALSE,
    retefuente_rate    NUMERIC(5,2)  DEFAULT 4,
    include_reteiva    BOOLEAN       DEFAULT FALSE,
    reteiva_rate       NUMERIC(5,2)  DEFAULT 15,
    include_reteica    BOOLEAN       DEFAULT FALSE,
    reteica_rate       NUMERIC(7,4)  DEFAULT 0.414,
    subtotal           NUMERIC(14,2) DEFAULT 0,
    iva_amount         NUMERIC(14,2) DEFAULT 0,
    retefuente_amount  NUMERIC(14,2) DEFAULT 0,
    reteiva_amount     NUMERIC(14,2) DEFAULT 0,
    reteica_amount     NUMERIC(14,2) DEFAULT 0,
    total              NUMERIC(14,2) DEFAULT 0,
    status             TEXT          DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
    created_by         UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ   DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_company_id ON public.bapesu_facturas(company_id);
CREATE INDEX IF NOT EXISTS idx_facturas_client_id  ON public.bapesu_facturas(client_id);
CREATE INDEX IF NOT EXISTS idx_facturas_created_at ON public.bapesu_facturas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_status     ON public.bapesu_facturas(status);

DROP TRIGGER IF EXISTS trg_bapesu_facturas_updated_at ON public.bapesu_facturas;
CREATE TRIGGER trg_bapesu_facturas_updated_at
    BEFORE UPDATE ON public.bapesu_facturas
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bapesu_factura_items (
    id         UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    factura_id UUID          NOT NULL REFERENCES public.bapesu_facturas(id) ON DELETE CASCADE,
    service_id UUID          REFERENCES public.bapesu_services(id) ON DELETE SET NULL,
    description TEXT         NOT NULL,
    quantity   NUMERIC(10,2) DEFAULT 1,
    price      NUMERIC(14,2) DEFAULT 0,
    position   INT           DEFAULT 0,
    created_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factura_items_factura_id ON public.bapesu_factura_items(factura_id);

-- ── RLS §5 ───────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_facturas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_factura_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facturas_select" ON public.bapesu_facturas;
DROP POLICY IF EXISTS "facturas_insert" ON public.bapesu_facturas;
DROP POLICY IF EXISTS "facturas_update" ON public.bapesu_facturas;
DROP POLICY IF EXISTS "facturas_delete" ON public.bapesu_facturas;
CREATE POLICY "facturas_select" ON public.bapesu_facturas FOR SELECT USING (company_id = public.current_user_company_id());
CREATE POLICY "facturas_insert" ON public.bapesu_facturas FOR INSERT WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "facturas_update" ON public.bapesu_facturas FOR UPDATE USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "facturas_delete" ON public.bapesu_facturas FOR DELETE USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "factura_items_select" ON public.bapesu_factura_items;
DROP POLICY IF EXISTS "factura_items_insert" ON public.bapesu_factura_items;
DROP POLICY IF EXISTS "factura_items_update" ON public.bapesu_factura_items;
DROP POLICY IF EXISTS "factura_items_delete" ON public.bapesu_factura_items;
CREATE POLICY "factura_items_select" ON public.bapesu_factura_items FOR SELECT USING (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));
CREATE POLICY "factura_items_insert" ON public.bapesu_factura_items FOR INSERT WITH CHECK (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));
CREATE POLICY "factura_items_update" ON public.bapesu_factura_items FOR UPDATE USING (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));
CREATE POLICY "factura_items_delete" ON public.bapesu_factura_items FOR DELETE USING (factura_id IN (SELECT id FROM public.bapesu_facturas WHERE company_id = public.current_user_company_id()));

-- =====================================================================
-- §6. RECORDATORIOS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bapesu_reminders (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id     UUID        NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    client_id      UUID        REFERENCES public.bapesu_clients(id) ON DELETE SET NULL,
    type           TEXT        NOT NULL CHECK (type IN ('payment', 'promotion', 'new_service')),
    title          TEXT        NOT NULL,
    message        TEXT,
    scheduled_date DATE,
    status         TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'done')),
    created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_company_id     ON public.bapesu_reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_date ON public.bapesu_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status         ON public.bapesu_reminders(status);

DROP TRIGGER IF EXISTS trg_bapesu_reminders_updated_at ON public.bapesu_reminders;
CREATE TRIGGER trg_bapesu_reminders_updated_at
    BEFORE UPDATE ON public.bapesu_reminders
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS §6 ───────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_select" ON public.bapesu_reminders;
DROP POLICY IF EXISTS "reminders_insert" ON public.bapesu_reminders;
DROP POLICY IF EXISTS "reminders_update" ON public.bapesu_reminders;
DROP POLICY IF EXISTS "reminders_delete" ON public.bapesu_reminders;
CREATE POLICY "reminders_select" ON public.bapesu_reminders FOR SELECT USING (company_id = public.current_user_company_id());
CREATE POLICY "reminders_insert" ON public.bapesu_reminders FOR INSERT WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "reminders_update" ON public.bapesu_reminders FOR UPDATE USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "reminders_delete" ON public.bapesu_reminders FOR DELETE USING (company_id = public.current_user_company_id());

-- =====================================================================
-- §7. INVENTARIO — Categorías, Productos, Movimientos de stock
-- =====================================================================

-- ── Categorías de inventario ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_inventory_categories (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID        NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    parent_id   UUID        REFERENCES public.bapesu_inventory_categories(id) ON DELETE SET NULL,
    description TEXT,
    color       TEXT        DEFAULT '#6366f1',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Proveedores ──────────────────────────────────────────────────────
-- (definidos antes de bapesu_products para la FK supplier_id)
CREATE TABLE IF NOT EXISTS public.bapesu_suppliers (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID        NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    name       TEXT        NOT NULL,
    nit        TEXT,
    contact    TEXT,
    email      TEXT,
    phone      TEXT,
    address    TEXT,
    notes      TEXT,
    is_active  BOOLEAN     DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bodegas / ubicaciones ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_warehouses (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID        NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    address     TEXT,
    description TEXT,
    is_active   BOOLEAN     DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Productos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_products (
    id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id       UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    name             TEXT          NOT NULL,
    sku              TEXT,
    barcode          TEXT,
    description      TEXT,
    category_id      UUID          REFERENCES public.bapesu_inventory_categories(id) ON DELETE SET NULL,
    unit             TEXT          DEFAULT 'unidad',
    photo_url        TEXT,
    is_active        BOOLEAN       DEFAULT TRUE,
    -- Stock (NUMERIC para soportar decimales: kg, litros, metros, etc.)
    stock_available  NUMERIC(14,3) DEFAULT 0,
    stock_reserved   NUMERIC(14,3) DEFAULT 0,
    stock_in_transit NUMERIC(14,3) DEFAULT 0,
    stock_min        NUMERIC(14,3) DEFAULT 0,
    stock_location   TEXT,
    supplier_id      UUID          REFERENCES public.bapesu_suppliers(id) ON DELETE SET NULL,
    -- Precios
    purchase_price   NUMERIC(14,2) DEFAULT 0,
    sale_price       NUMERIC(14,2) DEFAULT 0,
    tax_rate         NUMERIC(5,2)  DEFAULT 19,
    -- Meta
    created_by       UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ   DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Movimientos de stock ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_stock_movements (
    id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID          NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    product_id UUID          NOT NULL REFERENCES public.bapesu_products(id) ON DELETE CASCADE,
    type       TEXT          NOT NULL CHECK (type IN ('entrada','salida','ajuste','reserva')),
    quantity   NUMERIC(14,3) NOT NULL,
    notes      TEXT,
    created_by UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Índices §7 ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_cat_company   ON public.bapesu_inventory_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.bapesu_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON public.bapesu_warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company  ON public.bapesu_products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.bapesu_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku      ON public.bapesu_products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_mov_product ON public.bapesu_stock_movements(product_id);

-- ── Triggers updated_at §7 ───────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inv_cat_updated_at') THEN
        CREATE TRIGGER trg_inv_cat_updated_at BEFORE UPDATE ON public.bapesu_inventory_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
        CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.bapesu_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_suppliers_updated_at') THEN
        CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.bapesu_suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_warehouses_updated_at') THEN
        CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON public.bapesu_warehouses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- ── RLS §7 ───────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_warehouses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_stock_movements      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_cat_select" ON public.bapesu_inventory_categories;
DROP POLICY IF EXISTS "inv_cat_insert" ON public.bapesu_inventory_categories;
DROP POLICY IF EXISTS "inv_cat_update" ON public.bapesu_inventory_categories;
DROP POLICY IF EXISTS "inv_cat_delete" ON public.bapesu_inventory_categories;
CREATE POLICY "inv_cat_select" ON public.bapesu_inventory_categories FOR SELECT TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "inv_cat_insert" ON public.bapesu_inventory_categories FOR INSERT TO authenticated WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "inv_cat_update" ON public.bapesu_inventory_categories FOR UPDATE TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "inv_cat_delete" ON public.bapesu_inventory_categories FOR DELETE TO authenticated USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "suppliers_all" ON public.bapesu_suppliers;
CREATE POLICY "suppliers_all" ON public.bapesu_suppliers FOR ALL TO authenticated USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "warehouses_all" ON public.bapesu_warehouses;
CREATE POLICY "warehouses_all" ON public.bapesu_warehouses FOR ALL TO authenticated USING (company_id = public.current_user_company_id()) WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "products_select" ON public.bapesu_products;
DROP POLICY IF EXISTS "products_insert" ON public.bapesu_products;
DROP POLICY IF EXISTS "products_update" ON public.bapesu_products;
DROP POLICY IF EXISTS "products_delete" ON public.bapesu_products;
CREATE POLICY "products_select" ON public.bapesu_products FOR SELECT TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "products_insert" ON public.bapesu_products FOR INSERT TO authenticated WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "products_update" ON public.bapesu_products FOR UPDATE TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "products_delete" ON public.bapesu_products FOR DELETE TO authenticated USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "stock_mov_select" ON public.bapesu_stock_movements;
DROP POLICY IF EXISTS "stock_mov_insert" ON public.bapesu_stock_movements;
CREATE POLICY "stock_mov_select" ON public.bapesu_stock_movements FOR SELECT TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "stock_mov_insert" ON public.bapesu_stock_movements FOR INSERT TO authenticated WITH CHECK (company_id = public.current_user_company_id());

-- =====================================================================
-- §8. INVENTARIO — Operaciones (entrada / salida / traslado / conteo)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bapesu_inventory_ops (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id   UUID        NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
    type         TEXT        NOT NULL CHECK (type IN ('entrada','salida','traslado','conteo')),
    status       TEXT        NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador','confirmado','anulado')),
    reference    TEXT,
    op_date      DATE        DEFAULT CURRENT_DATE,
    supplier_id  UUID        REFERENCES public.bapesu_suppliers(id) ON DELETE SET NULL,
    warehouse_to   UUID      REFERENCES public.bapesu_warehouses(id) ON DELETE SET NULL,
    warehouse_from UUID      REFERENCES public.bapesu_warehouses(id) ON DELETE SET NULL,
    client_ref   TEXT,
    notes        TEXT,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bapesu_inventory_op_items (
    id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    op_id        UUID          NOT NULL REFERENCES public.bapesu_inventory_ops(id) ON DELETE CASCADE,
    product_id   UUID          NOT NULL REFERENCES public.bapesu_products(id) ON DELETE CASCADE,
    quantity     NUMERIC(14,3) NOT NULL DEFAULT 0,
    unit_cost    NUMERIC(14,2) DEFAULT 0,
    qty_expected NUMERIC(14,3) DEFAULT 0,
    qty_counted  NUMERIC(14,3) DEFAULT 0,
    lot_number   TEXT,
    expiry_date  DATE,
    notes        TEXT,
    position     INTEGER       DEFAULT 0
);

-- ── Índices §8 ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_ops_company   ON public.bapesu_inventory_ops(company_id);
CREATE INDEX IF NOT EXISTS idx_inv_ops_type      ON public.bapesu_inventory_ops(type);
CREATE INDEX IF NOT EXISTS idx_inv_ops_status    ON public.bapesu_inventory_ops(status);
CREATE INDEX IF NOT EXISTS idx_inv_op_items_op   ON public.bapesu_inventory_op_items(op_id);
CREATE INDEX IF NOT EXISTS idx_inv_op_items_prod ON public.bapesu_inventory_op_items(product_id);

-- ── Trigger updated_at §8 ────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inv_ops_updated_at') THEN
        CREATE TRIGGER trg_inv_ops_updated_at BEFORE UPDATE ON public.bapesu_inventory_ops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- ── RLS §8 ───────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_inventory_ops      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_inventory_op_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_ops_select" ON public.bapesu_inventory_ops;
DROP POLICY IF EXISTS "inv_ops_insert" ON public.bapesu_inventory_ops;
DROP POLICY IF EXISTS "inv_ops_update" ON public.bapesu_inventory_ops;
DROP POLICY IF EXISTS "inv_ops_delete" ON public.bapesu_inventory_ops;
CREATE POLICY "inv_ops_select" ON public.bapesu_inventory_ops FOR SELECT TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "inv_ops_insert" ON public.bapesu_inventory_ops FOR INSERT TO authenticated WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "inv_ops_update" ON public.bapesu_inventory_ops FOR UPDATE TO authenticated USING (company_id = public.current_user_company_id());
CREATE POLICY "inv_ops_delete" ON public.bapesu_inventory_ops FOR DELETE TO authenticated USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "inv_op_items_all" ON public.bapesu_inventory_op_items;
CREATE POLICY "inv_op_items_all" ON public.bapesu_inventory_op_items FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.bapesu_inventory_ops o WHERE o.id = op_id AND o.company_id = public.current_user_company_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.bapesu_inventory_ops o WHERE o.id = op_id AND o.company_id = public.current_user_company_id()));

-- =====================================================================
-- §9. MIGRACIONES (seguras — solo afectan BDs antiguas con INTEGER)
-- =====================================================================
ALTER TABLE public.bapesu_products
    ALTER COLUMN stock_available  TYPE NUMERIC(14,3) USING stock_available::NUMERIC,
    ALTER COLUMN stock_reserved   TYPE NUMERIC(14,3) USING stock_reserved::NUMERIC,
    ALTER COLUMN stock_in_transit TYPE NUMERIC(14,3) USING stock_in_transit::NUMERIC,
    ALTER COLUMN stock_min        TYPE NUMERIC(14,3) USING stock_min::NUMERIC;

ALTER TABLE public.bapesu_stock_movements
    ALTER COLUMN quantity TYPE NUMERIC(14,3) USING quantity::NUMERIC;

ALTER TABLE public.bapesu_products
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.bapesu_suppliers(id) ON DELETE SET NULL;

-- =====================================================================
-- FIN — schema.sql
-- Idempotente: puedes correrlo sobre una BD vacía o existente.
-- =====================================================================
-- =====================================================================
-- BAPESU PLATFORM — Super-Admin, Planes y Suscripciones
-- Idempotente: puede correrse varias veces sin errores
-- =====================================================================

-- ── 1. Ampliar CHECK de roles para incluir 'superadmin' ──────────────
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'admin', 'user'));

-- ── 2. Tabla de planes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_plans (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  description   TEXT,
  price_cop     INTEGER     DEFAULT 0,
  max_users     INTEGER     DEFAULT 1,
  max_clients   INTEGER     DEFAULT 50,
  max_products  INTEGER     DEFAULT 0,
  modules       JSONB       DEFAULT '[]'::jsonb,
  is_active     BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales (upsert seguro)
INSERT INTO public.bapesu_plans (id, name, description, price_cop, max_users, max_clients, max_products, modules) VALUES
  ('free',
   'Gratis',
   'Para empezar sin costo. Módulos básicos.',
   0, 1, 50, 0,
   '["clientes","cobros","cotizaciones"]'::jsonb),

  ('pro',
   'Pro',
   'Para negocios en crecimiento. Todos los módulos.',
   79000, 5, 500, 200,
   '["clientes","cobros","cotizaciones","servicios","inventario","reminders","analytics"]'::jsonb),

  ('enterprise',
   'Enterprise',
   'Sin límites. Soporte prioritario.',
   0, 999, 9999, 9999,
   '["clientes","cobros","cotizaciones","servicios","inventario","reminders","analytics","facturacion"]'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  price_cop    = EXCLUDED.price_cop,
  max_users    = EXCLUDED.max_users,
  max_clients  = EXCLUDED.max_clients,
  max_products = EXCLUDED.max_products,
  modules      = EXCLUDED.modules,
  updated_at   = NOW();

-- ── 3. Tabla de suscripciones ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_subscriptions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   UUID        NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
  plan_id      TEXT        NOT NULL REFERENCES public.bapesu_plans(id),
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','trial','suspended','cancelled')),
  trial_ends   DATE,
  renews_at    DATE,
  notes        TEXT,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.bapesu_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan    ON public.bapesu_subscriptions(plan_id);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.bapesu_subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.bapesu_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── 4. RLS: solo superadmin puede leer/escribir planes ───────────────
ALTER TABLE public.bapesu_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_subscriptions ENABLE ROW LEVEL SECURITY;

-- Planes: lectura pública (para mostrar precios), escritura solo superadmin
DROP POLICY IF EXISTS "plans_select" ON public.bapesu_plans;
CREATE POLICY "plans_select" ON public.bapesu_plans
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "plans_superadmin_write" ON public.bapesu_plans;
CREATE POLICY "plans_superadmin_write" ON public.bapesu_plans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'));

-- Suscripciones: solo superadmin
DROP POLICY IF EXISTS "subs_superadmin" ON public.bapesu_subscriptions;
CREATE POLICY "subs_superadmin" ON public.bapesu_subscriptions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'));

-- ── 5. Función helper: ¿es superadmin el usuario actual? ─────────────
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- ── 6. Superadmin puede leer TODAS las empresas ──────────────────────
DROP POLICY IF EXISTS "companies_superadmin_all" ON public.bapesu_companies;
CREATE POLICY "companies_superadmin_all" ON public.bapesu_companies
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ── 7. Superadmin puede leer TODOS los usuarios ──────────────────────
DROP POLICY IF EXISTS "users_superadmin_all" ON public.users;
CREATE POLICY "users_superadmin_all" ON public.users
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ── 8. Función superadmin: crear/asignar usuario a cualquier empresa ──
-- A diferencia de admin_assign_user_to_company, esta no valida
-- que el caller sea de la misma empresa — solo verifica que sea superadmin.
CREATE OR REPLACE FUNCTION public.superadmin_assign_user_to_company(
    p_user_id    UUID,
    p_company_id UUID,
    p_role       TEXT DEFAULT 'admin'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM public.users WHERE id = auth.uid() LIMIT 1;
    IF caller_role <> 'superadmin' THEN
        RAISE EXCEPTION 'Solo el superadmin puede usar esta función';
    END IF;

    INSERT INTO public.users (id, email, role, company_id, is_active, updated_at)
    SELECT p_user_id, au.email, p_role, p_company_id, TRUE, NOW()
    FROM auth.users au
    WHERE au.id = p_user_id
    ON CONFLICT (id) DO UPDATE SET
        role       = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        is_active  = TRUE,
        updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.superadmin_assign_user_to_company(UUID, UUID, TEXT) TO authenticated;

-- =====================================================================
