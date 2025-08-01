-- Script para insertar calificaciones de prueba
-- Esto creará calificaciones reales para que aparezcan las estrellas

-- Primero, verificar que la función RPC existe
-- Si no existe, ejecutar primero: database/add_rating_stats_function.sql

-- Insertar calificaciones de prueba para los productos existentes
-- Nota: Asegúrate de reemplazar los UUIDs con valores reales de tu base de datos

-- Obtener algunos productos existentes
-- SELECT id, name FROM products WHERE is_active = true LIMIT 4;

-- Insertar calificaciones de prueba
-- Reemplaza los UUIDs con valores reales de tu base de datos

-- Para el producto "Porta pick Gibson" (asumiendo ID = 1)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
VALUES 
(1, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 5, 'Excelente producto, muy buena calidad', true, false),
(1, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 4, 'Muy bueno, recomendado', true, false),
(1, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 5, 'Perfecto para músicos', true, false);

-- Para el producto "Porta pick Orange" (asumiendo ID = 2)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
VALUES 
(2, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004', 4, 'Buen producto', true, false),
(2, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 3, 'Regular', true, false);

-- Para el producto "Porta Pick Marshall" (asumiendo ID = 3)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
VALUES 
(3, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440006', 5, 'Increíble calidad', true, false),
(3, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440007', 5, 'Super recomendado', true, false),
(3, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440008', 4, 'Muy bueno', true, false);

-- Para el producto "Llaveros Padel" (asumiendo ID = 4)
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
VALUES 
(4, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440009', 5, 'Hermosos llaveros', true, false),
(4, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 4, 'Buen regalo', true, false);

-- Verificar las calificaciones insertadas
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