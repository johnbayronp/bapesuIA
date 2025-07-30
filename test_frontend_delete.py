#!/usr/bin/env python3
"""
Script para probar la eliminación desde el punto de vista del frontend
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_frontend_delete():
    """Probar la eliminación como la usaría el frontend"""
    
    # Configuración
    base_url = "http://localhost:5000/api/v1"
    
    print("=== PRUEBA DE ELIMINACIÓN PARA FRONTEND ===")
    
    # 1. Probar eliminación sin autenticación
    print("\n1. Probando eliminación sin autenticación...")
    try:
        response = requests.delete(f"{base_url}/products/1001")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 2. Probar eliminación con token inválido
    print("\n2. Probando eliminación con token inválido...")
    try:
        headers = {
            'Authorization': 'Bearer invalid_token_here',
            'Content-Type': 'application/json'
        }
        response = requests.delete(f"{base_url}/products/1001", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # 3. Probar hard delete sin autenticación
    print("\n3. Probando hard delete sin autenticación...")
    try:
        response = requests.delete(f"{base_url}/products/1001/hard-delete")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_frontend_delete() 