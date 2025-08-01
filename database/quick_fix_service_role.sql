-- SOLUCIÓN RÁPIDA: Permitir acceso al service_role
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar el estado actual
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- 2. Deshabilitar RLS temporalmente (SOLUCIÓN RÁPIDA)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que se deshabilitó
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- 4. Probar acceso directo
SELECT COUNT(*) FROM public.users; 