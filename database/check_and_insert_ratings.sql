-- Script para verificar productos y insertar calificaciones de prueba

-- 1. Primero, verificar qué productos existen
SELECT id, name, category FROM products WHERE is_active = true ORDER BY id;

-- 2. Verificar si la función RPC existe
-- Si no existe, ejecutar: database/add_rating_stats_function.sql

-- 3. Insertar calificaciones de prueba usando los IDs reales
-- (Ejecutar esto después de ver los IDs reales de los productos)

-- Ejemplo para insertar calificaciones (reemplaza los IDs con los reales):
/*
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
VALUES 
-- Reemplaza X con el ID real del producto "Porta pick Gibson"
(X, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 5, 'Excelente producto, muy buena calidad', true, false),
(X, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 4, 'Muy bueno, recomendado', true, false),
(X, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 5, 'Perfecto para músicos', true, false);
*/

-- 4. Verificar las calificaciones después de insertarlas
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