-- Rollback de la migración de campos de tracking
-- Fecha: 2024-01-15
-- Descripción: Revertir los cambios de tracking en la tabla orders

-- Eliminar el trigger de validación
DROP TRIGGER IF EXISTS trigger_validate_shipping_tracking ON orders;

-- Eliminar la función de validación
DROP FUNCTION IF EXISTS validate_shipping_tracking();

-- Eliminar el índice de tracking
DROP INDEX IF EXISTS idx_orders_tracking_number;

-- Eliminar las columnas de tracking
ALTER TABLE orders 
DROP COLUMN IF EXISTS tracking_number,
DROP COLUMN IF EXISTS tracking_url;

-- Verificar que el rollback se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tracking_number', 'tracking_url')
ORDER BY column_name; 