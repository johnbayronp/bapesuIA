-- ===================================================================
-- Migración: Multi-tenant para Bapesu Business Dashboard
-- ===================================================================
-- Convierte el dashboard a multi-empresa:
--   • Tabla `public.users` (perfiles) si aún no existe
--   • Tabla `bapesu_companies` con datos de cada empresa
--   • Cada usuario en `users` tiene un `company_id`
--   • `bapesu_clients` se aísla por `company_id`
--   • Trigger para crear automáticamente el perfil al registrarse
-- ===================================================================

-- ───────────────────────────────────────────────────────────────────
-- 0. Tabla public.users (perfiles) – la creamos si no existe
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    role        TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    first_name  TEXT,
    last_name   TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ───────────────────────────────────────────────────────────────────
-- 1. Tabla de empresas
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_companies (
    id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identidad
    name          TEXT        NOT NULL,
    nit           TEXT,
    tagline       TEXT,

    -- Contacto
    phone         TEXT,
    email         TEXT,
    instagram     TEXT,
    website       TEXT,
    address       TEXT,
    city          TEXT,

    -- Branding & pago
    logo_url      TEXT,
    payment_info  TEXT,

    -- Plan y estado
    plan          TEXT        DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    is_active     BOOLEAN     DEFAULT TRUE,

    -- Auditoría
    created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bapesu_companies_created_by ON public.bapesu_companies(created_by);

-- Trigger updated_at empresas
CREATE OR REPLACE FUNCTION public.update_bapesu_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bapesu_companies_updated_at ON public.bapesu_companies;
CREATE TRIGGER trg_bapesu_companies_updated_at
    BEFORE UPDATE ON public.bapesu_companies
    FOR EACH ROW EXECUTE FUNCTION public.update_bapesu_companies_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- 2. Agregar company_id a users
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.bapesu_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- ───────────────────────────────────────────────────────────────────
-- 3. Tabla bapesu_clients (la creamos si no existe + columna company_id)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_clients (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    name        TEXT        NOT NULL,
    nit         TEXT,
    email       TEXT,
    phone       TEXT,
    city        TEXT,
    address     TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bapesu_clients
    ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.bapesu_companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bapesu_clients_company_id ON public.bapesu_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_bapesu_clients_created_at ON public.bapesu_clients(created_at DESC);

-- Trigger updated_at clients
CREATE OR REPLACE FUNCTION public.update_bapesu_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bapesu_clients_updated_at ON public.bapesu_clients;
CREATE TRIGGER trg_bapesu_clients_updated_at
    BEFORE UPDATE ON public.bapesu_clients
    FOR EACH ROW EXECUTE FUNCTION public.update_bapesu_clients_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- 4. Tabla cotizacion_access_requests (si no existe)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cotizacion_access_requests (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    email        TEXT         NOT NULL,
    requested_at TIMESTAMPTZ  DEFAULT NOW(),
    granted      BOOLEAN      DEFAULT FALSE,
    granted_at   TIMESTAMPTZ
);

ALTER TABLE public.cotizacion_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can request access" ON public.cotizacion_access_requests;
CREATE POLICY "Anyone can request access"
    ON public.cotizacion_access_requests FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

-- ───────────────────────────────────────────────────────────────────
-- 5. Trigger: crear perfil automáticamente al registrarse en auth.users
-- ───────────────────────────────────────────────────────────────────
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

-- Backfill: crear perfil para usuarios ya existentes en auth.users
INSERT INTO public.users (id, email, role, is_active)
SELECT au.id, au.email, 'user', TRUE
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- ───────────────────────────────────────────────────────────────────
-- 6. Helper: función SECURITY DEFINER que devuelve company_id sin
--    disparar RLS (evita la recursión infinita)
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────
-- 7. RLS para public.users (sin recursión, usando la función helper)
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view company users"   ON public.users;
DROP POLICY IF EXISTS "Members can update company users" ON public.users;
DROP POLICY IF EXISTS "Users can view themselves"        ON public.users;
DROP POLICY IF EXISTS "Users can update themselves"      ON public.users;
DROP POLICY IF EXISTS "Users can insert their profile"   ON public.users;

-- SELECT: yo mismo o un miembro de mi empresa
CREATE POLICY "Members can view company users"
    ON public.users FOR SELECT
    USING (
        id = auth.uid()
        OR (
            company_id IS NOT NULL
            AND company_id = public.current_user_company_id()
        )
    );

-- INSERT: cualquier autenticado puede insertar SU propio perfil
CREATE POLICY "Users can insert their profile"
    ON public.users FOR INSERT
    WITH CHECK (id = auth.uid());

-- UPDATE: yo mismo o un miembro de mi empresa
CREATE POLICY "Members can update company users"
    ON public.users FOR UPDATE
    USING (
        id = auth.uid()
        OR (
            company_id IS NOT NULL
            AND company_id = public.current_user_company_id()
        )
    );

-- ───────────────────────────────────────────────────────────────────
-- 8. RLS para bapesu_companies
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their company"     ON public.bapesu_companies;
DROP POLICY IF EXISTS "Authenticated can create companies" ON public.bapesu_companies;
DROP POLICY IF EXISTS "Members can update their company"   ON public.bapesu_companies;

CREATE POLICY "Members can view their company"
    ON public.bapesu_companies FOR SELECT
    USING (
        id = public.current_user_company_id()
        OR created_by = auth.uid()
    );

CREATE POLICY "Authenticated can create companies"
    ON public.bapesu_companies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update their company"
    ON public.bapesu_companies FOR UPDATE
    USING (
        id = public.current_user_company_id()
    );

-- ───────────────────────────────────────────────────────────────────
-- 9. RLS para bapesu_clients (basadas en company_id)
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.bapesu_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own clients"   ON public.bapesu_clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can view clients"   ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can insert clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can update clients" ON public.bapesu_clients;
DROP POLICY IF EXISTS "Company members can delete clients" ON public.bapesu_clients;

CREATE POLICY "Company members can view clients"
    ON public.bapesu_clients FOR SELECT
    USING (company_id = public.current_user_company_id());

CREATE POLICY "Company members can insert clients"
    ON public.bapesu_clients FOR INSERT
    WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "Company members can update clients"
    ON public.bapesu_clients FOR UPDATE
    USING (company_id = public.current_user_company_id())
    WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "Company members can delete clients"
    ON public.bapesu_clients FOR DELETE
    USING (company_id = public.current_user_company_id());

-- ───────────────────────────────────────────────────────────────────
-- 10. Función para que el admin asigne un usuario a su empresa
--     SECURITY DEFINER → evita el bloqueo de RLS
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_assign_user_to_company(
    p_user_id   UUID,
    p_company_id UUID,
    p_role      TEXT DEFAULT 'user'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_company UUID;
    caller_role    TEXT;
BEGIN
    -- Verificar que quien llama es admin de esa empresa
    SELECT company_id, role INTO caller_company, caller_role
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;

    IF caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Solo los administradores pueden asignar usuarios';
    END IF;

    IF caller_company <> p_company_id THEN
        RAISE EXCEPTION 'No puedes asignar usuarios a otra empresa';
    END IF;

    -- Insertar o actualizar el perfil del nuevo usuario
    INSERT INTO public.users (id, email, role, company_id, is_active, updated_at)
    SELECT p_user_id, au.email, p_role, p_company_id, TRUE, NOW()
    FROM auth.users au
    WHERE au.id = p_user_id
    ON CONFLICT (id) DO UPDATE
        SET role       = EXCLUDED.role,
            company_id = EXCLUDED.company_id,
            is_active  = TRUE,
            updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_user_to_company(UUID, UUID, TEXT) TO authenticated;

-- ===================================================================
-- LISTO. Ejecuta este script completo en el SQL Editor de Supabase.
-- Es idempotente: puedes correrlo varias veces sin problema.
-- ===================================================================
