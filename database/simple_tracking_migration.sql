-- =====================================================
-- MIGRACIÓN SIMPLE PARA CAMPOS DE TRACKING
-- =====================================================
-- Este script solo agrega los campos tracking_number y tracking_url
-- a la tabla orders de forma segura

-- 1. Agregar columna tracking_number si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
        RAISE NOTICE 'Columna tracking_number agregada';
    ELSE
        RAISE NOTICE 'Columna tracking_number ya existe';
    END IF;
END $$;

-- 2. Agregar columna tracking_url si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tracking_url'
    ) THEN
        ALTER TABLE orders ADD COLUMN tracking_url TEXT;
        RAISE NOTICE 'Columna tracking_url agregada';
    ELSE
        RAISE NOTICE 'Columna tracking_url ya existe';
    END IF;
END $$;

-- 3. Crear índice para tracking_number si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'orders' AND indexname = 'idx_orders_tracking_number'
    ) THEN
        CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);
        RAISE NOTICE 'Índice idx_orders_tracking_number creado';
    ELSE
        RAISE NOTICE 'Índice idx_orders_tracking_number ya existe';
    END IF;
END $$;

-- 4. Verificar que las columnas se agregaron correctamente
SELECT 
    'Verificación de migración completada' as status,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'orders' AND column_name IN ('tracking_number', 'tracking_url')) as columnas_agregadas,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'orders' AND indexname = 'idx_orders_tracking_number') as indice_creado;

-- =====================================================
-- RESULTADO ESPERADO:
-- columnas_agregadas: 2
-- indice_creado: 1
-- ===================================================== 