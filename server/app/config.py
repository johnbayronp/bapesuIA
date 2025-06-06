import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Config:
    # Configuración general
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Configuración de Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

    GEMINI_API_KEY= os.getenv('GEMINI_API_KEY')
    
    # Configuración de CORS
    CORS_ORIGINS = [
        'http://localhost:3000',  # Desarrollo local
        'http://localhost:5000',  # Desarrollo local alternativo
        'https://bapesu-oatictqrm-bayronperezsoutlookes-projects.vercel.app',  # Frontend en Vercel
        'https://bapesu.vercel.app',  # Frontend en Vercel (dominio personalizado)
        'https://bapesuia-production.up.railway.app'  # API en Railway
    ]
    
    # Configuración de API
    API_PREFIX = '/api/v1'
    
    # Configuración de servicios externos
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
    DEEPSEEK_API_URL = os.getenv('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions')
    DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
    REMOVE_BG_API_KEY = os.getenv('REMOVE_BG_API_KEY')

    # Flask Configuration
    HOST = os.getenv('FLASK_HOST', 'localhost')  # Para Docker
    PORT = int(os.getenv('PORT', '5000'))

    # Configuración de DeepSeek
    DEEPSEEK_TEMPERATURE = float(os.getenv('DEEPSEEK_TEMPERATURE', '0.7'))
    DEEPSEEK_MAX_TOKENS = int(os.getenv('DEEPSEEK_MAX_TOKENS', '200'))

    #swagger
    SWAGGER_PREFIX = '/api/v1/docs'
    API_URL = '/swagger.json'

    @classmethod
    def validate_config(cls):
        """Validar la configuración requerida"""
        if not cls.DEEPSEEK_API_KEY:
            raise ValueError("DEEPSEEK_API_KEY no está configurada en las variables de entorno")

# Validar la configuración al importar el módulo
Config.validate_config()