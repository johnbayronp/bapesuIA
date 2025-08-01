from flask import Flask
from flask_cors import CORS
from .config import Config
from .routes import api_bp
from flask_swagger import swagger
from flask_swagger_ui import get_swaggerui_blueprint

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configurar CORS
    CORS(app, 
         resources={r"*": {  # Permitir todas las rutas
             "origins": ["*"],
             "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 86400  # Cache preflight por 24 horas
         }},
         supports_credentials=True)
    
    #swagger 
    swaggerui_blueprint = get_swaggerui_blueprint(
        app.config['SWAGGER_PREFIX'],
        app.config['API_URL'],
        config={
            'app_name': "Bapesu IA API | v1"
        }
    )   
    
    # Registrar el blueprint de swagger
    app.register_blueprint(swaggerui_blueprint, url_prefix=app.config['SWAGGER_PREFIX'])

    # Registrar blueprints API
    app.register_blueprint(api_bp, url_prefix=app.config['API_PREFIX'])

    # Manejador global para solicitudes OPTIONS
    @app.route('/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response

    return app
