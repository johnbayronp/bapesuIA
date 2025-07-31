import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno
load_dotenv()

# Configuración de Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def test_orders_direct():
    try:
        # Crear cliente de Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print("=== Verificando órdenes en la base de datos ===")
        
        # Obtener todas las órdenes
        result = supabase.table('orders').select('*').execute()
        
        print(f"Total de órdenes en la base de datos: {len(result.data)}")
        
        if result.data:
            print("\nPrimeras 5 órdenes:")
            for i, order in enumerate(result.data[:5]):
                print(f"Orden {i+1}:")
                print(f"  ID: {order.get('id')}")
                print(f"  User ID: {order.get('user_id')}")
                print(f"  Status: {order.get('status')}")
                print(f"  Created: {order.get('created_at')}")
                print(f"  Total: {order.get('total_amount')}")
                print()
        
        # Verificar si hay órdenes con user_id específico
        # Reemplaza 'tu-user-id' con el ID real del usuario
        user_id = "tu-user-id"  # Reemplaza con el ID real
        
        user_orders = supabase.table('orders').select('*').eq('user_id', user_id).execute()
        
        print(f"Órdenes para el usuario {user_id}: {len(user_orders.data)}")
        
        if user_orders.data:
            print("\nÓrdenes del usuario:")
            for order in user_orders.data:
                print(f"  ID: {order.get('id')}")
                print(f"  Status: {order.get('status')}")
                print(f"  Created: {order.get('created_at')}")
                print(f"  Total: {order.get('total_amount')}")
                print()
        
        # Verificar estructura de la tabla
        print("\n=== Verificando estructura de la tabla orders ===")
        try:
            # Intentar obtener una orden específica para ver la estructura
            if result.data:
                sample_order = result.data[0]
                print("Campos disponibles en la tabla orders:")
                for key in sample_order.keys():
                    print(f"  - {key}: {type(sample_order[key]).__name__}")
        except Exception as e:
            print(f"Error al verificar estructura: {e}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_orders_direct() 