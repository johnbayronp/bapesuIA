import os
from supabase import create_client, Client
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime, date, timedelta
import json

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        """Inicializar el cliente de Supabase"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def log_system_activity(self, activity_type: str, entity_id: str = None, 
                           entity_name: str = None, user_id: str = None, 
                           user_name: str = None, metadata: Dict = None) -> bool:
        """
        Registrar actividad del sistema
        
        Args:
            activity_type: Tipo de actividad
            entity_id: ID de la entidad relacionada
            entity_name: Nombre descriptivo de la entidad
            user_id: ID del usuario que realizó la acción
            user_name: Nombre del usuario
            metadata: Datos adicionales en formato JSON
            
        Returns:
            bool: True si se registró exitosamente
        """
        try:
            result = self.supabase.rpc('log_system_activity', {
                'p_activity_type': activity_type,
                'p_entity_id': entity_id,
                'p_entity_name': entity_name,
                'p_user_id': user_id,
                'p_user_name': user_name,
                'p_metadata': json.dumps(metadata) if metadata else None
            }).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error logging system activity: {str(e)}")
            return False
    
    def create_system_alert(self, alert_type: str, message: str, 
                           severity: str = 'info', metadata: Dict = None) -> Optional[int]:
        """
        Crear una alerta del sistema
        
        Args:
            alert_type: Tipo de alerta
            message: Mensaje de la alerta
            severity: Severidad ('info', 'warning', 'error', 'critical')
            metadata: Datos adicionales
            
        Returns:
            int: ID de la alerta creada o None si falló
        """
        try:
            result = self.supabase.rpc('create_system_alert', {
                'p_alert_type': alert_type,
                'p_message': message,
                'p_severity': severity,
                'p_metadata': json.dumps(metadata) if metadata else None
            }).execute()
            
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"Error creating system alert: {str(e)}")
            return None
    
    def resolve_system_alert(self, alert_id: int, resolved_by: str = None) -> bool:
        """
        Marcar una alerta como resuelta
        
        Args:
            alert_id: ID de la alerta
            resolved_by: Usuario que resolvió la alerta
            
        Returns:
            bool: True si se resolvió exitosamente
        """
        try:
            result = self.supabase.rpc('resolve_system_alert', {
                'p_alert_id': alert_id,
                'p_resolved_by': resolved_by
            }).execute()
            
            return result.data if result.data else False
        except Exception as e:
            logger.error(f"Error resolving system alert: {str(e)}")
            return False
    
    def calculate_daily_metrics(self, target_date: date = None) -> bool:
        """
        Calcular y almacenar métricas diarias
        
        Args:
            target_date: Fecha para calcular métricas (por defecto hoy)
            
        Returns:
            bool: True si se calcularon exitosamente
        """
        try:
            if target_date is None:
                target_date = date.today()
            
            result = self.supabase.rpc('calculate_daily_dashboard_metrics', {
                'p_date': target_date.isoformat()
            }).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error calculating daily metrics: {str(e)}")
            return False
    
    def get_dashboard_metrics(self, days: int = 30) -> Dict[str, Any]:
        """
        Obtener métricas del dashboard para los últimos N días
        
        Args:
            days: Número de días hacia atrás
            
        Returns:
            Dict con las métricas
        """
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=days)
            
            result = self.supabase.table('dashboard_metrics').select('*').gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).order('date', desc=True).execute()
            
            if not result.data:
                # Si no hay datos, calcular métricas para hoy
                self.calculate_daily_metrics()
                result = self.supabase.table('dashboard_metrics').select('*').eq('date', end_date.isoformat()).execute()
            
            return {
                'success': True,
                'data': result.data[0] if result.data else {},
                'history': result.data if result.data else []
            }
        except Exception as e:
            logger.error(f"Error getting dashboard metrics: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_analytics_metrics(self, days: int = 30) -> Dict[str, Any]:
        """
        Obtener métricas de analíticas para los últimos N días
        
        Args:
            days: Número de días hacia atrás
            
        Returns:
            Dict con las métricas de analíticas
        """
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=days)
            
            result = self.supabase.table('analytics_metrics').select('*').gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).order('date', desc=True).execute()
            
            return {
                'success': True,
                'data': result.data[0] if result.data else {},
                'history': result.data if result.data else []
            }
        except Exception as e:
            logger.error(f"Error getting analytics metrics: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Obtener actividad reciente del sistema
        
        Args:
            limit: Número máximo de actividades a retornar
            
        Returns:
            Lista de actividades recientes
        """
        try:
            result = self.supabase.table('system_activity').select('*').order('created_at', desc=True).limit(limit).execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting recent activity: {str(e)}")
            return []
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """
        Obtener alertas activas del sistema
        
        Returns:
            Lista de alertas activas
        """
        try:
            result = self.supabase.table('system_alerts').select('*').eq('is_resolved', False).order('created_at', desc=True).execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting active alerts: {str(e)}")
            return []
    
    def get_top_products_daily(self, target_date: date = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Obtener productos más vendidos para un día específico
        
        Args:
            target_date: Fecha objetivo (por defecto hoy)
            limit: Número máximo de productos
            
        Returns:
            Lista de productos más vendidos
        """
        try:
            if target_date is None:
                target_date = date.today()
            
            result = self.supabase.table('top_products_daily').select('*').eq('date', target_date.isoformat()).order('rank_position', asc=True).limit(limit).execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting top products daily: {str(e)}")
            return []
    
    def update_top_products_daily(self, target_date: date = None) -> bool:
        """
        Actualizar productos más vendidos para un día específico
        
        Args:
            target_date: Fecha objetivo (por defecto hoy)
            
        Returns:
            bool: True si se actualizó exitosamente
        """
        try:
            if target_date is None:
                target_date = date.today()
            
            # Obtener productos más vendidos (simplificado)
            # En una implementación real, esto vendría de las ventas reales
            products_result = self.supabase.table('products').select('id, name, price').eq('is_active', True).limit(10).execute()
            
            if products_result.data:
                # Eliminar datos existentes para la fecha
                self.supabase.table('top_products_daily').delete().eq('date', target_date.isoformat()).execute()
                
                # Insertar nuevos datos
                top_products = []
                for i, product in enumerate(products_result.data):
                    # Simular datos de ventas
                    total_sales = 100 - (i * 10)
                    total_revenue = float(product.get('price', 0)) * total_sales
                    
                    top_products.append({
                        'date': target_date.isoformat(),
                        'product_id': product['id'],
                        'product_name': product['name'],
                        'total_sales': total_sales,
                        'total_revenue': total_revenue,
                        'rank_position': i + 1
                    })
                
                if top_products:
                    self.supabase.table('top_products_daily').insert(top_products).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error updating top products daily: {str(e)}")
            return False
    
    def get_sales_metrics(self, period_type: str = 'monthly', months: int = 12) -> List[Dict[str, Any]]:
        """
        Obtener métricas de ventas por período
        
        Args:
            period_type: Tipo de período ('daily', 'weekly', 'monthly', 'yearly')
            months: Número de meses hacia atrás
            
        Returns:
            Lista de métricas de ventas
        """
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=months * 30)
            
            result = self.supabase.table('sales_metrics').select('*').eq('period_type', period_type).gte('period_start', start_date.isoformat()).lte('period_start', end_date.isoformat()).order('period_start', desc=True).execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting sales metrics: {str(e)}")
            return []
    
    def generate_weekly_report(self) -> Dict[str, Any]:
        """
        Generar reporte semanal de métricas
        
        Returns:
            Dict con el reporte semanal
        """
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=7)
            
            # Obtener métricas de la semana
            dashboard_result = self.supabase.table('dashboard_metrics').select('*').gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).execute()
            
            # Obtener actividad de la semana
            activity_result = self.supabase.table('system_activity').select('*').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            # Obtener alertas de la semana
            alerts_result = self.supabase.table('system_alerts').select('*').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            return {
                'success': True,
                'data': {
                    'period': {
                        'start': start_date.isoformat(),
                        'end': end_date.isoformat()
                    },
                    'dashboard_metrics': dashboard_result.data if dashboard_result.data else [],
                    'activity_count': len(activity_result.data) if activity_result.data else 0,
                    'alerts_count': len(alerts_result.data) if alerts_result.data else 0,
                    'resolved_alerts': len([a for a in alerts_result.data if a.get('is_resolved')]) if alerts_result.data else 0
                }
            }
        except Exception as e:
            logger.error(f"Error generating weekly report: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            } 