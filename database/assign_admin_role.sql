-- Script para asignar rol de administrador a un usuario específico
-- Ejecutar en Supabase SQL Editor

-- Reemplaza 'admin@example.com' con el email del usuario que quieres hacer administrador
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Verificar que el cambio se aplicó correctamente
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'admin@example.com';

-- Mostrar todos los administradores
SELECT id, email, role, created_at 
FROM public.users 
WHERE role = 'admin';

-- Mostrar estadísticas de roles
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users
FROM public.users 
GROUP BY role 
ORDER BY total_users DESC; 