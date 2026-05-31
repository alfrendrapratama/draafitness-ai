import json
import requests
import time
import os
import sys

# Menambahkan parent directory ke system path agar bisa import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

def call_llm_api(system_prompt: str, user_prompt: str, max_tokens: int = 2500) -> str:
    """
    Memanggil LLM API (Gemini atau OpenAI).
    Implementasi Retry Logic untuk API Timeout/Error (Max 1 retry).
    Validasi: Persyaratan 2.11 & 7.1
    """
    api_key = Config.LLM_API_KEY
    provider = Config.LLM_PROVIDER.lower()
    
    if not api_key:
        raise ValueError("API Key LLM tidak ditemukan di konfigurasi (.env).")

    # Menggabungkan instruksi sistem dan input user
    full_prompt = f"System Instructions:\n{system_prompt}\n\nUser Input:\n{user_prompt}"
    max_retries = 1
    
    for attempt in range(max_retries + 1):
        try:
            if provider == "gemini":
                url = f"https://generativelanguage.googleapis.com/v1/models/{Config.LLM_MODEL}:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": max_tokens,
                        "temperature": 0.7 # Tambahkan temperature agar respons lebih konsisten
                    }
                }
                
                # FIX: Tingkatkan timeout dari 15 ke 45 detik untuk formasi JSON kompleks
                response = requests.post(url, headers=headers, json=payload, timeout=45)
                response.raise_for_status()
                
                data = response.json()
                return data['candidates'][0]['content']['parts'][0]['text']
            
            elif provider == "openai":
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.7
                }
                
                # FIX: Tingkatkan timeout dari 15 ke 45 detik
                response = requests.post(url, headers=headers, json=payload, timeout=45)
                response.raise_for_status()
                
                data = response.json()
                return data['choices'][0]['message']['content']
                
            else:
                raise ValueError("Provider LLM tidak didukung. Gunakan 'gemini' atau 'openai'.")

        except (requests.exceptions.Timeout, requests.exceptions.RequestException) as e:
            if attempt < max_retries:
                time.sleep(2)  # Jeda sebelum mencoba lagi
                continue
            else:
                # Melempar runtime error untuk ditangkap di endpoint (menjadi HTTP 503)
                raise RuntimeError(f"LLM API Error atau Timeout setelah retry: {str(e)}")


def build_analysis_prompt(user_data: dict, calc_results: dict) -> str:
    """
    Membangun prompt terstruktur untuk AI BMI/Body interpretation.
    """
    user_prompt = (
        f"Berikut adalah data fisik dan tujuan fitness saya:\n"
        f"- Jenis Kelamin: {user_data.get('gender')}\n"
        f"- Usia: {user_data.get('age')} tahun\n"
        f"- Berat: {user_data.get('weight')} kg, Tinggi: {user_data.get('height')} cm\n"
        f"- Tingkat Aktivitas: {user_data.get('activity_level')}\n"
        f"- Tujuan: {user_data.get('fitness_goal')}\n\n"
        f"Hasil Kalkulasi Sistem:\n"
        f"- BMI: {calc_results.get('bmi')} (Kategori: {calc_results.get('bmi_category')})\n"
        f"- BMR: {calc_results.get('bmr')} kcal/hari\n"
        f"- TDEE: {calc_results.get('tdee')} kcal/hari\n"
        f"- Target Kalori Harian: {calc_results.get('target_calories')} kcal/hari\n\n"
        f"Berikan interpretasi profesional yang memotivasi (maksimal 3-4 kalimat). "
        f"Gunakan bahasa Indonesia yang natural, hangat, dan berikan sedikit tips singkat "
        f"untuk mencapai tujuan saya berdasarkan angka-angka di atas."
    )
    return user_prompt


def parse_json_response(response_text: str, retry_prompt: str = None) -> dict:
    """
    Membersihkan markdown code blocks dan memparsing respons LLM menjadi dictionary JSON.
    Berguna ketika kita meminta format JSON ketat (seperti di fitur Workout/Nutrition Planner).
    Validasi: Persyaratan 2.5
    """
    try:
        clean_text = response_text.strip()
        # Seringkali LLM membalas dengan markdown block ```json ... ```
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
            
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        clean_text = clean_text.strip()
        return json.loads(clean_text)
        
    except json.JSONDecodeError as e:
        # Pengecekan error handling JSON Parse
        raise ValueError(f"AI menghasilkan struktur JSON yang tidak valid. Error: {str(e)}")

# workout prompt
def build_workout_prompt(preferences: dict) -> tuple[str, str]:
    """
    Membangun prompt terstruktur untuk pembuatan rencana latihan (Workout Plan).
    Mengembalikan tuple: (system_prompt, user_prompt)
    Validasi: Persyaratan Task 2.1.1, 2.1.2, 2.1.3
    """
    
    system_prompt = (
        "You are an expert certified personal trainer and exercise scientist with 15+ years of experience.\n"
        "Generate a safe, progressive, and scientifically-sound weekly workout plan.\n"
        "IMPORTANT RULES:\n"
        "- Never recommend training 7 days/week without rest for beginners\n"
        "- Always include warm-up and cool-down notes\n"
        "- Provide exercise alternatives for limited mobility\n"
        "- Output MUST be valid JSON matching the specified schema exactly\n"
        "- Do not include any text outside the JSON structure"
    )

    # Mengamankan parameter alat (equipment) menjadi string yang rapi
    equipment_list = preferences.get("equipment", [])
    equipment_str = ", ".join(equipment_list) if equipment_list else "None"

    user_prompt = (
        f"Buatkan program latihan mingguan berdasarkan profil dan preferensi berikut:\n"
        f"- Tujuan Fitness: {preferences.get('fitness_goal')}\n"
        f"- Tingkat Pengalaman: {preferences.get('experience_level')}\n"
        f"- Lokasi Latihan: {preferences.get('workout_location')}\n"
        f"- Alat Tersedia: {equipment_str}\n"
        f"- Frekuensi: {preferences.get('days_per_week')} hari/minggu\n"
        f"- Durasi per sesi: {preferences.get('session_duration')} menit\n"
        f"- Area Fokus: {preferences.get('focus_area')}\n"
        f"- BMI: {preferences.get('bmi')}\n"
        f"- TDEE: {preferences.get('tdee')} kcal\n\n"
        f"Response HARUS dalam format JSON dengan struktur persis seperti berikut:\n"
        "{\n"
        '  "program_name": "string",\n'
        '  "program_summary": "string",\n'
        '  "weekly_schedule": [\n'
        "    {\n"
        '      "day": "string (e.g., Monday)",\n'
        '      "type": "workout atau rest",\n'
        '      "session": {\n'
        '        "name": "string",\n'
        '        "exercises": [\n'
        "          {\n"
        '            "name": "string",\n'
        '            "sets": 3,\n'
        '            "reps": "string",\n'
        '            "rest": "string",\n'
        '            "coaching_tip": "string",\n'
        '            "alternative": "string"\n'
        "          }\n"
        "        ]\n"
        "      }\n"
        "    }\n"
        "  ],\n"
        '  "progressive_overload_guide": "string",\n'
        '  "safety_notes": "string"\n'
        "}"
    )

    return system_prompt, user_prompt


def build_nutrition_prompt(preferences: dict, macro_targets: dict) -> tuple[str, str]:
    """
    Membangun prompt terstruktur untuk pembuatan rencana nutrisi harian (Meal Plan).
    Validasi: Persyaratan Task 3.1.1, 3.1.3, 3.1.4
    """
    system_prompt = (
        "You are an expert sports nutritionist and dietitian.\n"
        "Generate a highly personalized daily meal plan that is tasty, realistic, and easy to prepare.\n"
        "IMPORTANT RULES:\n"
        "- Total calories across all meals MUST be within ±50 kcal of the target calories.\n"
        "- Strictly adhere to the requested diet preferences, cuisine type, and allergies.\n"
        "- Output MUST be valid JSON matching the specified schema exactly.\n"
        "- Do not include any text or markdown formatting outside the JSON structure."
    )

    user_prompt = (
        f"Buatkan rencana makan harian dengan rincian preferensi berikut:\n"
        f"- Target Kalori: {preferences.get('target_calories')} kcal\n"
        f"- Tujuan Fitness: {preferences.get('fitness_goal')}\n"
        f"- Target Penurunan/Kenaikan Berat: {preferences.get('weight_goal_rate')} kg/minggu\n"
        f"- Preferensi Diet: {preferences.get('diet_preference')}\n"
        f"- Preferensi Masakan (Cuisine): {preferences.get('cuisine_preference')}\n"
        f"- Alergi/Pantangan: {preferences.get('allergies', 'Tidak ada')}\n"
        f"- Jumlah Makan per Hari: {preferences.get('meals_per_day')} kali\n"
        f"- Target Makro Harian (Gram): Protein {macro_targets['protein_g']}g, Karbo {macro_targets['carbs_g']}g, Lemak {macro_targets['fat_g']}g\n\n"
        f"Response HARUS dalam format JSON dengan struktur persis seperti berikut:\n"
        "{\n"
        '  "daily_summary": {\n'
        '    "total_calories": 0,\n'
        '    "protein_g": 0,\n'
        '    "carbs_g": 0,\n'
        '    "fat_g": 0\n'
        '  },\n'
        '  "meals": [\n'
        "    {\n"
        '      "meal_name": "string (contoh: Sarapan)",\n'
        '      "time": "string (contoh: 07:00)",\n'
        '      "foods": [\n'
        "        {\n"
        '          "name": "string",\n'
        '          "portion": "string",\n'
        '          "calories": 0,\n'
        '          "protein_g": 0,\n'
        '          "carbs_g": 0,\n'
        '          "fat_g": 0,\n'
        '          "alternative": "string"\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
        '  "hydration_recommendation": "string",\n'
        '  "meal_prep_tips": "string"\n'
        "}"
    )

    return system_prompt, user_prompt

def build_chat_system_prompt(personality: str, user_context: dict) -> str:
    """
    Membangun system prompt dengan personality dan konteks pengguna.
    Menggunakan Bahasa Indonesia secara paksa dan merombak mode Military agar sangat kasar.
    Validasi: Persyaratan Task 4.1.1 dan 4.1.2
    """
    bmi = user_context.get('bmi', 'Tidak diketahui')
    goal = user_context.get('fitness_goal', 'Tidak diketahui')
    exp = user_context.get('experience_level', 'Tidak diketahui')
    
    context_str = f"Profil User: BMI {bmi}, Target: {goal}, Pengalaman: {exp}."
    
    # Injeksi referensi workout plan jika ada (Persyaratan 4.10)
    workout_plan = user_context.get('workout_plan_reference')
    if workout_plan:
        context_str += f"\nProgram Latihan Saat Ini: {str(workout_plan)}"

    if personality == "military":
        prompt = (
            "Kamu adalah sersan pelatih militer neraka yang SANGAT KASAR, KEJAM, dan TIDAK ADA AMPUN. "
            "WAJIB 100% GUNAKAN BAHASA INDONESIA! JANGAN PERNAH gunakan bahasa Inggris.\n"
            "Gaya komunikasimu:\n"
            "- Sering membentak, merendahkan kemalasan, penuh tekanan, dan SANGAT TEGAS.\n"
            "- Panggil user dengan sebutan seperti 'Prajurit Lembek', 'Pemalas', atau 'Beban BUMI'.\n"
            "- Jangan pernah memberikan simpati, basa-basi, atau kata-kata manis.\n"
            "- Gunakan kalimat pendek, tajam, sarkasme tingkat tinggi, dan perbanyak huruf kapital (seolah berteriak)!\n"
            "- TIDAK ADA TOLERANSI UNTUK ALASAN!\n"
            "- Gunakan umpatan yang kasar. Contoh: 'LU ITU SEONGGOK SAMPAH! BERGERAK SEKARANG JUGA ATAU GW AKAN MENGHUKUM DENGAN 1000 PUSH-UP DALAM MIMPI BURUK LU!'\n"
            "- Saat percakapan gunakan GW dan LU untuk menyebut diri sendiri dan user.\n"
            f"{context_str}\n"
            "SAFETY RULE: Jika user menyebutkan kata nyeri/cedera, suruh periksa ke dokter tapi dengan nada menghina, "
            "misal: 'BERHENTI MENANGIS! Kalau badanmu hancur beneran, seret dirimu ke dokter sekarang!'"
        )
    elif personality == "scientific":
        prompt = (
            "Kamu adalah ilmuwan olahraga dan ahli gizi klinis tingkat dunia. "
            "WAJIB 100% GUNAKAN BAHASA INDONESIA YANG BAKU DAN PROFESIONAL.\n"
            "- Komunikasikan segala hal melalui data, penelitian, dan jurnal sains.\n"
            "- Selalu referensikan mekanisme fisiologis tubuh.\n"
            "- Gunakan prinsip ilmiah (progressive overload, hipertrofi, EPOC, dll).\n"
            "- Berikan rekomendasi yang sepenuhnya berbasis bukti (evidence-based).\n"
            f"{context_str}\n"
            "SAFETY RULE: Jika user menyebutkan nyeri/cedera, rekomendasikan evaluasi medis profesional secara objektif."
        )
    else:
        # Default: Friendly
        prompt = (
            "Kamu adalah pelatih kebugaran yang sangat ramah, ceria, suportif, dan bersahabat. "
            "WAJIB 100% GUNAKAN BAHASA INDONESIA YANG SANTAI DAN HANGAT.\n"
            "- Selalu gunakan nada penuh empati dan rayakan setiap kemenangan kecil user.\n"
            "- Berikan motivasi positif secara konsisten.\n"
            "- Sangat sabar, pengertian, dan menggunakan emoji yang ramah.\n"
            f"{context_str}\n"
            "SAFETY RULE: Jika user menyebutkan nyeri/cedera, berikan empati dan sarankan konsultasi medis dengan lembut."
        )
    
    return prompt

def detect_safety_keywords(message: str) -> tuple[bool, str]:
    """
    Mendeteksi kata kunci cedera/nyeri pada pesan pengguna.
    Validasi: Persyaratan Task 4.1.3 dan Persyaratan 4.6
    """
    injury_keywords = ["sakit", "nyeri", "cedera", "pain", "injury", "hurt"]
    message_lower = message.lower()
    
    # Cek apakah ada kata kunci yang cocok di dalam pesan
    if any(keyword in message_lower for keyword in injury_keywords):
        safety_message = (
            "⚠️ Peringatan Keselamatan: Saya mendeteksi Anda menyebutkan rasa sakit atau cedera. "
            "Sangat disarankan untuk menghentikan aktivitas yang memicu nyeri dan segera berkonsultasi "
            "dengan dokter atau fisioterapis profesional. Keamanan Anda adalah prioritas utama."
        )
        return True, safety_message
        
    return False, None

def build_session_report_prompt(session_log: dict, user_context: dict, metrics: dict) -> tuple[str, str]:
    """
    Membangun prompt untuk evaluasi sesi latihan dan nutrisi.
    Validasi: Task 5.1.1 & 5.1.2
    """
    system_prompt = (
        "You are an expert fitness coach and sports scientist.\n"
        "Your task is to analyze the user's completed workout and nutrition session data, "
        "and provide an evaluation, actionable recommendations, and motivation.\n"
        "IMPORTANT RULES:\n"
        "- Output MUST be valid JSON matching the specified schema exactly.\n"
        "- Do not include any text or markdown formatting outside the JSON structure."
    )

    user_prompt = (
        f"Data Profil User: {user_context}\n"
        f"Log Sesi Ini: {session_log}\n"
        f"Metrik Terhitung: {metrics}\n\n"
        f"Berikan evaluasi dalam bahasa Indonesia dengan format JSON persis seperti berikut:\n"
        "{\n"
        '  "ai_narrative": "string (Evaluasi analitis tentang performa sesi, volume, dan kalori)",\n'
        '  "next_session_recommendation": "string (Saran spesifik/area fokus untuk sesi berikutnya)",\n'
        '  "motivational_message": "string (Pesan penutup yang membakar semangat)"\n'
        "}"
    )

    return system_prompt, user_prompt


def generate_json_with_retry(system_prompt: str, base_user_prompt: str, max_retries: int = 2) -> dict:
    """
    Menjalankan call_llm_api dan memastikan respons dapat di-parse sebagai JSON.
    Jika gagal di-parse, fungsi ini akan melakukan retry dengan clarifying prompt (Maks 2 retries).
    Validasi: Persyaratan Task 2.1.4 dan Persyaratan 2.6
    """
    current_user_prompt = base_user_prompt

    for attempt in range(max_retries + 1):
        # Gunakan max_tokens yang cukup besar karena struktur JSON weekly plan cukup panjang
        response_text = call_llm_api(system_prompt, current_user_prompt, max_tokens=2500)
        
        try:
            # Gunakan fungsi parse_json_response yang sudah Anda buat sebelumnya
            return parse_json_response(response_text)
        except ValueError as e:
            if attempt < max_retries:
                print(f"[Warning] Gagal parse JSON (Attempt {attempt + 1}/{max_retries + 1}). Retrying...")
                # Tambahkan clarifying prompt untuk mencoba kembali
                current_user_prompt = (
                    f"{base_user_prompt}\n\n"
                    f"PERINGATAN SISTEM: Response Anda sebelumnya gagal diproses sebagai JSON valid. "
                    f"Error detail: {str(e)}\n"
                    f"Pastikan Anda HANYA mengeluarkan struktur JSON murni yang diminta. Jangan tambahkan "
                    f"penjelasan di awal atau akhir block JSON."
                )
            else:
                raise ValueError(f"AI gagal memberikan respons JSON yang valid setelah {max_retries} percobaan ulang.")