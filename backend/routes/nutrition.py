from flask import Blueprint, request, jsonify
from services.calculator import calculate_macro_distribution
from services.ai_service import build_nutrition_prompt, generate_json_with_retry
from utils.sanitizer import validate_numeric_range, validate_enum, sanitize_text_input
import logging

nutrition_bp = Blueprint('nutrition', __name__)

@nutrition_bp.route('/api/nutrition', methods=['POST', 'OPTIONS'])
def generate_nutrition():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 204
    
    data = request.json
    
    # 3.2.2 Validasi Input dan Sanitasi Teks
    try:
        target_calories = validate_numeric_range(data.get("target_calories", 0), 1200, 10000, "target_calories")
        meals_per_day = validate_numeric_range(data.get("meals_per_day", 3), 1, 6, "meals_per_day")
        
        # Validasi Enum standard
        fitness_goal = validate_enum(data.get("fitness_goal"), ["weight_loss", "maintenance", "muscle_gain"], "fitness_goal")
        
        # Anda dapat menyesuaikan list enum ini dengan input select di Frontend Anda nantinya
        diet_preference = validate_enum(data.get("diet_preference", "standard"), 
                                        ["standard", "vegan", "vegetarian", "keto", "paleo", "halal"], "diet_preference")
        cuisine_preference = validate_enum(data.get("cuisine_preference", "any"), 
                                        ["indonesian", "western", "asian", "mediterranean", "any"], "cuisine_preference")
        
        weight_goal_rate = float(data.get("weight_goal_rate", 0.5))
        
        # Sanitasi teks bebas untuk alergi guna menghindari Prompt Injection
        allergies = sanitize_text_input(data.get("allergies", ""))

    except ValueError as e:
        return jsonify({"error": "Invalid Input", "details": str(e)}), 400

    # 3.2.3 & 3.2.4 Implementasi Logic AI
    try:
        # Hitung distribusi makro
        macro_targets = calculate_macro_distribution(target_calories, fitness_goal)

        preferences = {
            "target_calories": target_calories,
            "diet_preference": diet_preference,
            "meals_per_day": meals_per_day,
            "weight_goal_rate": weight_goal_rate,
            "allergies": allergies,
            "cuisine_preference": cuisine_preference,
            "fitness_goal": fitness_goal
        }

        # Dapatkan prompt dan hit API dengan retry logic yang sama seperti workout
        system_prompt, user_prompt = build_nutrition_prompt(preferences, macro_targets)
        meal_plan = generate_json_with_retry(system_prompt, user_prompt)
        
        # 3.2.5 Return JSON Response
        return jsonify(meal_plan), 200

    except Exception as e:
        logging.error(f"Nutrition generation error: {str(e)}")
        # 3.2.6 Error Handling LLM Timeout/Failure
        return jsonify({"error": "Service Unavailable", "details": "AI sedang sibuk, gagal meng-generate meal plan. Coba lagi."}), 503