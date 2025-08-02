from flask import jsonify, abort, request, send_file, Blueprint
import requests
from rembg import remove
from PIL import Image
import io
from app.config import Config
from .services.gemini_service import GeminiService
from .middleware.auth import token_required
import qrcode
import os
from dotenv import load_dotenv
from google.cloud import texttospeech



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
    

@api_bp.route('/tools/text_x_voz', methods=['POST', 'OPTIONS'])
@token_required
def text_to_speech():
    if request.method == 'OPTIONS':
        response = jsonify(message='OPTIONS request received')
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response, 200

    try:
        data = request.json

        if 'text' not in data or not data['text'].strip():
            return jsonify({'error': 'No se proporcionó el texto para convertir a voz'}), 400

        text = data['text']
        voice_name = data.get('voice_name')  # Nuevo: nombre completo de la voz, opcional
        language_code = data.get('language_code', 'es-ES')
        gender_str = data.get('gender', 'NEUTRAL').upper()

        valid_genders = ['MALE', 'FEMALE', 'NEUTRAL']
        if gender_str not in valid_genders:
            gender_str = 'NEUTRAL'

        ssml_gender = getattr(texttospeech.SsmlVoiceGender, gender_str)

        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        client = texttospeech.TextToSpeechClient()

        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Si el usuario especifica un nombre de voz válido, lo usamos directamente
        if voice_name:
            voice = texttospeech.VoiceSelectionParams(
                name=voice_name,
                language_code=language_code,
                ssml_gender=ssml_gender
            )
        else:
            # Buscar voces por idioma
            voices = client.list_voices(language_code=language_code).voices
            filtered_voices = [v for v in voices if v.ssml_gender == ssml_gender]

            selected_voice = filtered_voices[0] if filtered_voices else voices[0]

            voice = texttospeech.VoiceSelectionParams(
                name=selected_voice.name,
                language_code=selected_voice.language_codes[0],
                ssml_gender=selected_voice.ssml_gender
            )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        audio_stream = io.BytesIO(response.audio_content)
        audio_stream.seek(0)

        return send_file(audio_stream, mimetype='audio/mpeg')

    except Exception as e:
        return jsonify({
            'error': 'Error al generar el audio',
            'details': str(e)
        }), 500





