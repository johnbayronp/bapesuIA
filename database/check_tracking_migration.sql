-- Script para verificar si los campos de tracking existen en la tabla orders
-- Ejecutar en el SQL Editor de Supabase

-- Verificar si las columnas existen
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tracking_number', 'tracking_url');

-- Verificar si el índice existe
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders' 
AND indexname = 'idx_orders_tracking_number';

-- Verificar si la función existe
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'validate_shipping_tracking';

-- Verificar si el trigger existe
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname = 'trigger_validate_shipping_tracking';

-- Si no existen las columnas, ejecutar:
-- ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
-- ALTER TABLE orders ADD COLUMN tracking_url TEXT;

-- Si no existe el índice, ejecutar:
-- CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);

-- Si no existe la función, ejecutar:
-- CREATE OR REPLACE FUNCTION validate_shipping_tracking()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.status = 'shipped' AND (NEW.tracking_number IS NULL OR NEW.tracking_number = '') THEN
--         RAISE EXCEPTION 'El número de guía es obligatorio cuando el estado es "shipped"';
--     END IF;
--     IF NEW.status = 'shipped' AND (NEW.tracking_url IS NULL OR NEW.tracking_url = '') THEN
--         RAISE EXCEPTION 'El link de tracking es obligatorio cuando el estado es "shipped"';
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Si no existe el trigger, ejecutar:
-- CREATE TRIGGER trigger_validate_shipping_tracking
--     BEFORE INSERT OR UPDATE ON orders
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_shipping_tracking(); 