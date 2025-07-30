-- Script para cambiar la tabla users a usar UUID en lugar de bigint (versión corregida)
-- Ejecutar en Supabase SQL Editor

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.users;

-- 3. Eliminar la función uuid_to_bigint (ya no la necesitamos)
DROP FUNCTION IF EXISTS uuid_to_bigint(UUID) CASCADE;

-- 4. Eliminar índices existentes si existen
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_is_active;
DROP INDEX IF EXISTS idx_users_created_at;

-- 5. Crear nueva tabla con UUID
CREATE TABLE public.users_new (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'customer',
    profile_image_url TEXT,
    preferences JSONB DEFAULT '{}',
    wishlist JSONB DEFAULT '[]',
    cart_items JSONB DEFAULT '[]',
    order_history JSONB DEFAULT '[]',
    total_spent DECIMAL(10,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    newsletter_subscription BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false
);

-- 6. Crear índices en la nueva tabla
CREATE INDEX idx_users_email ON public.users_new(email);
CREATE INDEX idx_users_role ON public.users_new(role);
CREATE INDEX idx_users_is_active ON public.users_new(is_active);
CREATE INDEX idx_users_created_at ON public.users_new(created_at);

-- 7. Migrar datos existentes (si los hay)
INSERT INTO public.users_new (
    id, email, first_name, last_name, phone, address, city, state, 
    postal_code, country, created_at, updated_at, is_active, role,
    profile_image_url, preferences, wishlist, cart_items, order_history,
    total_spent, loyalty_points, newsletter_subscription, marketing_consent
)
SELECT 
    au.id,
    au.email,
    pu.first_name,
    pu.last_name,
    pu.phone,
    pu.address,
    pu.city,
    pu.state,
    pu.postal_code,
    pu.country,
    COALESCE(pu.created_at, au.created_at),
    COALESCE(pu.updated_at, au.updated_at),
    COALESCE(pu.is_active, true),
    COALESCE(pu.role, 'customer'),
    pu.profile_image_url,
    COALESCE(pu.preferences, '{}'),
    COALESCE(pu.wishlist, '[]'),
    COALESCE(pu.cart_items, '[]'),
    COALESCE(pu.order_history, '[]'),
    COALESCE(pu.total_spent, 0),
    COALESCE(pu.loyalty_points, 0),
    COALESCE(pu.newsletter_subscription, false),
    COALESCE(pu.marketing_consent, false)
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email;

-- 8. Eliminar tabla antigua y renombrar la nueva
DROP TABLE public.users;
ALTER TABLE public.users_new RENAME TO users;

-- 9. Crear políticas RLS simples
CREATE POLICY "Enable read access for authenticated users" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on id" ON public.users
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

CREATE POLICY "Enable delete for users based on id" ON public.users
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

-- 10. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 11. Crear función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at, role, is_active)
    VALUES (NEW.id, NEW.email, NEW.created_at, NOW(), 'customer', true)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Crear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Verificar que todo funciona
SELECT 
    '✅ Tabla users migrada a UUID' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.users) as public_users;

-- 14. Probar acceso
DO $$
DECLARE
    current_user_id UUID;
    profile_count INTEGER;
BEGIN
    current_user_id := auth.uid();
    
    SELECT COUNT(*) INTO profile_count 
    FROM public.users 
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Usuario actual: %, Perfiles encontrados: %', current_user_id, profile_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al verificar acceso: %', SQLERRM;
END $$;