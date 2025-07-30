#!/usr/bin/env python3
"""
Script para probar la configuración de categorías
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
API_URL = os.getenv('VITE_API_URL', 'http://localhost:5000/api')

def test_categories_table():
    """Probar que la tabla de categorías existe y tiene datos"""
    print("=== Probando tabla de categorías ===")
    
    try:
        # Verificar que la tabla existe
        response = requests.get(f"{API_URL}/categories", headers={
            'Authorization': f'Bearer {SUPABASE_KEY}'
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Tabla de categorías accesible")
            print(f"📊 Categorías encontradas: {len(data.get('data', []))}")
            
            for cat in data.get('data', []):
                print(f"  - {cat.get('name')} (ID: {cat.get('id')})")
        else:
            print(f"❌ Error al acceder a categorías: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_category_crud():
    """Probar operaciones CRUD de categorías"""
    print("\n=== Probando operaciones CRUD de categorías ===")
    
    # Crear categoría de prueba
    test_category = {
        'name': 'Categoría de Prueba',
        'description': 'Descripción de prueba',
        'color': '#FF6B6B',
        'icon': 'TestIcon',
        'is_featured': False,
        'is_active': True
    }
    
    try:
        # Crear categoría
        response = requests.post(f"{API_URL}/categories", 
                               json=test_category,
                               headers={'Authorization': f'Bearer {SUPABASE_KEY}'})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                category_id = data['data']['id']
                print(f"✅ Categoría creada: {data['data']['name']} (ID: {category_id})")
                
                # Actualizar categoría
                update_data = {**test_category, 'name': 'Categoría Actualizada'}
                response = requests.put(f"{API_URL}/categories/{category_id}",
                                     json=update_data,
                                     headers={'Authorization': f'Bearer {SUPABASE_KEY}'})
                
                if response.status_code == 200:
                    print(f"✅ Categoría actualizada correctamente")
                else:
                    print(f"❌ Error al actualizar: {response.status_code}")
                
                # Eliminar categoría
                response = requests.delete(f"{API_URL}/categories/{category_id}",
                                        headers={'Authorization': f'Bearer {SUPABASE_KEY}'})
                
                if response.status_code == 200:
                    print(f"✅ Categoría eliminada correctamente")
                else:
                    print(f"❌ Error al eliminar: {response.status_code}")
            else:
                print(f"❌ Error al crear categoría: {data.get('error')}")
        else:
            print(f"❌ Error en la respuesta: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en operaciones CRUD: {str(e)}")

if __name__ == "__main__":
    print("🧪 Iniciando pruebas de categorías...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas")
        sys.exit(1)
    
    test_categories_table()
    test_category_crud()
    
    print("\n✅ Pruebas completadas") 