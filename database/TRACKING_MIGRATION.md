# Migración de Campos de Tracking

## Descripción
Esta migración agrega campos de tracking a la tabla `orders` para permitir el seguimiento de envíos.

## Campos Agregados
- `tracking_number` (VARCHAR(100)): Número de guía de envío
- `tracking_url` (TEXT): URL del link de tracking

## Archivos de Migración

### 1. `add_tracking_fields.sql`
Script principal para aplicar la migración:
- Agrega las columnas `tracking_number` y `tracking_url`
- Crea índice para búsquedas eficientes
- Agrega función de validación en la base de datos
- Crea trigger para validar campos obligatorios cuando status = 'shipped'

### 2. `rollback_tracking_fields.sql`
Script para revertir la migración si es necesario:
- Elimina las columnas agregadas
- Elimina índices y triggers relacionados
- Limpia funciones de validación

## Cómo Aplicar la Migración

### Opción 1: Migración Incremental (Recomendada)
Si ya tienes datos en la tabla `orders`:

```sql
-- Ejecutar en Supabase SQL Editor
\i database/add_tracking_fields.sql
```

### Opción 2: Recrear Tabla Completa
Si es un entorno de desarrollo sin datos importantes:

```sql
-- Ejecutar en Supabase SQL Editor
\i database/setup_orders_table.sql
```

## Validaciones Implementadas

### En la Base de Datos
- Trigger que valida que `tracking_number` no sea NULL cuando `status = 'shipped'`
- Trigger que valida que `tracking_url` no sea NULL cuando `status = 'shipped'`

### En el Frontend
- Validación en JavaScript antes de enviar datos
- Campos obligatorios marcados con asterisco rojo (*)
- Validación de URL válida para el link de tracking

## Funcionalidades del Frontend

### En OrdersManagement.jsx
- Campos de tracking aparecen dinámicamente cuando status = 'shipped'
- Validación en tiempo real con mensajes de error
- Nueva columna "Tracking" en la tabla de órdenes
- Link de tracking se abre en nueva pestaña

### En UserProfile.jsx
- Formato de moneda con separadores de miles aplicado
- Estadísticas de compras con formato colombiano

## Verificación de la Migración

Para verificar que la migración se aplicó correctamente:

```sql
-- Verificar que las columnas existen
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tracking_number', 'tracking_url');

-- Verificar que el trigger existe
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_validate_shipping_tracking';
```

## Rollback

Si necesitas revertir los cambios:

```sql
-- Ejecutar en Supabase SQL Editor
\i database/rollback_tracking_fields.sql
```

## Notas Importantes

1. **Compatibilidad**: Esta migración es compatible con órdenes existentes
2. **Validación**: Los campos son opcionales excepto cuando status = 'shipped'
3. **Índices**: Se crea un índice en `tracking_number` para búsquedas eficientes
4. **Documentación**: Se agregaron comentarios en la base de datos para documentación

## Próximos Pasos

1. Ejecutar la migración en el entorno de desarrollo
2. Probar la funcionalidad en el frontend
3. Ejecutar la migración en producción
4. Verificar que todo funciona correctamente 