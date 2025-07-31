#!/usr/bin/env python3
"""
Script de prueba para verificar las órdenes del usuario
"""

import requests
import json
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
API_URL = "http://localhost:5000/api/v1"
TEST_TOKEN = "test_token"  # Token de prueba

def test_user_orders():
    """Probar el endpoint de órdenes del usuario"""
    
    print("=== Prueba de Órdenes del Usuario ===")
    
    # Probar endpoint de prueba
    print("\n1. Probando endpoint de prueba...")
    try:
        response = requests.get(
            f"{API_URL}/user/orders/test",
            headers={
                "Authorization": f"Bearer {TEST_TOKEN}",
                "Content-Type": "application/json"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Probar endpoint de estadísticas
    print("\n2. Probando endpoint de estadísticas...")
    try:
        response = requests.get(
            f"{API_URL}/user/stats",
            headers={
                "Authorization": f"Bearer {TEST_TOKEN}",
                "Content-Type": "application/json"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Probar endpoint de órdenes
    print("\n3. Probando endpoint de órdenes...")
    try:
        response = requests.get(
            f"{API_URL}/user/orders",
            headers={
                "Authorization": f"Bearer {TEST_TOKEN}",
                "Content-Type": "application/json"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_user_orders() 