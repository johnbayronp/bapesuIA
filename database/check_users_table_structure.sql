-- Script para verificar y corregir la estructura de la tabla users
-- Ejecuta este script en Supabase SQL Editor

-- 1. Verificar la estructura actual de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'id';

-- 2. Si la tabla no existe, crearla con UUID
DO $$
BEGIN
    -- Verificar si la tabla users existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Crear tabla users con UUID
        CREATE TABLE public.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        
        -- Crear índices
        CREATE INDEX idx_users_email ON public.users(email);
        CREATE INDEX idx_users_role ON public.users(role);
        CREATE INDEX idx_users_is_active ON public.users(is_active);
        CREATE INDEX idx_users_created_at ON public.users(created_at);
        
        -- Agregar restricción para el campo role
        ALTER TABLE public.users 
        ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'vendor'));
        
        -- Crear función para actualizar updated_at automáticamente
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- Crear trigger para actualizar updated_at
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON public.users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        
        -- Crear función para crear perfil automáticamente
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Verificar que el usuario no existe ya
            IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
                RETURN NEW;
            END IF;
            
            -- Insertar perfil para nuevo usuario
            INSERT INTO public.users (id, email, created_at, updated_at, role, is_active)
            VALUES (
                NEW.id,
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
        
        -- Crear trigger para crear perfil automáticamente
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
        -- Configurar RLS (Row Level Security)
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas de seguridad
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Admins can view all profiles" ON public.users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth.uid() = id AND role = 'admin'
                )
            );
        
        CREATE POLICY "Admins can update all profiles" ON public.users
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth.uid() = id AND role = 'admin'
                )
            );
        
        CREATE POLICY "Allow insert for new users" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Tabla users creada con UUID';
    END IF;
END $$;

-- 3. Si la tabla existe pero tiene BIGINT, convertirla a UUID
DO $$
BEGIN
    -- Verificar si la columna id es BIGINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'id' 
        AND data_type = 'bigint'
    ) THEN
        -- Crear tabla temporal con UUID
        CREATE TABLE public.users_new (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        
        -- Copiar datos existentes (sin la columna id que será regenerada)
        INSERT INTO public.users_new (
            email, created_at, updated_at, first_name, last_name, phone, address, 
            city, state, postal_code, country, is_active, role, profile_image_url,
            preferences, wishlist, cart_items, order_history, total_spent, 
            loyalty_points, newsletter_subscription, marketing_consent, 
            default_payment_method, shipping_preferences, favorite_categories,
            last_login, login_count
        )
        SELECT 
            email, created_at, updated_at, first_name, last_name, phone, address,
            city, state, postal_code, country, is_active, role, profile_image_url,
            preferences, wishlist, cart_items, order_history, total_spent,
            loyalty_points, newsletter_subscription, marketing_consent,
            default_payment_method, shipping_preferences, favorite_categories,
            last_login, login_count
        FROM public.users;
        
        -- Eliminar tabla antigua y renombrar la nueva
        DROP TABLE public.users CASCADE;
        ALTER TABLE public.users_new RENAME TO users;
        
        -- Recrear índices y restricciones
        CREATE INDEX idx_users_email ON public.users(email);
        CREATE INDEX idx_users_role ON public.users(role);
        CREATE INDEX idx_users_is_active ON public.users(is_active);
        CREATE INDEX idx_users_created_at ON public.users(created_at);
        
        ALTER TABLE public.users 
        ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'vendor'));
        
        -- Recrear función y trigger para updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON public.users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        
        -- Recrear función y trigger para nuevos usuarios
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
                RETURN NEW;
            END IF;
            
            INSERT INTO public.users (id, email, created_at, updated_at, role, is_active)
            VALUES (
                NEW.id,
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
                RAISE WARNING 'Error creando perfil para usuario %: %', NEW.email, SQLERRM;
                RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
        -- Recrear RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Admins can view all profiles" ON public.users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth.uid() = id AND role = 'admin'
                )
            );
        
        CREATE POLICY "Admins can update all profiles" ON public.users
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth.uid() = id AND role = 'admin'
                )
            );
        
        CREATE POLICY "Allow insert for new users" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Tabla users convertida de BIGINT a UUID';
    END IF;
END $$;

-- 4. Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Mostrar estadísticas
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_public_users;

-- 6. Crear un usuario admin de ejemplo si no existe
INSERT INTO public.users (
    id, email, first_name, last_name, role, is_active
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'admin@example.com',
    'Admin',
    'User',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

SELECT '✅ Estructura de tabla users verificada y corregida' as status; 