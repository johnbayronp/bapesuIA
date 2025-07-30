-- Script para agregar usuarios de prueba a la tabla users
-- Ejecutar en Supabase SQL Editor

-- Función para generar un ID bigint único
CREATE OR REPLACE FUNCTION generate_test_user_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN floor(random() * 9223372036854775807)::bigint;
END;
$$ LANGUAGE plpgsql;

-- Insertar usuarios de prueba
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at,
    total_spent,
    loyalty_points
) VALUES 
(
    generate_test_user_id(),
    'juan.perez@example.com',
    'Juan',
    'Pérez',
    'customer',
    true,
    NOW() - INTERVAL '30 days',
    NOW(),
    150.50,
    25
),
(
    generate_test_user_id(),
    'maria.garcia@example.com',
    'María',
    'García',
    'customer',
    true,
    NOW() - INTERVAL '25 days',
    NOW(),
    89.99,
    15
),
(
    generate_test_user_id(),
    'carlos.rodriguez@example.com',
    'Carlos',
    'Rodríguez',
    'customer',
    false,
    NOW() - INTERVAL '20 days',
    NOW(),
    0.00,
    0
),
(
    generate_test_user_id(),
    'ana.lopez@example.com',
    'Ana',
    'López',
    'vendor',
    true,
    NOW() - INTERVAL '15 days',
    NOW(),
    0.00,
    0
),
(
    generate_test_user_id(),
    'pedro.martinez@example.com',
    'Pedro',
    'Martínez',
    'customer',
    true,
    NOW() - INTERVAL '10 days',
    NOW(),
    234.75,
    40
),
(
    generate_test_user_id(),
    'lucia.hernandez@example.com',
    'Lucía',
    'Hernández',
    'customer',
    true,
    NOW() - INTERVAL '5 days',
    NOW(),
    67.25,
    10
),
(
    generate_test_user_id(),
    'roberto.silva@example.com',
    'Roberto',
    'Silva',
    'customer',
    false,
    NOW() - INTERVAL '3 days',
    NOW(),
    0.00,
    0
),
(
    generate_test_user_id(),
    'carmen.vargas@example.com',
    'Carmen',
    'Vargas',
    'vendor',
    true,
    NOW() - INTERVAL '2 days',
    NOW(),
    0.00,
    0
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    total_spent,
    loyalty_points
FROM public.users 
WHERE email LIKE '%@example.com'
ORDER BY created_at DESC;

-- Mostrar estadísticas
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users
FROM public.users 
WHERE email LIKE '%@example.com'
GROUP BY role
ORDER BY total_users DESC; 