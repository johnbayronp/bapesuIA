from supabase import create_client, Client
from app.config import Config
import json
from datetime import datetime
from typing import Dict, List, Optional, Any

class ProductRatingService:
    def __init__(self):
        self.supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)
    
    def create_rating(self, user_id: str, product_id: int, order_id: str, rating: int, comment: str = None) -> Dict[str, Any]:
        """
        Crear una nueva calificación de producto
        """
        try:
            # Verificar que el usuario pueda calificar este producto
            can_rate = self.can_user_rate_product(user_id, product_id, order_id)
            if not can_rate:
                raise Exception("El usuario no puede calificar este producto")
            
            # Verificar que no haya calificado ya este producto en esta orden
            existing_rating = self.get_user_product_rating(user_id, product_id, order_id)
            if existing_rating:
                raise Exception("Ya has calificado este producto en esta orden")
            
            # Crear la calificación
            rating_data = {
                'product_id': product_id,
                'user_id': user_id,
                'order_id': order_id,
                'rating': rating,
                'comment': comment,
                'is_approved': True,
                'is_flagged': False
            }
            
            result = self.supabase.table('product_ratings').insert(rating_data).execute()
            
            if result.data:
                return {
                    'success': True,
                    'data': result.data[0],
                    'message': 'Calificación creada exitosamente'
                }
            else:
                raise Exception("Error al crear la calificación")
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_user_product_rating(self, user_id: str, product_id: int, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener la calificación de un usuario para un producto específico en una orden
        """
        try:
            result = self.supabase.table('product_ratings').select('*').eq('user_id', user_id).eq('product_id', product_id).eq('order_id', order_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            print(f"Error getting user product rating: {e}")
            return None
    
    def can_user_rate_product(self, user_id: str, product_id: int, order_id: str) -> bool:
        """
        Verificar si un usuario puede calificar un producto
        """
        try:
            print(f"DEBUG: Checking if user {user_id} can rate product {product_id} for order {order_id}")
            
            # Verificar que el usuario haya comprado el producto en la orden y que esté entregada
            result = self.supabase.rpc('can_user_rate_product', {
                'user_id_param': user_id,
                'product_id_param': product_id,
                'order_id_param': order_id
            }).execute()
            
            print(f"DEBUG: RPC result: {result.data}")
            
            # Manejar diferentes tipos de respuesta
            if result.data is None:
                can_rate = False
            elif isinstance(result.data, list) and len(result.data) > 0:
                can_rate = result.data[0]
            elif isinstance(result.data, bool):
                can_rate = result.data
            else:
                can_rate = False
                
            print(f"DEBUG: Can rate result: {can_rate}")
            
            return can_rate
            
        except Exception as e:
            print(f"Error checking if user can rate product: {e}")
            return False
    
    def get_product_ratings(self, product_id: int, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        Obtener calificaciones de un producto con paginación
        """
        try:
            # Calcular offset
            offset = (page - 1) * per_page
            
            # Obtener calificaciones aprobadas
            result = self.supabase.table('product_ratings').select(
                '*, users(first_name, last_name)'
            ).eq('product_id', product_id).eq('is_approved', True).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
            
            # Obtener total de calificaciones
            total_result = self.supabase.table('product_ratings').select('id', count='exact').eq('product_id', product_id).eq('is_approved', True).execute()
            total = total_result.count if total_result.count is not None else 0
            
            return {
                'success': True,
                'data': result.data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_product_rating_stats(self, product_id: int) -> Dict[str, Any]:
        """
        Obtener estadísticas de calificaciones de un producto
        """
        try:
            # Usar la función RPC para obtener estadísticas
            result = self.supabase.rpc('get_product_rating_stats', {
                'product_id_param': product_id
            }).execute()
            
            if result.data:
                return {
                    'success': True,
                    'data': result.data[0]
                }
            else:
                return {
                    'success': True,
                    'data': {
                        'average_rating': 0.00,
                        'total_ratings': 0,
                        'rating_distribution': {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
                        'recent_ratings': []
                    }
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_rating(self, rating_id: str, user_id: str, rating: int, comment: str = None) -> Dict[str, Any]:
        """
        Actualizar una calificación existente
        """
        try:
            # Verificar que la calificación pertenezca al usuario
            existing_rating = self.supabase.table('product_ratings').select('*').eq('id', rating_id).eq('user_id', user_id).execute()
            
            if not existing_rating.data:
                raise Exception("Calificación no encontrada o no tienes permisos para editarla")
            
            # Actualizar la calificación
            update_data = {
                'rating': rating,
                'comment': comment,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('product_ratings').update(update_data).eq('id', rating_id).eq('user_id', user_id).execute()
            
            if result.data:
                return {
                    'success': True,
                    'data': result.data[0],
                    'message': 'Calificación actualizada exitosamente'
                }
            else:
                raise Exception("Error al actualizar la calificación")
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_rating(self, rating_id: str, user_id: str) -> Dict[str, Any]:
        """
        Eliminar una calificación
        """
        try:
            # Verificar que la calificación pertenezca al usuario
            existing_rating = self.supabase.table('product_ratings').select('*').eq('id', rating_id).eq('user_id', user_id).execute()
            
            if not existing_rating.data:
                raise Exception("Calificación no encontrada o no tienes permisos para eliminarla")
            
            # Eliminar la calificación
            result = self.supabase.table('product_ratings').delete().eq('id', rating_id).eq('user_id', user_id).execute()
            
            return {
                'success': True,
                'message': 'Calificación eliminada exitosamente'
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_user_ratings(self, user_id: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        Obtener todas las calificaciones de un usuario
        """
        try:
            # Calcular offset
            offset = (page - 1) * per_page
            
            # Obtener calificaciones del usuario
            result = self.supabase.table('product_ratings').select(
                '*, products(name, image)'
            ).eq('user_id', user_id).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
            
            # Obtener total de calificaciones del usuario
            total_result = self.supabase.table('product_ratings').select('id', count='exact').eq('user_id', user_id).execute()
            total = total_result.count if total_result.count is not None else 0
            
            return {
                'success': True,
                'data': result.data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_pending_ratings(self, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        Obtener calificaciones pendientes de aprobación (solo para admins)
        """
        try:
            # Calcular offset
            offset = (page - 1) * per_page
            
            # Obtener calificaciones pendientes
            result = self.supabase.table('product_ratings').select(
                '*, products(name), users(first_name, last_name)'
            ).eq('is_approved', False).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
            
            # Obtener total de calificaciones pendientes
            total_result = self.supabase.table('product_ratings').select('id', count='exact').eq('is_approved', False).execute()
            total = total_result.count if total_result.count is not None else 0
            
            return {
                'success': True,
                'data': result.data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def approve_rating(self, rating_id: str) -> Dict[str, Any]:
        """
        Aprobar una calificación (solo para admins)
        """
        try:
            result = self.supabase.table('product_ratings').update({
                'is_approved': True,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', rating_id).execute()
            
            if result.data:
                return {
                    'success': True,
                    'data': result.data[0],
                    'message': 'Calificación aprobada exitosamente'
                }
            else:
                raise Exception("Error al aprobar la calificación")
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def reject_rating(self, rating_id: str, reason: str) -> Dict[str, Any]:
        """
        Rechazar una calificación (solo para admins)
        """
        try:
            result = self.supabase.table('product_ratings').update({
                'is_approved': False,
                'is_flagged': True,
                'flag_reason': reason,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', rating_id).execute()
            
            if result.data:
                return {
                    'success': True,
                    'data': result.data[0],
                    'message': 'Calificación rechazada exitosamente'
                }
            else:
                raise Exception("Error al rechazar la calificación")
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            } 