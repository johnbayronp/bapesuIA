import requests
import json

# Configuración
BASE_URL = "http://localhost:5000/api/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM1NzI4MDAwLCJpYXQiOjE3MzU3MjQ0MDAsImlzcyI6Imh0dHBzOi8vcnV0aHl1bWJ1bWJ1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6IjE5YzFhNzE5LTM5ZDAtNDM5Ny1hNzE5LTM5ZDAtNDM5NyJ9.test_signature"

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

def test_endpoints():
    """Probar los endpoints de órdenes de usuario"""
    
    print("=== PRUEBA DE ENDPOINTS DE ÓRDENES DE USUARIO ===\n")
    
    # 1. Probar endpoint de prueba de autenticación
    print("1. Probando endpoint de prueba de autenticación...")
    try:
        response = requests.get(f"{BASE_URL}/test-auth", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()
    
    # 2. Probar endpoint de prueba de órdenes de usuario
    print("2. Probando endpoint de prueba de órdenes de usuario...")
    try:
        response = requests.get(f"{BASE_URL}/user/orders/test", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()
    
    # 3. Probar endpoint principal de órdenes de usuario
    print("3. Probando endpoint principal de órdenes de usuario...")
    try:
        response = requests.get(f"{BASE_URL}/user/orders", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()
    
    # 4. Probar endpoint de estadísticas de usuario
    print("4. Probando endpoint de estadísticas de usuario...")
    try:
        response = requests.get(f"{BASE_URL}/user/stats", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()

if __name__ == "__main__":
    test_endpoints() 