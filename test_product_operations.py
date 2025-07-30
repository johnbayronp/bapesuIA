#!/usr/bin/env python3
"""
Script de prueba específico para diagnosticar problemas con operaciones CRUD de productos
"""

import os
import sys
from dotenv import load_dotenv

# Agregar el directorio del servidor al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

load_dotenv()

from app.services.product_service import ProductService

def test_product_operations():
    """Probar todas las operaciones CRUD de productos"""
    try:
        product_service = ProductService()
        
        print("=== PRUEBA DE OPERACIONES CRUD DE PRODUCTOS ===")
        
        # 1. Obtener productos existentes
        print("\n1. Obteniendo productos existentes...")
        try:
            result = product_service.supabase.table('products').select('*').limit(3).execute()
            products = result.data or []
            print(f"   Productos encontrados: {len(products)}")
            
            if products:
                for i, product in enumerate(products):
                    print(f"     {i+1}. ID: {product.get('id')}, Nombre: {product.get('name')}")
            else:
                print("   No hay productos para probar")
                return
        except Exception as e:
            print(f"   ❌ Error al obtener productos: {str(e)}")
            return
        
        # 2. Probar actualización directa con Supabase
        if products:
            test_product = products[0]
            product_id = test_product.get('id')
            
            print(f"\n2. Probando actualización directa con Supabase...")
            print(f"   Producto: ID {product_id}, Nombre: {test_product.get('name')}")
            
            try:
                # Actualización directa sin usar el servicio
                update_data = {
                    'name': f"{test_product.get('name')} - TEST UPDATE",
                    'description': 'Descripción de prueba actualizada'
                }
                
                print(f"   Datos de actualización: {update_data}")
                
                result = product_service.supabase.table('products').update(update_data).eq('id', product_id).execute()
                
                print(f"   Resultado directo: {result.data}")
                print(f"   Filas afectadas: {len(result.data) if result.data else 0}")
                
                if result.data and len(result.data) > 0:
                    print(f"   ✅ Actualización directa exitosa")
                else:
                    print(f"   ❌ Actualización directa falló")
                    
            except Exception as e:
                print(f"   ❌ Error en actualización directa: {str(e)}")
        
        # 3. Probar eliminación directa con Supabase
        if products:
            test_product = products[0]
            product_id = test_product.get('id')
            
            print(f"\n3. Probando eliminación directa con Supabase...")
            print(f"   Producto: ID {product_id}, Nombre: {test_product.get('name')}")
            
            try:
                # Eliminación directa sin usar el servicio
                result = product_service.supabase.table('products').delete().eq('id', product_id).execute()
                
                print(f"   Resultado eliminación: {result.data}")
                print(f"   Filas eliminadas: {len(result.data) if result.data else 0}")
                
                if result.data and len(result.data) > 0:
                    print(f"   ✅ Eliminación directa exitosa")
                else:
                    print(f"   ❌ Eliminación directa falló")
                    
            except Exception as e:
                print(f"   ❌ Error en eliminación directa: {str(e)}")
        
        # 4. Probar operaciones usando el servicio
        print(f"\n4. Probando operaciones usando el servicio...")
        
        # Crear un producto de prueba
        test_product_data = {
            'name': 'Producto de Prueba',
            'description': 'Producto creado para pruebas',
            'category': 'Test',
            'price': 99.99,
            'stock': 10,
            'status': 'Activo',
            'image_url': 'https://picsum.photos/200/300',
            'is_featured': False
        }
        
        try:
            print(f"   Creando producto de prueba...")
            created_product = product_service.create_product(test_product_data)
            print(f"   ✅ Producto creado con ID: {created_product.get('id')}")
            
            # Actualizar el producto creado
            update_data = {
                'name': 'Producto de Prueba - ACTUALIZADO',
                'description': 'Descripción actualizada',
                'price': 149.99
            }
            
            print(f"   Actualizando producto...")
            updated_product = product_service.update_product(str(created_product.get('id')), update_data)
            print(f"   ✅ Producto actualizado: {updated_product.get('name')}")
            
            # Eliminar el producto
            print(f"   Eliminando producto...")
            delete_success = product_service.delete_product(str(created_product.get('id')))
            if delete_success:
                print(f"   ✅ Producto eliminado exitosamente")
            else:
                print(f"   ❌ Error al eliminar producto")
                
        except Exception as e:
            print(f"   ❌ Error en operaciones del servicio: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # 5. Verificar políticas RLS
        print(f"\n5. Verificando políticas RLS...")
        try:
            # Intentar obtener información sobre las políticas
            result = product_service.supabase.rpc('get_policies', {'table_name': 'products'}).execute()
            print(f"   Políticas encontradas: {result.data}")
        except Exception as e:
            print(f"   ⚠️ No se pudieron verificar políticas: {str(e)}")
            
    except Exception as e:
        print(f"Error general en la prueba: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_product_operations() 