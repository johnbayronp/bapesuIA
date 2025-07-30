#!/usr/bin/env python3
"""
Script para probar específicamente la eliminación de productos
"""

import os
import sys
from dotenv import load_dotenv

# Agregar el directorio del servidor al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

load_dotenv()

from app.services.product_service import ProductService

def test_delete_product():
    """Probar la eliminación de productos"""
    try:
        product_service = ProductService()
        
        print("=== PRUEBA DE ELIMINACIÓN DE PRODUCTOS ===")
        
        # 1. Obtener productos existentes
        print("\n1. Obteniendo productos existentes...")
        try:
            result = product_service.supabase.table('products').select('*').limit(3).execute()
            products = result.data or []
            print(f"   Productos encontrados: {len(products)}")
            
            if products:
                for i, product in enumerate(products):
                    print(f"     {i+1}. ID: {product.get('id')}, Nombre: {product.get('name')}, Activo: {product.get('is_active')}")
            else:
                print("   No hay productos para probar")
                return
        except Exception as e:
            print(f"   ❌ Error al obtener productos: {str(e)}")
            return
        
        # 2. Crear un producto de prueba para eliminar
        print("\n2. Creando producto de prueba para eliminar...")
        test_product_data = {
            'name': 'Producto para Eliminar',
            'description': 'Producto creado para probar eliminación',
            'category': 'Test',
            'price': 99.99,
            'stock': 10,
            'status': 'Activo',
            'image_url': 'https://picsum.photos/200/300',
            'is_featured': False
        }
        
        try:
            created_product = product_service.create_product(test_product_data)
            print(f"   ✅ Producto creado con ID: {created_product.get('id')}")
            product_id = created_product.get('id')
        except Exception as e:
            print(f"   ❌ Error al crear producto de prueba: {str(e)}")
            return
        
        # 3. Probar eliminación soft delete
        print(f"\n3. Probando eliminación soft delete...")
        try:
            success = product_service.delete_product(str(product_id))
            if success:
                print(f"   ✅ Soft delete exitoso")
                
                # Verificar que el producto está marcado como inactivo
                check_result = product_service.supabase.table('products').select('*').eq('id', product_id).execute()
                if check_result.data:
                    product = check_result.data[0]
                    print(f"   Producto después de soft delete: Activo={product.get('is_active')}, Status={product.get('status')}")
                else:
                    print(f"   Producto no encontrado después de soft delete")
            else:
                print(f"   ❌ Soft delete falló")
        except Exception as e:
            print(f"   ❌ Error en soft delete: {str(e)}")
        
        # 4. Crear otro producto para hard delete
        print(f"\n4. Creando producto para hard delete...")
        test_product_data_2 = {
            'name': 'Producto para Hard Delete',
            'description': 'Producto creado para probar eliminación permanente',
            'category': 'Test',
            'price': 149.99,
            'stock': 5,
            'status': 'Activo',
            'image_url': 'https://picsum.photos/200/300',
            'is_featured': False
        }
        
        try:
            created_product_2 = product_service.create_product(test_product_data_2)
            print(f"   ✅ Producto creado con ID: {created_product_2.get('id')}")
            product_id_2 = created_product_2.get('id')
        except Exception as e:
            print(f"   ❌ Error al crear producto para hard delete: {str(e)}")
            return
        
        # 5. Probar eliminación hard delete
        print(f"\n5. Probando eliminación hard delete...")
        try:
            success = product_service.hard_delete_product(str(product_id_2))
            if success:
                print(f"   ✅ Hard delete exitoso")
                
                # Verificar que el producto fue eliminado permanentemente
                check_result = product_service.supabase.table('products').select('*').eq('id', product_id_2).execute()
                if check_result.data:
                    print(f"   ⚠️ Producto aún existe después de hard delete")
                else:
                    print(f"   ✅ Producto eliminado permanentemente")
            else:
                print(f"   ❌ Hard delete falló")
        except Exception as e:
            print(f"   ❌ Error en hard delete: {str(e)}")
        
        # 6. Verificar productos finales
        print(f"\n6. Verificando productos finales...")
        try:
            result = product_service.supabase.table('products').select('*').limit(5).execute()
            final_products = result.data or []
            print(f"   Productos totales: {len(final_products)}")
            
            for i, product in enumerate(final_products):
                print(f"     {i+1}. ID: {product.get('id')}, Nombre: {product.get('name')}, Activo: {product.get('is_active')}")
        except Exception as e:
            print(f"   ❌ Error al verificar productos finales: {str(e)}")
            
    except Exception as e:
        print(f"Error general en la prueba: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_delete_product() 