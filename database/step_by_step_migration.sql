-- =====================================================
-- MIGRACIÓN PASO A PASO PARA CAMPOS DE TRACKING
-- =====================================================
-- Ejecuta estos comandos uno por uno en Supabase SQL Editor

-- PASO 1: Verificar el estado actual
SELECT 
    'Estado actual de la tabla orders' as info,
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'orders';

-- PASO 2: Agregar columna tracking_number
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- PASO 3: Verificar que se agregó tracking_number
SELECT 
    'Verificación tracking_number' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'tracking_number';

-- PASO 4: Agregar columna tracking_url
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- PASO 5: Verificar que se agregó tracking_url
SELECT 
    'Verificación tracking_url' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'tracking_url';

-- PASO 6: Crear índice para tracking_number
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- PASO 7: Verificar que se creó el índice
SELECT 
    'Verificación índice' as info,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'orders' 
AND indexname = 'idx_orders_tracking_number';

-- PASO 8: Verificación final
SELECT 
    'VERIFICACIÓN FINAL' as info,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'orders' AND column_name = 'tracking_number') as tracking_number_exists,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'orders' AND column_name = 'tracking_url') as tracking_url_exists,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'orders' AND indexname = 'idx_orders_tracking_number') as index_exists;

-- =====================================================
-- RESULTADO ESPERADO:
-- tracking_number_exists: 1
-- tracking_url_exists: 1  
-- index_exists: 1
-- ===================================================== 