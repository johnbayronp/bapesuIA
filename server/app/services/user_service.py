import os
from supabase import create_client, Client
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        """Inicializar el cliente de Supabase"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')  # Usar la clave de servicio para operaciones admin
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def get_users(self, page: int = 1, per_page: int = 10, filters: Dict = None) -> Dict[str, Any]:
        """
        Obtener usuarios con paginación y filtros
        
        Args:
            page: Número de página (1-based)
            per_page: Elementos por página
            filters: Diccionario con filtros (status, role, search)
        
        Returns:
            Dict con usuarios, total y metadata
        """
        try:
            print(f"=== DEBUG: Iniciando get_users ===")
            print(f"Parámetros: page={page}, per_page={per_page}, filters={filters}")
            
            # Verificar conexión a Supabase
            print(f"Supabase URL: {os.getenv('SUPABASE_URL')}")
            print(f"Supabase Key configurado: {'Sí' if os.getenv('SUPABASE_SERVICE_KEY') else 'No'}")
            
            # Primero obtener el total sin paginación para el conteo
            count_query = self.supabase.table('users').select('id', count='exact')
            print(f"Count query creada: {count_query}")
            
            # Aplicar filtros al conteo
            if filters:
                print(f"Aplicando filtros: {filters}")
                if filters.get('status') and filters['status'] != 'all':
                    is_active = filters['status'] == 'Activo'
                    count_query = count_query.eq('is_active', is_active)
                    print(f"Filtro status aplicado: is_active={is_active}")
                
                if filters.get('role') and filters['role'] != 'all':
                    count_query = count_query.eq('role', filters['role'])
                    print(f"Filtro role aplicado: role={filters['role']}")
                
                if filters.get('search'):
                    search_term = filters['search']
                    count_query = count_query.or_(
                        f'first_name.ilike.%{search_term}%,last_name.ilike.%{search_term}%,email.ilike.%{search_term}%'
                    )
                    print(f"Filtro search aplicado: search_term={search_term}")
            
            # Ejecutar conteo
            print("Ejecutando count query...")
            count_result = count_query.execute()
            total_count = count_result.count
            print(f"Count result: {count_result}")
            print(f"Total count: {total_count}")
            
            # Ahora obtener los datos con paginación
            query = self.supabase.table('users').select('*')
            print(f"Data query creada: {query}")
            
            # Aplicar filtros a la consulta de datos
            if filters:
                if filters.get('status') and filters['status'] != 'all':
                    is_active = filters['status'] == 'Activo'
                    query = query.eq('is_active', is_active)
                
                if filters.get('role') and filters['role'] != 'all':
                    query = query.eq('role', filters['role'])
                
                if filters.get('search'):
                    search_term = filters['search']
                    query = query.or_(
                        f'first_name.ilike.%{search_term}%,last_name.ilike.%{search_term}%,email.ilike.%{search_term}%'
                    )
            
            # Aplicar paginación
            from_range = (page - 1) * per_page
            to_range = from_range + per_page - 1
            query = query.range(from_range, to_range)
            print(f"Paginación aplicada: rango {from_range}-{to_range}")
            
            # Ejecutar consulta de datos
            print("Ejecutando data query...")
            result = query.execute()
            print(f"Data result: {result}")
            print(f"Data count: {len(result.data) if result.data else 0}")
            
            print(f"Paginación: página {page}, por página {per_page}, rango {from_range}-{to_range}")
            print(f"Total de usuarios: {total_count}, Usuarios obtenidos: {len(result.data) if result.data else 0}")
            
            return {
                'users': result.data if result.data else [],
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
            
        except Exception as e:
            print(f"ERROR en get_users: {str(e)}")
            logger.error(f"Error getting users: {str(e)}")
            raise Exception(f"Error al obtener usuarios: {str(e)}")
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """
        Obtener un usuario por ID
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Dict con los datos del usuario o None si no existe
        """
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by id {user_id}: {str(e)}")
            raise Exception(f"Error al obtener usuario: {str(e)}")
    
    def create_user(self, user_data: Dict) -> Dict:
        """
        Crear un nuevo usuario
        
        Args:
            user_data: Diccionario con los datos del usuario
            
        Returns:
            Dict con el usuario creado
        """
        try:
            # Validar datos requeridos
            required_fields = ['email', 'role']
            for field in required_fields:
                if not user_data.get(field):
                    raise ValueError(f"Campo requerido faltante: {field}")
            
            # Insertar en la tabla users
            result = self.supabase.table('users').insert(user_data).execute()
            
            if not result.data:
                raise Exception("No se pudo crear el usuario")
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise Exception(f"Error al crear usuario: {str(e)}")
    
    def update_user(self, user_id: str, user_data: Dict) -> Dict:
        """
        Actualizar un usuario
        
        Args:
            user_id: ID del usuario
            user_data: Diccionario con los datos a actualizar
            
        Returns:
            Dict con el usuario actualizado
        """
        try:
            # Validar datos requeridos
            required_fields = ['email', 'role']
            for field in required_fields:
                if not user_data.get(field):
                    raise ValueError(f"Campo requerido faltante: {field}")
            
            # Actualizar en la tabla users
            result = self.supabase.table('users').update(user_data).eq('id', user_id).execute()
            
            if not result.data:
                raise Exception("No se pudo actualizar el usuario")
            
            # Si el email cambió, actualizar en auth
            old_user = self.get_user_by_id(user_id)
            if old_user and user_data.get('email') != old_user.get('email'):
                try:
                    # Actualizar email en auth
                    self.supabase.auth.admin.update_user_by_id(
                        user_id,
                        {'email': user_data['email']}
                    )
                except Exception as auth_error:
                    logger.warning(f"Error updating auth email: {str(auth_error)}")
                    # No fallar si no se puede actualizar auth, solo loggear
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {str(e)}")
            raise Exception(f"Error al actualizar usuario: {str(e)}")
    
    def delete_user(self, user_id: str) -> bool:
        """
        Eliminar un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            # Eliminar de la tabla users
            result = self.supabase.table('users').delete().eq('id', user_id).execute()
            
            if not result.data:
                raise Exception("No se pudo eliminar el usuario")
            
            # Eliminar de auth
            try:
                self.supabase.auth.admin.delete_user(user_id)
            except Exception as auth_error:
                logger.warning(f"Error deleting from auth: {str(auth_error)}")
                # No fallar si no se puede eliminar de auth, solo loggear
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            raise Exception(f"Error al eliminar usuario: {str(e)}")
    
    def deactivate_user(self, user_id: str) -> Dict:
        """
        Desactivar un usuario (soft delete)
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Dict con el usuario desactivado
        """
        try:
            result = self.supabase.table('users').update({
                'is_active': False,
                'updated_at': 'now()'
            }).eq('id', user_id).execute()
            
            if not result.data:
                raise Exception("No se pudo desactivar el usuario")
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error deactivating user {user_id}: {str(e)}")
            raise Exception(f"Error al desactivar usuario: {str(e)}")
    
    def activate_user(self, user_id: str) -> Dict:
        """
        Activar un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Dict con el usuario activado
        """
        try:
            result = self.supabase.table('users').update({
                'is_active': True,
                'updated_at': 'now()'
            }).eq('id', user_id).execute()
            
            if not result.data:
                raise Exception("No se pudo activar el usuario")
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error activating user {user_id}: {str(e)}")
            raise Exception(f"Error al activar usuario: {str(e)}")
    
    def get_user_stats(self) -> Dict:
        """
        Obtener estadísticas de usuarios
        
        Returns:
            Dict con las estadísticas de usuarios
        """
        try:
            # Obtener total de usuarios
            total_result = self.supabase.table('users').select('id', count='exact').execute()
            total_users = total_result.count if total_result.count else 0
            
            # Obtener usuarios activos
            active_result = self.supabase.table('users').select('id', count='exact').eq('is_active', True).execute()
            active_users = active_result.count if active_result.count else 0
            
            # Obtener usuarios por rol
            role_result = self.supabase.table('users').select('role').execute()
            role_counts = {}
            if role_result.data:
                for user in role_result.data:
                    role = user.get('role', 'user')
                    role_counts[role] = role_counts.get(role, 0) + 1
            
            return {
                'success': True,
                'data': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'inactive_users': total_users - active_users,
                    'role_counts': role_counts
                }
            }
        except Exception as e:
            logger.error(f"Error en get_user_stats: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_recent_users(self, limit: int = 5) -> List[Dict]:
        """
        Obtener usuarios recientes
        
        Args:
            limit: Número máximo de usuarios a retornar
            
        Returns:
            Lista de usuarios recientes
        """
        try:
            result = self.supabase.table('users').select('*').order('created_at', desc=True).limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error en get_recent_users: {str(e)}")
            return [] 