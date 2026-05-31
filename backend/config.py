import os
from dotenv import load_dotenv

# Memaksa load ulang .env (override) agar mengabaikan cache terminal VS Code
load_dotenv(override=True)

class Config:
    # API & env config
    LLM_API_KEY = os.getenv("LLM_API_KEY")
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
    
    # FIX: Menggunakan model Gemini 3.1 Flash Lite sesuai request
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-3.1-flash-lite") 
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    PORT = int(os.getenv("PORT", 5000)) 

    # constants : activity multipliers
    ACTIVITY_MULTIPLIERS = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extra_active": 1.9
    }

    # constants : macro distribution % 
    MACRO_DISTRIBUTION = {
        "weight_loss": {"protein": 0.35, "carbs": 0.40, "fats": 0.25},
        "maintenance": {"protein": 0.25, "carbs": 0.50, "fats": 0.25},
        "muscle_gain": {"protein": 0.30, "carbs": 0.45, "fats": 0.25},
    }