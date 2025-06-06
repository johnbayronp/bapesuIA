from flask import Flask
from flask_cors import CORS
from app.config import Config

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


app.config.from_object(Config)

from app import routes
