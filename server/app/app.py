from flask import Flask
from flask_cors import CORS
from app.config import Config

app = Flask(__name__)

CORS(app, 
         resources={r".*": {  # Permitir todas las rutas
             "origins": Config.CORS_ORIGINS,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }},
         supports_credentials=True)

app.config.from_object(Config)

from app import routes
