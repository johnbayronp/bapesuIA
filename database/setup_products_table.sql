-- Script para configurar la tabla products correctamente
-- Ejecuta este script en Supabase SQL Editor

-- 1. Eliminar tabla existente si existe (para empezar limpio)
DROP TABLE IF EXISTS public.products CASCADE;

-- 2. Eliminar funciones y triggers existentes
DROP FUNCTION IF EXISTS update_products_updated_at() CASCADE;

-- 3. Crear la tabla products con estructura completa
CREATE TABLE public.products (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Activo',
    image_url TEXT,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    weight DECIMAL(8,3),
    dimensions JSONB,
    tags TEXT[],
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_by UUID REFERENCES public.users(id),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    cost_price DECIMAL(10,2),
    supplier_info JSONB DEFAULT '{}',
    inventory_alerts JSONB DEFAULT '{}',
    seo_data JSONB DEFAULT '{}'
);

-- 4. Crear índices
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_created_at ON public.products(created_at);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_stock ON public.products(stock);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name ON public.products(name);

-- 5. Agregar restricciones
ALTER TABLE public.products 
ADD CONSTRAINT products_status_check CHECK (status IN ('Activo', 'Inactivo', 'Sin Stock', 'Borrador'));

ALTER TABLE public.products 
ADD CONSTRAINT products_price_check CHECK (price >= 0);

ALTER TABLE public.products 
ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

ALTER TABLE public.products 
ADD CONSTRAINT products_discount_check CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Crear trigger para actualizar updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_products_updated_at();

-- 8. Crear función para generar SKU automáticamente
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
DECLARE
    category_code VARCHAR(3);
    sequence_num INTEGER;
    new_sku VARCHAR(100);
BEGIN
    -- Si ya tiene SKU, no hacer nada
    IF NEW.sku IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Obtener código de categoría (primeras 3 letras)
    category_code := UPPER(substring(NEW.category from 1 for 3));
    
    -- Obtener siguiente número de secuencia para esta categoría
    SELECT COALESCE(MAX(CAST(substring(sku from 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.products
    WHERE sku LIKE category_code || '%';
    
    -- Generar SKU: CAT001, CAT002, etc.
    new_sku := category_code || LPAD(sequence_num::text, 3, '0');
    
    NEW.sku := new_sku;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para generar SKU automáticamente
CREATE TRIGGER generate_sku_trigger
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION generate_sku();

-- 10. Crear función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar status basado en stock
    IF NEW.stock = 0 THEN
        NEW.status := 'Sin Stock';
    ELSIF NEW.stock > 0 AND NEW.status = 'Sin Stock' THEN
        NEW.status := 'Activo';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear trigger para actualizar status basado en stock
CREATE TRIGGER update_product_status_trigger
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status();

-- 12. Configurar RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 13. Crear políticas RLS
-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Users can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Política para permitir administradores ver todos los productos
CREATE POLICY "Admins can view all products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir administradores insertar productos
CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir administradores actualizar productos
CREATE POLICY "Admins can update products" ON public.products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Política para permitir administradores eliminar productos
CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 14. Crear usuario admin si no existe
INSERT INTO public.users (
    id, email, first_name, last_name, role, is_active
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'admin@example.com',
    'Admin',
    'User',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- 15. Insertar datos de ejemplo
INSERT INTO public.products (
    id, name, description, category, price, stock, status, 
    image_url, sku, is_featured, created_by
) VALUES 
(1001, 'Laptop Gaming Pro', 'Laptop de alto rendimiento para gaming', 'Electrónicos', 1299.99, 15, 'Activo', 'https://via.placeholder.com/300x200', 'ELE001', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
(1002, 'Camiseta Básica', 'Camiseta de algodón 100%', 'Ropa', 29.99, 50, 'Activo', 'https://via.placeholder.com/300x200', 'ROP001', false, '550e8400-e29b-41d4-a716-446655440000'::uuid),
(1003, 'Sofá Moderno', 'Sofá elegante para sala de estar', 'Hogar', 899.50, 8, 'Activo', 'https://via.placeholder.com/300x200', 'HOG001', true, '550e8400-e29b-41d4-a716-446655440000'::uuid),
(1004, 'Smartphone Galaxy', 'Teléfono inteligente con cámara avanzada', 'Electrónicos', 699.99, 0, 'Sin Stock', 'https://via.placeholder.com/300x200', 'ELE002', false, '550e8400-e29b-41d4-a716-446655440000'::uuid),
(1005, 'Jeans Clásicos', 'Jeans de alta calidad', 'Ropa', 89.99, 25, 'Activo', 'https://via.placeholder.com/300x200', 'ROP002', false, '550e8400-e29b-41d4-a716-446655440000'::uuid);

-- 16. Crear vista para estadísticas de productos
CREATE OR REPLACE VIEW products_stats AS
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN status = 'Activo' THEN 1 END) as active_products,
    COUNT(CASE WHEN status = 'Sin Stock' THEN 1 END) as out_of_stock,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_products,
    AVG(price) as average_price,
    SUM(stock) as total_stock,
    COUNT(CASE WHEN stock <= 5 AND stock > 0 THEN 1 END) as low_stock_products
FROM public.products
WHERE is_active = true;

-- Mensaje de confirmación
SELECT 'Tabla products creada exitosamente con todos los índices, triggers y políticas RLS' as status; 