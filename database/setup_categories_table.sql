-- Script para crear la tabla de categorías
-- Ejecuta este script en Supabase SQL Editor

-- 0. Eliminar tabla existente si existe (CUIDADO: esto eliminará todos los datos)
DROP TABLE IF EXISTS public.categories CASCADE;

-- 1. Crear tabla de categorías
CREATE TABLE public.categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) UNIQUE,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_active ON public.categories(is_active);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- 3. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- 4. Crear trigger para generar slug automáticamente
CREATE OR REPLACE FUNCTION generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
        NEW.slug = REGEXP_REPLACE(NEW.slug, '\s+', '-', 'g');
        NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_category_slug
    BEFORE INSERT OR UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION generate_category_slug();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS
-- Política para permitir lectura de categorías activas
CREATE POLICY "Allow read active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Política para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Allow all operations for authenticated users" ON public.categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Insertar categorías por defecto
INSERT INTO public.categories (name, description, icon, color, is_featured, sort_order) VALUES
('Electrónicos', 'Productos electrónicos y tecnología', 'DevicePhoneMobileIcon', '#3B82F6', true, 1),
('Ropa', 'Ropa y accesorios de vestir', 'ShoppingBagIcon', '#EF4444', true, 2),
('Hogar', 'Productos para el hogar y decoración', 'HomeIcon', '#10B981', true, 3),
('Deportes', 'Artículos deportivos y fitness', 'TrophyIcon', '#F59E0B', true, 4),
('Libros', 'Libros y material educativo', 'BookOpenIcon', '#8B5CF6', false, 5),
('Juguetes', 'Juguetes y entretenimiento', 'GiftIcon', '#EC4899', false, 6),
('Salud', 'Productos de salud y belleza', 'HeartIcon', '#06B6D4', false, 7),
('Automotriz', 'Productos para automóviles', 'TruckIcon', '#6B7280', false, 8),
('Jardín', 'Productos para jardín y exteriores', 'LeafIcon', '#059669', false, 9),
('Oficina', 'Productos de oficina y papelería', 'BriefcaseIcon', '#7C3AED', false, 10);

-- 8. Verificar que la tabla se creó correctamente
SELECT 'Tabla de categorías creada exitosamente' as status;
SELECT COUNT(*) as total_categories FROM public.categories; 