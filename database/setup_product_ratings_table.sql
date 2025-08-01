-- Script para crear la tabla de calificaciones de productos
-- Ejecuta este script en Supabase SQL Editor

-- Eliminar tabla existente si existe (para empezar limpio)
DROP TABLE IF EXISTS product_ratings CASCADE;

-- Eliminar funciones y triggers existentes
DROP FUNCTION IF EXISTS update_product_rating_stats() CASCADE;
DROP FUNCTION IF EXISTS validate_product_rating() CASCADE;

-- Crear tabla de calificaciones de productos
CREATE TABLE product_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Calificación y comentario
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Estado de la calificación
    is_approved BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restricción única: un usuario solo puede calificar un producto una vez por orden
    CONSTRAINT unique_user_product_order UNIQUE (user_id, product_id, order_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_product_ratings_product_id ON product_ratings(product_id);
CREATE INDEX idx_product_ratings_user_id ON product_ratings(user_id);
CREATE INDEX idx_product_ratings_order_id ON product_ratings(order_id);
CREATE INDEX idx_product_ratings_rating ON product_ratings(rating);
CREATE INDEX idx_product_ratings_created_at ON product_ratings(created_at);
CREATE INDEX idx_product_ratings_is_approved ON product_ratings(is_approved);
CREATE INDEX idx_product_rating_stats ON product_ratings(product_id, rating, is_approved);

-- Agregar campos calculados a la tabla products para estadísticas
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb;

-- Crear función para validar calificaciones
CREATE OR REPLACE FUNCTION validate_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que el usuario haya comprado el producto en la orden especificada
    IF NOT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = NEW.product_id 
        AND oi.order_id = NEW.order_id
        AND o.user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'El usuario no puede calificar un producto que no ha comprado en esta orden';
    END IF;
    
    -- Verificar que la orden esté en estado delivered
    IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = NEW.order_id 
        AND status = 'delivered'
    ) THEN
        RAISE EXCEPTION 'Solo se pueden calificar productos de órdenes entregadas';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validar calificaciones
CREATE TRIGGER trigger_validate_product_rating
    BEFORE INSERT OR UPDATE ON product_ratings
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_rating();

-- Crear función para actualizar estadísticas de productos
CREATE OR REPLACE FUNCTION update_product_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
    rating_dist JSONB;
BEGIN
    -- Calcular promedio de calificaciones aprobadas
    SELECT 
        COALESCE(AVG(rating), 0.00),
        COUNT(*)
    INTO avg_rating, total_count
    FROM product_ratings 
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_approved = TRUE;
    
    -- Calcular distribución de calificaciones
    SELECT jsonb_build_object(
        '1', COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND rating = 1 AND is_approved = TRUE), 0),
        '2', COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND rating = 2 AND is_approved = TRUE), 0),
        '3', COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND rating = 3 AND is_approved = TRUE), 0),
        '4', COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND rating = 4 AND is_approved = TRUE), 0),
        '5', COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND rating = 5 AND is_approved = TRUE), 0)
    ) INTO rating_dist;
    
    -- Actualizar estadísticas en la tabla products
    UPDATE products 
    SET 
        average_rating = avg_rating,
        total_ratings = total_count,
        rating_distribution = rating_dist,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar estadísticas
CREATE TRIGGER trigger_update_product_rating_stats_insert
    AFTER INSERT ON product_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_stats();

CREATE TRIGGER trigger_update_product_rating_stats_update
    AFTER UPDATE ON product_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_stats();

CREATE TRIGGER trigger_update_product_rating_stats_delete
    AFTER DELETE ON product_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_stats();

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_product_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_product_ratings_updated_at
    BEFORE UPDATE ON product_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_product_ratings_updated_at();

-- Configurar RLS (Row Level Security) para product_ratings
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean calificaciones públicas
CREATE POLICY "Users can view approved ratings" ON product_ratings
    FOR SELECT USING (is_approved = TRUE);

-- Política para que los usuarios solo vean sus propias calificaciones
CREATE POLICY "Users can view their own ratings" ON product_ratings
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios creen sus propias calificaciones
CREATE POLICY "Users can create their own ratings" ON product_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios actualicen sus propias calificaciones
CREATE POLICY "Users can update their own ratings" ON product_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios eliminen sus propias calificaciones
CREATE POLICY "Users can delete their own ratings" ON product_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Política para que los administradores vean todas las calificaciones
CREATE POLICY "Admins can view all ratings" ON product_ratings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Función para obtener estadísticas de calificaciones de un producto
CREATE OR REPLACE FUNCTION get_product_rating_stats(product_id_param BIGINT)
RETURNS TABLE (
    average_rating DECIMAL(3,2),
    total_ratings INTEGER,
    rating_distribution JSONB,
    recent_ratings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.average_rating,
        p.total_ratings,
        p.rating_distribution,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', pr.id,
                    'rating', pr.rating,
                    'comment', pr.comment,
                    'user_name', CONCAT(u.first_name, ' ', u.last_name),
                    'created_at', pr.created_at
                )
            )
            FROM product_ratings pr
            JOIN users u ON u.id = pr.user_id
            WHERE pr.product_id = product_id_param 
            AND pr.is_approved = TRUE
            ORDER BY pr.created_at DESC
            LIMIT 10), 
            '[]'::jsonb
        ) as recent_ratings
    FROM products p
    WHERE p.id = product_id_param;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario puede calificar un producto
CREATE OR REPLACE FUNCTION can_user_rate_product(user_id_param UUID, product_id_param BIGINT, order_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = product_id_param 
        AND oi.order_id = order_id_param
        AND o.user_id = user_id_param
        AND o.status = 'delivered'
    );
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE product_ratings IS 'Tabla para almacenar las calificaciones de productos por los usuarios';
COMMENT ON COLUMN product_ratings.rating IS 'Calificación del 1 al 5 estrellas';
COMMENT ON COLUMN product_ratings.is_approved IS 'Indica si la calificación está aprobada para mostrar públicamente';
COMMENT ON COLUMN product_ratings.is_flagged IS 'Indica si la calificación ha sido marcada para revisión';
COMMENT ON COLUMN product_ratings.flag_reason IS 'Razón por la cual la calificación fue marcada';

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment) VALUES 
-- (1, 'user-uuid-here', 'order-uuid-here', 5, 'Excelente producto, muy recomendado'),
-- (1, 'user-uuid-here', 'order-uuid-here', 4, 'Buen producto, cumple las expectativas');

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Tabla product_ratings creada exitosamente con todas las funciones y políticas de seguridad';
END $$; 