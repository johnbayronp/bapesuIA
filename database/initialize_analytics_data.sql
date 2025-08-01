-- =====================================================
-- INICIALIZACIÓN DE DATOS DE EJEMPLO PARA ANALÍTICAS
-- =====================================================

-- Insertar métricas de ejemplo para los últimos 30 días
DO $$
DECLARE
    i INTEGER;
    current_date DATE;
    base_orders INTEGER := 100;
    base_products INTEGER := 50;
    base_users INTEGER := 200;
    base_revenue DECIMAL(10,2) := 5000.00;
BEGIN
    FOR i IN 0..29 LOOP
        current_date := CURRENT_DATE - INTERVAL '1 day' * i;
        
        -- Insertar métricas del dashboard
        INSERT INTO dashboard_metrics (
            date,
            total_orders,
            total_products,
            total_users,
            monthly_revenue,
            orders_change,
            products_change,
            users_change,
            revenue_change,
            low_stock_products,
            pending_orders
        ) VALUES (
            current_date,
            base_orders + (i * 2),
            base_products + i,
            base_users + (i * 3),
            base_revenue + (i * 100),
            CASE 
                WHEN i > 0 THEN CONCAT('+', (2 + (i % 5))::TEXT, '%')
                ELSE '+0%'
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (1 + (i % 3))::TEXT, '%')
                ELSE '+0%'
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (3 + (i % 4))::TEXT, '%')
                ELSE '+0%'
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (5 + (i % 8))::TEXT, '%')
                ELSE '+0%'
            END,
            GREATEST(0, 5 - (i % 10)),
            GREATEST(0, 10 - (i % 15))
        ) ON CONFLICT (date) DO NOTHING;
        
        -- Insertar métricas de analíticas
        INSERT INTO analytics_metrics (
            date,
            total_sales,
            total_orders,
            total_users,
            conversion_rate,
            sales_change,
            orders_change,
            users_change,
            conversion_change
        ) VALUES (
            current_date,
            base_revenue + (i * 100),
            base_orders + (i * 2),
            base_users + (i * 3),
            CASE 
                WHEN (base_users + (i * 3)) > 0 
                THEN ROUND(((base_orders + (i * 2))::DECIMAL / (base_users + (i * 3))) * 100, 2)
                ELSE 0
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (5 + (i % 8))::TEXT, '%')
                ELSE '+0%'
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (2 + (i % 5))::TEXT, '%')
                ELSE '+0%'
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (3 + (i % 4))::TEXT, '%')
                ELSE '+0%'
            END,
            CASE 
                WHEN i > 0 THEN CONCAT('+', (1 + (i % 3))::TEXT, '%')
                ELSE '+0%'
            END
        ) ON CONFLICT (date) DO NOTHING;
    END LOOP;
END $$;

-- Insertar productos más vendidos de ejemplo para hoy
INSERT INTO top_products_daily (
    date,
    product_id,
    product_name,
    total_sales,
    total_revenue,
    rank_position
) VALUES 
    (CURRENT_DATE, 1, 'Producto Premium A', 150, 7500.00, 1),
    (CURRENT_DATE, 2, 'Producto Estándar B', 120, 3600.00, 2),
    (CURRENT_DATE, 3, 'Producto Básico C', 100, 2000.00, 3),
    (CURRENT_DATE, 4, 'Producto Deluxe D', 80, 6400.00, 4),
    (CURRENT_DATE, 5, 'Producto Regular E', 75, 1875.00, 5)
ON CONFLICT (date, product_id) DO NOTHING;

-- Insertar actividad del sistema de ejemplo
INSERT INTO system_activity (
    activity_type,
    entity_id,
    entity_name,
    user_id,
    user_name,
    metadata
) VALUES 
    ('order_created', 'ORD-001', 'Nuevo pedido #ORD-001', 'user-123', 'Juan Pérez', '{"amount": 299.99, "items": 3}'),
    ('user_registered', 'user-456', 'Nuevo usuario registrado', NULL, 'María García', '{"email": "maria@example.com"}'),
    ('product_added', 'PROD-789', 'Producto agregado al catálogo', 'admin-001', 'Administrador', '{"category": "Electrónicos", "price": 199.99}'),
    ('order_updated', 'ORD-002', 'Pedido actualizado #ORD-002', 'admin-001', 'Administrador', '{"status": "shipped", "tracking": "TRK123456"}'),
    ('user_login', 'user-123', 'Usuario inició sesión', 'user-123', 'Juan Pérez', '{"ip": "192.168.1.100"}'),
    ('product_updated', 'PROD-456', 'Producto actualizado', 'admin-001', 'Administrador', '{"price_change": 10.00}'),
    ('order_cancelled', 'ORD-003', 'Pedido cancelado #ORD-003', 'user-789', 'Carlos López', '{"reason": "cambio de opinión"}'),
    ('user_profile_updated', 'user-123', 'Perfil de usuario actualizado', 'user-123', 'Juan Pérez', '{"fields": ["phone", "address"]}'),
    ('discount_created', 'DISC-001', 'Descuento creado', 'admin-001', 'Administrador', '{"percentage": 20, "code": "SUMMER20"}'),
    ('inventory_alert', 'PROD-789', 'Stock bajo en producto', NULL, 'Sistema', '{"current_stock": 5, "threshold": 10}')
ON CONFLICT DO NOTHING;

-- Insertar alertas del sistema de ejemplo
INSERT INTO system_alerts (
    alert_type,
    message,
    severity,
    metadata
) VALUES 
    ('low_stock', '5 productos con stock bajo', 'warning', '{"affected_products": 5, "threshold": 10}'),
    ('pending_orders', '12 pedidos pendientes de procesamiento', 'info', '{"pending_count": 12, "oldest_order": "2024-01-15"}'),
    ('system_maintenance', 'Mantenimiento programado para mañana', 'info', '{"scheduled_time": "2024-01-20 02:00", "duration": "2 hours"}'),
    ('high_traffic', 'Tráfico alto detectado en el sitio web', 'warning', '{"concurrent_users": 150, "threshold": 100}'),
    ('payment_error', 'Error en procesamiento de pagos', 'error', '{"gateway": "stripe", "error_code": "card_declined"}')
ON CONFLICT DO NOTHING;

-- Insertar métricas de ventas de ejemplo
INSERT INTO sales_metrics (
    period_type,
    period_start,
    period_end,
    total_sales,
    total_orders,
    average_order_value,
    unique_customers,
    repeat_customers
) VALUES 
    ('monthly', '2024-01-01', '2024-01-31', 45000.00, 180, 250.00, 120, 60),
    ('monthly', '2023-12-01', '2023-12-31', 42000.00, 168, 250.00, 115, 53),
    ('monthly', '2023-11-01', '2023-11-30', 38000.00, 152, 250.00, 108, 44),
    ('weekly', '2024-01-15', '2024-01-21', 12000.00, 48, 250.00, 35, 13),
    ('weekly', '2024-01-08', '2024-01-14', 11000.00, 44, 250.00, 32, 12),
    ('weekly', '2024-01-01', '2024-01-07', 10000.00, 40, 250.00, 30, 10)
ON CONFLICT (period_type, period_start) DO NOTHING;

-- Comentario final
SELECT 'Datos de ejemplo para analíticas inicializados exitosamente' as status; 