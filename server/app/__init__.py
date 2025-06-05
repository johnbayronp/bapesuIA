from flask import Flask
from flask_cors import CORS
from .config import Config
from .routes import api_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configurar CORS
    CORS(app, 
         resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Registrar blueprints
    app.register_blueprint(api_bp, url_prefix=app.config['API_PREFIX'])

    return app
