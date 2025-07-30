#!/usr/bin/env python3
"""
Script para probar la API desde el punto de vista del frontend
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_frontend_api():
    """Probar la API como la usaría el frontend"""
    
    # Configuración
    base_url = "http://localhost:5000/api/v1"
    
    print("=== PRUEBA DE API PARA FRONTEND ===")
    
    # 1. Probar endpoint de productos con parámetros como el frontend
    print("\n1. Probando endpoint de productos con parámetros...")
    try:
        # Simular la petición del frontend
        url = f"{base_url}/products?page=1&per_page=10"
        print(f"   URL: {url}")
        
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response structure: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            if 'data' in data:
                print(f"   Data structure: {list(data['data'].keys()) if isinstance(data['data'], dict) else 'Not a dict'}")
                
                if 'data' in data['data']:
                    products = data['data']['data']
                    print(f"   Products count: {len(products) if isinstance(products, list) else 'Not a list'}")
                    
                    if isinstance(products, list) and len(products) > 0:
                        print(f"   First product: {products[0]}")
                    else:
                        print(f"   Products: {products}")
                else:
                    print(f"   Data content: {data['data']}")
            else:
                print(f"   Full response: {data}")
        else:
            print(f"   Error response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 2. Probar endpoint de categorías
    print("\n2. Probando endpoint de categorías...")
    try:
        response = requests.get(f"{base_url}/products/categories")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
        else:
            print(f"   Error response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 3. Probar endpoint de estadísticas
    print("\n3. Probando endpoint de estadísticas...")
    try:
        response = requests.get(f"{base_url}/products/stats")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
        else:
            print(f"   Error response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 4. Probar actualización de producto (sin token)
    print("\n4. Probando actualización de producto sin token...")
    try:
        update_data = {
            'name': 'Test Product Update',
            'description': 'Test Description',
            'price': 99.99
        }
        
        response = requests.put(
            f"{base_url}/products/1001",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(update_data)
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_frontend_api() 