#!/usr/bin/env python3
"""
Script de prueba para diagnosticar problemas con la actualización de productos
"""

import os
import sys
from dotenv import load_dotenv

# Agregar el directorio del servidor al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

load_dotenv()

from app.services.product_service import ProductService

def test_product_update():
    """Probar la actualización de productos"""
    try:
        product_service = ProductService()
        
        print("=== PRUEBA DE ACTUALIZACIÓN DE PRODUCTOS ===")
        
        # 1. Obtener todos los productos para ver qué hay
        print("\n1. Obteniendo todos los productos...")
        products_result = product_service.get_products(page=1, per_page=10)
        products = products_result.get('data', [])
        
        if not products:
            print("No hay productos en la base de datos")
            return
        
        print(f"Productos encontrados: {len(products)}")
        for i, product in enumerate(products[:3]):  # Mostrar solo los primeros 3
            print(f"  {i+1}. ID: {product.get('id')}, Nombre: {product.get('name')}")
        
        # 2. Intentar actualizar el primer producto
        if products:
            test_product = products[0]
            product_id = test_product.get('id')
            
            print(f"\n2. Intentando actualizar producto con ID: {product_id}")
            print(f"   Producto actual: {test_product.get('name')}")
            
            # Datos de prueba para actualización
            update_data = {
                'name': f"{test_product.get('name')} - ACTUALIZADO",
                'description': 'Descripción actualizada de prueba',
                'price': float(test_product.get('price', 0)) + 1.0,
                'stock': int(test_product.get('stock', 0)) + 1
            }
            
            print(f"   Datos de actualización: {update_data}")
            
            # Intentar actualizar
            try:
                updated_product = product_service.update_product(str(product_id), update_data)
                print(f"   ✅ Actualización exitosa: {updated_product.get('name')}")
            except Exception as e:
                print(f"   ❌ Error en actualización: {str(e)}")
        
        # 3. Verificar políticas RLS
        print("\n3. Verificando acceso a la tabla...")
        try:
            # Intentar obtener un producto específico
            if products:
                test_id = products[0].get('id')
                result = product_service.supabase.table('products').select('*').eq('id', test_id).execute()
                print(f"   ✅ Acceso de lectura OK: {len(result.data) if result.data else 0} productos encontrados")
            else:
                print("   ⚠️ No hay productos para probar acceso de lectura")
        except Exception as e:
            print(f"   ❌ Error de acceso de lectura: {str(e)}")
        
        # 4. Verificar estructura de la tabla
        print("\n4. Verificando estructura de la tabla...")
        try:
            # Intentar obtener información de la tabla
            result = product_service.supabase.table('products').select('id, name, price, stock').limit(1).execute()
            if result.data:
                sample_product = result.data[0]
                print(f"   ✅ Estructura OK - Campos disponibles: {list(sample_product.keys())}")
                print(f"   ✅ Tipos de datos - ID: {type(sample_product.get('id'))}, Price: {type(sample_product.get('price'))}")
            else:
                print("   ⚠️ No se pudieron obtener datos de la tabla")
        except Exception as e:
            print(f"   ❌ Error al verificar estructura: {str(e)}")
            
    except Exception as e:
        print(f"Error general en la prueba: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_product_update() 