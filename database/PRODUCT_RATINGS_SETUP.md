# Configuración de la Tabla de Calificaciones de Productos

Este archivo contiene las instrucciones para configurar la tabla de calificaciones de productos en la base de datos Supabase.

## 🚀 Pasos para Configurar

### 1. Ejecutar el SQL de la Tabla

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `setup_product_ratings_table.sql`
4. Ejecuta el script

### 2. Verificar la Configuración

Después de ejecutar el SQL, deberías ver:

- ✅ Tabla `product_ratings` creada
- ✅ Campos calculados agregados a la tabla `products`
- ✅ Índices creados para optimizar consultas
- ✅ Triggers para validar y actualizar estadísticas automáticamente
- ✅ RLS (Row Level Security) configurado
- ✅ Políticas de seguridad configuradas
- ✅ Funciones auxiliares creadas

## 📊 Estructura de la Tabla

### Tabla `product_ratings`
- `id`: UUID (clave primaria)
- `product_id`: BIGINT (referencia a products.id)
- `user_id`: UUID (referencia a auth.users.id)
- `order_id`: UUID (referencia a orders.id)
- `rating`: INTEGER (1-5 estrellas)
- `comment`: TEXT (comentario opcional)
- `is_approved`: BOOLEAN (si está aprobada para mostrar públicamente)
- `is_flagged`: BOOLEAN (si ha sido marcada para revisión)
- `flag_reason`: TEXT (razón del marcado)
- `created_at`: TIMESTAMP (fecha de creación)
- `updated_at`: TIMESTAMP (fecha de última actualización)

### Campos Agregados a `products`
- `average_rating`: DECIMAL(3,2) (promedio de calificaciones)
- `total_ratings`: INTEGER (total de calificaciones)
- `rating_distribution`: JSONB (distribución de calificaciones por estrella)

## 🔒 Validaciones y Restricciones

### Restricciones de Negocio
1. **Un usuario solo puede calificar un producto una vez por orden**
2. **Solo se pueden calificar productos de órdenes entregadas**
3. **El usuario debe haber comprado el producto en la orden especificada**
4. **Las calificaciones deben estar entre 1 y 5 estrellas**

### Seguridad
- **RLS habilitado** con políticas específicas
- **Usuarios solo ven calificaciones aprobadas públicamente**
- **Usuarios pueden ver, crear, actualizar y eliminar sus propias calificaciones**
- **Administradores tienen acceso completo**

## 🔄 Funciones Automáticas

### Triggers Implementados
1. **Validación de calificaciones**: Verifica que el usuario pueda calificar
2. **Actualización de estadísticas**: Actualiza automáticamente el promedio y distribución
3. **Actualización de timestamps**: Mantiene `updated_at` actualizado

### Funciones Auxiliares
- `get_product_rating_stats(product_id)`: Obtiene estadísticas completas
- `can_user_rate_product(user_id, product_id, order_id)`: Verifica si puede calificar

## 📈 Ejemplos de Uso

### 1. Crear una Calificación
```sql
INSERT INTO product_ratings (product_id, user_id, order_id, rating, comment)
VALUES (1, 'user-uuid', 'order-uuid', 5, 'Excelente producto');
```

### 2. Obtener Estadísticas de un Producto
```sql
SELECT * FROM get_product_rating_stats(1);
```

### 3. Verificar si un Usuario Puede Calificar
```sql
SELECT can_user_rate_product('user-uuid', 1, 'order-uuid');
```

### 4. Obtener Calificaciones Recientes
```sql
SELECT pr.*, u.first_name, u.last_name
FROM product_ratings pr
JOIN users u ON u.id = pr.user_id
WHERE pr.product_id = 1 AND pr.is_approved = TRUE
ORDER BY pr.created_at DESC
LIMIT 10;
```

## 🛠️ API Endpoints Sugeridos

### Frontend Integration
```javascript
// Crear calificación
POST /api/product-ratings
{
  "product_id": 123,
  "order_id": "uuid",
  "rating": 5,
  "comment": "Excelente producto"
}

// Obtener estadísticas
GET /api/products/:id/ratings

// Verificar si puede calificar
GET /api/products/:id/can-rate?order_id=uuid
```

## 📊 Distribución de Calificaciones

La tabla `products` ahora incluye un campo `rating_distribution` con esta estructura:
```json
{
  "1": 5,   // 5 calificaciones de 1 estrella
  "2": 10,  // 10 calificaciones de 2 estrellas
  "3": 25,  // 25 calificaciones de 3 estrellas
  "4": 50,  // 50 calificaciones de 4 estrellas
  "5": 100  // 100 calificaciones de 5 estrellas
}
```

## 🔍 Consultas Útiles

### Productos Mejor Calificados
```sql
SELECT p.name, p.average_rating, p.total_ratings
FROM products p
WHERE p.average_rating >= 4.0 AND p.total_ratings >= 5
ORDER BY p.average_rating DESC, p.total_ratings DESC;
```

### Calificaciones Pendientes de Aprobación
```sql
SELECT pr.*, p.name as product_name, u.first_name, u.last_name
FROM product_ratings pr
JOIN products p ON p.id = pr.product_id
JOIN users u ON u.id = pr.user_id
WHERE pr.is_approved = FALSE
ORDER BY pr.created_at DESC;
```

### Estadísticas Generales
```sql
SELECT 
    COUNT(*) as total_ratings,
    AVG(rating) as average_rating,
    COUNT(DISTINCT product_id) as products_rated,
    COUNT(DISTINCT user_id) as users_rating
FROM product_ratings
WHERE is_approved = TRUE;
```

## 🚨 Consideraciones Importantes

1. **Rendimiento**: Los triggers pueden afectar el rendimiento en tablas grandes
2. **Backup**: Asegúrate de hacer backup antes de ejecutar el script
3. **Testing**: Prueba las validaciones en un entorno de desarrollo primero
4. **Monitoreo**: Monitorea el rendimiento de las consultas con índices

## 🔧 Mantenimiento

### Limpieza de Datos
```sql
-- Eliminar calificaciones duplicadas (si las hay)
DELETE FROM product_ratings 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM product_ratings 
    GROUP BY user_id, product_id, order_id
);

-- Actualizar estadísticas manualmente
SELECT update_product_rating_stats();
```

### Optimización
```sql
-- Analizar tablas para optimizar consultas
ANALYZE product_ratings;
ANALYZE products;
```

---

¡La tabla de calificaciones está lista para usar! 🎉 