from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.analyze import analyze_bp
from routes.workout import workout_bp
from routes.nutrition import nutrition_bp 
from routes.chat import chat_bp
from routes.session_report import session_report_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # FIX: Terapkan CORS secara global dengan support localhost dan 127.0.0.1
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:*", "http://127.0.0.1:*", "http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # --- Mendaftarkan Blueprint Rute ---
    app.register_blueprint(analyze_bp)
    app.register_blueprint(workout_bp)
    app.register_blueprint(nutrition_bp) 
    app.register_blueprint(chat_bp)
    app.register_blueprint(session_report_bp)

    # --- Error Handlers Sesuai Design Document ---
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "details": str(error.description)}), 400

    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({"error": "Rate Limit Exceeded", "details": "Too many requests. Please wait."}), 429

    @app.errorhandler(503)
    def service_unavailable(error):
        return jsonify({"error": "Service Unavailable", "details": "AI sedang sibuk, silakan coba lagi"}), 503

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal Server Error", "details": "Terjadi kesalahan pada server"}), 500

    # Route dasar untuk test health check server
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "Backend AI Fitness Companion is running!"}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    # Jalankan server
    app.run(host='0.0.0.0', port=Config.PORT, debug=(Config.FLASK_ENV == 'development'))