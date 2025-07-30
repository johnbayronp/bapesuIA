#!/usr/bin/env python3
"""
Script para probar los endpoints de autenticación
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_auth_endpoints():
    """Probar endpoints de autenticación"""
    
    # Configuración
    base_url = "http://localhost:5000/api/v1"
    
    print("=== PRUEBA DE ENDPOINTS DE AUTENTICACIÓN ===")
    
    # 1. Probar endpoint sin autenticación
    print("\n1. Probando endpoint sin autenticación...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 2. Probar endpoint de productos sin autenticación
    print("\n2. Probando endpoint de productos sin autenticación...")
    try:
        response = requests.get(f"{base_url}/products")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 3. Probar endpoint de productos con token inválido
    print("\n3. Probando endpoint de productos con token inválido...")
    try:
        headers = {
            'Authorization': 'Bearer invalid_token_here',
            'Content-Type': 'application/json'
        }
        response = requests.get(f"{base_url}/products", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 4. Probar endpoint de test-auth
    print("\n4. Probando endpoint test-auth...")
    try:
        response = requests.get(f"{base_url}/test-auth")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 5. Probar endpoint de test-admin
    print("\n5. Probando endpoint test-admin...")
    try:
        response = requests.get(f"{base_url}/test-admin")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 6. Probar actualización de producto sin autenticación
    print("\n6. Probando actualización de producto sin autenticación...")
    try:
        update_data = {
            'name': 'Test Product',
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
    
    # 7. Probar eliminación de producto sin autenticación
    print("\n7. Probando eliminación de producto sin autenticación...")
    try:
        response = requests.delete(f"{base_url}/products/1001")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_auth_endpoints() 