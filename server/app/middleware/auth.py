from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime
import os
from ..config import Config
from ..services.user_service import UserService

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        print("token_required")
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

def admin_required(f):
    """
    Decorador para verificar que el usuario tiene rol de administrador
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200  # Permitir preflight sin validar token

        # Primero verificar el token
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401

        if not token:
            return jsonify({'message': 'Token no proporcionado'}), 401

        try:
            # Verificar el token
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

            # Verificar rol de administrador
            user_id = data.get('sub')  # ID del usuario del token
            if not user_id:
                return jsonify({'message': 'ID de usuario no encontrado en el token'}), 401

            try:
                user_service = UserService()
                user = user_service.get_user_by_id(user_id)
                
                if not user:
                    return jsonify({'message': 'Usuario no encontrado'}), 404
                
                if user.get('role') != 'admin':
                    return jsonify({'message': 'Acceso denegado. Se requiere rol de administrador'}), 403
                
                # Agregar la información del usuario al request
                request.user = data
                request.admin_user = user
                
            except Exception as e:
                return jsonify({'message': f'Error al verificar rol de administrador: {str(e)}'}), 500
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401
        except Exception as e:
            return jsonify({'message': f'Error de autenticación: {str(e)}'}), 401

        return f(*args, **kwargs)

    return decorated 