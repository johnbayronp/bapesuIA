from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime
import os
from ..config import Config

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if request.method == 'OPTIONS':
            return '', 200  # Permitir preflight sin validar token


        token = None
        # Obtener el token del header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401

        if not token:
            return jsonify({'message': 'Token no proporcionado'}), 401

        try:
            # Verificar el token con la clave secreta de Supabase
            data = jwt.decode(
                token,
                Config.SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience="authenticated"
            )
            
            # Verificar si el token ha expirado
            exp = data.get('exp')
            current_time = datetime.now()
            
            if exp and current_time > datetime.fromtimestamp(exp):
                return jsonify({'message': 'Token expirado'}), 401

            # Agregar la información del usuario al request
            request.user = data
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401
        except Exception as e:
            return jsonify({'message': f'Error de autenticación: {str(e)}'}), 401

        return f(*args, **kwargs)

    return decorated 