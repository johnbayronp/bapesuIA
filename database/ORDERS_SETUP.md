# Configuración de la Tabla de Orders

Este archivo contiene las instrucciones para configurar la tabla de órdenes en la base de datos Supabase.

## Pasos para Configurar

### 1. Ejecutar el SQL de la Tabla

1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `setup_orders_table.sql`
4. Ejecuta el script

### 2. Verificar la Configuración

Después de ejecutar el SQL, deberías ver:

- ✅ Tabla `orders` creada
- ✅ Tabla `order_items` creada
- ✅ Índices creados para optimizar consultas
- ✅ Triggers para generar números de orden automáticamente
- ✅ RLS (Row Level Security) configurado
- ✅ Políticas de seguridad configuradas

### 3. Estructura de las Tablas

#### Tabla `orders`
- `id`: UUID (clave primaria)
- `order_number`: Número único de orden (generado automáticamente)
- `user_id`: ID del usuario (referencia a auth.users)
- `customer_name`: Nombre del cliente
- `customer_email`: Email del cliente
- `customer_phone`: Teléfono del cliente
- `shipping_address`: Dirección de envío
- `shipping_city`: Ciudad
- `shipping_state`: Departamento/Estado
- `shipping_zip_code`: Código postal
- `shipping_country`: País (por defecto 'Colombia')
- `subtotal`: Subtotal del pedido
- `shipping_cost`: Costo de envío
- `total_amount`: Total del pedido
- `payment_method`: Método de pago
- `shipping_method`: Método de envío
- `status`: Estado del pedido (pending, confirmed, processing, shipped, delivered, cancelled)
- `comments`: Comentarios adicionales
- `whatsapp_sent`: Indica si se envió por WhatsApp
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

#### Tabla `order_items`
- `id`: UUID (clave primaria)
- `order_id`: ID de la orden (referencia a orders)
- `product_id`: ID del producto (referencia a products)
- `product_name`: Nombre del producto
- `product_price`: Precio del producto
- `quantity`: Cantidad
- `total_price`: Precio total (precio * cantidad)
- `created_at`: Fecha de creación

### 4. Funcionalidades Automáticas

#### Generación de Números de Orden
- Formato: `ORD-YYYYMMDD-XXXX` (ejemplo: `ORD-20250115-0001`)
- Se genera automáticamente al crear una orden
- Es único y secuencial

#### Actualización Automática de Timestamps
- `created_at`: Se establece automáticamente al crear
- `updated_at`: Se actualiza automáticamente al modificar

#### Seguridad (RLS)
- Los usuarios solo pueden ver sus propias órdenes
- Los administradores pueden ver todas las órdenes
- Los usuarios solo pueden crear órdenes para sí mismos

### 5. Estados de las Órdenes

- `pending`: Pendiente (estado inicial)
- `confirmed`: Confirmada
- `processing`: En procesamiento
- `shipped`: Enviada
- `delivered`: Entregada
- `cancelled`: Cancelada

### 6. API Endpoints Disponibles

#### Para Usuarios Autenticados:
- `POST /api/v1/orders` - Crear nueva orden
- `GET /api/v1/orders` - Obtener órdenes del usuario
- `GET /api/v1/orders/<order_id>` - Obtener orden específica

#### Para Administradores:
- `GET /api/v1/admin/orders` - Obtener todas las órdenes
- `PATCH /api/v1/admin/orders/<order_id>/status` - Actualizar estado
- `GET /api/v1/admin/orders/stats` - Obtener estadísticas

### 7. Ejemplo de Uso

```javascript
// Crear una orden
const orderData = {
  customer_name: "Juan Pérez",
  customer_email: "juan@example.com",
  customer_phone: "3001234567",
  shipping_address: "Calle 123 #45-67",
  shipping_city: "Bogotá",
  shipping_state: "Cundinamarca",
  shipping_zip_code: "110111",
  subtotal: 50000,
  shipping_cost: 10000,
  total_amount: 60000,
  payment_method: "transfer",
  shipping_method: "Interrapidisimo Bogotá",
  comments: "Entregar en la portería",
  items: [
    {
      product_id: "uuid-del-producto",
      name: "Producto Ejemplo",
      price: 25000,
      quantity: 2
    }
  ]
};

const response = await fetch('/api/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(orderData)
});
```

### 8. Verificación

Para verificar que todo funciona correctamente:

1. Ejecuta el SQL
2. Prueba crear una orden desde el frontend
3. Verifica que se guarde en la base de datos
4. Confirma que se envíe por WhatsApp con el número de orden

### 9. Troubleshooting

Si encuentras problemas:

1. **Error de permisos**: Verifica que las políticas RLS estén configuradas correctamente
2. **Error de números de orden**: Verifica que el trigger esté funcionando
3. **Error de referencias**: Asegúrate de que las tablas `users` y `products` existan
4. **Error de API**: Verifica que el servicio `OrderService` esté importado correctamente

### 10. Notas Importantes

- Las órdenes se crean automáticamente cuando el usuario completa el checkout
- El número de orden se incluye en el mensaje de WhatsApp
- Los administradores pueden gestionar las órdenes desde el panel de administración
- Las estadísticas están disponibles para análisis de ventas 