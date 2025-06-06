from flask import Flask
from flask_cors import CORS
from app.config import Config

app = Flask(__name__)

app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": "https://bapesu-ia.vercel.app/"}}, supports_credentials=True)


from app import routes
