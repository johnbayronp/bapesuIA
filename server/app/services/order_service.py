from supabase import create_client, Client
from app.config import Config
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

class OrderService:
    def __init__(self):
        self.supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)
    
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crear una nueva orden en la base de datos
        
        Args:
            order_data: Diccionario con los datos de la orden
            
        Returns:
            Dict con la orden creada
        """
        try:
            print(f"OrderService.create_order - Received user_id: {order_data.get('user_id')}")
            print(f"OrderService.create_order - Full order_data: {order_data}")
            
            # Preparar los datos de la orden
            order_payload = {
                'user_id': order_data.get('user_id'),
                'customer_name': order_data['customer_name'],
                'customer_email': order_data['customer_email'],
                'customer_phone': order_data['customer_phone'],
                'shipping_address': order_data['shipping_address'],
                'shipping_city': order_data['shipping_city'],
                'shipping_state': order_data['shipping_state'],
                'shipping_zip_code': order_data['shipping_zip_code'],
                'shipping_country': order_data.get('shipping_country', 'Colombia'),
                'subtotal': order_data['subtotal'],
                'shipping_cost': order_data['shipping_cost'],
                'total_amount': order_data['total_amount'],
                'payment_method': order_data['payment_method'],
                'shipping_method': order_data['shipping_method'],
                'status': order_data.get('status', 'pending'),
                'comments': order_data.get('comments'),
                'whatsapp_sent': order_data.get('whatsapp_sent', True),
                'tracking_number': order_data.get('tracking_number'),
                'tracking_url': order_data.get('tracking_url')
            }
            
            # Crear la orden
            result = self.supabase.table('orders').insert(order_payload).execute()
            
            if not result.data:
                raise Exception("No se pudo crear la orden")
            
            order = result.data[0]
            order_id = order['id']
            
            # Crear los items de la orden
            order_items = []
            for item in order_data['items']:
                item_payload = {
                    'order_id': order_id,
                    'product_id': item.get('product_id'),
                    'product_name': item['name'],
                    'product_price': item['price'],
                    'quantity': item['quantity'],
                    'total_price': item['price'] * item['quantity']
                }
                order_items.append(item_payload)
            
            # Insertar todos los items
            if order_items:
                items_result = self.supabase.table('order_items').insert(order_items).execute()
                order['items'] = items_result.data
            else:
                order['items'] = []
            
            return {
                'success': True,
                'data': order,
                'message': 'Orden creada exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al crear la orden'
            }
    
    def get_order(self, order_id: str) -> Dict[str, Any]:
        """
        Obtener una orden específica con sus items
        
        Args:
            order_id: ID de la orden
            
        Returns:
            Dict con la orden y sus items
        """
        try:
            # Obtener la orden
            order_result = self.supabase.table('orders').select('*').eq('id', order_id).execute()
            
            if not order_result.data:
                return {
                    'success': False,
                    'error': 'Orden no encontrada',
                    'message': 'La orden especificada no existe'
                }
            
            order = order_result.data[0]
            
            # Obtener los items de la orden
            items_result = self.supabase.table('order_items').select('*').eq('order_id', order_id).execute()
            order['items'] = items_result.data if items_result.data else []
            
            return {
                'success': True,
                'data': order,
                'message': 'Orden obtenida exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al obtener la orden'
            }
    
    def get_user_orders(self, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Obtener todas las órdenes de un usuario
        
        Args:
            user_id: ID del usuario
            limit: Límite de resultados
            offset: Offset para paginación
            
        Returns:
            Dict con las órdenes del usuario
        """
        try:
            print(f"User ID: {user_id} , offset: {offset} , limit: {limit}")
            # Usar la clave de servicio para bypass RLS ya que estamos en el backend
            result = self.supabase.table('orders').select('*').eq('user_id', user_id).order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            
            return {
                'success': True,
                'data': result.data if result.data else [],
                'message': 'Órdenes obtenidas exitosamente'
            }
            
        except Exception as e:
            print(f"Error en get_user_orders: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al obtener las órdenes'
            }
    
    def get_all_orders(self, limit: int = 50, offset: int = 0, status: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtener todas las órdenes (solo para administradores)
        
        Args:
            limit: Límite de resultados
            offset: Offset para paginación
            status: Filtrar por estado
            
        Returns:
            Dict con todas las órdenes
        """
        try:
            query = self.supabase.table('orders').select('*').order('created_at', desc=True)
            
            if status:
                query = query.eq('status', status)
            
            result = query.range(offset, offset + limit - 1).execute()
            
            return {
                'success': True,
                'data': result.data if result.data else [],
                'message': 'Órdenes obtenidas exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al obtener las órdenes'
            }
    
    def update_order_status(self, order_id: str, status: str) -> Dict[str, Any]:
        """
        Actualizar el estado de una orden
        
        Args:
            order_id: ID de la orden
            status: Nuevo estado
            
        Returns:
            Dict con el resultado de la actualización
        """
        try:
            valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
            
            if status not in valid_statuses:
                return {
                    'success': False,
                    'error': 'Estado inválido',
                    'message': f'El estado debe ser uno de: {", ".join(valid_statuses)}'
                }
            
            result = self.supabase.table('orders').update({'status': status}).eq('id', order_id).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Orden no encontrada',
                    'message': 'La orden especificada no existe'
                }
            
            return {
                'success': True,
                'data': result.data[0],
                'message': 'Estado de la orden actualizado exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al actualizar el estado de la orden'
            }

    def update_order(self, order_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actualizar una orden completa
        
        Args:
            order_id: ID de la orden
            order_data: Datos a actualizar
            
        Returns:
            Dict con el resultado de la actualización
        """
        try:
            # Validar estado si se proporciona
            if 'status' in order_data:
                valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
                if order_data['status'] not in valid_statuses:
                    return {
                        'success': False,
                        'error': 'Estado inválido',
                        'message': f'El estado debe ser uno de: {", ".join(valid_statuses)}'
                    }
            
            # Campos permitidos para actualización
            allowed_fields = [
                'status', 'customer_name', 'customer_email', 'customer_phone',
                'shipping_address', 'shipping_city', 'shipping_state', 
                'shipping_zip_code', 'comments', 'tracking_number', 'tracking_url'
            ]
            
            # Filtrar solo los campos permitidos
            update_data = {k: v for k, v in order_data.items() if k in allowed_fields}
            
            if not update_data:
                return {
                    'success': False,
                    'error': 'Datos inválidos',
                    'message': 'No se proporcionaron datos válidos para actualizar'
                }
            
            result = self.supabase.table('orders').update(update_data).eq('id', order_id).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Orden no encontrada',
                    'message': 'La orden especificada no existe'
                }
            
            return {
                'success': True,
                'data': result.data[0],
                'message': 'Orden actualizada exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al actualizar la orden'
            }
    
    def get_order_stats(self) -> Dict[str, Any]:
        """
        Obtener estadísticas de las órdenes
        
        Returns:
            Dict con las estadísticas
        """
        try:
            # Obtener total de órdenes
            total_result = self.supabase.table('orders').select('id', count='exact').execute()
            total_orders = total_result.count if total_result.count else 0
            
            # Obtener órdenes por estado
            status_result = self.supabase.table('orders').select('status').execute()
            status_counts = {}
            if status_result.data:
                for order in status_result.data:
                    status = order['status']
                    status_counts[status] = status_counts.get(status, 0) + 1
            
            # Obtener total de ventas
            sales_result = self.supabase.table('orders').select('total_amount').eq('status', 'delivered').execute()
            total_sales = sum(order['total_amount'] for order in sales_result.data) if sales_result.data else 0
            
            return {
                'success': True,
                'data': {
                    'total_orders': total_orders,
                    'status_counts': status_counts,
                    'total_sales': total_sales
                },
                'message': 'Estadísticas obtenidas exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al obtener las estadísticas'
            }

    def delete_order(self, order_id: str) -> Dict[str, Any]:
        """
        Eliminar una orden y sus items asociados
        
        Args:
            order_id: ID de la orden
            
        Returns:
            Dict con el resultado de la eliminación
        """
        try:
            # Primero verificar que la orden existe
            order_result = self.supabase.table('orders').select('id').eq('id', order_id).execute()
            
            if not order_result.data:
                return {
                    'success': False,
                    'error': 'Orden no encontrada',
                    'message': 'La orden especificada no existe'
                }
            
            # Eliminar la orden (los items se eliminarán automáticamente por CASCADE)
            delete_result = self.supabase.table('orders').delete().eq('id', order_id).execute()
            
            if delete_result.data:
                return {
                    'success': True,
                    'message': 'Orden eliminada exitosamente'
                }
            else:
                return {
                    'success': False,
                    'error': 'Error al eliminar la orden',
                    'message': 'No se pudo eliminar la orden'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al eliminar la orden'
            } 