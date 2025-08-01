# API de Calificaciones de Productos

Este documento describe los endpoints disponibles para manejar las calificaciones de productos en el sistema.

## 🚀 Configuración Requerida

Antes de usar estos endpoints, asegúrate de:

1. **Ejecutar el SQL de la tabla**: `database/setup_product_ratings_table.sql`
2. **Verificar la configuración**: Revisar `database/PRODUCT_RATINGS_SETUP.md`

## 📋 Endpoints Disponibles

### 🔐 Endpoints que Requieren Autenticación

#### 1. Crear Calificación
```http
POST /api/v1/product-ratings
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 123,
  "order_id": "uuid-order-id",
  "rating": 5,
  "comment": "Excelente producto, muy recomendado"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-rating-id",
    "product_id": 123,
    "user_id": "uuid-user-id",
    "order_id": "uuid-order-id",
    "rating": 5,
    "comment": "Excelente producto, muy recomendado",
    "is_approved": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Calificación creada exitosamente"
}
```

#### 2. Verificar si Puede Calificar
```http
GET /api/v1/products/{product_id}/can-rate?order_id={order_id}
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "can_rate": true,
    "product_id": 123,
    "order_id": "uuid-order-id"
  }
}
```

#### 3. Actualizar Calificación
```http
PUT /api/v1/product-ratings/{rating_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Buen producto, pero podría mejorar"
}
```

#### 4. Eliminar Calificación
```http
DELETE /api/v1/product-ratings/{rating_id}
Authorization: Bearer <token>
```

#### 5. Obtener Calificaciones del Usuario
```http
GET /api/v1/user/ratings?page=1&per_page=10
Authorization: Bearer <token>
```

### 🌐 Endpoints Públicos

#### 1. Obtener Calificaciones de un Producto
```http
GET /api/v1/products/{product_id}/ratings?page=1&per_page=10
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-rating-id",
      "rating": 5,
      "comment": "Excelente producto",
      "created_at": "2024-01-01T00:00:00Z",
      "users": {
        "first_name": "Juan",
        "last_name": "Pérez"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### 2. Obtener Estadísticas de Calificaciones
```http
GET /api/v1/products/{product_id}/rating-stats
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "average_rating": 4.2,
    "total_ratings": 25,
    "rating_distribution": {
      "1": 1,
      "2": 2,
      "3": 5,
      "4": 8,
      "5": 9
    },
    "recent_ratings": [
      {
        "id": "uuid-rating-id",
        "rating": 5,
        "comment": "Excelente producto",
        "user_name": "Juan Pérez",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 👨‍💼 Endpoints de Administrador

#### 1. Obtener Calificaciones Pendientes
```http
GET /api/v1/admin/product-ratings/pending?page=1&per_page=10
Authorization: Bearer <admin-token>
```

#### 2. Aprobar Calificación
```http
PATCH /api/v1/admin/product-ratings/{rating_id}/approve
Authorization: Bearer <admin-token>
```

#### 3. Rechazar Calificación
```http
PATCH /api/v1/admin/product-ratings/{rating_id}/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Comentario inapropiado"
}
```

## 🔒 Validaciones y Restricciones

### Validaciones de Negocio
1. **Solo usuarios autenticados** pueden crear calificaciones
2. **Solo se pueden calificar productos de órdenes entregadas** (`status = 'delivered'`)
3. **Un usuario solo puede calificar un producto una vez por orden**
4. **Las calificaciones deben estar entre 1 y 5 estrellas**
5. **Solo administradores** pueden aprobar/rechazar calificaciones

### Validaciones Técnicas
1. **Campos requeridos**: `product_id`, `order_id`, `rating`
2. **Tipos de datos**: 
   - `product_id`: INTEGER
   - `order_id`: UUID
   - `rating`: INTEGER (1-5)
   - `comment`: TEXT (opcional)

## 📊 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Error de validación o datos incorrectos |
| 401 | No autenticado |
| 403 | No autorizado (solo para endpoints admin) |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## 🚨 Manejo de Errores

### Errores Comunes

#### Error de Validación
```json
{
  "success": false,
  "error": "La calificación debe estar entre 1 y 5"
}
```

#### Error de Permisos
```json
{
  "success": false,
  "error": "El usuario no puede calificar este producto"
}
```

#### Error de Duplicado
```json
{
  "success": false,
  "error": "Ya has calificado este producto en esta orden"
}
```

## 🔧 Ejemplos de Uso

### Frontend Integration

#### Crear Calificación
```javascript
const createRating = async (productId, orderId, rating, comment = null) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/product-ratings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        order_id: orderId,
        rating: rating,
        comment: comment
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log('Calificación creada:', data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error al crear calificación:', error);
    throw error;
  }
};
```

#### Obtener Estadísticas
```javascript
const getProductStats = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}/rating-stats`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};
```

#### Verificar si Puede Calificar
```javascript
const canRateProduct = async (productId, orderId) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `${API_URL}/products/${productId}/can-rate?order_id=${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    return data.success && data.data.can_rate;
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};
```

## 📈 Consideraciones de Rendimiento

1. **Paginación**: Todos los endpoints de listado soportan paginación
2. **Índices**: La base de datos tiene índices optimizados para consultas frecuentes
3. **Caché**: Considera implementar caché para estadísticas de productos populares
4. **Rate Limiting**: Implementa límites de velocidad para prevenir spam

## 🔄 Flujo de Trabajo Típico

1. **Usuario compra producto** → Orden creada con `status = 'pending'`
2. **Admin procesa orden** → `status = 'confirmed'` → `'processing'` → `'shipped'`
3. **Producto entregado** → `status = 'delivered'`
4. **Usuario puede calificar** → Llamar a `/can-rate` para verificar
5. **Usuario califica** → POST a `/product-ratings`
6. **Calificación aprobada** → Automáticamente por defecto
7. **Estadísticas actualizadas** → Automáticamente por triggers

---

¡Los endpoints están listos para usar! 🎉 