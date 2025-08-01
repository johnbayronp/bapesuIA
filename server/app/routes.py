from flask import jsonify, abort, request, send_file, Blueprint
import requests
from rembg import remove
from PIL import Image
import io
from app.config import Config
from .services.gemini_service import GeminiService
from .services.user_service import UserService
from .services.product_service import ProductService
from .services.category_service import CategoryService
from .services.order_service import OrderService
from .services.product_rating_service import ProductRatingService
from .middleware.auth import token_required, admin_required
import qrcode
from datetime import datetime


api_bp = Blueprint('/api/v1', __name__)

@api_bp.route('/')
def hello():
    try:
        return jsonify(message="Running API - Bapesu IA | V1 | By John perez | 2025")
    except Exception as e:
        abort(500, description=str(e))

@api_bp.route('/test-auth', methods=['GET', 'OPTIONS'])
@token_required
def test_auth():
    """Endpoint de prueba para verificar autenticación"""
    try:
        return jsonify({
            'success': True,
            'message': 'Autenticación exitosa',
            'user': request.user
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/test-admin', methods=['GET', 'OPTIONS'])
@admin_required
def test_admin():
    """Endpoint de prueba para verificar rol de administrador"""
    try:
        return jsonify({
            'success': True,
            'message': 'Acceso de administrador exitoso',
            'user': request.user,
            'admin_user': request.admin_user
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/test-users-table', methods=['GET', 'OPTIONS'])
@token_required
def test_users_table():
    """Endpoint de prueba para verificar acceso a la tabla users"""
    try:
        from .services.user_service import UserService
        
        # Crear instancia del servicio
        user_service = UserService()
        
        # Intentar obtener todos los usuarios sin paginación
        result = user_service.supabase.table('users').select('*').execute()
        
        return jsonify({
            'success': True,
            'message': 'Acceso a tabla users exitoso',
            'total_users': len(result.data) if result.data else 0,
            'sample_data': result.data[:3] if result.data else [],  # Primeros 3 usuarios como muestra
            'raw_result': str(result)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500


@api_bp.route('/tools/remove-background', methods=['POST','OPTIONS'])
@token_required
def remove_background():
    if request.method == 'OPTIONS' :
       response = jsonify(message='OPTIONS request received' )
       response.headers.add("Access-Control-Allow-Origin", "*")
       response.headers.add("Access-Control-Allow-Headers", "*")
       response.headers.add("Access-Control-Allow-Methods", "*")
       return response, 200

    if 'image' not in request.files:
        return 'No image uploaded', 400

    file = request.files['image']
    if file.filename == '':
        return 'No selected file', 400

    # Leer la imagen
    input_image = Image.open(file.stream)
    
    # Remover el fondo
    output_image = remove(input_image)
    
    # Convertir la imagen procesada a bytes
    img_io = io.BytesIO()
    output_image.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')


@api_bp.route('/tools/generate-description', methods=['POST','OPTIONS'])
@token_required
def generate_description():

    if request.method == 'OPTIONS' :
       response = jsonify(message='OPTIONS request received' )
       response.headers.add("Access-Control-Allow-Origin", "*")
       response.headers.add("Access-Control-Allow-Headers", "*")
       response.headers.add("Access-Control-Allow-Methods", "*")
       return response, 200

    try:
        data = request.json
        # Validar datos requeridos
        required_fields = ['name', 'category', 'features', 'targetAudience', 'tone']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo requerido faltante: {field}'}), 400

        # Construir el prompt para DeepSeek
        prompt = f"""
            Redacta una descripción profesional en español (60-100 palabras) para el siguiente producto o servicio:

            - Nombre: {data['name']}
            - Categoría: {data['category']}
            - Características: {data['features']}
            - Público objetivo: {data['targetAudience']}
            - Tono: {data['tone']}

            Instrucciones:
            - Sé persuasivo y enfocado en ventas.
            - Adapta el texto al tono y público especificado.
            - Destaca las características principales con claridad.
            - Usa lenguaje profesional, evita repeticiones y frases genéricas.
            - La descripción debe estar completa y finalizar con un punto.
            - No incluyas explicaciones ni encabezados, solo la descripción.
            """

        # Configurar la llamada a la API de DeepSeek
        headers = {
            "Authorization": f"Bearer {Config.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": Config.DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": "Eres un experto en marketing y copywriting."},
                {"role": "user", "content": prompt}
            ],
            "temperature": Config.DEEPSEEK_TEMPERATURE,
            "max_tokens": Config.DEEPSEEK_MAX_TOKENS
        }

        # Realizar la llamada a la API
        response = requests.post(Config.DEEPSEEK_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        # Extraer la descripción generada
        generated_text = response.json()['choices'][0]['message']['content']
        
        return jsonify({
            'description': generated_text,
            'status': 'success'
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Error al comunicarse con el servicio de Bapesu IA',
            'details': str(e)
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Error al procesar la solicitud',
            'details': str(e)
        }), 500


@api_bp.route('/tools/generate-things-videos', methods=['POST','OPTIONS'])
@token_required
def generate_ideas_videos():
    if request.method == 'OPTIONS' :
       response = jsonify(message='OPTIONS request received' )
       response.headers.add("Access-Control-Allow-Origin", "*")
       response.headers.add("Access-Control-Allow-Headers", "*")
       response.headers.add("Access-Control-Allow-Methods", "*")
       return response, 200
    
    data = request.json
    # Validar datos api
    required_fields = ['prompt']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo requerido faltante: {field}'}), 400
        
    # Crear un servicio externo para agregar la logica 
    iaGemini = GeminiService()
    
    response = iaGemini.generate_ideas_videos(data['prompt'])

    return jsonify(response),200

@api_bp.route('/tools/qr_generator', methods=['POST', 'OPTIONS'])
@token_required
def qr_generator():
    if request.method == 'OPTIONS':
        response = jsonify(message='OPTIONS request received')
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response, 200

    try:
        data = request.json

        # Validar entrada
        if 'content' not in data or not data['content'].strip():
            return jsonify({'error': 'No se proporcionó el contenido para el código QR'}), 400

        import qrcode
        import io
        from flask import send_file

        qr = qrcode.make(data['content'])

        img_io = io.BytesIO()
        qr.save(img_io, 'PNG')
        img_io.seek(0)

        return send_file(img_io, mimetype='image/png')

    except Exception as e:
        return jsonify({
            'error': 'Error al generar el código QR',
            'details': str(e)
        }), 500

# ============================================================================
# RUTAS CRUD PARA USUARIOS (Solo administradores)
# ============================================================================

@api_bp.route('/users', methods=['GET', 'OPTIONS'])
@admin_required
def get_users():
    """
    Obtener lista de usuarios con paginación y filtros
    
    Query Parameters:
    - page: Número de página (default: 1)
    - per_page: Elementos por página (default: 10)
    - status: Filtro por estado (all, Activo, Inactivo)
    - role: Filtro por rol (all, customer, admin, vendor)
    - search: Término de búsqueda
    """
    try:
        # Obtener parámetros de query
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status', 'all')
        role = request.args.get('role', 'all')
        search = request.args.get('search', '')
        
        # Validar parámetros
        if page < 1:
            return jsonify({'error': 'La página debe ser mayor a 0'}), 400
        
        if per_page < 1 or per_page > 100:
            return jsonify({'error': 'Elementos por página debe estar entre 1 y 100'}), 400
        
        # Construir filtros
        filters = {}
        if status != 'all':
            filters['status'] = status
        if role != 'all':
            filters['role'] = role
        if search:
            filters['search'] = search
        
        # Obtener usuarios
        user_service = UserService()
        result = user_service.get_users(page=page, per_page=per_page, filters=filters)
        
        return jsonify({
            'success': True,
            'data': result['users'],
            'pagination': {
                'page': result['page'],
                'per_page': result['per_page'],
                'total': result['total'],
                'total_pages': result['total_pages']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/users/<user_id>', methods=['GET', 'OPTIONS'])
@admin_required
def get_user(user_id):
    """
    Obtener un usuario específico por ID
    """
    try:
        user_service = UserService()
        user = user_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/users', methods=['POST', 'OPTIONS'])
@admin_required
def create_user():
    """
    Crear un nuevo usuario
    
    Body:
    {
        "email": "usuario@ejemplo.com",
        "first_name": "Nombre",
        "last_name": "Apellido",
        "role": "customer",
        "is_active": true
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos requeridos'
            }), 400
        
        # Validar campos requeridos
        required_fields = ['email', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        user_service = UserService()
        new_user = user_service.create_user(data)
        
        return jsonify({
            'success': True,
            'data': new_user,
            'message': 'Usuario creado exitosamente'
        }), 201
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/users/<user_id>', methods=['PUT', 'OPTIONS'])
@admin_required
def update_user(user_id):
    """
    Actualizar un usuario existente
    
    Body:
    {
        "email": "usuario@ejemplo.com",
        "first_name": "Nombre",
        "last_name": "Apellido",
        "role": "customer",
        "is_active": true
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos requeridos'
            }), 400
        
        # Validar campos requeridos
        required_fields = ['email', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        user_service = UserService()
        
        # Verificar que el usuario existe
        existing_user = user_service.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        updated_user = user_service.update_user(user_id, data)
        
        return jsonify({
            'success': True,
            'data': updated_user,
            'message': 'Usuario actualizado exitosamente'
        }), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/users/<user_id>', methods=['DELETE', 'OPTIONS'])
@admin_required
def delete_user(user_id):
    """
    Eliminar un usuario (eliminación completa de BD y auth)
    """
    try:
        user_service = UserService()
        
        # Verificar que el usuario existe
        existing_user = user_service.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        # Eliminar usuario
        user_service.delete_user(user_id)
        
        return jsonify({
            'success': True,
            'message': 'Usuario eliminado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/users/<user_id>/deactivate', methods=['PATCH', 'OPTIONS'])
@admin_required
def deactivate_user(user_id):
    """
    Desactivar un usuario (soft delete)
    """
    try:
        user_service = UserService()
        
        # Verificar que el usuario existe
        existing_user = user_service.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        # Desactivar usuario
        deactivated_user = user_service.deactivate_user(user_id)
        
        return jsonify({
            'success': True,
            'data': deactivated_user,
            'message': 'Usuario desactivado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/users/<user_id>/activate', methods=['PATCH', 'OPTIONS'])
@admin_required
def activate_user(user_id):
    """
    Activar un usuario
    """
    try:
        user_service = UserService()
        
        # Verificar que el usuario existe
        existing_user = user_service.get_user_by_id(user_id)
        if not existing_user:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        # Activar usuario
        activated_user = user_service.activate_user(user_id)
        
        return jsonify({
            'success': True,
            'data': activated_user,
            'message': 'Usuario activado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e) 
        }), 500


@api_bp.route('/users/stats', methods=['GET', 'OPTIONS'])
@admin_required
def get_user_stats():
    """
    Obtener estadísticas de usuarios
    """
    try:
        user_service = UserService()
        stats = user_service.get_user_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== RUTAS DE PRODUCTOS ====================

@api_bp.route('/products', methods=['GET', 'OPTIONS'])
def get_products():
    """
    Obtener productos con paginación y filtros
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        
        # Obtener parámetros de consulta
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Obtener filtros
        filters = {}
        if request.args.get('category'):
            filters['category'] = request.args.get('category')
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        if request.args.get('min_price'):
            filters['min_price'] = request.args.get('min_price')
        if request.args.get('max_price'):
            filters['max_price'] = request.args.get('max_price')
        if request.args.get('featured') is not None:
            filters['featured'] = request.args.get('featured').lower() == 'true'
        if request.args.get('in_stock') is not None:
            filters['in_stock'] = request.args.get('in_stock').lower() == 'true'
        
        # Obtener productos
        result = product_service.get_products(page=page, per_page=per_page, filters=filters)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/<product_id>', methods=['GET', 'OPTIONS'])
def get_product(product_id):
    """
    Obtener un producto específico por ID
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        product = product_service.get_product_by_id(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': product
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products', methods=['POST', 'OPTIONS'])
@admin_required
def create_product():
    """
    Crear un nuevo producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        
        # Obtener datos del request
        product_data = request.get_json()
        
        if not product_data:
            return jsonify({
                'success': False,
                'error': 'Datos del producto requeridos'
            }), 400
        
        # Crear producto
        new_product = product_service.create_product(product_data)
        
        return jsonify({
            'success': True,
            'data': new_product,
            'message': 'Producto creado exitosamente'
        }), 201
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/<product_id>', methods=['PUT', 'OPTIONS'])
@admin_required
def update_product(product_id):
    """
    Actualizar un producto existente
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        print(f"=== DEBUG: Endpoint update_product llamado ===")
        print(f"Product ID: {product_id}")
        print(f"Request data: {request.get_json()}")
        
        product_service = ProductService()
        
        # Obtener datos del request
        product_data = request.get_json()
        
        if not product_data:
            return jsonify({
                'success': False,
                'error': 'Datos del producto requeridos'
            }), 400
        
        # Actualizar producto
        updated_product = product_service.update_product(product_id, product_data)
        
        return jsonify({
            'success': True,
            'data': updated_product,
            'message': 'Producto actualizado exitosamente'
        }), 200
        
    except ValueError as e:
        print(f"=== ERROR: ValueError en update_product: {str(e)} ===")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        print(f"=== ERROR: Exception en update_product: {str(e)} ===")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/<product_id>', methods=['DELETE', 'OPTIONS'])
@admin_required
def delete_product(product_id):
    """
    Eliminar un producto (soft delete)
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        
        # Eliminar producto
        success = product_service.delete_product(product_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Error al eliminar el producto'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Producto eliminado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/<product_id>/hard-delete', methods=['DELETE', 'OPTIONS'])
@admin_required
def hard_delete_product(product_id):
    """
    Eliminar un producto permanentemente
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        
        # Eliminar producto permanentemente
        success = product_service.hard_delete_product(product_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Error al eliminar el producto permanentemente'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Producto eliminado permanentemente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/<product_id>/stock', methods=['PATCH', 'OPTIONS'])
@admin_required
def update_product_stock(product_id):
    """
    Actualizar el stock de un producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        
        # Obtener datos del request
        data = request.get_json()
        
        if not data or 'stock' not in data:
            return jsonify({
                'success': False,
                'error': 'Nuevo stock requerido'
            }), 400
        
        new_stock = int(data['stock'])
        
        # Actualizar stock
        updated_product = product_service.update_stock(product_id, new_stock)
        
        return jsonify({
            'success': True,
            'data': updated_product,
            'message': 'Stock actualizado exitosamente'
        }), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/stats', methods=['GET', 'OPTIONS'])
@admin_required
def get_product_stats():
    """
    Obtener estadísticas de productos
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        stats = product_service.get_product_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/categories', methods=['GET', 'OPTIONS'])
@admin_required
def get_product_categories():
    """
    Obtener lista de categorías de productos
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        categories = product_service.get_categories()
        
        return jsonify({
            'success': True,
            'data': categories
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/products/search', methods=['GET', 'OPTIONS'])
def search_products():
    """
    Buscar productos por término de búsqueda
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        product_service = ProductService()
        
        search_term = request.args.get('q', '')
        limit = int(request.args.get('limit', 10))
        
        if not search_term:
            return jsonify({
                'success': False,
                'error': 'Término de búsqueda requerido'
            }), 400
        
        products = product_service.search_products(search_term, limit)
        
        return jsonify({
            'success': True,
            'data': products
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# RUTAS PARA CATEGORÍAS
# ============================================================================

@api_bp.route('/categories', methods=['GET', 'OPTIONS'])
def get_categories():
    """
    Obtener todas las categorías con filtros opcionales
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        category_service = CategoryService()
        
        # Obtener parámetros de consulta
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        # Obtener filtros
        filters = {}
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        
        categories = category_service.get_categories(include_inactive, filters)
        
        return jsonify({
            'success': True,
            'data': categories
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/categories/<int:category_id>', methods=['GET', 'OPTIONS'])
@admin_required
def get_category(category_id):
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        category_service = CategoryService()
        category = category_service.get_category_by_id(category_id)
        if not category:
            return jsonify({'success': False, 'error': 'Categoría no encontrada'}), 404
        return jsonify({'success': True, 'data': category}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/categories', methods=['POST', 'OPTIONS'])
@admin_required
def create_category():
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        category_service = CategoryService()
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        data['created_by'] = request.user.get('id')
        category = category_service.create_category(data)
        return jsonify({'success': True, 'data': category, 'message': 'Categoría creada exitosamente'}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/categories/<int:category_id>', methods=['PUT', 'OPTIONS'])
@admin_required
def update_category(category_id):
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        category_service = CategoryService()
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        category = category_service.update_category(category_id, data)
        return jsonify({'success': True, 'data': category, 'message': 'Categoría actualizada exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/categories/<int:category_id>', methods=['DELETE', 'OPTIONS'])
@admin_required
def delete_category(category_id):
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        category_service = CategoryService()
        success = category_service.delete_category(category_id)
        if success:
            return jsonify({'success': True, 'message': 'Categoría eliminada exitosamente'}), 200
        else:
            return jsonify({'success': False, 'error': 'Error al eliminar la categoría'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/categories/featured', methods=['GET', 'OPTIONS'])
@admin_required
def get_featured_categories():
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        category_service = CategoryService()
        categories = category_service.get_featured_categories()
        return jsonify({'success': True, 'data': categories}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/categories/stats', methods=['GET', 'OPTIONS'])
@admin_required
def get_category_stats():
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        category_service = CategoryService()
        stats = category_service.get_category_stats()
        return jsonify({'success': True, 'data': stats}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== ORDERS ROUTES ====================

@api_bp.route('/orders/test', methods=['GET', 'POST', 'OPTIONS'])
def test_orders_endpoint():
    """
    Endpoint de prueba para verificar que las rutas de órdenes funcionan
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        return jsonify({
            'success': True,
            'message': 'Endpoint de órdenes funcionando correctamente',
            'method': request.method,
            'timestamp': datetime.now().isoformat()
        }), 200
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/orders', methods=['GET', 'POST', 'OPTIONS'])
@token_required
def orders_endpoint():
    """
    Manejar órdenes: GET para obtener órdenes del usuario, POST para crear nueva orden
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        
        if request.method == 'POST':
            # Crear una nueva orden
            data = request.get_json()
            
            print(f"Received order data: {data}")
            
            if not data:
                return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
            
            # Validar campos requeridos
            required_fields = ['customer_name', 'customer_email', 'customer_phone', 'shipping_address', 
                             'shipping_city', 'shipping_state', 'shipping_zip_code', 'subtotal', 
                             'shipping_cost', 'total_amount', 'payment_method', 'shipping_method', 'items']
            
            missing_fields = []
            for field in required_fields:
                if field not in data or not data[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                return jsonify({
                    'success': False, 
                    'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
                }), 400
            
            # Agregar el user_id del usuario autenticado
            user_id = request.user.get('sub')
            data['user_id'] = user_id
            
            print(f"Creating order with user_id: {user_id}")
            print(f"request.user: {request.user}")
            print(f"Final order data: {data}")
            
            result = order_service.create_order(data)
            
            print(f"Order creation result: {result}")
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        elif request.method == 'GET':
            # Obtener las órdenes del usuario autenticado
            user_id = request.user.get('sub')
            
            # Parámetros de paginación
            limit = request.args.get('limit', 50, type=int)
            offset = request.args.get('offset', 0, type=int)
            
            result = order_service.get_user_orders(user_id, limit, offset)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 400
                
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/orders/<order_id>', methods=['GET', 'OPTIONS'])
@token_required
def get_order(order_id):
    """
    Obtener una orden específica
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        result = order_service.get_order(order_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/user/orders', methods=['GET', 'OPTIONS'])
@token_required
def get_user_orders():
    """
    Obtener todas las órdenes del usuario actual
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        # Obtener parámetros de paginación
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status', None)
        
        # Calcular offset
        offset = (page - 1) * limit
        
        order_service = OrderService()
        user_id = request.user.get('sub')
        
        # Obtener órdenes del usuario
        result = order_service.get_user_orders(user_id, limit=limit, offset=offset)
     
        
        if result['success']:
            # Filtrar por estado si se especifica
            orders = result['data']
            if status and status != 'all':
                orders = [order for order in orders if order['status'] == status]
            
            # Agregar información de paginación
            response_data = {
                'success': True,
                'data': orders,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': len(orders),
                    'has_more': len(orders) == limit
                },
                'message': 'Órdenes obtenidas exitosamente'
            }
            
            return jsonify(response_data), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/admin/orders', methods=['GET', 'OPTIONS'])
@admin_required
def get_all_orders():
    """
    Obtener todas las órdenes (solo para administradores)
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        
        # Parámetros de paginación y filtros
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        status = request.args.get('status')
        
        result = order_service.get_all_orders(limit, offset, status)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/admin/orders/<order_id>/status', methods=['PATCH', 'OPTIONS'])
@admin_required
def update_order_status(order_id):
    """
    Actualizar el estado de una orden (solo para administradores)
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'success': False, 'error': 'Estado requerido'}), 400
        
        result = order_service.update_order_status(order_id, data['status'])
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/admin/orders/<order_id>', methods=['PUT', 'OPTIONS'])
@admin_required
def update_order(order_id):
    """
    Actualizar una orden completa (solo para administradores)
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        
        result = order_service.update_order(order_id, data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/admin/orders/<order_id>', methods=['DELETE', 'OPTIONS'])
@admin_required
def delete_order(order_id):
    """
    Eliminar una orden (solo para administradores)
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        result = order_service.delete_order(order_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/admin/orders/stats', methods=['GET', 'OPTIONS'])
@admin_required
def get_order_stats():
    """
    Obtener estadísticas de las órdenes (solo para administradores)
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_service = OrderService()
        result = order_service.get_order_stats()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/user/orders/test', methods=['GET', 'OPTIONS'])
@token_required
def test_user_orders():
    """
    Endpoint de prueba para verificar la autenticación y el servicio de órdenes
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        user_id = request.user.get('sub')
        print(f"Usuario autenticado: {user_id}")
        
        order_service = OrderService()
        result = order_service.get_user_orders(user_id, limit=5, offset=0)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'orders_result': result,
            'message': 'Prueba de autenticación y servicio de órdenes'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error en prueba de autenticación'
        }), 500

@api_bp.route('/user/stats', methods=['GET', 'OPTIONS'])
@token_required
def get_current_user_stats():
    """
    Obtener estadísticas del usuario actual
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        user_id = request.user.get('sub')
        order_service = OrderService()
        
        # Obtener todas las órdenes del usuario
        result = order_service.get_user_orders(user_id, limit=1000, offset=0)
        
        if not result['success']:
            return jsonify(result), 400
        
        orders = result['data']
        
        # Calcular estadísticas
        total_spent = sum(float(order.get('total_amount', 0)) for order in orders)
        total_orders = len(orders)
        delivered_orders = len([order for order in orders if order.get('status') == 'delivered'])
        
        # Calcular puntos de fidelidad (1 punto por cada $10.000 gastados)
        loyalty_points = int(total_spent / 10000)
        
        # Obtener última compra
        last_order = None
        if orders:
            last_order = max(orders, key=lambda x: x.get('created_at', ''))
        
        stats = {
            'total_spent': total_spent,
            'total_orders': total_orders,
            'delivered_orders': delivered_orders,
            'loyalty_points': loyalty_points,
            'last_order': last_order,
            'order_history': orders[:5]  # Solo las últimas 5 órdenes
        }
        
        return jsonify({
            'success': True,
            'data': stats,
            'message': 'Estadísticas obtenidas exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error al obtener estadísticas'
        }), 500


# ==================== RUTAS DE CALIFICACIONES DE PRODUCTOS ====================

@api_bp.route('/product-ratings', methods=['POST', 'OPTIONS'])
@token_required
def create_product_rating():
    """
    Crear una nueva calificación de producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        data = request.get_json()
        print(f"DEBUG: Received data: {data}")  # Debug log
        
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        
        # Validar campos requeridos
        required_fields = ['product_id', 'order_id', 'rating']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            print(f"DEBUG: Missing fields: {missing_fields}")  # Debug log
            return jsonify({
                'success': False, 
                'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
            }), 400
        
        # Validar que la calificación esté entre 1 y 5
        if not (1 <= data['rating'] <= 5):
            print(f"DEBUG: Invalid rating: {data['rating']}")  # Debug log
            return jsonify({
                'success': False, 
                'error': 'La calificación debe estar entre 1 y 5'
            }), 400
        
        user_id = request.user.get('sub')
        print(f"DEBUG: User ID: {user_id}")  # Debug log
        print(f"DEBUG: Product ID: {data['product_id']}")  # Debug log
        print(f"DEBUG: Order ID: {data['order_id']}")  # Debug log
        print(f"DEBUG: Rating: {data['rating']}")  # Debug log
        
        rating_service = ProductRatingService()
        
        # Verificar si el usuario puede calificar antes de intentar crear
        can_rate = rating_service.can_user_rate_product(
            user_id=user_id,
            product_id=data['product_id'],
            order_id=data['order_id']
        )
        print(f"DEBUG: Can user rate: {can_rate}")  # Debug log
        
        if not can_rate:
            return jsonify({
                'success': False,
                'error': 'No puedes calificar este producto. Verifica que el pedido esté entregado y que hayas comprado este producto.'
            }), 400
        print(f"DEBUG: Creating rating , user_id: {user_id}, product_id: {data['product_id']}, order_id: {data['order_id']}, rating: {data['rating']}, comment: {data.get('comment')}")
        result = rating_service.create_rating(
            user_id=user_id,
            product_id=data['product_id'],
            order_id=data['order_id'],
            rating=data['rating'],
            comment=data.get('comment')
        )
        
        print(f"DEBUG: Service result: {result}")  # Debug log
        
        if result and result.get('success'):
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"DEBUG: Exception occurred: {str(e)}")  # Debug log
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/products/<int:product_id>/ratings', methods=['GET', 'OPTIONS'])
def get_product_ratings(product_id):
    """
    Obtener calificaciones de un producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        rating_service = ProductRatingService()
        result = rating_service.get_product_ratings(product_id, page, per_page)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/products/<int:product_id>/rating-stats', methods=['GET', 'OPTIONS'])
def get_product_rating_stats(product_id):
    """
    Obtener estadísticas de calificaciones de un producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        rating_service = ProductRatingService()
        result = rating_service.get_product_rating_stats(product_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/products/<int:product_id>/can-rate', methods=['GET', 'OPTIONS'])
@token_required
def can_user_rate_product(product_id):
    """
    Verificar si un usuario puede calificar un producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        order_id = request.args.get('order_id')
        if not order_id:
            return jsonify({'success': False, 'error': 'order_id es requerido'}), 400
        
        user_id = request.user.get('sub')
        print(f"DEBUG: Checking if user {user_id} can rate product {product_id} for order {order_id}")
        
        rating_service = ProductRatingService()
        
        can_rate = rating_service.can_user_rate_product(user_id, product_id, order_id)
        
        print(f"DEBUG: Can rate result: {can_rate}")
        
        return jsonify({
            'success': True,
            'data': {
                'can_rate': can_rate,
                'user_id': user_id,
                'product_id': product_id,
                'order_id': order_id
            }
        }), 200
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/product-ratings/<rating_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_product_rating(rating_id):
    """
    Actualizar una calificación de producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400
        
        # Validar que la calificación esté entre 1 y 5
        if 'rating' in data and not (1 <= data['rating'] <= 5):
            return jsonify({
                'success': False, 
                'error': 'La calificación debe estar entre 1 y 5'
            }), 400
        
        user_id = request.user.get('sub')
        rating_service = ProductRatingService()
        
        result = rating_service.update_rating(
            rating_id=rating_id,
            user_id=user_id,
            rating=data.get('rating'),
            comment=data.get('comment')
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/product-ratings/<rating_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_product_rating(rating_id):
    """
    Eliminar una calificación de producto
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        user_id = request.user.get('sub')
        rating_service = ProductRatingService()
        
        result = rating_service.delete_rating(rating_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/user/ratings', methods=['GET', 'OPTIONS'])
@token_required
def get_user_ratings():
    """
    Obtener todas las calificaciones del usuario actual
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        user_id = request.user.get('sub')
        rating_service = ProductRatingService()
        
        result = rating_service.get_user_ratings(user_id, page, per_page)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== RUTAS ADMIN PARA CALIFICACIONES ====================

@api_bp.route('/admin/product-ratings/pending', methods=['GET', 'OPTIONS'])
@admin_required
def get_pending_ratings():
    """
    Obtener calificaciones pendientes de aprobación
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        rating_service = ProductRatingService()
        result = rating_service.get_pending_ratings(page, per_page)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/admin/product-ratings/<rating_id>/approve', methods=['PATCH', 'OPTIONS'])
@admin_required
def approve_rating(rating_id):
    """
    Aprobar una calificación
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        rating_service = ProductRatingService()
        result = rating_service.approve_rating(rating_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/admin/product-ratings/<rating_id>/reject', methods=['PATCH', 'OPTIONS'])
@admin_required
def reject_rating(rating_id):
    """
    Rechazar una calificación
    """
    try:
        if request.method == 'OPTIONS':
            response = jsonify(message='OPTIONS request received')
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "*")
            response.headers.add("Access-Control-Allow-Methods", "*")
            return response, 200
        
        data = request.get_json()
        if not data or 'reason' not in data:
            return jsonify({'success': False, 'error': 'Razón de rechazo requerida'}), 400
        
        rating_service = ProductRatingService()
        result = rating_service.reject_rating(rating_id, data['reason'])
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500