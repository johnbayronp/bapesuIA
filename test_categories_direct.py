#!/usr/bin/env python3
"""
Script para probar la tabla de categorías directamente en Supabase
"""
import os
import sys
from supabase import create_client, Client

def test_categories_direct():
    """Probar la tabla de categorías directamente en Supabase"""
    print("=== Probando tabla de categorías directamente ===")
    
    # Configuración de Supabase (necesitarás actualizar estos valores)
    SUPABASE_URL = "https://tu-proyecto.supabase.co"  # Actualiza con tu URL
    SUPABASE_KEY = "tu-service-role-key"  # Actualiza con tu service role key
    
    try:
        # Crear cliente de Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Verificar que la tabla existe
        print("🔍 Verificando tabla de categorías...")
        
        # Intentar obtener categorías
        result = supabase.table('categories').select('*').execute()
        
        if result.data:
            print(f"✅ Tabla de categorías accesible")
            print(f"📊 Categorías encontradas: {len(result.data)}")
            
            for cat in result.data:
                print(f"  - {cat.get('name')} (ID: {cat.get('id')})")
        else:
            print("⚠️  No se encontraron categorías en la tabla")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Para usar este script:")
        print("1. Actualiza SUPABASE_URL con tu URL de Supabase")
        print("2. Actualiza SUPABASE_KEY con tu service role key")
        print("3. Ejecuta el script setup_categories_table.sql en Supabase SQL Editor")

def create_test_categories():
    """Crear categorías de prueba"""
    print("\n=== Creando categorías de prueba ===")
    
    # Configuración de Supabase (necesitarás actualizar estos valores)
    SUPABASE_URL = "https://tu-proyecto.supabase.co"  # Actualiza con tu URL
    SUPABASE_KEY = "tu-service-role-key"  # Actualiza con tu service role key
    
    test_categories = [
        {
            'name': 'Electrónicos',
            'description': 'Productos electrónicos y tecnología',
            'icon': 'DevicePhoneMobileIcon',
            'color': '#3B82F6',
            'is_featured': True,
            'is_active': True,
            'sort_order': 1
        },
        {
            'name': 'Ropa',
            'description': 'Ropa y accesorios de vestir',
            'icon': 'ShoppingBagIcon',
            'color': '#EF4444',
            'is_featured': True,
            'is_active': True,
            'sort_order': 2
        },
        {
            'name': 'Hogar',
            'description': 'Productos para el hogar y decoración',
            'icon': 'HomeIcon',
            'color': '#10B981',
            'is_featured': True,
            'is_active': True,
            'sort_order': 3
        }
    ]
    
    try:
        # Crear cliente de Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        for category in test_categories:
            result = supabase.table('categories').insert(category).execute()
            if result.data:
                print(f"✅ Categoría creada: {category['name']}")
            else:
                print(f"❌ Error al crear categoría: {category['name']}")
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Para usar este script:")
        print("1. Actualiza SUPABASE_URL con tu URL de Supabase")
        print("2. Actualiza SUPABASE_KEY con tu service role key")

if __name__ == "__main__":
    print("🧪 Iniciando pruebas directas de categorías...")
    print("⚠️  IMPORTANTE: Actualiza las variables SUPABASE_URL y SUPABASE_KEY en el script antes de ejecutar")
    
    test_categories_direct()
    # create_test_categories()  # Descomenta para crear categorías de prueba
    
    print("\n✅ Pruebas completadas")
    print("\n📝 Pasos para configurar categorías:")
    print("1. Ve a Supabase SQL Editor")
    print("2. Ejecuta el script database/setup_categories_table.sql")
    print("3. Verifica que la tabla se creó correctamente")
    print("4. Actualiza las variables en este script y ejecútalo para probar") 