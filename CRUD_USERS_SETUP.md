# CRUD de Usuarios - Configuración Completa

## 📋 Descripción

Se ha implementado un CRUD completo para usuarios que maneja tanto la tabla `users` como el sistema de autenticación de Supabase. El sistema incluye:

- ✅ **Backend completo** con Flask y Supabase
- ✅ **Frontend actualizado** para usar la API del backend
- ✅ **Autenticación y autorización** basada en roles
- ✅ **Operaciones CRUD completas** (Create, Read, Update, Delete)
- ✅ **Paginación y filtros** avanzados
- ✅ **Manejo de errores** robusto

## 🚀 Configuración del Backend

### 1. Variables de Entorno

Agregar al archivo `.env` del servidor:

```env
# Supabase Configuration
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_clave_anonima
SUPABASE_SERVICE_KEY=tu_clave_de_servicio  # IMPORTANTE: Para operaciones admin
SUPABASE_JWT_SECRET=tu_jwt_secret

# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
```

### 2. Instalar Dependencias

```bash
cd server
pip install supabase==2.3.4
```

### 3. Configurar Supabase

1. **Obtener la clave de servicio** desde el dashboard de Supabase
2. **Configurar RLS** para la tabla `users`
3. **Verificar permisos** de la clave de servicio

## 🔧 Configuración del Frontend

### 1. Variables de Entorno

Agregar al archivo `.env` del cliente:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 2. Verificar Dependencias

El frontend ya incluye todas las dependencias necesarias.

## 📚 API Endpoints

### Autenticación Requerida

Todas las rutas requieren autenticación y rol de administrador.

### 1. Obtener Usuarios

```http
GET /api/v1/users?page=1&per_page=10&status=all&role=all&search=
```

**Query Parameters:**
- `page`: Número de página (default: 1)
- `per_page`: Elementos por página (default: 10)
- `status`: Filtro por estado (all, Activo, Inactivo)
- `role`: Filtro por rol (all, customer, admin, vendor)
- `search`: Término de búsqueda

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

### 2. Obtener Usuario por ID

```http
GET /api/v1/users/{user_id}
```

### 3. Crear Usuario

```http
POST /api/v1/users
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "role": "customer",
  "is_active": true
}
```

### 4. Actualizar Usuario

```http
PUT /api/v1/users/{user_id}
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "role": "customer",
  "is_active": true
}
```

### 5. Eliminar Usuario

```http
DELETE /api/v1/users/{user_id}
```

### 6. Desactivar Usuario

```http
PATCH /api/v1/users/{user_id}/deactivate
```

### 7. Activar Usuario

```http
PATCH /api/v1/users/{user_id}/activate
```

### 8. Estadísticas de Usuarios

```http
GET /api/v1/users/stats
```

## 🔐 Seguridad

### Middleware de Autenticación

- **`@token_required`**: Verifica el token JWT de Supabase
- **`@admin_required`**: Verifica que el usuario tenga rol de administrador

### Validaciones

- ✅ Campos requeridos (email, role)
- ✅ Validación de tipos de datos
- ✅ Verificación de existencia de usuarios
- ✅ Protección contra auto-eliminación

## 🎯 Funcionalidades Implementadas

### Backend (Flask + Supabase)

1. **UserService** (`server/app/services/user_service.py`)
   - ✅ Obtener usuarios con paginación y filtros
   - ✅ CRUD completo de usuarios
   - ✅ Manejo de autenticación de Supabase
   - ✅ Estadísticas de usuarios
   - ✅ Validaciones robustas

2. **Rutas API** (`server/app/routes.py`)
   - ✅ 8 endpoints completos
   - ✅ Manejo de errores HTTP
   - ✅ Respuestas JSON estandarizadas
   - ✅ Documentación inline

3. **Middleware de Autorización** (`server/app/middleware/auth.py`)
   - ✅ Verificación de tokens JWT
   - ✅ Verificación de roles de administrador
   - ✅ Manejo de errores de autenticación

### Frontend (React + Supabase)

1. **Servicio de API** (`client/src/services/userApi.js`)
   - ✅ Cliente HTTP con autenticación
   - ✅ Manejo de tokens automático
   - ✅ Métodos para todas las operaciones CRUD

2. **Componente de Gestión** (`client/src/components/admin/sections/UsersManagement.jsx`)
   - ✅ Interfaz completa de gestión
   - ✅ Filtros y búsqueda
   - ✅ Paginación
   - ✅ Modales de edición y eliminación
   - ✅ Manejo de estados de carga

## 🔄 Flujo de Datos

### Actualización de Usuario

1. **Frontend** → Envía datos al backend
2. **Backend** → Valida datos y actualiza tabla `users`
3. **Backend** → Si email cambió, actualiza autenticación
4. **Backend** → Retorna respuesta al frontend
5. **Frontend** → Muestra notificación y actualiza lista

### Eliminación de Usuario

1. **Frontend** → Confirma eliminación
2. **Backend** → Elimina de tabla `users`
3. **Backend** → Elimina de sistema de autenticación
4. **Backend** → Retorna confirmación
5. **Frontend** → Actualiza lista y muestra notificación

## 🚨 Manejo de Errores

### Backend

- ✅ Validación de campos requeridos
- ✅ Verificación de existencia de usuarios
- ✅ Manejo de errores de Supabase
- ✅ Respuestas HTTP apropiadas
- ✅ Logging de errores

### Frontend

- ✅ Captura de errores de red
- ✅ Notificaciones de error amigables
- ✅ Estados de carga
- ✅ Validación de formularios

## 📊 Características Avanzadas

### Paginación
- ✅ Paginación del lado del servidor
- ✅ Navegación entre páginas
- ✅ Información de total de registros

### Filtros
- ✅ Filtro por estado (Activo/Inactivo)
- ✅ Filtro por rol (Customer/Admin/Vendor)
- ✅ Búsqueda por nombre o email
- ✅ Combinación de filtros

### Seguridad
- ✅ Solo administradores pueden acceder
- ✅ Verificación de tokens JWT
- ✅ Protección contra CSRF
- ✅ Validación de datos

## 🧪 Testing

### Probar Endpoints

```bash
# Obtener usuarios
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/v1/users

# Crear usuario
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","role":"customer"}' \
     http://localhost:5000/api/v1/users
```

## 🔧 Troubleshooting

### Error: "SUPABASE_SERVICE_KEY no está configurada"
- Verificar que la variable de entorno esté configurada
- Obtener la clave de servicio desde el dashboard de Supabase

### Error: "Acceso denegado. Se requiere rol de administrador"
- Verificar que el usuario tenga rol 'admin' en la tabla users
- Verificar que el token JWT sea válido

### Error: "Usuario no encontrado"
- Verificar que el ID del usuario existe en la tabla users
- Verificar permisos de RLS en Supabase

## 📝 Notas Importantes

1. **Clave de Servicio**: Es crucial para operaciones de administración
2. **RLS**: Configurar políticas de Row Level Security en Supabase
3. **Tokens**: Los tokens JWT deben ser válidos y no expirados
4. **Roles**: Solo usuarios con rol 'admin' pueden acceder
5. **Eliminación**: Es permanente y afecta tanto BD como auth

## 🎉 ¡Listo!

El CRUD de usuarios está completamente implementado y funcional. El sistema maneja tanto la base de datos como la autenticación de manera segura y eficiente. 