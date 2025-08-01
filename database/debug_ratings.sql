-- Script de diagnóstico para calificaciones
-- Verificar si las calificaciones existen y están aprobadas

-- 1. Verificar calificaciones existentes
SELECT '=== CALIFICACIONES EXISTENTES ===' as info;
SELECT 
    pr.id,
    pr.product_id,
    p.name as product_name,
    pr.rating,
    pr.is_approved,
    pr.is_flagged,
    pr.created_at
FROM product_ratings pr
JOIN products p ON pr.product_id = p.id
ORDER BY pr.created_at DESC;

-- 2. Verificar productos activos
SELECT '=== PRODUCTOS ACTIVOS ===' as info;
SELECT 
    id,
    name,
    category,
    is_active
FROM products 
WHERE is_active = true
ORDER BY id;

-- 3. Probar la función RPC manualmente
SELECT '=== PRUEBA FUNCIÓN RPC ===' as info;
-- Primero obtener los IDs de productos activos
WITH active_products AS (
    SELECT id FROM products WHERE is_active = true
)
SELECT * FROM get_products_rating_stats(
    ARRAY(SELECT id FROM active_products)
);

-- 4. Verificar calificaciones aprobadas por producto
SELECT '=== CALIFICACIONES APROBADAS POR PRODUCTO ===' as info;
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(pr.id) as total_ratings,
    ROUND(AVG(pr.rating), 1) as average_rating,
    COUNT(CASE WHEN pr.is_approved = true THEN 1 END) as approved_ratings
FROM products p
LEFT JOIN product_ratings pr ON p.id = pr.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.id;

-- 5. Verificar si hay calificaciones aprobadas específicamente
SELECT '=== SOLO CALIFICACIONES APROBADAS ===' as info;
SELECT 
    pr.product_id,
    p.name as product_name,
    pr.rating,
    pr.is_approved,
    pr.created_at
FROM product_ratings pr
JOIN products p ON pr.product_id = p.id
WHERE pr.is_approved = true
ORDER BY pr.created_at DESC; 