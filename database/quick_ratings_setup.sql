-- Script completo para configurar calificaciones de prueba
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear la función RPC si no existe
CREATE OR REPLACE FUNCTION get_products_rating_stats(product_ids BIGINT[])
RETURNS TABLE (
    product_id BIGINT,
    average_rating NUMERIC(3,2),
    total_ratings INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.product_id,
        COALESCE(AVG(pr.rating)::NUMERIC(3,2), 0.00) as average_rating,
        COALESCE(COUNT(pr.id)::INTEGER, 0) as total_ratings
    FROM product_ratings pr
    WHERE pr.product_id = ANY(product_ids)
    AND pr.is_approved = true
    GROUP BY pr.product_id;
    
    -- Incluir productos sin calificaciones con valores por defecto
    RETURN QUERY
    SELECT 
        p.id as product_id,
        0.00 as average_rating,
        0 as total_ratings
    FROM products p
    WHERE p.id = ANY(product_ids)
    AND p.id NOT IN (
        SELECT DISTINCT product_id 
        FROM product_ratings 
        WHERE product_id = ANY(product_ids) 
        AND is_approved = true
    );
END;
$$;

-- 2. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_products_rating_stats(BIGINT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_rating_stats(BIGINT[]) TO service_role;

-- 3. Verificar productos existentes
SELECT 'Productos existentes:' as info;
SELECT id, name, category FROM products WHERE is_active = true ORDER BY id;

-- 4. Insertar calificaciones de prueba para los primeros 4 productos
-- (Ajusta los IDs según los productos que tengas)

-- Para el primer producto (Porta pick Gibson)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    5,
    'Excelente producto, muy buena calidad',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Gibson%' AND p.is_active = true
LIMIT 1;

INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002',
    4,
    'Muy bueno, recomendado',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Gibson%' AND p.is_active = true
LIMIT 1;

-- Para el segundo producto (Porta pick Orange)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440003',
    4,
    'Buen producto',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Orange%' AND p.is_active = true
LIMIT 1;

INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440004',
    3,
    'Regular',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Orange%' AND p.is_active = true
LIMIT 1;

-- Para el tercer producto (Porta Pick Marshall)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440005',
    5,
    'Increíble calidad',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Marshall%' AND p.is_active = true
LIMIT 1;

INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440006',
    5,
    'Super recomendado',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Marshall%' AND p.is_active = true
LIMIT 1;

-- Para el cuarto producto (Llaveros Padel)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440007',
    5,
    'Hermosos llaveros',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Padel%' AND p.is_active = true
LIMIT 1;

INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
SELECT 
    p.id,
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440008',
    4,
    'Buen regalo',
    true,
    false
FROM products p 
WHERE p.name LIKE '%Padel%' AND p.is_active = true
LIMIT 1;

-- 5. Verificar las calificaciones insertadas
SELECT 'Calificaciones después de la inserción:' as info;
SELECT 
    p.name as product_name,
    p.id as product_id,
    COUNT(pr.id) as total_ratings,
    ROUND(AVG(pr.rating), 1) as average_rating
FROM products p
LEFT JOIN product_ratings pr ON p.id = pr.product_id AND pr.is_approved = true
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.id;

-- 6. Probar la función RPC
SELECT 'Probando función RPC:' as info;
SELECT * FROM get_products_rating_stats(ARRAY[1,2,3,4]); 