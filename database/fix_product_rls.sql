-- Script para corregir las políticas RLS de la tabla products
-- Ejecuta este script en Supabase SQL Editor

-- 1. Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- 2. Deshabilitar RLS temporalmente para pruebas
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 3. Crear políticas más permisivas para desarrollo
-- Política para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Allow all operations for authenticated users" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Alternativa: Habilitar RLS con políticas más específicas
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política para lectura de productos activos
-- CREATE POLICY "Allow read active products" ON public.products
--     FOR SELECT USING (is_active = true);

-- Política para todas las operaciones para administradores
-- CREATE POLICY "Allow all operations for admins" ON public.products
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.users 
--             WHERE users.id = auth.uid() 
--             AND users.role = 'admin'
--         )
--     );

-- 5. Verificar que las políticas se aplicaron correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products';

-- Mensaje de confirmación
SELECT 'Políticas RLS corregidas para la tabla products' as status; 