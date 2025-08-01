-- Script para agregar el campo original_price a la tabla products
-- Ejecuta este script en Supabase SQL Editor

-- 1. Agregar el campo original_price
ALTER TABLE public.products 
ADD COLUMN original_price DECIMAL(10,2);

-- 2. Agregar restricción para que original_price sea mayor o igual a 0
ALTER TABLE public.products 
ADD CONSTRAINT products_original_price_check CHECK (original_price >= 0);

-- 3. Crear índice para optimizar consultas por original_price
CREATE INDEX idx_products_original_price ON public.products(original_price);

-- 4. Crear función para calcular automáticamente el descuento basado en precio original y precio actual
CREATE OR REPLACE FUNCTION calculate_discount_percentage()
RETURNS TRIGGER AS $$
BEGIN
    -- Si hay precio original y precio actual, calcular el descuento
    IF NEW.original_price IS NOT NULL AND NEW.price IS NOT NULL AND NEW.original_price > NEW.price THEN
        NEW.discount_percentage := ((NEW.original_price - NEW.price) / NEW.original_price) * 100;
    ELSIF NEW.original_price IS NULL OR NEW.original_price <= NEW.price THEN
        -- Si no hay descuento, limpiar el precio original y el descuento
        NEW.original_price := NULL;
        NEW.discount_percentage := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para calcular automáticamente el descuento
CREATE TRIGGER calculate_discount_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_discount_percentage();

-- 6. Actualizar productos existentes (opcional)
-- Si quieres que los productos existentes tengan un precio original basado en un descuento del 20%
-- UPDATE public.products 
-- SET original_price = price * 1.25 
-- WHERE original_price IS NULL AND discount_percentage = 0;

-- Mensaje de confirmación
SELECT 'Campo original_price agregado exitosamente a la tabla products' as status; 