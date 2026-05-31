from flask import request, jsonify
from functools import wraps
import time

# Penyimpanan in-memory sederhana untuk melacak request history per IP (Session)
# Format: { "IP_ADDRESS": [timestamp1, timestamp2, ...] }
request_history = {}

def check_rate_limit(limit=20, window=60):
    """
    Decorator untuk membatasi jumlah request ke endpoint tertentu.
    Sesuai Persyaratan 4.7 dan Property 9.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = request.remote_addr
            current_time = time.time()
            
            # Inisialisasi history untuk IP baru
            if ip not in request_history:
                request_history[ip] = []
            
            # Bersihkan request lama yang sudah di luar rentang waktu (window)
            request_history[ip] = [t for t in request_history[ip] if current_time - t < window]
            
            # Cek apakah limit tercapai
            if len(request_history[ip]) >= limit:
                response = jsonify({
                    "error": "Rate Limit Exceeded",
                    "details": "Terlalu banyak permintaan. Silakan tunggu beberapa saat."
                })
                # Tambahkan header Retry-After sesuai Persyaratan 4.7
                response.headers["Retry-After"] = str(window)
                return response, 429
                
            # Catat request baru
            request_history[ip].append(current_time)
            return f(*args, **kwargs)
        return decorated_function
    return decorator