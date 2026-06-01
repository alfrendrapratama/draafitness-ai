# DRAAFITNESS - AI Personal Fitness Companion 🏋️‍♂️

A stateless Single Page Application (SPA) powered by Generative AI, designed to be your ultimate personal fitness assistant. This application analyzes your body metrics, generates customized workout programs, plans precise diet menus, and tracks your real-time workout session progress.

## ✨ Key Features

1. **Profile & BMI Analysis:** Automatically calculates BMI, BMR, and TDEE based on user metrics[cite: 2].
2. **AI Workout Generator:** Generates a weekly workout program based on Progressive Overload, tailored to goals, location, and available equipment[cite: 2].
3. **AI Nutrition Planner:** Creates a detailed daily meal plan with exact macronutrient distribution and hydration recommendations[cite: 2].
4. **AI Fitness Chatbot:** An interactive chat assistant with 3 unique personalities (Friendly, Military, Scientific) and built-in medical/injury detection guardrails[cite: 2].
5. **Session Progress Tracker:** Tracks reps, weights, duration, and calories in real-time, concluding with an AI-generated evaluation report[cite: 2].

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JavaScript.
- **Backend:** Python 3, Flask, Flask-CORS[cite: 1].
- **AI Integration:** LLM API (Google Gemini / OpenAI)[cite: 1].
- **Storage:** Browser Session Storage (Zero-footprint/Stateless architecture)[cite: 1].

---

## 🚀 How to Run (Local Development)

To run this application locally, you will need two separate terminal windows running simultaneously: one for the Backend and one for the Frontend.

### Step 1: Backend Setup (Flask API)

1. Open your first terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a Virtual Environment to keep dependencies isolated:
   ```bash
   python -m venv venv
   ```
3. Activate the Virtual Environment:
   ```bash
   - Windows: `venv\Scripts\activate`,
   - Mac/Linux: `source` venv/bin/activate`,
   ```
4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file inside the `backend` folder and add your LLM API Key:

   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here

   ```

6. Start the Backend server:
   ```bash
   python app.py
   ```
   (The backend API will run and listen on `http://127.0.0.1:5000`).

### Step 2: Frontend Setup (Local Web Server)

1. Leave the backend terminal running. Open a New Terminal window.

2. Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

3. Start the built-in Python HTTP server on port 8000:

   ```bash
   python -m http.server 8000
   ```

4. Open your web browser (Chrome/Edge/Safari) and go to:
   `http://localhost:8000` or `http://127.0.0.1:8000`

The application is now ready to use! Enjoy training with your AI Coach!

## 📂 Directory Structure

```
   DraaFitness_Prototype/
│
├── 📁 frontend/             # Client-side UI and Logic
│   ├── 📄 index.html
│   ├── 📄 style.css
│   └── 📄 script.js
│
├── 📁 backend/              # Server-side Logic and AI Integration
│   ├── 📄 app.py
│   ├── 📄 config.py
│   ├── 📄 requirements.txt
│   ├── 📄 .env.example
│   ├── 📁 routes/           # API endpoint controllers
│   ├── 📁 services/         # Calculator logic & AI Prompt Builder
│   └── 📁 utils/            # Middleware (Security & Rate Limiter)
│
└── 📄 README.md             # This documentation
```

## 🔒 Security & Privacy Notes

- The `.env` file containing your credentials (API Keys) is included in the `.gitignore` file and will not be uploaded to any public repository[cite: 1].
- This application does not use external databases. All activity data and user profiles are stored in the browser's `sessionStorage` and will be automatically deleted when the browser tab is closed[cite: 1, 2].
