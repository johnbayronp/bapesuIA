-- =====================================================
-- MIGRACIÓN CORREGIDA PARA CAMPOS DE TRACKING
-- =====================================================
-- Este script agrega los campos tracking_number y tracking_url
-- a la tabla orders de forma segura (idempotente)

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

-- 4. Crear función de validación (siempre recrear para evitar conflictos)
CREATE OR REPLACE FUNCTION validate_shipping_tracking()
RETURNS TRIGGER AS $func$
BEGIN
    IF NEW.status = 'shipped' THEN
        IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
            RAISE EXCEPTION 'tracking_number es requerido cuando el status es shipped';
        END IF;
    END IF;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- 5. Crear trigger (siempre recrear para evitar conflictos)
DROP TRIGGER IF EXISTS trigger_validate_shipping_tracking ON orders;
CREATE TRIGGER trigger_validate_shipping_tracking
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_shipping_tracking();

-- 6. Verificar que todo se aplicó correctamente
SELECT 
    'Verificación de migración completada' as status,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'orders' AND column_name IN ('tracking_number', 'tracking_url')) as columnas_agregadas,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'orders' AND indexname = 'idx_orders_tracking_number') as indice_creado,
    (SELECT COUNT(*) FROM pg_proc 
     WHERE proname = 'validate_shipping_tracking') as funcion_creada,
    (SELECT COUNT(*) FROM pg_trigger 
     WHERE tgname = 'trigger_validate_shipping_tracking') as trigger_creado;

-- =====================================================
-- RESULTADO ESPERADO:
-- columnas_agregadas: 2
-- indice_creado: 1  
-- funcion_creada: 1
-- trigger_creado: 1
-- ===================================================== 