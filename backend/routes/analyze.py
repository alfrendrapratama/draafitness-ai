from flask import Blueprint, request, jsonify
import sys
import os

# Menambahkan parent directory ke system path untuk import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services import calculator, ai_service
from utils import sanitizer

# Inisialisasi Blueprint untuk rute ini
analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_profile():
    """
    Endpoint POST /api/analyze
    Menangani validasi input, kalkulasi BMI/BMR/TDEE/Makro, dan pemanggilan LLM.
    """
    # Handle CORS preflight request - Flask-CORS should handle this, but explicit response helps
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 204
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Bad Request", "details": "Format JSON tidak ditemukan atau kosong."}), 400

    # 1.5.2: Implementasi Input Validation dengan Sanitizer
    try:
        height = sanitizer.validate_numeric_range(data.get('height'), 100, 250, 'height')
        weight = sanitizer.validate_numeric_range(data.get('weight'), 30, 300, 'weight')
        age = sanitizer.validate_numeric_range(data.get('age'), 10, 100, 'age')
        
        gender = sanitizer.validate_enum(data.get('gender'), ['male', 'female'], 'gender')
        activity_level = sanitizer.validate_enum(
            data.get('activity_level'), 
            ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'], 
            'activity_level'
        )
        fitness_goal = sanitizer.validate_enum(
            data.get('fitness_goal'), 
            ['weight_loss', 'maintenance', 'muscle_gain'], 
            'fitness_goal'
        )
    except ValueError as e:
        # 1.5.6: Return HTTP 400 untuk invalid input
        return jsonify({"error": "Invalid Input", "details": str(e)}), 400

    # 1.5.3: Implementasi Calculator Calls
    bmi, bmi_category = calculator.calculate_bmi(weight, height)
    bmr = calculator.calculate_bmr(weight, height, age, gender)
    tdee = calculator.calculate_tdee(bmr, activity_level)
    target_calories = calculator.calculate_target_calories(tdee, fitness_goal)
    macro_distribution = calculator.calculate_macro_distribution(target_calories, fitness_goal)

    # 1.5.4: Implementasi LLM API Call
    user_data = {
        "gender": gender, "age": age, "weight": weight, "height": height,
        "activity_level": activity_level, "fitness_goal": fitness_goal
    }
    calc_results = {
        "bmi": bmi, "bmi_category": bmi_category, "bmr": bmr,
        "tdee": tdee, "target_calories": target_calories
    }
    
    system_prompt = "Anda adalah AI Fitness Coach profesional. Berikan interpretasi hasil analisis tubuh yang singkat, hangat, dan memotivasi."
    user_prompt = ai_service.build_analysis_prompt(user_data, calc_results)
    
    try:
        # Panggil LLM, batasi output max_tokens untuk efisiensi
        ai_interpretation = ai_service.call_llm_api(system_prompt, user_prompt, max_tokens=300)
    except RuntimeError as e:
        # 1.5.6: Return HTTP 503 untuk LLM timeout/error
        return jsonify({"error": "Service Unavailable", "details": str(e)}), 503

    # 1.5.5: Return JSON Response sesuai struktur Design Document
    response_data = {
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmr": bmr,
        "tdee": tdee,
        "target_calories": target_calories,
        "ai_interpretation": ai_interpretation,
        "calorie_breakdown": {
            "protein_kcal": macro_distribution['protein_kcal'],
            "carbs_kcal": macro_distribution['carbs_kcal'],
            "fat_kcal": macro_distribution['fat_kcal'],
            "protein_g": macro_distribution['protein_g'],
            "carbs_g": macro_distribution['carbs_g'],
            "fat_g": macro_distribution['fat_g']
        }
    }
    
    return jsonify(response_data), 200