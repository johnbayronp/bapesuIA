-- Script completo para aplicar la migración de tracking fields
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si las columnas ya existen
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tracking_number', 'tracking_url');

-- 2. Si no existen las columnas, agregarlas
DO $$
BEGIN
    -- Verificar si tracking_number existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
        RAISE NOTICE 'Columna tracking_number agregada';
    ELSE
        RAISE NOTICE 'Columna tracking_number ya existe';
    END IF;
    
    -- Verificar si tracking_url existe
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

-- 3. Crear índice para tracking_number (si no existe)
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

-- 4. Crear función de validación (si no existe)
CREATE OR REPLACE FUNCTION validate_shipping_tracking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'shipped' AND (NEW.tracking_number IS NULL OR NEW.tracking_number = '') THEN
        RAISE EXCEPTION 'El número de guía es obligatorio cuando el estado es "shipped"';
    END IF;
    IF NEW.status = 'shipped' AND (NEW.tracking_url IS NULL OR NEW.tracking_url = '') THEN
        RAISE EXCEPTION 'El link de tracking es obligatorio cuando el estado es "shipped"';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_validate_shipping_tracking'
    ) THEN
        CREATE TRIGGER trigger_validate_shipping_tracking
            BEFORE INSERT OR UPDATE ON orders
            FOR EACH ROW
            EXECUTE FUNCTION validate_shipping_tracking();
        RAISE NOTICE 'Trigger trigger_validate_shipping_tracking creado';
    ELSE
        RAISE NOTICE 'Trigger trigger_validate_shipping_tracking ya existe';
    END IF;
END $$;

-- 6. Agregar comentarios a las columnas
COMMENT ON COLUMN orders.tracking_number IS 'Número de guía de envío';
COMMENT ON COLUMN orders.tracking_url IS 'URL de tracking del envío';

-- 7. Verificar que todo se aplicó correctamente
SELECT 
    'Verificación final' as status,
    COUNT(*) as columnas_tracking
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tracking_number', 'tracking_url');

-- 8. Verificar que el trigger existe
SELECT 
    'Trigger verification' as status,
    COUNT(*) as triggers_count
FROM pg_trigger 
WHERE tgname = 'trigger_validate_shipping_tracking';

-- 9. Verificar que la función existe
SELECT 
    'Function verification' as status,
    COUNT(*) as functions_count
FROM pg_proc 
WHERE proname = 'validate_shipping_tracking';

-- 10. Mostrar estructura final de la tabla orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position; 