#!/usr/bin/env python3
"""
Script de prueba para verificar la configuración de las tablas de órdenes
"""

import os
import sys
from dotenv import load_dotenv

# Agregar el directorio server al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from app.config import Config
from supabase import create_client

def test_orders_setup():
    """Verificar si las tablas de órdenes existen y están configuradas correctamente"""
    
    try:
        # Crear cliente de Supabase
        supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)
        
        print("🔍 Verificando configuración de tablas de órdenes...")
        
        # Verificar si la tabla orders existe
        try:
            result = supabase.table('orders').select('count', count='exact').execute()
            print(f"✅ Tabla 'orders' existe - Total de registros: {result.count}")
        except Exception as e:
            print(f"❌ Error al acceder a tabla 'orders': {e}")
            return False
        
        # Verificar si la tabla order_items existe
        try:
            result = supabase.table('order_items').select('count', count='exact').execute()
            print(f"✅ Tabla 'order_items' existe - Total de registros: {result.count}")
        except Exception as e:
            print(f"❌ Error al acceder a tabla 'order_items': {e}")
            return False
        
        # Verificar estructura de la tabla orders
        try:
            result = supabase.table('orders').select('*').limit(1).execute()
            if result.data:
                order = result.data[0]
                print(f"✅ Estructura de 'orders' válida - Columnas disponibles: {list(order.keys())}")
            else:
                print("✅ Tabla 'orders' vacía pero accesible")
        except Exception as e:
            print(f"❌ Error al verificar estructura de 'orders': {e}")
            return False
        
        # Verificar estructura de la tabla order_items
        try:
            result = supabase.table('order_items').select('*').limit(1).execute()
            if result.data:
                item = result.data[0]
                print(f"✅ Estructura de 'order_items' válida - Columnas disponibles: {list(item.keys())}")
            else:
                print("✅ Tabla 'order_items' vacía pero accesible")
        except Exception as e:
            print(f"❌ Error al verificar estructura de 'order_items': {e}")
            return False
        
        print("\n🎉 Todas las verificaciones pasaron exitosamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    load_dotenv()
    success = test_orders_setup()
    sys.exit(0 if success else 1) 