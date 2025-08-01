-- Script para crear calificaciones válidas
-- Primero verificar qué tenemos en la base de datos

-- 1. Verificar productos existentes
SELECT '=== PRODUCTOS EXISTENTES ===' as info;
SELECT id, name, category FROM products WHERE is_active = true ORDER BY id;

-- 2. Verificar órdenes existentes
SELECT '=== ÓRDENES EXISTENTES ===' as info;
SELECT id, user_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10;

-- 3. Verificar items de órdenes existentes
SELECT '=== ITEMS DE ÓRDENES ===' as info;
SELECT 
    oi.order_id,
    oi.product_id,
    p.name as product_name,
    o.status as order_status,
    o.user_id
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
ORDER BY o.created_at DESC
LIMIT 20;

-- 4. Verificar calificaciones existentes
SELECT '=== CALIFICACIONES EXISTENTES ===' as info;
SELECT 
    pr.product_id,
    p.name as product_name,
    pr.rating,
    pr.is_approved,
    pr.created_at
FROM product_ratings pr
JOIN products p ON pr.product_id = p.id
ORDER BY pr.created_at DESC;

-- 5. Si no hay órdenes entregadas, crear algunas de prueba
-- (Solo ejecutar si no hay órdenes entregadas)

-- Crear una orden de prueba entregada con UUID válido
INSERT INTO orders (
    user_id, 
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip_code,
    shipping_country,
    subtotal,
    shipping_cost,
    total_amount,
    payment_method,
    shipping_method,
    status,
    created_at,
    updated_at
)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Cliente de Prueba',
    'cliente@test.com',
    '+573001234567',
    'Calle Test 123, Apto 456',
    'Bogotá',
    'Cundinamarca',
    '110111',
    'Colombia',
    40000.00,
    5000.00,
    45000.00,
    'credit_card',
    'express',
    'delivered',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
) RETURNING id;

-- Guardar el ID de la orden creada para usarlo en los items
-- (Este comando devolverá el UUID generado)

-- 6. Insertar items en la orden de prueba
-- Primero obtener el ID de la orden que acabamos de crear
DO $$
DECLARE
    order_id uuid;
BEGIN
    -- Obtener el ID de la orden que acabamos de crear
    SELECT id INTO order_id FROM orders 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' 
    AND status = 'delivered' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Insertar items en la orden
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
    SELECT 
        order_id,
        p.id,
        p.name,
        p.price,
        1,
        p.price
    FROM products p 
    WHERE p.name LIKE '%Gibson%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
    SELECT 
        order_id,
        p.id,
        p.name,
        p.price,
        1,
        p.price
    FROM products p 
    WHERE p.name LIKE '%Orange%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
    SELECT 
        order_id,
        p.id,
        p.name,
        p.price,
        1,
        p.price
    FROM products p 
    WHERE p.name LIKE '%Marshall%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
    SELECT 
        order_id,
        p.id,
        p.name,
        p.price,
        1,
        p.price
    FROM products p 
    WHERE p.name LIKE '%Padel%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    -- 7. Ahora insertar calificaciones válidas
    -- Para Gibson
    INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
    SELECT 
        p.id,
        '550e8400-e29b-41d4-a716-446655440000',
        order_id,
        5,
        'Excelente producto, muy buena calidad',
        true,
        false
    FROM products p 
    WHERE p.name LIKE '%Gibson%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    -- Para Orange
    INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
    SELECT 
        p.id,
        '550e8400-e29b-41d4-a716-446655440000',
        order_id,
        4,
        'Buen producto',
        true,
        false
    FROM products p 
    WHERE p.name LIKE '%Orange%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    -- Para Marshall
    INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
    SELECT 
        p.id,
        '550e8400-e29b-41d4-a716-446655440000',
        order_id,
        5,
        'Increíble calidad',
        true,
        false
    FROM products p 
    WHERE p.name LIKE '%Marshall%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

    -- Para Padel
    INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment, is_approved, is_flagged) 
    SELECT 
        p.id,
        '550e8400-e29b-41d4-a716-446655440000',
        order_id,
        5,
        'Hermosos llaveros',
        true,
        false
    FROM products p 
    WHERE p.name LIKE '%Padel%' AND p.is_active = true
    LIMIT 1
    ON CONFLICT DO NOTHING;

END $$;

-- 7. Verificar el resultado final
SELECT '=== RESULTADO FINAL ===' as info;
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

-- 8. Probar la función RPC
SELECT '=== PRUEBA FUNCIÓN RPC ===' as info;
SELECT * FROM get_products_rating_stats(ARRAY[1,2,3,4]); 