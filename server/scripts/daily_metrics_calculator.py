#!/usr/bin/env python3
"""
Script para calcular métricas diarias del panel de administración
Este script puede ser ejecutado diariamente como un cron job
"""

import os
import sys
import logging
from datetime import datetime, date
from pathlib import Path

# Agregar el directorio del proyecto al path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.services.analytics_service import AnalyticsService
from app.services.product_service import ProductService
from app.services.order_service import OrderService
from app.services.user_service import UserService

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('daily_metrics.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def calculate_daily_metrics():
    """Calcular y almacenar métricas diarias"""
    try:
        logger.info("Iniciando cálculo de métricas diarias...")
        
        analytics_service = AnalyticsService()
        
        # Calcular métricas para hoy
        success = analytics_service.calculate_daily_metrics()
        
        if success:
            logger.info("Métricas diarias calculadas exitosamente")
        else:
            logger.error("Error al calcular métricas diarias")
            return False
        
        # Actualizar productos más vendidos
        success = analytics_service.update_top_products_daily()
        
        if success:
            logger.info("Productos más vendidos actualizados exitosamente")
        else:
            logger.error("Error al actualizar productos más vendidos")
            return False
        
        # Verificar y crear alertas automáticas
        create_automatic_alerts(analytics_service)
        
        logger.info("Proceso de cálculo de métricas diarias completado")
        return True
        
    except Exception as e:
        logger.error(f"Error en el cálculo de métricas diarias: {str(e)}")
        return False

def create_automatic_alerts(analytics_service):
    """Crear alertas automáticas basadas en métricas"""
    try:
        logger.info("Verificando alertas automáticas...")
        
        # Verificar productos con stock bajo
        product_service = ProductService()
        low_stock_products = product_service.get_low_stock_products(threshold=10)
        
        if low_stock_products:
            alert_message = f"{len(low_stock_products)} productos con stock bajo"
            analytics_service.create_system_alert(
                alert_type='low_stock',
                message=alert_message,
                severity='warning',
                metadata={'affected_products': len(low_stock_products), 'threshold': 10}
            )
            logger.info(f"Alerta creada: {alert_message}")
        
        # Verificar pedidos pendientes
        order_service = OrderService()
        pending_orders = order_service.get_pending_orders()
        
        if len(pending_orders) > 5:  # Alerta si hay más de 5 pedidos pendientes
            alert_message = f"{len(pending_orders)} pedidos pendientes de procesamiento"
            analytics_service.create_system_alert(
                alert_type='pending_orders',
                message=alert_message,
                severity='info',
                metadata={'pending_count': len(pending_orders)}
            )
            logger.info(f"Alerta creada: {alert_message}")
        
        # Verificar métricas de rendimiento
        dashboard_metrics = analytics_service.get_dashboard_metrics(days=1)
        if dashboard_metrics['success']:
            data = dashboard_metrics['data']
            
            # Alerta si no hay ventas en el día
            if data.get('monthly_revenue', 0) == 0:
                analytics_service.create_system_alert(
                    alert_type='no_sales',
                    message='No se registraron ventas hoy',
                    severity='warning'
                )
                logger.info("Alerta creada: No se registraron ventas hoy")
        
        logger.info("Verificación de alertas automáticas completada")
        
    except Exception as e:
        logger.error(f"Error al crear alertas automáticas: {str(e)}")

def log_system_activity(analytics_service):
    """Registrar actividad del sistema"""
    try:
        logger.info("Registrando actividad del sistema...")
        
        # Registrar que se ejecutó el cálculo de métricas
        analytics_service.log_system_activity(
            activity_type='metrics_calculation',
            entity_name='Cálculo diario de métricas ejecutado',
            user_name='Sistema Automático',
            metadata={
                'execution_time': datetime.now().isoformat(),
                'script_version': '1.0'
            }
        )
        
        logger.info("Actividad del sistema registrada")
        
    except Exception as e:
        logger.error(f"Error al registrar actividad del sistema: {str(e)}")

def main():
    """Función principal del script"""
    try:
        logger.info("=" * 50)
        logger.info("INICIANDO SCRIPT DE CÁLCULO DE MÉTRICAS DIARIAS")
        logger.info(f"Fecha y hora: {datetime.now()}")
        logger.info("=" * 50)
        
        # Verificar variables de entorno
        required_env_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            logger.error(f"Variables de entorno faltantes: {missing_vars}")
            return False
        
        # Ejecutar cálculo de métricas
        success = calculate_daily_metrics()
        
        if success:
            # Registrar actividad del sistema
            analytics_service = AnalyticsService()
            log_system_activity(analytics_service)
            
            logger.info("=" * 50)
            logger.info("SCRIPT COMPLETADO EXITOSAMENTE")
            logger.info("=" * 50)
            return True
        else:
            logger.error("=" * 50)
            logger.error("SCRIPT FALLÓ")
            logger.error("=" * 50)
            return False
            
    except Exception as e:
        logger.error(f"Error crítico en el script: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 