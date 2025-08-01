-- Migración para agregar campos de tracking a la tabla orders
-- Fecha: 2024-01-15
-- Descripción: Agregar campos para número de guía y link de tracking

-- Agregar campos de tracking a la tabla orders
ALTER TABLE orders 
ADD COLUMN tracking_number VARCHAR(100),
ADD COLUMN tracking_url TEXT;

-- Agregar comentarios para documentación
COMMENT ON COLUMN orders.tracking_number IS 'Número de guía de envío para tracking';
COMMENT ON COLUMN orders.tracking_url IS 'URL del link de tracking del envío';

-- Crear índice para mejorar búsquedas por número de tracking
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);

-- Actualizar la función de validación de estado para incluir validación de tracking
-- (Opcional: Crear una función que valide que cuando status = 'shipped', tracking_number no sea NULL)
CREATE OR REPLACE FUNCTION validate_shipping_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado es 'shipped', verificar que tenga tracking_number
    IF NEW.status = 'shipped' AND (NEW.tracking_number IS NULL OR NEW.tracking_number = '') THEN
        RAISE EXCEPTION 'El número de guía es obligatorio cuando el estado es "shipped"';
    END IF;
    
    -- Si el estado es 'shipped', verificar que tenga tracking_url
    IF NEW.status = 'shipped' AND (NEW.tracking_url IS NULL OR NEW.tracking_url = '') THEN
        RAISE EXCEPTION 'El link de tracking es obligatorio cuando el estado es "shipped"';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar tracking cuando el estado es shipped
CREATE TRIGGER trigger_validate_shipping_tracking
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_shipping_tracking();

-- Verificar que la migración se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tracking_number', 'tracking_url')
ORDER BY column_name; 