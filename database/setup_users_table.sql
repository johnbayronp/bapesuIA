-- Script único para configurar la tabla users correctamente
-- Ejecuta este script en Supabase SQL Editor y listo

-- 1. Eliminar tabla existente si existe (para empezar limpio)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Eliminar funciones y triggers existentes
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS migrate_existing_users() CASCADE;
DROP FUNCTION IF EXISTS uuid_to_bigint(uuid) CASCADE;

-- 3. Crear la tabla users con estructura completa
CREATE TABLE public.users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'customer',
    profile_image_url TEXT,
    preferences JSONB DEFAULT '{}',
    wishlist JSONB DEFAULT '[]',
    cart_items JSONB DEFAULT '[]',
    order_history JSONB DEFAULT '[]',
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    newsletter_subscription BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    default_payment_method JSONB,
    shipping_preferences JSONB DEFAULT '{}',
    favorite_categories TEXT[],
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0
);

-- 4. Crear índices
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- 5. Agregar restricción para el campo role
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'vendor'));

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Crear trigger para actualizar updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Crear función para convertir UUID a bigint de forma más segura
CREATE OR REPLACE FUNCTION uuid_to_bigint(uuid_val UUID)
RETURNS BIGINT AS $$
DECLARE
    hex_string TEXT;
    result BIGINT;
BEGIN
    -- Remover guiones del UUID
    hex_string := replace(uuid_val::text, '-', '');
    
    -- Tomar solo los primeros 16 caracteres para evitar overflow
    hex_string := substring(hex_string from 1 for 16);
    
    -- Convertir a bigint usando base 16
    result := ('x' || hex_string)::bit(64)::bigint;
    
    -- Asegurar que sea positivo
    RETURN abs(result);
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback: usar un hash simple del UUID
        RETURN abs(('x' || substring(md5(uuid_val::text) from 1 for 16))::bit(64)::bigint);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. Crear función para migrar usuarios existentes
CREATE OR REPLACE FUNCTION migrate_existing_users()
RETURNS INTEGER AS $$
DECLARE
    auth_user RECORD;
    bigint_id BIGINT;
    migrated_count INTEGER := 0;
BEGIN
    -- Recorrer todos los usuarios en auth.users que no tienen perfil en public.users
    FOR auth_user IN 
        SELECT au.id, au.email, au.created_at
        FROM auth.users au
        LEFT JOIN public.users pu ON uuid_to_bigint(au.id) = pu.id
        WHERE pu.id IS NULL
    LOOP
        BEGIN
            -- Convertir UUID a bigint
            bigint_id := uuid_to_bigint(auth_user.id);
            
            -- Insertar perfil para usuario existente
            INSERT INTO public.users (id, email, created_at, updated_at, role, is_active)
            VALUES (
                bigint_id,
                auth_user.email,
                auth_user.created_at,
                NOW(),
                'customer',
                true
            )
            ON CONFLICT (id) DO NOTHING;
            
            migrated_count := migrated_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                -- Si hay error con un usuario específico, continuar con el siguiente
                RAISE WARNING 'Error migrando usuario %: %', auth_user.email, SQLERRM;
                CONTINUE;
        END;
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear función para crear perfil automáticamente (más robusta)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    bigint_id BIGINT;
BEGIN
    -- Verificar que el usuario no existe ya
    IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
        RETURN NEW;
    END IF;
    
    -- Convertir UUID a bigint de forma segura
    bigint_id := uuid_to_bigint(NEW.id);
    
    -- Insertar perfil para nuevo usuario
    INSERT INTO public.users (id, email, created_at, updated_at, role, is_active)
    VALUES (
        bigint_id,
        NEW.email, 
        NEW.created_at, 
        NOW(),
        'customer',
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay error, no fallar el registro del usuario
        RAISE WARNING 'Error creando perfil para usuario %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Crear trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Configurar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 13. Crear políticas de seguridad
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (uuid_to_bigint(auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (uuid_to_bigint(auth.uid()) = id);

CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE uuid_to_bigint(auth.uid()) = id AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE uuid_to_bigint(auth.uid()) = id AND role = 'admin'
        )
    );

CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT WITH CHECK (uuid_to_bigint(auth.uid()) = id);

-- 14. Comentarios para documentar
COMMENT ON TABLE public.users IS 'Tabla de usuarios para tienda virtual';
COMMENT ON COLUMN public.users.id IS 'ID único del usuario (bigint convertido desde UUID)';
COMMENT ON COLUMN public.users.email IS 'Email del usuario';
COMMENT ON COLUMN public.users.role IS 'Rol del usuario: customer, admin, vendor';

-- 15. Migrar usuarios existentes automáticamente
SELECT migrate_existing_users() as usuarios_migrados;

-- 16. Verificar que todo se creó correctamente
SELECT '✅ Tabla users configurada correctamente' as status;

-- 17. Probar la función de conversión
SELECT 
    '550e8400-e29b-41d4-a716-446655440000'::uuid as uuid_example,
    uuid_to_bigint('550e8400-e29b-41d4-a716-446655440000'::uuid) as bigint_conversion;

-- 18. Mostrar estadísticas
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_public_users;