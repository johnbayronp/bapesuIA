-- Crear tabla de lista de deseos (wishlist)
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(user_id, product_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Usuarios solo pueden ver sus propios items de wishlist
CREATE POLICY "Users can view their own wishlist items" ON wishlist
    FOR SELECT USING (auth.uid() = user_id);

-- Usuarios solo pueden insertar sus propios items de wishlist
CREATE POLICY "Users can insert their own wishlist items" ON wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios solo pueden eliminar sus propios items de wishlist
CREATE POLICY "Users can delete their own wishlist items" ON wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- Función para verificar si un producto está en la wishlist del usuario
CREATE OR REPLACE FUNCTION is_product_in_wishlist(user_uuid UUID, product_bigint BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM wishlist 
        WHERE user_id = user_uuid AND product_id = product_bigint
    );
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION is_product_in_wishlist(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_product_in_wishlist(UUID, BIGINT) TO service_role;

-- Función para obtener la wishlist de un usuario con información del producto
CREATE OR REPLACE FUNCTION get_user_wishlist(user_uuid UUID)
RETURNS TABLE (
    wishlist_id UUID,
    product_id BIGINT,
    product_name VARCHAR(255),
    product_price DECIMAL(10,2),
    product_image_url TEXT,
    product_category VARCHAR(100),
    added_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as wishlist_id,
        w.product_id,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image_url,
        p.category as product_category,
        w.created_at as added_at
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = user_uuid
    AND p.is_active = true
    ORDER BY w.created_at DESC;
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION get_user_wishlist(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wishlist(UUID) TO service_role; 