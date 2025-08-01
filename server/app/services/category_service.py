import os
from supabase import create_client, Client
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CategoryService:
    def __init__(self):
        """Inicializar el cliente de Supabase"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def get_categories(self, include_inactive: bool = False, filters: Dict = None) -> List[Dict]:
        """
        Obtener todas las categorías con filtros opcionales
        
        Args:
            include_inactive: Si incluir categorías inactivas
            filters: Diccionario con filtros (search, status)
        
        Returns:
            Lista de categorías
        """
        try:
            query = self.supabase.table('categories').select('*')
            
            # Aplicar filtros si se proporcionan
            if filters:
                # Filtro de búsqueda
                if filters.get('search'):
                    search_term = filters['search']
                    query = query.or_(f'name.ilike.%{search_term}%,description.ilike.%{search_term}%')
                
                # Filtro de estado
                if filters.get('status'):
                    status = filters['status']
                    if status == 'active':
                        query = query.eq('is_active', True)
                    elif status == 'inactive':
                        query = query.eq('is_active', False)
                    elif status == 'featured':
                        query = query.eq('is_featured', True).eq('is_active', True)
                else:
                    # Si no hay filtro de estado específico, usar include_inactive
                    if not include_inactive:
                        query = query.eq('is_active', True)
            else:
                # Comportamiento original si no hay filtros
                if not include_inactive:
                    query = query.eq('is_active', True)
            
            query = query.order('sort_order', desc=False).order('name', desc=False)
            result = query.execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error en get_categories: {str(e)}")
            raise Exception(f"Error al obtener categorías: {str(e)}")
    
    def get_category_by_id(self, category_id: int) -> Optional[Dict]:
        """
        Obtener una categoría por ID
        
        Args:
            category_id: ID de la categoría
        
        Returns:
            Dict con los datos de la categoría o None si no existe
        """
        try:
            result = self.supabase.table('categories').select('*').eq('id', category_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error en get_category_by_id: {str(e)}")
            raise Exception(f"Error al obtener categoría: {str(e)}")
    
    def get_category_by_slug(self, slug: str) -> Optional[Dict]:
        """
        Obtener una categoría por slug
        
        Args:
            slug: Slug de la categoría
        
        Returns:
            Dict con los datos de la categoría o None si no existe
        """
        try:
            result = self.supabase.table('categories').select('*').eq('slug', slug).eq('is_active', True).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error en get_category_by_slug: {str(e)}")
            raise Exception(f"Error al obtener categoría: {str(e)}")
    
    def create_category(self, category_data: Dict) -> Dict:
        """
        Crear una nueva categoría
        
        Args:
            category_data: Diccionario con los datos de la categoría
        
        Returns:
            Dict con la categoría creada
        """
        try:
            # Validar datos requeridos
            if not category_data.get('name'):
                raise ValueError("El nombre de la categoría es requerido")
            
            # Verificar que el nombre no exista
            existing = self.supabase.table('categories').select('id').eq('name', category_data['name']).execute()
            if existing.data and len(existing.data) > 0:
                raise ValueError("Ya existe una categoría con ese nombre")
            
            # Preparar datos para inserción
            insert_data = {
                'name': category_data['name'],
                'description': category_data.get('description', ''),
                'slug': category_data.get('slug', ''),  # Se generará automáticamente si está vacío
                'icon': category_data.get('icon', ''),
                'color': category_data.get('color', '#3B82F6'),
                'is_active': category_data.get('is_active', True),
                'is_featured': category_data.get('is_featured', False),
                'sort_order': category_data.get('sort_order', 0),
                'parent_id': category_data.get('parent_id'),
                'created_by': category_data.get('created_by')
            }
            
            # Insertar categoría
            result = self.supabase.table('categories').insert(insert_data).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("Error al crear la categoría")
                
        except Exception as e:
            logger.error(f"Error en create_category: {str(e)}")
            raise Exception(f"Error al crear categoría: {str(e)}")
    
    def update_category(self, category_id: int, category_data: Dict) -> Dict:
        """
        Actualizar una categoría existente
        
        Args:
            category_id: ID de la categoría
            category_data: Diccionario con los datos a actualizar
        
        Returns:
            Dict con la categoría actualizada
        """
        try:
            # Verificar que la categoría existe
            existing_category = self.get_category_by_id(category_id)
            if not existing_category:
                raise ValueError("Categoría no encontrada")
            
            # Verificar que el nombre no exista en otra categoría
            if 'name' in category_data and category_data['name'] != existing_category['name']:
                existing = self.supabase.table('categories').select('id').eq('name', category_data['name']).execute()
                if existing.data and len(existing.data) > 0:
                    raise ValueError("Ya existe una categoría con ese nombre")
            
            # Preparar datos para actualización
            update_data = {}
            fields_to_update = [
                'name', 'description', 'slug', 'icon', 'color', 'is_active', 
                'is_featured', 'sort_order', 'parent_id'
            ]
            
            for field in fields_to_update:
                if field in category_data and category_data[field] is not None:
                    update_data[field] = category_data[field]
            
            # Actualizar categoría
            result = self.supabase.table('categories').update(update_data).eq('id', category_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("Error al actualizar la categoría")
                
        except Exception as e:
            logger.error(f"Error en update_category: {str(e)}")
            raise Exception(f"Error al actualizar categoría: {str(e)}")
    
    def delete_category(self, category_id: int) -> bool:
        """
        Eliminar una categoría (soft delete)
        
        Args:
            category_id: ID de la categoría
        
        Returns:
            True si se eliminó correctamente
        """
        try:
            # Verificar que la categoría existe
            existing_category = self.get_category_by_id(category_id)
            if not existing_category:
                raise ValueError("Categoría no encontrada")
            
            # Verificar que no haya productos usando esta categoría
            # Primero obtener el nombre de la categoría
            category_name = existing_category['name']
            products = self.supabase.table('products').select('id').eq('category', category_name).execute()
            if products.data and len(products.data) > 0:
                raise ValueError("No se puede eliminar la categoría porque tiene productos asociados")
            
            # Soft delete - marcar como inactiva
            result = self.supabase.table('categories').update({
                'is_active': False
            }).eq('id', category_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error en delete_category: {str(e)}")
            raise Exception(f"Error al eliminar categoría: {str(e)}")
    
    def get_featured_categories(self) -> List[Dict]:
        """
        Obtener categorías destacadas
        
        Returns:
            Lista de categorías destacadas
        """
        try:
            result = self.supabase.table('categories').select('*').eq('is_featured', True).eq('is_active', True).order('sort_order', desc=False).execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error en get_featured_categories: {str(e)}")
            return []
    
    def get_category_stats(self) -> Dict:
        """
        Obtener estadísticas de categorías
        
        Returns:
            Dict con estadísticas de categorías
        """
        try:
            # Obtener todas las categorías activas
            categories = self.get_categories(include_inactive=False)
            
            # Contar productos por categoría
            stats = {
                'total_categories': len(categories),
                'featured_categories': len([c for c in categories if c.get('is_featured')]),
                'categories_with_products': 0,
                'categories_without_products': 0
            }
            
            for category in categories:
                products = self.supabase.table('products').select('id').eq('category', category['name']).eq('is_active', True).execute()
                if products.data and len(products.data) > 0:
                    stats['categories_with_products'] += 1
                else:
                    stats['categories_without_products'] += 1
            
            return stats
            
        except Exception as e:
            logger.error(f"Error en get_category_stats: {str(e)}")
            return {
                'total_categories': 0,
                'featured_categories': 0,
                'categories_with_products': 0,
                'categories_without_products': 0
            } 