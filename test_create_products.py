#!/usr/bin/env python3
"""
Script para verificar la tabla de productos y crear productos de prueba
"""

import os
import sys
from dotenv import load_dotenv

# Agregar el directorio del servidor al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

load_dotenv()

from app.services.product_service import ProductService

def test_create_products():
    """Crear productos de prueba"""
    try:
        product_service = ProductService()
        
        print("=== VERIFICACIÓN Y CREACIÓN DE PRODUCTOS ===")
        
        # 1. Verificar si la tabla existe
        print("\n1. Verificando tabla de productos...")
        try:
            result = product_service.supabase.table('products').select('count').execute()
            print(f"   ✅ Tabla products existe")
        except Exception as e:
            print(f"   ❌ Error al acceder a la tabla: {str(e)}")
            return
        
        # 2. Verificar productos existentes
        print("\n2. Verificando productos existentes...")
        try:
            result = product_service.supabase.table('products').select('*').limit(5).execute()
            existing_products = result.data or []
            print(f"   Productos existentes: {len(existing_products)}")
            
            if existing_products:
                for i, product in enumerate(existing_products):
                    print(f"     {i+1}. ID: {product.get('id')}, Nombre: {product.get('name')}")
            else:
                print("   No hay productos en la tabla")
        except Exception as e:
            print(f"   ❌ Error al verificar productos: {str(e)}")
            return
        
        # 3. Crear productos de prueba si no hay ninguno
        if not existing_products:
            print("\n3. Creando productos de prueba...")
            
            test_products = [
                {
                    'name': 'Laptop Gaming Pro',
                    'description': 'Laptop de alto rendimiento para gaming',
                    'category': 'Electrónicos',
                    'price': 1299.99,
                    'stock': 15,
                    'status': 'Activo',
                    'image_url': 'https://picsum.photos/200/300',
                    'is_featured': True
                },
                {
                    'name': 'Camiseta Básica',
                    'description': 'Camiseta de algodón 100%',
                    'category': 'Ropa',
                    'price': 29.99,
                    'stock': 50,
                    'status': 'Activo',
                    'image_url': 'https://picsum.photos/200/300',
                    'is_featured': False
                },
                {
                    'name': 'Sofá Moderno',
                    'description': 'Sofá elegante para sala de estar',
                    'category': 'Hogar',
                    'price': 899.50,
                    'stock': 8,
                    'status': 'Activo',
                    'image_url': 'https://picsum.photos/200/300',
                    'is_featured': True
                }
            ]
            
            for i, product_data in enumerate(test_products):
                try:
                    print(f"   Creando producto {i+1}: {product_data['name']}")
                    created_product = product_service.create_product(product_data)
                    print(f"   ✅ Creado con ID: {created_product.get('id')}")
                except Exception as e:
                    print(f"   ❌ Error al crear producto {i+1}: {str(e)}")
        
        # 4. Verificar productos después de la creación
        print("\n4. Verificando productos después de la creación...")
        try:
            result = product_service.supabase.table('products').select('*').limit(5).execute()
            final_products = result.data or []
            print(f"   Productos totales: {len(final_products)}")
            
            for i, product in enumerate(final_products):
                print(f"     {i+1}. ID: {product.get('id')}, Nombre: {product.get('name')}, Precio: {product.get('price')}")
        except Exception as e:
            print(f"   ❌ Error al verificar productos finales: {str(e)}")
            
    except Exception as e:
        print(f"Error general en la prueba: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_create_products() 