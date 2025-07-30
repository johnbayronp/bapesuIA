# Configuración de Supabase para Tienda Virtual

## ⚠️ IMPORTANTE: Si ya tienes una tabla users creada

Si ya tienes una tabla `users` en Supabase (como se muestra en la imagen), necesitas ejecutar el script de migración para agregar las columnas faltantes.

### Paso 1: Ejecutar la migración

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `database/add_missing_columns.sql`
4. Ejecuta el script completo

### Paso 2: Verificar la migración

1. Ejecuta el script de verificación `database/test_user_creation.sql`
2. Verifica que todas las columnas se agregaron correctamente

## Si no tienes tabla users creada

### Paso 1: Crear la tabla de usuarios

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `database/users_table.sql`
4. Ejecuta el script

## Paso 3: Configurar variables de entorno

### En el frontend (.env):
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### En el backend (.env):
```env
SUPABASE_JWT_SECRET=tu_jwt_secret_de_supabase
```

## Paso 4: Probar la funcionalidad

1. Registra un nuevo usuario en tu aplicación
2. Verifica que se creó automáticamente un registro en la tabla `users`
3. Inicia sesión y ve a `/profile` para ver el perfil del usuario

## Estructura de la tabla

La tabla `users` incluye los siguientes campos:

### Campos básicos:
- `id`: UUID (referencia a auth.users)
- `email`: Email del usuario
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

### Información personal:
- `first_name`: Nombre
- `last_name`: Apellido
- `phone`: Teléfono

### Dirección de envío:
- `address`: Dirección completa
- `city`: Ciudad
- `state`: Estado/Provincia
- `postal_code`: Código postal
- `country`: País

### Estado y rol:
- `is_active`: Si el usuario está activo
- `role`: Rol del usuario (customer, admin, vendor)

### Campos de tienda virtual:
- `wishlist`: Lista de deseos (JSON)
- `cart_items`: Items en el carrito (JSON)
- `order_history`: Historial de pedidos (JSON)
- `total_spent`: Total gastado
- `loyalty_points`: Puntos de fidelidad

### Preferencias:
- `newsletter_subscription`: Suscripción al boletín
- `marketing_consent`: Consentimiento de marketing
- `preferences`: Preferencias generales (JSON)

## Funcionalidades implementadas

### ✅ Creación automática de perfil
Cuando un usuario se registra, automáticamente se crea un registro en la tabla `users`.

### ✅ Actualización automática de timestamps
El campo `updated_at` se actualiza automáticamente cuando se modifica un registro.

### ✅ Seguridad con RLS
Row Level Security está configurado para que:
- Los usuarios solo puedan ver y editar su propio perfil
- Los administradores pueden ver y editar todos los perfiles

### ✅ Componente de perfil
Los usuarios pueden ver y editar su perfil en `/profile`.

### ✅ Servicio de usuarios
API completa para manejar perfiles de usuario.

## Troubleshooting

### Error: "relation 'users' does not exist"
- Verifica que ejecutaste el script SQL correctamente
- Asegúrate de estar en el esquema `public`

### Error: "permission denied"
- Verifica que las políticas RLS están configuradas correctamente
- Asegúrate de que el usuario está autenticado

### Error: "trigger does not exist"
- Verifica que los triggers se crearon correctamente
- Ejecuta nuevamente las funciones de trigger

### Error: "column does not exist"
- Ejecuta el script `add_missing_columns.sql` para agregar las columnas faltantes

### El usuario se registra pero no aparece en la tabla users
1. Verifica que el trigger `on_auth_user_created` está funcionando
2. Revisa los logs de Supabase para errores
3. Ejecuta el script de verificación para diagnosticar el problema

## Comandos útiles de SQL

```sql
-- Ver todos los usuarios
SELECT * FROM public.users;

-- Ver usuarios activos
SELECT * FROM public.users WHERE is_active = true;

-- Ver usuarios por rol
SELECT * FROM public.users WHERE role = 'customer';

-- Ver estadísticas
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'customer') as customers,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  AVG(total_spent) as avg_spent
FROM public.users WHERE is_active = true;

-- Verificar triggers
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

## Próximos pasos

1. **Implementar carrito de compras**: Usar el campo `cart_items`
2. **Implementar lista de deseos**: Usar el campo `wishlist`
3. **Implementar sistema de pedidos**: Usar el campo `order_history`
4. **Implementar sistema de fidelidad**: Usar el campo `loyalty_points`
5. **Implementar panel de administración**: Para gestionar usuarios