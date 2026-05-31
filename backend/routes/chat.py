from flask import Blueprint, request, jsonify
from services.ai_service import call_llm_api, build_chat_system_prompt, detect_safety_keywords
from utils.sanitizer import sanitize_text_input, validate_enum
from utils.rate_limiter import check_rate_limit
import logging

chat_bp = Blueprint('chat', __name__)

# 4.3.1 Buat POST /api/chat endpoint
# Penegakan Property 9: Rate limit 20 req/menit
@chat_bp.route('/api/chat', methods=['POST'])
@check_rate_limit(limit=20, window=60)
def chat_with_coach():
    data = request.json
    if not data:
        return jsonify({"error": "Bad Request", "details": "Request body harus berupa JSON"}), 400

    try:
        # 4.3.2 Implementasi input sanitasi menggunakan sanitize_text_input()
        raw_message = data.get("message", "")
        message = sanitize_text_input(raw_message)
        
        if not message:
            raise ValueError("Pesan tidak boleh kosong")

        personality = validate_enum(
            data.get("personality", "friendly"), 
            ["military", "friendly", "scientific"], 
            "personality"
        )
        
        history = data.get("conversation_history", [])
        user_context = data.get("user_context", {})

    except ValueError as e:
        # 4.3.7 Error handling: HTTP 400 untuk invalid input
        return jsonify({"error": "Invalid Input", "details": str(e)}), 400

    # 4.3.5 Implementasi safety flag detection
    is_unsafe, safety_message = detect_safety_keywords(message)
    if is_unsafe:
        # 4.3.6 Return JSON response dengan safety flag True
        return jsonify({
            "response": "Demi keselamatan Anda, AI Coach menghentikan sementara arahan untuk topik ini.",
            "safety_flag": True,
            "safety_message": safety_message
        }), 200

    # 4.3.3 Implementasi conversation history handling
    formatted_history = ""
    if isinstance(history, list) and len(history) > 0:
        # Ambil 10 pesan terakhir untuk menjaga efisiensi token LLM
        for msg in history[-10:]: 
            role = "User" if msg.get("role") == "user" else "Coach"
            content = msg.get("content", "")
            formatted_history += f"{role}: {content}\n"
    
    # Gabungkan riwayat dengan pesan terbaru
    if formatted_history:
        final_user_prompt = f"Riwayat Percakapan:\n{formatted_history}\n\nPesan Baru User: {message}"
    else:
        final_user_prompt = f"Pesan User: {message}"

    try:
        # 4.3.4 Implementasi LLM API call dengan system prompt sesuai personality
        system_prompt = build_chat_system_prompt(personality, user_context)
        
        # Batasi token output ke 1000 agar respons chat tetap ringkas
        ai_response = call_llm_api(system_prompt, final_user_prompt, max_tokens=1000)
        
        # 4.3.6 Return JSON response
        return jsonify({
            "response": ai_response,
            "safety_flag": False,
            "safety_message": None
        }), 200

    except Exception as e:
        logging.error(f"Chatbot API error: {str(e)}")
        # 4.3.7 Error handling: HTTP 503 untuk LLM timeout/error
        return jsonify({
            "error": "Service Unavailable", 
            "details": "AI Coach sedang sibuk atau terjadi gangguan koneksi. Silakan coba lagi."
        }), 503