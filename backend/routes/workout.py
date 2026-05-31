from flask import Blueprint, request, jsonify
from services.ai_service import build_workout_prompt, generate_json_with_retry
from utils.sanitizer import validate_numeric_range, validate_enum
import logging

workout_bp = Blueprint('workout', __name__)

@workout_bp.route('/api/workout', methods=['POST', 'OPTIONS'])
def generate_workout():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 204
    
    data = request.json
    
    # 2.2.2 Validasi Input
    try:
        fitness_goal = validate_enum(data.get("fitness_goal"), 
                                    ["weight_loss", "maintenance", "muscle_gain"], "fitness_goal")
        experience_level = validate_enum(data.get("experience_level"), 
                                        ["beginner", "intermediate", "advanced"], "experience_level")
        workout_location = validate_enum(data.get("workout_location"), 
                                        ["gym", "home", "outdoor"], "workout_location")
        focus_area = validate_enum(data.get("focus_area"), 
                                  ["full_body", "upper_body", "lower_body", "cardio", "flexibility"], "focus_area")
        
        days_per_week = validate_numeric_range(data.get("days_per_week"), 1, 7, "days_per_week")
        session_duration = validate_numeric_range(data.get("session_duration"), 15, 180, "session_duration")
        
        # Equipment array validation (simple check)
        equipment = data.get("equipment", [])
        if not isinstance(equipment, list):
            raise ValueError("Equipment harus berupa list")

    except ValueError as e:
        return jsonify({"error": "Invalid Input", "details": str(e)}), 400

    # 2.2.3 & 2.2.4 Implementasi AI & Parsing
    try:
        # Menyiapkan preferences untuk prompt builder
        preferences = {
            "fitness_goal": fitness_goal,
            "experience_level": experience_level,
            "workout_location": workout_location,
            "equipment": equipment,
            "days_per_week": days_per_week,
            "session_duration": session_duration,
            "focus_area": focus_area,
            "bmi": data.get("bmi"),
            "tdee": data.get("tdee")
        }

        system_prompt, user_prompt = build_workout_prompt(preferences)
        workout_plan = generate_json_with_retry(system_prompt, user_prompt)
        
        # 2.2.5 Return JSON Response
        return jsonify(workout_plan), 200

    except Exception as e:
        logging.error(f"Workout generation error: {str(e)}")
        # 2.2.6 Error Handling (HTTP 503 untuk timeout/AI failure)
        return jsonify({"error": "Service Unavailable", "details": "Gagal meng-generate workout plan. Coba lagi."}), 503