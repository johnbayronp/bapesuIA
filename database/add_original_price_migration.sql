-- Script para agregar el campo original_price a la tabla products existente
-- Ejecuta este script en Supabase SQL Editor

-- 1. Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'original_price'
        AND table_schema = 'public'
    ) THEN
        -- Agregar el campo original_price
        ALTER TABLE public.products 
        ADD COLUMN original_price DECIMAL(10,2);
        
        -- Agregar restricción para que original_price sea mayor o igual a 0
        ALTER TABLE public.products 
        ADD CONSTRAINT products_original_price_check CHECK (original_price >= 0);
        
        -- Crear índice para optimizar consultas por original_price
        CREATE INDEX idx_products_original_price ON public.products(original_price);
        
        RAISE NOTICE 'Campo original_price agregado exitosamente';
    ELSE
        RAISE NOTICE 'El campo original_price ya existe en la tabla products';
    END IF;
END $$;

-- 2. Verificar si la función ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_name = 'calculate_discount_percentage'
        AND routine_schema = 'public'
    ) THEN
        -- Crear función para calcular automáticamente el descuento basado en precio original y precio actual
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
        
        RAISE NOTICE 'Función calculate_discount_percentage creada exitosamente';
    ELSE
        RAISE NOTICE 'La función calculate_discount_percentage ya existe';
    END IF;
END $$;

-- 3. Verificar si el trigger ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'calculate_discount_trigger'
        AND event_object_table = 'products'
        AND trigger_schema = 'public'
    ) THEN
        -- Crear trigger para calcular automáticamente el descuento
        CREATE TRIGGER calculate_discount_trigger
            BEFORE INSERT OR UPDATE ON public.products
            FOR EACH ROW
            EXECUTE FUNCTION calculate_discount_percentage();
        
        RAISE NOTICE 'Trigger calculate_discount_trigger creado exitosamente';
    ELSE
        RAISE NOTICE 'El trigger calculate_discount_trigger ya existe';
    END IF;
END $$;

-- 4. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT 'Migración de original_price completada exitosamente' as status; 