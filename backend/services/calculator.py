import os
import sys

# nambahin parent directory ke system path supaya bisa import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

def calculate_bmi(weight_kg, height_cm):
    # menghitung bmi dan mengambalikan (bmi_value, bmi_category)
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    bmi = round(bmi, 2)

    if bmi < 18.5:
        category = "Underweight"
    elif 18.5 <= bmi < 24.9:
        category = "Normal"
    elif 25 <= bmi < 29.9:
        category = "Overweight"
    else:
        category = "Obese"

    return bmi, category

def calculate_bmr(weight_kg, height_cm, age, gender):
    # menghitung bmr berdasarkan rumus mifflin-st jeor
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)

    if gender.lower() == 'male':
        bmr = base + 5
    else:
        bmr = base - 161

    return round(bmr, 2)

def calculate_tdee(bmr, activity_level):
    # menghitung tdee berdasarkan bmr dan level aktivitas
    # Mengambil multiplier dari config, default ke 'sedentary' (1.2) kalo gak ditemuin
    multiplier = Config.ACTIVITY_MULTIPLIERS.get(activity_level, 1.2)
    return round(bmr * multiplier, 2)

def calculate_target_calories(tdee, fitness_goal):
    # menghitung target kalori harian dan mastiin gak kurang dari 1200 kcal
    if fitness_goal == "weight_loss":
        target = tdee - 500 # defisit 500 kcal
    elif fitness_goal == "muscle_gain":
        target = tdee + 500 # surplus 500 kcal
    else: # maintenance
        target = tdee

    # safety check gak boleh dibawah 1200 kcal
    return max(1200.0, round(target, 2))

def calculate_macro_distribution(target_calories, fitness_goal):
    """
    Menghitung distribusi makro berdasarkan target kalori dan fitness goal.
    Returns flat structure: protein_kcal, carbs_kcal, fat_kcal, protein_g, carbs_g, fat_g
    """
    if fitness_goal == "weight_loss":
        p_pct, c_pct, f_pct = 0.35, 0.40, 0.25
    elif fitness_goal == "muscle_gain":
        p_pct, c_pct, f_pct = 0.30, 0.45, 0.25
    else:  # maintenance
        p_pct, c_pct, f_pct = 0.25, 0.50, 0.25

    p_kcal = target_calories * p_pct
    c_kcal = target_calories * c_pct
    f_kcal = target_calories * f_pct

    return {
        "protein_kcal": round(p_kcal, 2),
        "carbs_kcal": round(c_kcal, 2),
        "fat_kcal": round(f_kcal, 2),
        "protein_g": round(p_kcal / 4, 2),  # 1g Protein = 4 kcal
        "carbs_g": round(c_kcal / 4, 2),    # 1g Karbohidrat = 4 kcal
        "fat_g": round(f_kcal / 9, 2)       # 1g Lemak = 9 kcal
    }