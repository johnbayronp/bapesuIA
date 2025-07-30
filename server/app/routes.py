from flask import jsonify, abort, request, send_file, Blueprint
import requests
from rembg import remove
from PIL import Image
import io
from app.config import Config
from .services.gemini_service import GeminiService
from .services.user_service import UserService
from .middleware.auth import token_required, admin_required
import qrcode


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