#!/usr/bin/env python3
"""
Script de prueba para verificar la actualización de productos
"""

import os
import sys
import requests
import json

# Agregar el directorio del servidor al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from app.services.product_service import ProductService

def test_product_service():
    """Probar el servicio de productos directamente"""
    print("=== Probando ProductService ===")
    
    try:
        product_service = ProductService()
        
        # 1. Obtener todos los productos
        print("\n1. Obteniendo productos...")
        products = product_service.get_products(page=1, per_page=5)
        print(f"Productos encontrados: {len(products['products'])}")
        
        if products['products']:
            # 2. Obtener el primer producto
            first_product = products['products'][0]
            product_id = first_product['id']
            print(f"\n2. Producto a actualizar: {first_product['name']} (ID: {product_id})")
            
            # 3. Actualizar el producto
            update_data = {
                'name': f"{first_product['name']} - Actualizado",
                'price': float(first_product['price']) + 1.0,
                'stock': int(first_product['stock']) + 1
            }
            
            print(f"\n3. Datos de actualización: {update_data}")
            
            updated_product = product_service.update_product(str(product_id), update_data)
            print(f"\n4. Producto actualizado: {updated_product}")
            
            return True
        else:
            print("No hay productos para probar")
            return False
            
    except Exception as e:
        print(f"Error en la prueba: {str(e)}")
        return False

def test_api_endpoint():
    """Probar el endpoint de la API"""
    print("\n=== Probando API Endpoint ===")
    
    try:
        # URL base (ajusta según tu configuración)
        base_url = "http://localhost:5000/api/v1"
        
        # 1. Obtener productos
        print("\n1. Obteniendo productos...")
        response = requests.get(f"{base_url}/products")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Productos: {len(data.get('data', {}).get('products', []))}")
            
            if data.get('data', {}).get('products'):
                first_product = data['data']['products'][0]
                product_id = first_product['id']
                
                # 2. Actualizar producto
                update_data = {
                    'name': f"{first_product['name']} - API Test",
                    'price': float(first_product['price']) + 2.0
                }
                
                print(f"\n2. Actualizando producto {product_id}...")
                update_response = requests.put(
                    f"{base_url}/products/{product_id}",
                    json=update_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                print(f"Update Status: {update_response.status_code}")
                print(f"Update Response: {update_response.text}")
                
                return True
        else:
            print(f"Error obteniendo productos: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error en la prueba de API: {str(e)}")
        return False

if __name__ == "__main__":
    print("Iniciando pruebas de actualización de productos...")
    
    # Probar servicio directamente
    service_result = test_product_service()
    
    # Probar API endpoint
    api_result = test_api_endpoint()
    
    print(f"\n=== Resultados ===")
    print(f"Servicio directo: {'✅ OK' if service_result else '❌ Error'}")
    print(f"API endpoint: {'✅ OK' if api_result else '❌ Error'}")
    
    if service_result and api_result:
        print("\n🎉 Todas las pruebas pasaron!")
    else:
        print("\n⚠️  Algunas pruebas fallaron. Revisa los logs arriba.") 