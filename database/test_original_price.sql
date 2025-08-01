-- Script para verificar y probar el campo original_price
-- Ejecuta este script en Supabase SQL Editor

-- 1. Verificar si la columna original_price existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_name = 'original_price';

-- 2. Verificar si la función calculate_discount_percentage existe
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'calculate_discount_percentage'
AND routine_schema = 'public';

-- 3. Verificar si el trigger calculate_discount_trigger existe
SELECT 
    trigger_name, 
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'calculate_discount_trigger'
AND trigger_schema = 'public';

-- 4. Mostrar algunos productos existentes para ver su estructura
SELECT 
    id, 
    name, 
    price, 
    original_price, 
    discount_percentage,
    stock
FROM public.products 
LIMIT 5;

-- 5. Probar actualización de un producto con original_price
-- (Descomenta las siguientes líneas para probar)
/*
UPDATE public.products 
SET 
    original_price = 150.00,
    price = 120.00
WHERE id = 1001;

-- Verificar el resultado
SELECT 
    id, 
    name, 
    price, 
    original_price, 
    discount_percentage
FROM public.products 
WHERE id = 1001;
*/

-- 6. Mostrar la estructura completa de la tabla products
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position; 