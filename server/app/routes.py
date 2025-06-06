from flask import jsonify, abort, request, send_file, Blueprint
import requests
from rembg import remove
from PIL import Image
import io
from app.config import Config
from .services.gemini_service import GeminiService
from .middleware.auth import token_required


api_bp = Blueprint('/api/v1', __name__)

@api_bp.route('/')
def hello():
    try:
        return jsonify(message="Running API - Bapesu IA | V1 | By John perez | 2025")
    except Exception as e:
        abort(500, description=str(e))


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
    print("generate_ideas_videos")
    
    data = request.json
    # Validar datos requeridos
    required_fields = ['prompt']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo requerido faltante: {field}'}), 400
        
    # Crear un servicio externo para agregar la logica 
    iaGemini = GeminiService()
    
    response = iaGemini.generate_ideas_videos(data['prompt'])

    return jsonify(response),200
