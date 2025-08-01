-- =====================================================
-- TABLAS PARA PERSISTENCIA DE DATOS DE ANALÍTICAS
-- =====================================================

-- Tabla para almacenar métricas diarias del dashboard
CREATE TABLE IF NOT EXISTS dashboard_metrics (
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

-- Tabla para almacenar métricas de analíticas
CREATE TABLE IF NOT EXISTS analytics_metrics (
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

-- Tabla para almacenar productos más vendidos por día
CREATE TABLE IF NOT EXISTS top_products_daily (
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

-- Tabla para almacenar actividad del sistema
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL, -- 'order_created', 'user_registered', 'product_added', etc.
    entity_id VARCHAR(255), -- ID del pedido, usuario, producto, etc.
    entity_name VARCHAR(255), -- Nombre descriptivo
    user_id VARCHAR(255), -- ID del usuario que realizó la acción (si aplica)
    user_name VARCHAR(255), -- Nombre del usuario
    metadata JSONB, -- Datos adicionales en formato JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar alertas del sistema
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'pending_order', 'system_error', etc.
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    metadata JSONB, -- Datos adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar métricas de ventas por período
CREATE TABLE IF NOT EXISTS sales_metrics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
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

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_date ON dashboard_metrics(date);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_date ON analytics_metrics(date);
CREATE INDEX IF NOT EXISTS idx_top_products_daily_date ON top_products_daily(date);
CREATE INDEX IF NOT EXISTS idx_system_activity_created_at ON system_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_system_activity_type ON system_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_period ON sales_metrics(period_type, period_start);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_dashboard_metrics_updated_at 
    BEFORE UPDATE ON dashboard_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_metrics_updated_at 
    BEFORE UPDATE ON analytics_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at 
    BEFORE UPDATE ON system_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar actividad del sistema
CREATE OR REPLACE FUNCTION log_system_activity(
    p_activity_type VARCHAR(50),
    p_entity_id VARCHAR(255) DEFAULT NULL,
    p_entity_name VARCHAR(255) DEFAULT NULL,
    p_user_id VARCHAR(255) DEFAULT NULL,
    p_user_name VARCHAR(255) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_activity (
        activity_type, 
        entity_id, 
        entity_name, 
        user_id, 
        user_name, 
        metadata
    ) VALUES (
        p_activity_type,
        p_entity_id,
        p_entity_name,
        p_user_id,
        p_user_name,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql;

-- Función para crear alerta del sistema
CREATE OR REPLACE FUNCTION create_system_alert(
    p_alert_type VARCHAR(50),
    p_message TEXT,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    alert_id INTEGER;
BEGIN
    INSERT INTO system_alerts (
        alert_type,
        message,
        severity,
        metadata
    ) VALUES (
        p_alert_type,
        p_message,
        p_severity,
        p_metadata
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Función para resolver alerta
CREATE OR REPLACE FUNCTION resolve_system_alert(
    p_alert_id INTEGER,
    p_resolved_by VARCHAR(255) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE system_alerts 
    SET 
        is_resolved = TRUE,
        resolved_at = NOW(),
        resolved_by = p_resolved_by
    WHERE id = p_alert_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular métricas diarias del dashboard
CREATE OR REPLACE FUNCTION calculate_daily_dashboard_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    v_total_orders INTEGER;
    v_total_products INTEGER;
    v_total_users INTEGER;
    v_monthly_revenue DECIMAL(10,2);
    v_low_stock_products INTEGER;
    v_pending_orders INTEGER;
    v_prev_date DATE;
    v_prev_metrics RECORD;
BEGIN
    -- Obtener métricas actuales
    SELECT COUNT(*) INTO v_total_orders FROM orders WHERE DATE(created_at) <= p_date;
    SELECT COUNT(*) INTO v_total_products FROM products WHERE is_active = TRUE;
    SELECT COUNT(*) INTO v_total_users FROM users WHERE is_active = TRUE;
    
    -- Calcular ingresos del mes actual
    SELECT COALESCE(SUM(total_amount), 0) INTO v_monthly_revenue 
    FROM orders 
    WHERE DATE(created_at) >= DATE_TRUNC('month', p_date) 
    AND DATE(created_at) <= p_date;
    
    -- Productos con stock bajo
    SELECT COUNT(*) INTO v_low_stock_products 
    FROM products 
    WHERE stock < 10 AND is_active = TRUE;
    
    -- Pedidos pendientes
    SELECT COUNT(*) INTO v_pending_orders 
    FROM orders 
    WHERE status = 'pending' AND DATE(created_at) <= p_date;
    
    -- Obtener métricas del día anterior para calcular cambios
    v_prev_date := p_date - INTERVAL '1 day';
    SELECT * INTO v_prev_metrics FROM dashboard_metrics WHERE date = v_prev_date;
    
    -- Insertar o actualizar métricas del día
    INSERT INTO dashboard_metrics (
        date,
        total_orders,
        total_products,
        total_users,
        monthly_revenue,
        low_stock_products,
        pending_orders,
        orders_change,
        products_change,
        users_change,
        revenue_change
    ) VALUES (
        p_date,
        v_total_orders,
        v_total_products,
        v_total_users,
        v_monthly_revenue,
        v_low_stock_products,
        v_pending_orders,
        CASE 
            WHEN v_prev_metrics.total_orders > 0 
            THEN CONCAT(
                CASE 
                    WHEN v_total_orders > v_prev_metrics.total_orders THEN '+'
                    WHEN v_total_orders < v_prev_metrics.total_orders THEN '-'
                    ELSE ''
                END,
                ABS(ROUND(((v_total_orders - v_prev_metrics.total_orders)::DECIMAL / v_prev_metrics.total_orders) * 100))
            ) || '%'
            ELSE '+0%'
        END,
        CASE 
            WHEN v_prev_metrics.total_products > 0 
            THEN CONCAT(
                CASE 
                    WHEN v_total_products > v_prev_metrics.total_products THEN '+'
                    WHEN v_total_products < v_prev_metrics.total_products THEN '-'
                    ELSE ''
                END,
                ABS(ROUND(((v_total_products - v_prev_metrics.total_products)::DECIMAL / v_prev_metrics.total_products) * 100))
            ) || '%'
            ELSE '+0%'
        END,
        CASE 
            WHEN v_prev_metrics.total_users > 0 
            THEN CONCAT(
                CASE 
                    WHEN v_total_users > v_prev_metrics.total_users THEN '+'
                    WHEN v_total_users < v_prev_metrics.total_users THEN '-'
                    ELSE ''
                END,
                ABS(ROUND(((v_total_users - v_prev_metrics.total_users)::DECIMAL / v_prev_metrics.total_users) * 100))
            ) || '%'
            ELSE '+0%'
        END,
        CASE 
            WHEN v_prev_metrics.monthly_revenue > 0 
            THEN CONCAT(
                CASE 
                    WHEN v_monthly_revenue > v_prev_metrics.monthly_revenue THEN '+'
                    WHEN v_monthly_revenue < v_prev_metrics.monthly_revenue THEN '-'
                    ELSE ''
                END,
                ABS(ROUND(((v_monthly_revenue - v_prev_metrics.monthly_revenue) / v_prev_metrics.monthly_revenue) * 100))
            ) || '%'
            ELSE '+0%'
        END
    ) ON CONFLICT (date) DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_products = EXCLUDED.total_products,
        total_users = EXCLUDED.total_users,
        monthly_revenue = EXCLUDED.monthly_revenue,
        low_stock_products = EXCLUDED.low_stock_products,
        pending_orders = EXCLUDED.pending_orders,
        orders_change = EXCLUDED.orders_change,
        products_change = EXCLUDED.products_change,
        users_change = EXCLUDED.users_change,
        revenue_change = EXCLUDED.revenue_change,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE dashboard_metrics IS 'Métricas diarias del dashboard de administración';
COMMENT ON TABLE analytics_metrics IS 'Métricas de analíticas por día';
COMMENT ON TABLE top_products_daily IS 'Productos más vendidos por día';
COMMENT ON TABLE system_activity IS 'Registro de actividad del sistema';
COMMENT ON TABLE system_alerts IS 'Alertas del sistema';
COMMENT ON TABLE sales_metrics IS 'Métricas de ventas por período';

COMMENT ON FUNCTION log_system_activity IS 'Registra una actividad del sistema';
COMMENT ON FUNCTION create_system_alert IS 'Crea una nueva alerta del sistema';
COMMENT ON FUNCTION resolve_system_alert IS 'Marca una alerta como resuelta';
COMMENT ON FUNCTION calculate_daily_dashboard_metrics IS 'Calcula y almacena las métricas diarias del dashboard'; 