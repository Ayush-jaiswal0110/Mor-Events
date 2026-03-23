import jwt
import datetime
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from functools import wraps

def generate_token(user_id, email, role="admin"):
    payload = {
        'id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')

def decode_token(encoded_token):
    try:
        return jwt.decode(encoded_token, settings.JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'success': False, 'message': 'Unauthorized. Please login.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        
        if not decoded:
            return Response({'success': False, 'message': 'Unauthorized. Please login.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Attach user info to request
        request.user_info = decoded
        return f(request, *args, **kwargs)
    return decorated_function
