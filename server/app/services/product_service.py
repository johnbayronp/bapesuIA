import os
from supabase import create_client, Client
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ProductService:
    def __init__(self):
        """Inicializar el cliente de Supabase"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def get_products(self, page: int = 1, per_page: int = 10, filters: Dict = None) -> Dict[str, Any]:
        """
        Obtener productos con paginación y filtros
        
        Args:
            page: Número de página (1-based)
            per_page: Elementos por página
            filters: Diccionario con filtros (category, status, search, min_price, max_price)
        
        Returns:
            Dict con productos, total y metadata
        """
        try:
            print(f"=== DEBUG: Iniciando get_products ===")
            print(f"Parámetros: page={page}, per_page={per_page}, filters={filters}")
            
            # Primero obtener el total sin paginación para el conteo
            count_query = self.supabase.table('products').select('id', count='exact').eq('is_active', True)
            
            # Aplicar filtros al conteo
            if filters:
                count_query = self._apply_filters(count_query, filters)
            
            # Ejecutar conteo
            count_result = count_query.execute()
            total_count = count_result.count
            
            # Ahora obtener los datos con paginación
            query = self.supabase.table('products').select('*').eq('is_active', True)
            
            # Aplicar filtros a la consulta de datos
            if filters:
                query = self._apply_filters(query, filters)
            
            # Aplicar paginación
            from_range = (page - 1) * per_page
            to_range = from_range + per_page - 1
            query = query.range(from_range, to_range)
            
            # Ejecutar consulta de datos
            result = query.execute()
            
            return {
                'data': result.data or [],
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"Error en get_products: {str(e)}")
            raise Exception(f"Error al obtener productos: {str(e)}")
    
    def _apply_filters(self, query, filters: Dict):
        """Aplicar filtros a una consulta"""
        if filters.get('category') and filters['category'] != 'all':
            query = query.eq('category', filters['category'])
        
        if filters.get('status') and filters['status'] != 'all':
            query = query.eq('status', filters['status'])
        
        if filters.get('search'):
            search_term = filters['search']
            query = query.or_(
                f'name.ilike.%{search_term}%,description.ilike.%{search_term}%,sku.ilike.%{search_term}%'
            )
        
        if filters.get('min_price'):
            query = query.gte('price', float(filters['min_price']))
        
        if filters.get('max_price'):
            query = query.lte('price', float(filters['max_price']))
        
        if filters.get('featured') is not None:
            query = query.eq('is_featured', filters['featured'])
        
        if filters.get('in_stock') is True:
            query = query.gt('stock', 0)
        
        return query
    
    def get_product_by_id(self, product_id) -> Optional[Dict]:
        """
        Obtener un producto por ID
        
        Args:
            product_id: ID del producto (puede ser string o int)
        
        Returns:
            Dict con los datos del producto o None si no existe
        """
        try:
            # Convertir product_id a entero si es necesario
            if isinstance(product_id, str):
                try:
                    product_id_int = int(product_id)
                except (ValueError, TypeError):
                    print(f"Error: ID de producto inválido: {product_id}")
                    return None
            else:
                product_id_int = product_id
            
            print(f"=== DEBUG: Buscando producto con ID: {product_id_int} ===")
            result = self.supabase.table('products').select('*').eq('id', product_id_int).execute()
            
            print(f"Resultado de búsqueda: {result.data}")
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error en get_product_by_id: {str(e)}")
            raise Exception(f"Error al obtener producto: {str(e)}")
    
    def create_product(self, product_data: Dict) -> Dict:
        """
        Crear un nuevo producto
        
        Args:
            product_data: Diccionario con los datos del producto
        
        Returns:
            Dict con el producto creado
        """
        try:
            # Validar datos requeridos
            required_fields = ['name', 'category', 'price']
            for field in required_fields:
                if field not in product_data or not product_data[field]:
                    raise ValueError(f"El campo {field} es requerido")
            
            # Validar precio
            if float(product_data['price']) < 0:
                raise ValueError("El precio no puede ser negativo")
            
            # Validar stock
            if 'stock' in product_data and int(product_data['stock']) < 0:
                raise ValueError("El stock no puede ser negativo")
            
            # Generar ID único
            product_id = int(uuid.uuid4().int % 1000000) + 1000
            
            # Preparar datos para inserción
            insert_data = {
                'id': product_id,
                'name': product_data['name'],
                'description': product_data.get('description', ''),
                'category': product_data['category'],
                'price': float(product_data['price']),
                'stock': int(product_data.get('stock', 0)),
                'status': product_data.get('status', 'Activo'),
                'image_url': product_data.get('image_url', ''),
                'sku': product_data.get('sku'),  # Se generará automáticamente si es None
                'barcode': product_data.get('barcode', ''),
                'weight': float(product_data.get('weight', 0)) if product_data.get('weight') else None,
                'dimensions': product_data.get('dimensions', {}),
                'tags': product_data.get('tags', []),
                'specifications': product_data.get('specifications', {}),
                'is_featured': product_data.get('is_featured', False),
                'is_active': product_data.get('is_active', True),
                'discount_percentage': float(product_data.get('discount_percentage', 0)),
                'cost_price': float(product_data.get('cost_price', 0)) if product_data.get('cost_price') else None,
                'supplier_info': product_data.get('supplier_info', {}),
                'inventory_alerts': product_data.get('inventory_alerts', {}),
                'seo_data': product_data.get('seo_data', {}),
                'created_by': product_data.get('created_by', '550e8400-e29b-41d4-a716-446655440000')  # Default admin user UUID
            }
            
            # Insertar producto
            result = self.supabase.table('products').insert(insert_data).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("Error al crear el producto")
                
        except Exception as e:
            logger.error(f"Error en create_product: {str(e)}")
            raise Exception(f"Error al crear producto: {str(e)}")
    
    def update_product(self, product_id: str, product_data: Dict) -> Dict:
        """
        Actualizar un producto existente
        
        Args:
            product_id: ID del producto
            product_data: Diccionario con los datos a actualizar
        
        Returns:
            Dict con el producto actualizado
        """
        try:
            print(f"=== DEBUG: Actualizando producto {product_id} ===")
            print(f"Datos recibidos: {product_data}")
            
            # Convertir product_id a entero si es necesario
            try:
                if isinstance(product_id, str):
                    product_id_int = int(product_id)
                else:
                    product_id_int = product_id
            except (ValueError, TypeError):
                raise ValueError(f"ID de producto inválido: {product_id}")
            
            print(f"ID convertido: {product_id_int}, tipo: {type(product_id_int)}")
            
            # Verificar que el producto existe
            existing_product = self.get_product_by_id(product_id_int)
            if not existing_product:
                raise ValueError("Producto no encontrado")
            
            print(f"Producto existente: {existing_product}")
            
            # Validar precio si se proporciona
            if 'price' in product_data:
                try:
                    price = float(product_data['price'])
                    if price < 0:
                        raise ValueError("El precio no puede ser negativo")
                except (ValueError, TypeError):
                    raise ValueError("El precio debe ser un número válido")
            
            # Validar stock si se proporciona
            if 'stock' in product_data:
                try:
                    stock = int(product_data['stock'])
                    if stock < 0:
                        raise ValueError("El stock no puede ser negativo")
                except (ValueError, TypeError):
                    raise ValueError("El stock debe ser un número entero válido")
            
            # Preparar datos para actualización
            update_data = {}
            
            # Solo actualizar campos que se proporcionen
            fields_to_update = [
                'name', 'description', 'category', 'price', 'stock', 'status',
                'image_url', 'barcode', 'weight', 'dimensions', 'tags',
                'specifications', 'is_featured', 'is_active', 'discount_percentage',
                'cost_price', 'supplier_info', 'inventory_alerts', 'seo_data'
            ]
            
            for field in fields_to_update:
                if field in product_data and product_data[field] is not None:
                    try:
                        if field in ['price', 'discount_percentage']:
                            update_data[field] = float(product_data[field])
                        elif field == 'stock':
                            update_data[field] = int(product_data[field])
                        elif field == 'weight':
                            update_data[field] = float(product_data[field]) if product_data[field] else None
                        elif field in ['is_featured', 'is_active']:
                            update_data[field] = bool(product_data[field])
                        else:
                            update_data[field] = product_data[field]
                    except (ValueError, TypeError) as e:
                        raise ValueError(f"Error procesando campo '{field}': {str(e)}")
            
            print(f"Datos a actualizar: {update_data}")
            
            # Actualizar producto
            print(f"Ejecutando actualización con ID: {product_id_int}, tipo: {type(product_id_int)}")
            print(f"Datos de actualización: {update_data}")
            
            result = self.supabase.table('products').update(update_data).eq('id', product_id_int).execute()
            
            print(f"Resultado de actualización: {result.data}")
            print(f"Tipo de resultado: {type(result.data)}")
            print(f"Longitud del resultado: {len(result.data) if result.data else 0}")
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                # Intentar obtener el producto después de la actualización para verificar
                check_result = self.supabase.table('products').select('*').eq('id', product_id_int).execute()
                print(f"Verificación post-actualización: {check_result.data}")
                
                if check_result.data and len(check_result.data) > 0:
                    print("Producto encontrado después de actualización, pero la actualización no devolvió datos")
                    return check_result.data[0]
                else:
                    raise Exception("Error al actualizar el producto - producto no encontrado después de actualización")
                
        except Exception as e:
            logger.error(f"Error en update_product: {str(e)}")
            raise Exception(f"Error al actualizar producto: {str(e)}")
    
    def delete_product(self, product_id: str) -> bool:
        """
        Eliminar un producto (soft delete)
        
        Args:
            product_id: ID del producto
        
        Returns:
            True si se eliminó correctamente
        """
        try:
            print(f"=== DEBUG: Eliminando producto {product_id} ===")
            
            # Convertir product_id a entero si es necesario
            try:
                if isinstance(product_id, str):
                    product_id_int = int(product_id)
                else:
                    product_id_int = product_id
            except (ValueError, TypeError):
                raise ValueError(f"ID de producto inválido: {product_id}")
            
            print(f"ID convertido: {product_id_int}, tipo: {type(product_id_int)}")
            
            # Verificar que el producto existe
            existing_product = self.get_product_by_id(product_id_int)
            if not existing_product:
                raise ValueError("Producto no encontrado")
            
            print(f"Producto encontrado: {existing_product.get('name')}")
            
            # Soft delete - marcar como inactivo
            result = self.supabase.table('products').update({
                'is_active': False,
                'status': 'Inactivo'
            }).eq('id', product_id_int).execute()
            
            print(f"Resultado de eliminación: {result.data}")
            print(f"Filas afectadas: {len(result.data) if result.data else 0}")
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error en delete_product: {str(e)}")
            raise Exception(f"Error al eliminar producto: {str(e)}")
    
    def hard_delete_product(self, product_id: str) -> bool:
        """
        Eliminar un producto permanentemente
        
        Args:
            product_id: ID del producto
        
        Returns:
            True si se eliminó correctamente
        """
        try:
            print(f"=== DEBUG: Eliminación permanente de producto {product_id} ===")
            
            # Convertir product_id a entero si es necesario
            try:
                if isinstance(product_id, str):
                    product_id_int = int(product_id)
                else:
                    product_id_int = product_id
            except (ValueError, TypeError):
                raise ValueError(f"ID de producto inválido: {product_id}")
            
            print(f"ID convertido: {product_id_int}, tipo: {type(product_id_int)}")
            
            # Verificar que el producto existe
            existing_product = self.get_product_by_id(product_id_int)
            if not existing_product:
                raise ValueError("Producto no encontrado")
            
            print(f"Producto encontrado: {existing_product.get('name')}")
            
            # Eliminación permanente
            result = self.supabase.table('products').delete().eq('id', product_id_int).execute()
            
            print(f"Resultado de eliminación permanente: {result.data}")
            print(f"Filas eliminadas: {len(result.data) if result.data else 0}")
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error en hard_delete_product: {str(e)}")
            raise Exception(f"Error al eliminar producto permanentemente: {str(e)}")
    
    def update_stock(self, product_id: str, new_stock: int) -> Dict:
        """
        Actualizar el stock de un producto
        
        Args:
            product_id: ID del producto
            new_stock: Nueva cantidad de stock
        
        Returns:
            Dict con el producto actualizado
        """
        try:
            if new_stock < 0:
                raise ValueError("El stock no puede ser negativo")
            
            result = self.supabase.table('products').update({
                'stock': new_stock
            }).eq('id', product_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("Error al actualizar stock")
                
        except Exception as e:
            logger.error(f"Error en update_stock: {str(e)}")
            raise Exception(f"Error al actualizar stock: {str(e)}")
    
    def get_product_stats(self) -> Dict:
        """
        Obtener estadísticas de productos
        
        Returns:
            Dict con estadísticas de productos
        """
        try:
            result = self.supabase.table('products_stats').select('*').execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                # Fallback si la vista no existe
                return self._calculate_stats_manually()
                
        except Exception as e:
            logger.error(f"Error en get_product_stats: {str(e)}")
            return self._calculate_stats_manually()
    
    def _calculate_stats_manually(self) -> Dict:
        """Calcular estadísticas manualmente si la vista no existe"""
        try:
            # Obtener todos los productos activos
            result = self.supabase.table('products').select('*').eq('is_active', True).execute()
            products = result.data or []
            
            if not products:
                return {
                    'total_products': 0,
                    'active_products': 0,
                    'out_of_stock': 0,
                    'featured_products': 0,
                    'average_price': 0,
                    'total_stock': 0,
                    'low_stock_products': 0
                }
            
            total_products = len(products)
            active_products = len([p for p in products if p.get('status') == 'Activo'])
            out_of_stock = len([p for p in products if p.get('status') == 'Sin Stock'])
            featured_products = len([p for p in products if p.get('is_featured')])
            average_price = sum(float(p.get('price', 0)) for p in products) / total_products
            total_stock = sum(int(p.get('stock', 0)) for p in products)
            low_stock_products = len([p for p in products if 0 < int(p.get('stock', 0)) <= 5])
            
            return {
                'total_products': total_products,
                'active_products': active_products,
                'out_of_stock': out_of_stock,
                'featured_products': featured_products,
                'average_price': round(average_price, 2),
                'total_stock': total_stock,
                'low_stock_products': low_stock_products
            }
            
        except Exception as e:
            logger.error(f"Error en _calculate_stats_manually: {str(e)}")
            return {
                'total_products': 0,
                'active_products': 0,
                'out_of_stock': 0,
                'featured_products': 0,
                'average_price': 0,
                'total_stock': 0,
                'low_stock_products': 0
            }
    
    def get_categories(self) -> List[str]:
        """
        Obtener lista de categorías únicas
        
        Returns:
            Lista de categorías
        """
        try:
            result = self.supabase.table('products').select('category').eq('is_active', True).execute()
            
            if result.data:
                categories = list(set([p['category'] for p in result.data]))
                return sorted(categories)
            return []
            
        except Exception as e:
            logger.error(f"Error en get_categories: {str(e)}")
            return []
    
    def search_products(self, search_term: str, limit: int = 10) -> List[Dict]:
        """
        Buscar productos por término de búsqueda
        
        Args:
            search_term: Término de búsqueda
            limit: Límite de resultados
        
        Returns:
            Lista de productos que coinciden
        """
        try:
            result = self.supabase.table('products').select('*').or_(
                f'name.ilike.%{search_term}%,description.ilike.%{search_term}%,sku.ilike.%{search_term}%'
            ).eq('is_active', True).limit(limit).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error en search_products: {str(e)}")
            return [] 