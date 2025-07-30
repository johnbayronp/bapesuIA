# Configuración de Productos - Base de Datos

Este documento contiene las instrucciones para configurar la tabla de productos en Supabase y las funcionalidades del CRUD completo.

## 📋 Tabla de Contenidos

1. [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
2. [Estructura de la Tabla](#estructura-de-la-tabla)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Endpoints de la API](#endpoints-de-la-api)
5. [Uso del Frontend](#uso-del-frontend)

## 🗄️ Configuración de la Base de Datos

### Paso 1: Verificar y corregir la tabla users

**IMPORTANTE**: Antes de crear la tabla de productos, asegúrate de que la tabla `users` tenga la estructura correcta.

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `database/check_users_table_structure.sql`
4. Ejecuta el script completo

Este script:
- ✅ Verificará la estructura actual de la tabla `users`
- ✅ Si la tabla no existe, la creará con `id` como UUID
- ✅ Si la tabla existe con `id` como BIGINT, la convertirá a UUID
- ✅ Creará un usuario admin de ejemplo

### Paso 2: Crear la tabla de productos

Una vez que la tabla `users` esté configurada correctamente:

1. Copia y pega el contenido del archivo `database/setup_products_table.sql`
2. Ejecuta el script completo

### Paso 2: Verificar la Configuración

El script creará:

- ✅ Tabla `products` con todas las columnas necesarias
- ✅ Índices para optimizar consultas
- ✅ Restricciones de integridad
- ✅ Triggers automáticos (SKU, updated_at, status)
- ✅ Políticas RLS (Row Level Security)
- ✅ Datos de ejemplo
- ✅ Vista de estadísticas

## 📊 Estructura de la Tabla

### Columnas Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT | ID único del producto |
| `name` | VARCHAR(255) | Nombre del producto |
| `description` | TEXT | Descripción detallada |
| `category` | VARCHAR(100) | Categoría del producto |
| `price` | DECIMAL(10,2) | Precio del producto |
| `stock` | INTEGER | Cantidad en stock |
| `status` | VARCHAR(20) | Estado (Activo, Inactivo, Sin Stock) |
| `sku` | VARCHAR(100) | Código SKU único (generado automáticamente) |
| `image_url` | TEXT | URL de la imagen del producto |
| `is_featured` | BOOLEAN | Si es producto destacado |
| `is_active` | BOOLEAN | Si está activo en el sistema |

### Columnas Adicionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `barcode` | VARCHAR(100) | Código de barras |
| `weight` | DECIMAL(8,3) | Peso del producto |
| `dimensions` | JSONB | Dimensiones (largo, ancho, alto) |
| `tags` | TEXT[] | Array de etiquetas |
| `specifications` | JSONB | Especificaciones técnicas |
| `discount_percentage` | DECIMAL(5,2) | Porcentaje de descuento |
| `cost_price` | DECIMAL(10,2) | Precio de costo |
| `supplier_info` | JSONB | Información del proveedor |
| `inventory_alerts` | JSONB | Alertas de inventario |
| `seo_data` | JSONB | Datos SEO |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |
| `created_by` | UUID | ID del usuario que lo creó |

## ⚙️ Funcionalidades Implementadas

### Backend (Python/Flask)

#### Servicio de Productos (`product_service.py`)

- ✅ **CRUD Completo**: Create, Read, Update, Delete
- ✅ **Paginación**: Soporte para paginación de resultados
- ✅ **Filtros Avanzados**: Por categoría, estado, precio, búsqueda
- ✅ **Validaciones**: Validación de datos de entrada
- ✅ **Manejo de Errores**: Gestión completa de errores
- ✅ **Estadísticas**: Cálculo automático de estadísticas
- ✅ **Búsqueda**: Búsqueda por nombre, descripción, SKU

#### Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/products` | Obtener productos con filtros y paginación |
| `GET` | `/products/{id}` | Obtener producto específico |
| `POST` | `/products` | Crear nuevo producto |
| `PUT` | `/products/{id}` | Actualizar producto |
| `DELETE` | `/products/{id}` | Eliminar producto (soft delete) |
| `DELETE` | `/products/{id}/hard-delete` | Eliminar permanentemente |
| `PATCH` | `/products/{id}/stock` | Actualizar stock |
| `GET` | `/products/stats` | Obtener estadísticas |
| `GET` | `/products/categories` | Obtener categorías |
| `GET` | `/products/search` | Buscar productos |

### Frontend (React)

#### Componente de Gestión (`ProductsManagement.jsx`)

- ✅ **Interfaz Completa**: Tabla con todos los productos
- ✅ **Modal de Creación/Edición**: Formulario completo
- ✅ **Filtros en Tiempo Real**: Búsqueda y filtros
- ✅ **Paginación**: Navegación entre páginas
- ✅ **Estadísticas Visuales**: Dashboard con métricas
- ✅ **Acciones CRUD**: Botones para crear, editar, eliminar
- ✅ **Validaciones**: Validación de formularios
- ✅ **Notificaciones**: Toast messages para feedback

## 🔧 Endpoints de la API

### Obtener Productos

```bash
GET /api/v1/products?page=1&per_page=10&category=Electrónicos&status=Activo&search=laptop
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `per_page`: Elementos por página (default: 10)
- `category`: Filtrar por categoría
- `status`: Filtrar por estado
- `search`: Término de búsqueda
- `min_price`: Precio mínimo
- `max_price`: Precio máximo
- `featured`: Solo destacados (true/false)
- `in_stock`: Solo con stock (true/false)

### Crear Producto

```bash
POST /api/v1/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Laptop Gaming Pro",
  "description": "Laptop de alto rendimiento para gaming",
  "category": "Electrónicos",
  "price": 1299.99,
  "stock": 15,
  "image_url": "https://example.com/image.jpg",
  "is_featured": true,
  "status": "Activo"
}
```

### Actualizar Producto

```bash
PUT /api/v1/products/1001
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Laptop Gaming Pro Updated",
  "price": 1199.99,
  "stock": 20
}
```

### Eliminar Producto

```bash
DELETE /api/v1/products/1001
Authorization: Bearer <token>
```

### Obtener Estadísticas

```bash
GET /api/v1/products/stats
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_products": 25,
    "active_products": 20,
    "out_of_stock": 3,
    "featured_products": 5,
    "average_price": 450.50,
    "total_stock": 1500,
    "low_stock_products": 8
  }
}
```

## 🎨 Uso del Frontend

### Características Principales

1. **Dashboard de Estadísticas**
   - Total de productos
   - Productos activos
   - Productos sin stock
   - Productos destacados

2. **Filtros Avanzados**
   - Búsqueda por nombre/SKU
   - Filtro por categoría
   - Filtro por estado

3. **Gestión Completa**
   - Crear nuevos productos
   - Editar productos existentes
   - Eliminar productos
   - Ver detalles completos

4. **Interfaz Responsiva**
   - Diseño adaptativo
   - Modo oscuro/claro
   - Tabla con scroll horizontal

### Funcionalidades del Modal

- ✅ **Validación de Campos**: Campos requeridos marcados
- ✅ **Carga de Categorías**: Dropdown dinámico
- ✅ **Imagen Preview**: Vista previa de imagen
- ✅ **Checkbox Destacado**: Marcar como destacado
- ✅ **Estados**: Activo, Inactivo, Sin Stock

## 🔒 Seguridad

### Políticas RLS (Row Level Security)

- ✅ **Lectura**: Solo usuarios autenticados pueden ver productos activos
- ✅ **Administradores**: Acceso completo a todos los productos
- ✅ **Escritura**: Solo administradores pueden crear/editar/eliminar
- ✅ **Eliminación**: Soft delete por defecto

### Validaciones

- ✅ **Precio**: No puede ser negativo
- ✅ **Stock**: No puede ser negativo
- ✅ **Campos Requeridos**: Nombre, categoría, precio
- ✅ **SKU Único**: Generado automáticamente
- ✅ **Estado Válido**: Solo valores permitidos

## 🚀 Triggers Automáticos

### Generación de SKU
- Se genera automáticamente al crear producto
- Formato: `CAT001`, `CAT002`, etc.
- Basado en la categoría del producto

### Actualización de Estado
- Se actualiza automáticamente según el stock
- Stock = 0 → Estado "Sin Stock"
- Stock > 0 → Estado "Activo"

### Timestamp de Actualización
- `updated_at` se actualiza automáticamente
- `created_at` se establece al crear

## 📝 Notas Importantes

1. **Ejecutar el script SQL** antes de usar las funcionalidades
2. **Verificar las variables de entorno** en el backend
3. **Configurar CORS** si es necesario
4. **Revisar las políticas RLS** según tus necesidades
5. **Probar todos los endpoints** antes de producción

## 🐛 Solución de Problemas

### Error: "foreign key constraint cannot be implemented"
**Problema**: `Key columns "created_by" and "id" are of incompatible types: bigint and uuid`

**Solución**:
1. Ejecutar primero `database/check_users_table_structure.sql`
2. Luego ejecutar `database/setup_products_table.sql`
3. Esto asegura que ambas tablas usen UUID

### Error: "Tabla products no existe"
- Ejecutar el script SQL completo
- Verificar que se ejecutó sin errores

### Error: "No tienes permisos"
- Verificar que el usuario tiene rol de administrador
- Revisar las políticas RLS

### Error: "SKU duplicado"
- El SKU se genera automáticamente
- No es necesario proporcionarlo manualmente

### Error: "Campo requerido"
- Verificar que todos los campos obligatorios están completos
- Revisar la validación en el frontend

### Error: "UUID inválido"
- Verificar que el UUID del usuario admin existe
- El UUID por defecto es: `550e8400-e29b-41d4-a716-446655440000`

---

¡La configuración está completa! Ahora puedes gestionar productos de manera completa con CRUD, filtros, estadísticas y una interfaz moderna. 