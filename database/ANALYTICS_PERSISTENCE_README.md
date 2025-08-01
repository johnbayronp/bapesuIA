# Sistema de Persistencia de Datos de Analíticas

## 📊 Descripción General

Este sistema implementa persistencia de datos para las métricas y analíticas del panel de administración, permitiendo:

- **Almacenamiento histórico** de métricas diarias
- **Cálculo de tendencias** y cambios porcentuales
- **Registro de actividad** del sistema
- **Gestión de alertas** automáticas
- **Reportes** basados en datos históricos

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `dashboard_metrics`
Almacena métricas diarias del dashboard de administración.

```sql
CREATE TABLE dashboard_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(10,2) DEFAULT 0,
    orders_change VARCHAR(10) DEFAULT '+0%',
    products_change VARCHAR(10) DEFAULT '+0%',
    users_change VARCHAR(10) DEFAULT '+0%',
    revenue_change VARCHAR(10) DEFAULT '+0%',
    low_stock_products INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `analytics_metrics`
Almacena métricas específicas de analíticas.

```sql
CREATE TABLE analytics_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    sales_change VARCHAR(10) DEFAULT '+0%',
    orders_change VARCHAR(10) DEFAULT '+0%',
    users_change VARCHAR(10) DEFAULT '+0%',
    conversion_change VARCHAR(10) DEFAULT '+0%',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `system_activity`
Registra todas las actividades del sistema.

```sql
CREATE TABLE system_activity (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    entity_name VARCHAR(255),
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `system_alerts`
Gestiona alertas del sistema.

```sql
CREATE TABLE system_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `top_products_daily`
Almacena productos más vendidos por día.

```sql
CREATE TABLE top_products_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    rank_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, product_id)
);
```

#### 6. `sales_metrics`
Métricas de ventas por período.

```sql
CREATE TABLE sales_metrics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    repeat_customers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period_type, period_start)
);
```

## 🔧 Funciones de Base de Datos

### Funciones Principales

#### `calculate_daily_dashboard_metrics(p_date DATE)`
Calcula y almacena métricas diarias del dashboard.

#### `log_system_activity(...)`
Registra una actividad del sistema.

#### `create_system_alert(...)`
Crea una nueva alerta del sistema.

#### `resolve_system_alert(alert_id, resolved_by)`
Marca una alerta como resuelta.

## 🚀 Instalación y Configuración

### 1. Ejecutar Scripts de Base de Datos

```bash
# Crear tablas y funciones
psql -h db.xyz.supabase.co -p 5432 -d postgres -U postgres -f setup_analytics_tables.sql

# Inicializar datos de ejemplo (opcional)
psql -h db.xyz.supabase.co -p 5432 -d postgres -U postgres -f initialize_analytics_data.sql
```

### 2. Configurar Variables de Entorno

```bash
export SUPABASE_URL="tu_url_de_supabase"
export SUPABASE_SERVICE_KEY="tu_clave_de_servicio"
```

### 3. Ejecutar Script de Cálculo Diario

```bash
# Ejecutar manualmente
python server/scripts/daily_metrics_calculator.py

# Configurar como cron job (ejecutar diariamente a las 2:00 AM)
0 2 * * * /usr/bin/python3 /path/to/project/server/scripts/daily_metrics_calculator.py
```

## 📈 Uso del Sistema

### Endpoints Disponibles

#### Dashboard
- `GET /admin/dashboard/stats` - Obtener métricas del dashboard
- `GET /admin/dashboard/alerts` - Obtener alertas del sistema

#### Analíticas
- `GET /admin/analytics/stats` - Obtener métricas de analíticas
- `GET /admin/analytics/top-products` - Productos más vendidos
- `GET /admin/analytics/recent-activity` - Actividad reciente

#### Gestión de Persistencia
- `POST /admin/analytics/calculate-metrics` - Calcular métricas manualmente
- `POST /admin/analytics/log-activity` - Registrar actividad
- `POST /admin/analytics/create-alert` - Crear alerta
- `PATCH /admin/analytics/resolve-alert/<id>` - Resolver alerta
- `GET /admin/analytics/weekly-report` - Reporte semanal

### Ejemplos de Uso

#### Registrar Actividad
```javascript
fetch('/admin/analytics/log-activity', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        activity_type: 'order_created',
        entity_id: 'ORD-123',
        entity_name: 'Nuevo pedido #ORD-123',
        user_id: 'user-456',
        user_name: 'Juan Pérez',
        metadata: {
            amount: 299.99,
            items: 3
        }
    })
});
```

#### Crear Alerta
```javascript
fetch('/admin/analytics/create-alert', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        alert_type: 'low_stock',
        message: '5 productos con stock bajo',
        severity: 'warning',
        metadata: {
            affected_products: 5,
            threshold: 10
        }
    })
});
```

## 📊 Beneficios de la Persistencia

### 1. **Análisis Histórico**
- Comparación de métricas entre períodos
- Identificación de tendencias
- Análisis de estacionalidad

### 2. **Rendimiento Mejorado**
- Datos pre-calculados
- Consultas más rápidas
- Menor carga en la base de datos principal

### 3. **Alertas Inteligentes**
- Alertas basadas en datos históricos
- Detección de anomalías
- Notificaciones proactivas

### 4. **Reportes Avanzados**
- Reportes semanales/mensuales
- Métricas de crecimiento
- Análisis de conversión

## 🔄 Automatización

### Script de Cálculo Diario

El script `daily_metrics_calculator.py` automatiza:

1. **Cálculo de métricas** diarias
2. **Actualización** de productos más vendidos
3. **Creación** de alertas automáticas
4. **Registro** de actividad del sistema

### Configuración de Cron

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar diariamente a las 2:00 AM
0 2 * * * /usr/bin/python3 /path/to/project/server/scripts/daily_metrics_calculator.py >> /var/log/daily_metrics.log 2>&1
```

## 📝 Mantenimiento

### Limpieza de Datos

```sql
-- Eliminar datos antiguos (más de 1 año)
DELETE FROM dashboard_metrics WHERE date < CURRENT_DATE - INTERVAL '1 year';
DELETE FROM analytics_metrics WHERE date < CURRENT_DATE - INTERVAL '1 year';
DELETE FROM system_activity WHERE created_at < NOW() - INTERVAL '1 year';
DELETE FROM top_products_daily WHERE date < CURRENT_DATE - INTERVAL '1 year';
```

### Monitoreo

- Revisar logs del script diario
- Verificar que las métricas se calculen correctamente
- Monitorear el tamaño de las tablas
- Verificar alertas automáticas

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Script no ejecuta**: Verificar variables de entorno
2. **Métricas no se calculan**: Revisar permisos de base de datos
3. **Alertas no se crean**: Verificar configuración de umbrales
4. **Datos duplicados**: Verificar constraints UNIQUE

### Logs

Los logs se guardan en:
- `daily_metrics.log` - Script de cálculo diario
- Base de datos - Actividad del sistema

## 🔮 Futuras Mejoras

1. **Gráficos interactivos** con datos históricos
2. **Alertas más inteligentes** con machine learning
3. **Exportación** de reportes en PDF/Excel
4. **Dashboard en tiempo real** con WebSockets
5. **Análisis predictivo** de ventas 