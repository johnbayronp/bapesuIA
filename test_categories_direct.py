#!/usr/bin/env python3
"""
Script para probar la tabla de categorías directamente en Supabase
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar definidos en el archivo .env")
    print(f"SUPABASE_URL: {'Definido' if supabase_url else 'No definido'}")
    print(f"SUPABASE_SERVICE_KEY: {'Definido' if supabase_key else 'No definido'}")
    sys.exit(1)

def test_categories_direct():
    """Test direct access to categories table"""
    print("Testing direct access to categories table...")
    
    try:
        # Crear cliente de Supabase
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Consultar categorías
        print("Querying categories table...")
        result = supabase.table('categories').select('*').execute()
        
        print(f"Response status: {result}")
        print(f"Number of categories found: {len(result.data)}")
        
        if result.data:
            print("\nCategories found:")
            for i, category in enumerate(result.data):
                print(f"  {i+1}. {category.get('name', 'N/A')} (ID: {category.get('id', 'N/A')})")
                print(f"      Active: {category.get('is_active', 'N/A')}")
                print(f"      Featured: {category.get('is_featured', 'N/A')}")
        else:
            print("No categories found in database")
            print("\nPossible issues:")
            print("1. The categories table doesn't exist")
            print("2. The setup_categories_table.sql script hasn't been executed")
            print("3. RLS policies are blocking access")
            
    except Exception as e:
        print(f"Error testing categories table: {e}")
        print(f"Error type: {type(e)}")

if __name__ == "__main__":
    test_categories_direct() 