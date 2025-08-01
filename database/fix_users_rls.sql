-- Script para configurar RLS en la tabla users
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes que puedan estar bloqueando
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.users;

-- 4. Crear política para permitir acceso completo desde la clave de servicio
CREATE POLICY "Enable full access for service role" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Crear política para usuarios autenticados (mantener funcionalidad del frontend)
CREATE POLICY "Enable read access for authenticated users" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Crear política alternativa más específica (opcional)
-- CREATE POLICY "Enable read access for service role" ON public.users
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Enable insert for service role" ON public.users
--     FOR INSERT
--     WITH CHECK (true);

-- CREATE POLICY "Enable update for service role" ON public.users
--     FOR UPDATE
--     USING (true)
--     WITH CHECK (true);

-- CREATE POLICY "Enable delete for service role" ON public.users
--     FOR DELETE
--     USING (true);

-- 6. Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'; 