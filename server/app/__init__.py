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
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
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

    return app
