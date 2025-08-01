#!/usr/bin/env python3
"""
Script para probar el endpoint de refresh metrics
"""

import requests
import time
import json

def test_refresh_metrics_endpoint():
    """Probar el endpoint de refresh metrics"""
    
    # URL del endpoint
    url = "http://localhost:5000/api/v1/admin/analytics/refresh-metrics"
    
    # Headers (sin token real para esta prueba)
    headers = {
        'Content-Type': 'application/json'
    }
    
    print("=== PROBANDO ENDPOINT DE REFRESH METRICS ===")
    print(f"URL: {url}")
    print(f"Headers: {headers}")
    
    try:
        # Hacer la petición POST
        print("\nEnviando petición POST...")
        response = requests.post(url, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        # Intentar parsear la respuesta como JSON
        try:
            response_json = response.json()
            print(f"Response JSON: {json.dumps(response_json, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("ERROR: No se pudo conectar al servidor")
        print("Asegúrate de que el servidor Flask esté corriendo en http://localhost:5000")
    except requests.exceptions.Timeout:
        print("ERROR: Timeout en la petición")
    except Exception as e:
        print(f"ERROR: {str(e)}")

def wait_for_server():
    """Esperar a que el servidor esté disponible"""
    print("Esperando a que el servidor esté disponible...")
    
    for i in range(30):  # Esperar máximo 30 segundos
        try:
            response = requests.get("http://localhost:5000/api/v1/health", timeout=5)
            if response.status_code == 200:
                print("✓ Servidor disponible")
                return True
        except:
            pass
        
        print(f"Intento {i+1}/30...")
        time.sleep(1)
    
    print("✗ Servidor no disponible después de 30 segundos")
    return False

if __name__ == "__main__":
    # Esperar a que el servidor esté listo
    if wait_for_server():
        test_refresh_metrics_endpoint()
    else:
        print("No se pudo conectar al servidor. Asegúrate de que esté corriendo.") 