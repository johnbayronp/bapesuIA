from flask import Flask
from flask_cors import CORS
from .config import Config
from .routes import api_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configurar CORS
    CORS(app, 
         resources={r"/api/*": {  # Permitir todas las rutas
             "origins": config_class.CORS_ORIGINS,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }},
         supports_credentials=True)

    # Registrar blueprints
    app.register_blueprint(api_bp, url_prefix=app.config['API_PREFIX'])

    return app
