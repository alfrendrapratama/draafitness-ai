from flask import Blueprint, request, jsonify
from services.ai_service import build_session_report_prompt, generate_json_with_retry
import logging

session_report_bp = Blueprint('session_report', __name__)

@session_report_bp.route('/api/session-report', methods=['POST'])
def generate_report():
    data = request.json
    
    # 5.2.2 Validasi Input
    if not data or "session_log" not in data:
        return jsonify({"error": "Bad Request", "details": "session_log wajib diisi"}), 400
        
    session_log = data.get("session_log", {})
    user_context = data.get("user_context", {})
    
    try:
        # 5.2.3 Kalkulasi Total Volume: Σ (sets × reps × weight_kg)
        total_volume_kg = 0
        for exercise in session_log.get("exercises", []):
            for s in exercise.get("sets", []):
                total_volume_kg += (s.get("reps", 0) * s.get("weight_kg", 0))
                
        # 5.2.4 Kalkulasi Kalori
        # Hitung kalori masuk dari array nutrition_log
        calories_consumed = sum(item.get("calories", 0) for item in session_log.get("nutrition_log", []))
        
        # Estimasi kalori terbakar (Simple formula: ~6 kcal per menit durasi latihan)
        duration_minutes = session_log.get("duration_minutes", 0)
        calories_burned_estimate = duration_minutes * 6
        
        calculated_metrics = {
            "total_volume_kg": total_volume_kg,
            "calories_burned_estimate": calories_burned_estimate,
            "calories_consumed": calories_consumed
        }
        
        # 5.2.5 Implementasi LLM API call
        system_prompt, user_prompt = build_session_report_prompt(session_log, user_context, calculated_metrics)
        ai_response = generate_json_with_retry(system_prompt, user_prompt)
        
        # 5.2.6 Return JSON response gabungan
        return jsonify({
            "total_volume_kg": total_volume_kg,
            "calories_burned_estimate": calories_burned_estimate,
            "calories_consumed": calories_consumed,
            "ai_narrative": ai_response.get("ai_narrative", ""),
            "next_session_recommendation": ai_response.get("next_session_recommendation", ""),
            "motivational_message": ai_response.get("motivational_message", "")
        }), 200
        
    except Exception as e:
        logging.error(f"Session Report Error: {str(e)}")
        # 5.2.7 Error handling
        return jsonify({
            "error": "Service Unavailable", 
            "details": "Gagal menyusun laporan sesi. AI sedang sibuk."
        }), 503