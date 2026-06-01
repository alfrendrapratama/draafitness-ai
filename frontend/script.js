document.addEventListener('DOMContentLoaded', () => {

    // --- 1. VIEW NAVIGATION LOGIC (SPA Style) ---
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    
    console.log('NAV DEBUG: Found', navItems.length, 'nav items');
    console.log('NAV DEBUG: Found', viewSections.length, 'view sections');
    viewSections.forEach((section, idx) => {
        console.log(`NAV DEBUG: Section ${idx}: id="${section.id}", class="${section.className}"`);
    });

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Nav item clicked:', this.getAttribute('data-target'));
            
            // A. Update visual menu yang aktif (highlight)
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // B. Sembunyikan semua halaman
            viewSections.forEach(section => {
                section.classList.remove('active');
            });

            // C. Tampilkan halaman yang sesuai dengan data-target
            const targetId = this.getAttribute('data-target');
            console.log('Target ID:', targetId);
            const targetSection = document.getElementById(targetId);
            console.log('Target Section:', targetSection);
            
            if (targetSection) {
                targetSection.classList.add('active');
                console.log('Active class added to:', targetId);
                
                // --- PERBAIKAN: Trigger updateDashboard jika targetnya adalah dashboard ---
                if (targetId === 'dashboard-view') {
                    // Pastikan fungsi updateDashboard sudah terdeklarasi di scope file script.js Anda
                    if (typeof updateDashboard === 'function') {
                        updateDashboard();
                    }
                }
                
            } else {
                console.warn('Target section not found for:', targetId);
            }
        });
    });

    // Load saved profile from session storage on page load
    try {
        loadProfileFromSession();
    } catch (error) {
        console.error('Error loading profile from session:', error);
    }

    // --- 2. THEME TOGGLE (Dark/Light Mode) ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.body.removeAttribute('data-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.setAttribute('data-theme', 'light');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- SESSION STORAGE HELPERS ---
    function saveToSession(key, data) {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    function loadFromSession(key) {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // --- 3. LANGUAGE TOGGLE (EN/ID) ---
    const langToggleBtn = document.getElementById('langToggle');
    let currentLang = 'en';

    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'id' : 'en';
        
        const textElements = document.querySelectorAll('.lang');
        textElements.forEach(el => {
            if (currentLang === 'id') {
                el.innerText = el.getAttribute('data-id');
            } else {
                el.innerText = el.getAttribute('data-en');
            }
        });

        langToggleBtn.innerText = currentLang === 'en' ? 'ID/EN' : 'EN/ID';
        
        const searchInput = document.getElementById('searchInput');
        const chatInput = document.getElementById('aiChatInput');
        if(currentLang === 'id') {
            searchInput.placeholder = "Cari latihan...";
            chatInput.placeholder = "Tanya AI Coach...";
        } else {
            searchInput.placeholder = "Search exercises...";
            chatInput.placeholder = "Ask AI Coach...";
        }
    });

    // --- 4. FORM VALIDATION (BMI Analysis) ---
    const profileForm = document.getElementById('profileForm');
    const formInputs = profileForm.querySelectorAll('input, select');

    // Validation rules for each field
    const validationRules = {
        height: {
            min: 100,
            max: 250,
            errorMsg: 'Height must be between 100-250 cm'
        },
        weight: {
            min: 30,
            max: 300,
            errorMsg: 'Weight must be between 30-300 kg'
        },
        age: {
            min: 10,
            max: 100,
            errorMsg: 'Age must be between 10-100 years'
        },
        gender: {
            required: true,
            errorMsg: 'Please select a gender'
        },
        activityLevel: {
            required: true,
            errorMsg: 'Please select an activity level'
        },
        fitnessGoal: {
            required: true,
            errorMsg: 'Please select a fitness goal'
        }
    };

    // Function to validate a single field
    function validateField(field) {
        const fieldName = field.name;
        const fieldValue = field.value.trim();
        const rule = validationRules[fieldName];
        const errorElement = document.getElementById(`${fieldName}Error`);

        if (!rule) return true; // No rule defined, skip validation

        let isValid = true;
        let errorMsg = '';

        // Check if field is required and empty
        if (rule.required && !fieldValue) {
            isValid = false;
            errorMsg = rule.errorMsg;
        }
        // Check numeric range for number inputs
        else if (field.type === 'number' && fieldValue) {
            const numValue = parseFloat(fieldValue);
            if (isNaN(numValue)) {
                isValid = false;
                errorMsg = 'Please enter a valid number';
            } else if (rule.min !== undefined && numValue < rule.min) {
                isValid = false;
                errorMsg = rule.errorMsg;
            } else if (rule.max !== undefined && numValue > rule.max) {
                isValid = false;
                errorMsg = rule.errorMsg;
            }
        }
        // Check enum/select fields
        else if (field.tagName === 'SELECT' && !fieldValue) {
            isValid = false;
            errorMsg = rule.errorMsg;
        }

        // Update UI: highlight field and show error message
        if (!isValid) {
            field.classList.add('form-input-error');
            if (errorElement) {
                errorElement.textContent = errorMsg;
                errorElement.style.display = 'block';
            }
        } else {
            field.classList.remove('form-input-error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }

        return isValid;
    }

    // Add real-time validation listeners to all form inputs
    formInputs.forEach(input => {
        // Validate on blur (when user leaves the field)
        input.addEventListener('blur', () => {
            validateField(input);
        });

        // Validate on input (real-time as user types)
        input.addEventListener('input', () => {
            validateField(input);
        });

        // Validate on change (for select dropdowns)
        input.addEventListener('change', () => {
            validateField(input);
        });
    });

    // Function to validate entire form
    function validateProfileForm() {
        let isFormValid = true;
        formInputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });
        return isFormValid;
    }

    // --- 4.1 SESSION STORAGE HELPERS ---
    function saveToSession(key, data) {
        /**
         * Saves data to browser session storage as JSON.
         * 
         * @param {string} key - Session storage key
         * @param {Object} data - Data object to save
         */
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    function loadFromSession(key) {
        /**
         * Loads data from browser session storage.
         * 
         * @param {string} key - Session storage key
         * @returns {Object|null} Parsed data object or null if not found
         */
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // --- 4.4 LOAD PROFILE FROM SESSION STORAGE ---
    function loadProfileFromSession() {
        /**
         * Loads user profile from session storage and populates the form.
         * This allows users to see their previously saved profile data.
         */
        const savedProfile = loadFromSession('userProfile');
        
        if (savedProfile) {
            // Populate form fields with saved data
            const nameField = document.getElementById('name');
            if (nameField) nameField.value = savedProfile.name || '';
            
            const heightField = document.getElementById('height');
            if (heightField) heightField.value = savedProfile.height;
            
            const weightField = document.getElementById('weight');
            if (weightField) weightField.value = savedProfile.weight;
            
            const ageField = document.getElementById('age');
            if (ageField) ageField.value = savedProfile.age;
            
            const genderField = document.getElementById('gender');
            if (genderField) genderField.value = savedProfile.gender;
            
            const activityLevelField = document.getElementById('activityLevel');
            if (activityLevelField) activityLevelField.value = savedProfile.activityLevel;
            
            const fitnessGoalField = document.getElementById('fitnessGoal');
            if (fitnessGoalField) fitnessGoalField.value = savedProfile.fitnessGoal;
            
            console.log('Profile loaded from session storage:', savedProfile);
            
            // If analysis results exist, display them
            if (savedProfile.bmi) {
                const analysisData = {
                    bmi: savedProfile.bmi,
                    bmi_category: savedProfile.bmiCategory,
                    bmr: savedProfile.bmr,
                    tdee: savedProfile.tdee,
                    target_calories: savedProfile.targetCalories,
                    ai_interpretation: savedProfile.aiInterpretation,
                    calorie_breakdown: {
                        protein_kcal: savedProfile.calorieBreakdown?.proteinKcal || 0,
                        carbs_kcal: savedProfile.calorieBreakdown?.carbsKcal || 0,
                        fat_kcal: savedProfile.calorieBreakdown?.fatKcal || 0,
                        protein_g: savedProfile.calorieBreakdown?.proteinG || 0,
                        carbs_g: savedProfile.calorieBreakdown?.carbsG || 0,
                        fat_g: savedProfile.calorieBreakdown?.fatG || 0
                    }
                };
                renderAnalysisResult(analysisData);
            }
        }
    }

    // --- 4.2 TOAST NOTIFICATION SYSTEM ---
    function showToast(message, type = 'info', duration = 3000) {
        /**
         * Shows a toast notification to the user.
         * 
         * @param {string} message - Message to display
         * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
         * @param {number} duration - Duration in milliseconds (0 = persistent)
         */
        
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        const bgColor = {
            'success': 'rgba(16, 185, 129, 0.9)',
            'error': 'rgba(239, 68, 68, 0.9)',
            'info': 'rgba(59, 130, 246, 0.9)',
            'warning': 'rgba(245, 158, 11, 0.9)'
        }[type] || 'rgba(59, 130, 246, 0.9)';

        const icon = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle',
            'warning': 'fa-warning'
        }[type] || 'fa-info-circle';

        toast.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
            pointer-events: auto;
            max-width: 400px;
            word-wrap: break-word;
        `;

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    // Add CSS animations for toast
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // --- TASK 1.7.3 & 1.7.6: API CALL & ERROR HANDLING ---
    async function analyzeProfile(formData) {
        const submitBtn = profileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        
        // 1.7.6 Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

        try {
            // Konversi camelCase ke snake_case sesuai API Contract
            const payload = {
                height: formData.height,
                weight: formData.weight,
                age: formData.age,
                gender: formData.gender,
                activity_level: formData.activityLevel,
                fitness_goal: formData.fitnessGoal
            };

            // Menggunakan 127.0.0.1 untuk mencegah error 405/CORS resolve di Windows
            const response = await fetch('http://127.0.0.1:5000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            // Gunakan payload yang sudah di-convert ke snake_case sesuai API Contract
            body: JSON.stringify(payload) 
        });

            const data = await response.json();

            // 1.7.6 Error handling respons API
            if (!response.ok) {
                const errorMsg = data.details || data.message || `HTTP Error ${response.status}`;
                throw new Error(errorMsg);
            }

            // 1.7.5 Implementasi Session Storage (Data Profil)
            const userProfile = {
                name: formData.name || '',
                height: formData.height,
                weight: formData.weight,
                age: formData.age,
                gender: formData.gender,
                activityLevel: formData.activityLevel,
                fitnessGoal: formData.fitnessGoal,
                bmi: data.bmi,
                bmiCategory: data.bmi_category,
                bmr: data.bmr,
                tdee: data.tdee,
                targetCalories: data.target_calories,
                aiInterpretation: data.ai_interpretation,
                calorieBreakdown: data.calorie_breakdown, // Simpan data makro!
                savedAt: new Date().toISOString()
            };

            saveToSession('userProfile', userProfile);
            return data;

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calculator"></i> <span class="lang" data-en="Analyze Profile" data-id="Analisis Profil">Analyze Profile</span>';
        }
    }

    // --- 4.3 RENDER ANALYSIS RESULT ---
    function renderAnalysisResult(data) {
        /**
         * Renders the analysis results in the UI.
         * Displays BMI gauge, category, BMR, TDEE, target calories, and macro breakdown.
         * 
         * @param {Object} data - Analysis result object from API with keys:
         *   - bmi: number
         *   - bmi_category: string
         *   - bmr: number
         *   - tdee: number
         *   - target_calories: number
         *   - ai_interpretation: string
         *   - calorie_breakdown: {protein_kcal, carbs_kcal, fat_kcal, protein_g, carbs_g, fat_g}
         */
        try {
            // Hide loading and error states
            const loadingElem = document.getElementById('analysisLoading');
            const errorElem = document.getElementById('analysisError');
            if (loadingElem) loadingElem.style.display = 'none';
            if (errorElem) errorElem.style.display = 'none';

            // Update BMI result card
            const resultBMI = document.getElementById('resultBMI');
            const resultBMICategory = document.getElementById('resultBMICategory');
            if (resultBMI) resultBMI.textContent = data.bmi.toFixed(1);
            if (resultBMICategory) resultBMICategory.textContent = data.bmi_category;

            // Update BMR, TDEE, Target Calories
            const resultBMR = document.getElementById('resultBMR');
            const resultTDEE = document.getElementById('resultTDEE');
            const resultTargetCalories = document.getElementById('resultTargetCalories');
            if (resultBMR) resultBMR.textContent = Math.round(data.bmr);
            if (resultTDEE) resultTDEE.textContent = Math.round(data.tdee);
            if (resultTargetCalories) resultTargetCalories.textContent = Math.round(data.target_calories);

            // Update macro breakdown
            const breakdown = data.calorie_breakdown;
            if (breakdown) {
                const proteinKcal = document.getElementById('proteinKcal');
                const proteinGrams = document.getElementById('proteinGrams');
                const carbsKcal = document.getElementById('carbsKcal');
                const carbsGrams = document.getElementById('carbsGrams');
                const fatKcal = document.getElementById('fatKcal');
                const fatGrams = document.getElementById('fatGrams');
                
                if (proteinKcal) proteinKcal.textContent = Math.round(breakdown.protein_kcal) + ' kcal';
                if (proteinGrams) proteinGrams.textContent = Math.round(breakdown.protein_g) + ' g';
                if (carbsKcal) carbsKcal.textContent = Math.round(breakdown.carbs_kcal) + ' kcal';
                if (carbsGrams) carbsGrams.textContent = Math.round(breakdown.carbs_g) + ' g';
                if (fatKcal) fatKcal.textContent = Math.round(breakdown.fat_kcal) + ' kcal';
                if (fatGrams) fatGrams.textContent = Math.round(breakdown.fat_g) + ' g';
            }

            // Update AI interpretation
            const aiInterpretation = document.getElementById('aiInterpretation');
            if (aiInterpretation) aiInterpretation.textContent = data.ai_interpretation;

            // Apply BMI category color coding
            const bmiCategoryElement = document.getElementById('resultBMICategory');
            if (bmiCategoryElement) {
                bmiCategoryElement.style.color = getBMICategoryColor(data.bmi_category);
            }

        // Show results section
            const analysisResults = document.getElementById('analysisResults');
            if (analysisResults) analysisResults.style.display = 'block';

            // FIX: Gunakan scrollTo pada container spesifik alih-alih scrollIntoView global
            setTimeout(() => {
                const resultsElem = document.getElementById('analysisResults');
                const mainContent = document.querySelector('.main-content');
                
                if (resultsElem && mainContent) {
                    mainContent.scrollTo({
                        top: resultsElem.offsetTop - 30, // Offset 30px agar tidak terlalu mepet atas
                        behavior: 'smooth'
                    });
                }
            }, 100);

            updateDashboard();
        } catch (error) {
            console.error('Error rendering analysis result:', error);
        }
    }

    // Helper function to get color based on BMI category
    function getBMICategoryColor(category) {
        const colors = {
            'Underweight': '#3b82f6',      // Blue
            'Normal': '#10b981',           // Green
            'Overweight': '#f59e0b',       // Amber
            'Obese': '#ef4444'             // Red
        };
        return colors[category] || '#8a909d';
    }

// --- TASK 1.7.2: FORM SUBMISSION & VALIDATION ---
    let lastFormData = null;

    // profileForm SUDAH dideklarasikan di baris 126, jadi kita langsung pakai saja!
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            // Mencegah form melakukan refresh halaman (PENTING!)
            e.preventDefault();

            if (typeof validateProfileForm === 'function' && !validateProfileForm()) {
                showToast('Tolong perbaiki data form yang berwarna merah.', 'warning');
                return;
            }

            // Kumpulkan data dan pastikan tipe datanya sesuai API Contract
            const formData = {
                name: document.getElementById('name')?.value.trim() || '',
                height: parseFloat(document.getElementById('height').value),
                weight: parseFloat(document.getElementById('weight').value),
                age: parseInt(document.getElementById('age').value),
                gender: document.getElementById('gender').value,
                activityLevel: document.getElementById('activityLevel').value,
                fitnessGoal: document.getElementById('fitnessGoal').value
            };

            // Simpan untuk fitur retry jika API gagal
            lastFormData = formData;

            // Reset error text & tampilkan indikator loading
            document.getElementById('analysisError').style.display = 'none';
            document.getElementById('analysisResults').style.display = 'none';
            document.getElementById('analysisLoading').style.display = 'block';
            
            // Panggil fungsi API
            analyzeProfile(formData)
                .then(data => {
                    document.getElementById('analysisLoading').style.display = 'none';
                    renderAnalysisResult(data);
                    showToast('Analisis AI berhasil!', 'success');
                })
                .catch(error => {
                    document.getElementById('analysisLoading').style.display = 'none';
                    document.getElementById('analysisError').style.display = 'block';
                    const errorMsgEl = document.getElementById('errorMessage');
                    if (errorMsgEl) errorMsgEl.textContent = error.message;
                    showToast(error.message, 'error');
                });
        });
    }

    // Add retry button functionality
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (lastFormData) {
                console.log('Retrying analysis with previous form data...');
                profileForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // --- 5. WORKOUT GENERATOR LOGIC ---
    const workoutForm = document.getElementById('workoutForm');
    const workoutResults = document.getElementById('workoutResults');
    const workoutLoading = document.getElementById('workoutLoading');
    const workoutScheduleContainer = document.getElementById('workoutScheduleContainer');
    
    // Motivation messages for loading state
    const motivationMsgs = [
        "Crafting your personalized workout...",
        "Optimizing your training sessions...",
        "Consulting with AI fitness experts...",
        "Building your path to success...",
        "Almost there, champion!"
    ];

    function getRandomMotivation() {
        return motivationMsgs[Math.floor(Math.random() * motivationMsgs.length)];
    }

    // 2.3.4 Implementasi API call generateWorkout(preferences)
    async function generateWorkout(preferences) {
        // Menggunakan 127.0.0.1 untuk mencegah masalah CORS
        const response = await fetch('http://127.0.0.1:5000/api/workout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(preferences)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.details || data.error || 'Failed to generate workout plan');
        }
        return data;
    }

    // 2.4.1 & 2.4.2 Implementasi renderWorkoutPlan(data) dan Accordion
    function renderWorkoutPlan(data) {
        document.getElementById('workoutProgramName').textContent = data.program_name || 'Workout Plan';
        document.getElementById('workoutProgramSummary').textContent = data.program_summary || '';
        document.getElementById('progressiveOverloadGuide').textContent = data.progressive_overload_guide || '';
        document.getElementById('workoutSafetyNotes').textContent = data.safety_notes || '';

        workoutScheduleContainer.innerHTML = '';
        
        if (data.weekly_schedule && Array.isArray(data.weekly_schedule)) {
            data.weekly_schedule.forEach((item, index) => {
                const dayCard = document.createElement('div');
                dayCard.className = 'card glass-accent';
                dayCard.style.marginBottom = '15px';
                
                const isRest = item.type === 'rest';
                const sessionName = isRest ? 'Rest Day' : (item.session?.name || 'Workout');
                
                // Header Accordion
                const headerHTML = `
                    <div class="card-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="toggleAccordion(this)">
                        <span><strong>${item.day}</strong>: ${sessionName}</span>
                        <i class="fas fa-chevron-down" style="transition: transform 0.3s; transform: ${index === 0 && !isRest ? 'rotate(180deg)' : 'rotate(0deg)'};"></i>
                    </div>
                `;

                // Konten Accordion
                let contentHTML = `<div class="workout-details" style="display: ${index === 0 && !isRest ? 'block' : 'none'}; padding-top: 15px;">`;

                if (!isRest && item.session && item.session.exercises) {
                    contentHTML += '<ul style="list-style: none; padding: 0;">';
                    item.session.exercises.forEach(ex => {
                        contentHTML += `
                            <li style="margin-bottom: 15px; padding: 15px;" class="glass-input">
                                <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--primary-color);">
                                    <span>${ex.name}</span>
                                    <span>${ex.sets} sets x ${ex.reps}</span>
                                </div>
                                <div style="font-size: 0.85rem; margin-top: 8px; color: var(--text-main);">
                                    <i class="fas fa-stopwatch text-primary"></i> Rest: ${ex.rest} | 
                                    <i class="fas fa-lightbulb text-primary" style="margin-left: 10px;"></i> Tip: ${ex.coaching_tip}
                                </div>
                                <div style="font-size: 0.8rem; margin-top: 8px; color: var(--accent-green); font-style: italic;">
                                    <i class="fas fa-exchange-alt"></i> Alternative: ${ex.alternative}
                                </div>
                            </li>
                        `;
                    });
                    contentHTML += '</ul>';
                } else {
                    contentHTML += '<p class="text-muted" style="margin: 0;"><i class="fas fa-bed"></i> Nikmati pemulihan Anda! Istirahat penting untuk perkembangan otot.</p>';
                }

                contentHTML += '</div>';
                dayCard.innerHTML = headerHTML + contentHTML;
                workoutScheduleContainer.appendChild(dayCard);
            });
        }

        if (workoutResults) workoutResults.style.display = 'block';
    }

    // Fungsi global pembantu untuk toggle efek Accordion
    window.toggleAccordion = function(element) {
        const content = element.nextElementSibling;
        const icon = element.querySelector('i.fa-chevron-down');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            if(icon) icon.style.transform = 'rotate(180deg)';
        } else {
            content.style.display = 'none';
            if(icon) icon.style.transform = 'rotate(0deg)';
        }
    };

    // --- UX LOGIC: WORKOUT EQUIPMENT AUTO-TOGGLE ---
    const locationSelect = document.querySelector('select[name="workout_location"]');
    const eqCheckboxes = document.querySelectorAll('input[name="equipment"]');
    const eqNone = document.getElementById('eqNone');

    // 1. Auto-select berdasarkan lokasi
    if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
            const loc = e.target.value;
            if (loc === 'gym') {
                // Jika Gym: Centang semua kecuali 'No Equipment'
                eqCheckboxes.forEach(cb => cb.checked = (cb.value !== 'none'));
            } else if (loc === 'outdoor') {
                // Jika Outdoor: Centang 'No Equipment' dan 'Pull-up Bar'
                eqCheckboxes.forEach(cb => cb.checked = false);
                eqNone.checked = true;
                const pullup = document.querySelector('input[value="pullup_bar"]');
                if(pullup) pullup.checked = true;
            } else {
                // Jika Home: Reset state (kosongkan)
                eqCheckboxes.forEach(cb => cb.checked = false);
            }
        });
    }

    // 2. Mutual Exclusion: Jika 'No Equipment' dicentang, hapus centang alat lain
    if (eqNone) {
        eqNone.addEventListener('change', (e) => {
            if (e.target.checked) {
                eqCheckboxes.forEach(cb => {
                    if (cb !== eqNone) cb.checked = false;
                });
            }
        });
    }

    // 3. Mutual Exclusion: Jika alat lain dicentang, hapus centang 'No Equipment'
    eqCheckboxes.forEach(cb => {
        if (cb !== eqNone) {
            cb.addEventListener('change', () => {
                if (cb.checked && eqNone) eqNone.checked = false;
            });
        }
    });

    if (workoutForm) {
        workoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(workoutForm);
            const equipmentArray = formData.getAll('equipment');

            // 2.3.3 Validasi Form: Pastikan minimal 1 alat dipilih
            if (equipmentArray.length === 0) {
                showToast('Mohon pilih setidaknya satu opsi peralatan (misal: No Equipment).', 'warning');
                return;
            }

            const profile = loadFromSession('userProfile');
            const preferences = {
                fitness_goal: formData.get('fitness_goal'),
                experience_level: formData.get('experience_level'),
                workout_location: formData.get('workout_location'),
                focus_area: formData.get('focus_area'),
                days_per_week: parseInt(formData.get('days_per_week')),
                session_duration: parseInt(formData.get('session_duration')),
                equipment: equipmentArray,
                bmi: profile ? profile.bmi : null,
                tdee: profile ? profile.tdee : null
            };

            // 2.3.5 Loading state
            document.getElementById('workout-form-container').style.display = 'none';
            workoutResults.style.display = 'none';
            workoutLoading.style.display = 'block';
            
            const loadingMsg = document.getElementById('workoutLoadingMsg');
            const interval = setInterval(() => {
                loadingMsg.textContent = getRandomMotivation();
            }, 3000);

            try {
                const data = await generateWorkout(preferences);
                clearInterval(interval);
                workoutLoading.style.display = 'none';
                
                renderWorkoutPlan(data);
                
                // 2.4.5 Session storage for workout plan
                const workoutPlanData = {
                    programName: data.program_name,
                    weeklySchedule: data.weekly_schedule,
                    progressiveOverloadGuide: data.progressive_overload_guide,
                    savedAt: new Date().toISOString()
                };
                saveToSession('workoutPlan', workoutPlanData);
                showToast('Rencana latihan berhasil dibuat oleh AI!', 'success');
            } catch (err) {
                clearInterval(interval);
                workoutLoading.style.display = 'none';
                document.getElementById('workout-form-container').style.display = 'block';
                showToast(err.message, 'error');
            }
        });
    }

    // 2.4.3 Implementasi "Modify Plan" button
    const modifyWorkoutBtn = document.getElementById('modifyWorkoutBtn');
    if (modifyWorkoutBtn) {
        modifyWorkoutBtn.addEventListener('click', () => {
            if(workoutResults) workoutResults.style.display = 'none';
            
            const workoutFormContainer = document.getElementById('workout-form-container');
            if(workoutFormContainer) workoutFormContainer.style.display = 'block';
            
            // Scroll mulus kembali ke form
            const mainContent = document.querySelector('.main-content');
            if (mainContent && workoutFormContainer) {
                mainContent.scrollTo({
                    top: workoutFormContainer.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    }

    // 2.4.4 Implementasi "Copy to Clipboard" (Human Readable)
    const copyWorkoutBtn = document.getElementById('copyWorkoutBtn');
    if (copyWorkoutBtn) {
        copyWorkoutBtn.addEventListener('click', () => {
            const plan = loadFromSession('workoutPlan');
            if (plan && plan.weeklySchedule) {
                let textToCopy = `💪 ${plan.programName}\n\n`;
                
                plan.weeklySchedule.forEach(day => {
                    textToCopy += `--- ${day.day} ---\n`;
                    if (day.type === 'rest') {
                        textToCopy += `Rest Day\n\n`;
                    } else {
                        textToCopy += `Session: ${day.session.name}\n`;
                        day.session.exercises.forEach(ex => {
                            textToCopy += `- ${ex.name}: ${ex.sets} sets x ${ex.reps} (Rest: ${ex.rest})\n`;
                            textToCopy += `  Tip: ${ex.coaching_tip}\n`;
                            textToCopy += `  Alternative: ${ex.alternative}\n`;
                        });
                        textToCopy += '\n';
                    }
                });
                
                textToCopy += `📈 Progressive Overload Guide:\n${plan.progressiveOverloadGuide}`;

                navigator.clipboard.writeText(textToCopy)
                    .then(() => showToast('Jadwal berhasil disalin ke clipboard!', 'success'))
                    .catch(() => showToast('Gagal menyalin data', 'error'));
            } else {
                showToast('Tidak ada data rencana latihan untuk disalin.', 'warning');
            }
        });
    }

    // 2.4.4 Implementasi "Print"
    const printWorkoutBtn = document.getElementById('printWorkoutBtn');
    if (printWorkoutBtn) {
        printWorkoutBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Load saved workout plan if exists
    const savedWorkout = loadFromSession('workoutPlan');
    if (savedWorkout) {
        renderWorkoutPlan({
            program_name: savedWorkout.programName,
            program_summary: "Your saved plan", 
            weekly_schedule: savedWorkout.weeklySchedule,
            progressive_overload_guide: savedWorkout.progressiveOverloadGuide,
            safety_notes: "Consult a professional if you have any pre-existing conditions."
        });
        document.getElementById('workout-form-container').style.display = 'none';
    }

    // Update link from dashboard
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    if (startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => {
            document.querySelector('[data-target="workout-view"]').click();
        });
    }

    // --- 6. NUTRITION PLANNER LOGIC ---
    const nutritionForm = document.getElementById('nutritionForm');
    const nutritionResults = document.getElementById('nutritionResults');
    const nutritionLoading = document.getElementById('nutritionLoading');
    const nutritionCaloriesInput = document.getElementById('nutritionCalories');
    const targetCaloriesDisplay = document.getElementById('targetCaloriesDisplay');

    // 3.3.2 Sinkronisasi Slider Kalori
    if (nutritionCaloriesInput && targetCaloriesDisplay) {
        nutritionCaloriesInput.addEventListener('input', (e) => {
            targetCaloriesDisplay.textContent = e.target.value;
        });
    }

    // Auto-populate Target Calories from Profile
    function syncNutritionCalories() {
        const profile = loadFromSession('userProfile');
        if (profile && profile.targetCalories && nutritionCaloriesInput) {
            nutritionCaloriesInput.value = Math.round(profile.targetCalories);
            targetCaloriesDisplay.textContent = Math.round(profile.targetCalories);
        }
    }

    // Panggil saat navigasi menu Nutrition diklik
    document.querySelector('[data-target="nutrition-view"]').addEventListener('click', syncNutritionCalories);

    // 3.3.4 API Call Logic
    async function generateNutrition(preferences) {
        const response = await fetch('http://127.0.0.1:5000/api/nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preferences)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || 'Failed to generate nutrition plan');
        return data;
    }

    // 3.4.1 & 3.4.2 Render Logic
    function renderMealPlan(data) {
        const summary = data.daily_summary;
        
        // Update Summary Texts
        document.getElementById('nutriTotalCalories').textContent = summary.total_calories;
        document.getElementById('nutriProteinG').textContent = `${summary.protein_g}g`;
        document.getElementById('nutriCarbsG').textContent = `${summary.carbs_g}g`;
        document.getElementById('nutriFatG').textContent = `${summary.fat_g}g`;

        // Update Donut Chart CSS Conic Gradient dynamically
        const totalMacros = summary.protein_g + summary.carbs_g + summary.fat_g;
        if (totalMacros > 0) {
            const pPct = (summary.protein_g / totalMacros) * 100;
            const cPct = (summary.carbs_g / totalMacros) * 100;
            
            const macroDonut = document.getElementById('macroDonut');
            // Protein (Blue), Carbs (Green), Fat (Amber)
            macroDonut.style.background = `conic-gradient(
                #3b82f6 0% ${pPct}%, 
                #10b981 ${pPct}% ${pPct + cPct}%, 
                #f59e0b ${pPct + cPct}% 100%
            )`;
        }

        // 3.4.3 Hydration & Tips
        document.getElementById('hydrationRec').textContent = data.hydration_recommendation || 'Minum minimal 2-3 liter air per hari.';
        document.getElementById('mealPrepTips').textContent = data.meal_prep_tips || 'Persiapkan bahan makanan di akhir pekan untuk mempermudah eksekusi.';

        // Render Meals Array
        const mealsContainer = document.getElementById('mealsContainer');
        mealsContainer.innerHTML = '';

        if (data.meals && Array.isArray(data.meals)) {
            data.meals.forEach(meal => {
                let foodsHTML = '';
                meal.foods.forEach(food => {
                    foodsHTML += `
                        <div class="meal-food-item">
                            <div style="display: flex; justify-content: space-between; font-weight: 600;">
                                <span>${food.name} <span style="color:var(--text-muted); font-size:0.85rem;">(${food.portion})</span></span>
                                <span style="color:var(--primary-color);">${food.calories} Kcal</span>
                            </div>
                            <div style="font-size: 0.8rem; margin-top: 5px; color: var(--text-muted);">
                                P: ${food.protein_g}g | C: ${food.carbs_g}g | F: ${food.fat_g}g
                            </div>
                            <div style="font-size: 0.8rem; margin-top: 5px; color: var(--accent-green); font-style: italic;">
                                <i class="fas fa-exchange-alt"></i> Alt: ${food.alternative}
                            </div>
                        </div>
                    `;
                });

                const mealCard = `
                    <div class="card glass">
                        <div class="card-header" style="font-size: 1rem; color: var(--text-main); font-weight: bold; margin-bottom: 10px;">
                            <span>${meal.meal_name}</span>
                            <span style="color: var(--text-muted);"><i class="far fa-clock"></i> ${meal.time}</span>
                        </div>
                        ${foodsHTML}
                    </div>
                `;
                mealsContainer.innerHTML += mealCard;
            });
        }

        nutritionResults.style.display = 'block';
    }

    // Form Submit Event
    if (nutritionForm) {
        nutritionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(nutritionForm);
            const profile = loadFromSession('userProfile');

            const preferences = {
                target_calories: parseInt(formData.get('target_calories')),
                diet_preference: formData.get('diet_preference'),
                meals_per_day: parseInt(formData.get('meals_per_day')),
                weight_goal_rate: parseFloat(formData.get('weight_goal_rate')),
                allergies: formData.get('allergies').trim(),
                cuisine_preference: formData.get('cuisine_preference'),
                fitness_goal: profile ? profile.fitnessGoal : 'maintenance' // Fallback aman
            };

            document.getElementById('nutrition-form-container').style.display = 'none';
            nutritionResults.style.display = 'none';
            nutritionLoading.style.display = 'block';

            try {
                const data = await generateNutrition(preferences);
                nutritionLoading.style.display = 'none';
                renderMealPlan(data);
                
                // 3.4.5 Session Storage
                const mealPlanData = {
                    dailySummary: data.daily_summary,
                    meals: data.meals,
                    hydrationRecommendation: data.hydration_recommendation,
                    mealPrepTips: data.meal_prep_tips,
                    savedAt: new Date().toISOString()
                };
                saveToSession('mealPlan', mealPlanData);
                showToast('Rencana nutrisi berhasil dibuat!', 'success');
            } catch (err) {
                nutritionLoading.style.display = 'none';
                document.getElementById('nutrition-form-container').style.display = 'block';
                showToast(err.message, 'error');
            }
        });
    }

    // 3.4.4 Action Buttons (Modify, Copy, Print)
    document.getElementById('modifyNutritionBtn')?.addEventListener('click', () => {
        nutritionResults.style.display = 'none';
        document.getElementById('nutrition-form-container').style.display = 'block';
    });

    document.getElementById('printNutritionBtn')?.addEventListener('click', () => {
        window.print();
    });

    document.getElementById('copyNutritionBtn')?.addEventListener('click', () => {
        const plan = loadFromSession('mealPlan');
        if (plan) {
            let txt = `🥗 Nutrition Plan: ${plan.dailySummary.total_calories} Kcal\n`;
            txt += `Macros: P ${plan.dailySummary.protein_g}g | C ${plan.dailySummary.carbs_g}g | F ${plan.dailySummary.fat_g}g\n\n`;
            plan.meals.forEach(m => {
                txt += `--- ${m.meal_name} (${m.time}) ---\n`;
                m.foods.forEach(f => {
                    txt += `- ${f.name} (${f.portion}): ${f.calories} kcal\n`;
                });
                txt += '\n';
            });
            navigator.clipboard.writeText(txt).then(() => showToast('Tersalin ke clipboard!', 'success'));
        }
    });

    // Check saved session on load
    const savedMealPlan = loadFromSession('mealPlan');
    if (savedMealPlan) {
        renderMealPlan({
            daily_summary: savedMealPlan.dailySummary,
            meals: savedMealPlan.meals,
            hydration_recommendation: savedMealPlan.hydrationRecommendation,
            meal_prep_tips: savedMealPlan.mealPrepTips
        });
        document.getElementById('nutrition-form-container').style.display = 'none';
    }

// --- 7. DASHBOARD UPDATER ---
    function updateDashboard() {
        const profile = loadFromSession('userProfile');
        
        // 1. Update Profile Info
        if (profile) {
            document.getElementById('dashName').textContent = profile.name || '-';
            document.getElementById('dashAge').textContent = profile.age ? `${profile.age} Yrs` : '-';
            document.getElementById('dashHeight').textContent = profile.height ? `${profile.height} cm` : '-';
            document.getElementById('dashWeight').textContent = profile.weight ? `${profile.weight} kg` : '-';
            
            const bmiBadge = document.getElementById('dashBmiBadge');
            if (profile.bmi) {
                bmiBadge.textContent = `BMI: ${profile.bmi.toFixed(1)} (${profile.bmiCategory})`;
                bmiBadge.style.color = getBMICategoryColor(profile.bmiCategory);
            }

            // Set dynamic AI Insight based on goal
            const insights = {
                'weight_loss': '"Consistency in your caloric deficit is the key. You cannot out-train a bad diet!"',
                'muscle_gain': '"Lift heavy, eat your protein, and prioritize recovery. Muscle is built while you rest."',
                'maintenance': '"Balance is everything. Keep your activity steady and enjoy the healthy lifestyle!"'
            };
            if(profile.fitnessGoal) {
                document.getElementById('dashAiInsight').textContent = insights[profile.fitnessGoal] || insights['maintenance'];
            }
        }

        // 2. Update Daily Goal & Macros (Sync with Session Progress)
        let totalCal = 0;
        let totalPro = 0; 
        let totalCarb = 0;
        let totalFat = 0;
        
        // PERBAIKAN: Ambil data secara lokal dari session storage, bukan dari variabel global
        const sessionData = loadFromSession('sessionLog');
        
        // Jika ada kalori yang di-log di active session
        if (sessionData && sessionData.nutritionLog) {
            sessionData.nutritionLog.forEach(food => {
                totalCal += parseInt(food.calories) || 0;
                // Estimasi kasar makro untuk visualisasi dashboard
                totalPro += Math.round(food.calories * 0.05); 
                totalCarb += Math.round(food.calories * 0.1);
                totalFat += Math.round(food.calories * 0.03);
            });
        }

        const targetCal = profile ? (profile.targetCalories || 0) : 0;
        const dashCalorieText = document.getElementById('dashCalorieText');
        const dashCalorieBar = document.getElementById('dashCalorieBar');
        
        if (dashCalorieText && dashCalorieBar) {
            dashCalorieText.innerHTML = `${totalCal} <span style="font-size: 1rem; color: var(--text-muted)">/ ${Math.round(targetCal)} Kcal</span>`;
            const percent = targetCal > 0 ? Math.min((totalCal / targetCal) * 100, 100) : 0;
            dashCalorieBar.style.width = `${percent}%`;
            dashCalorieBar.style.background = percent >= 100 ? 'var(--danger-red)' : 'var(--primary-color)';
        }

        const dashProteinText = document.getElementById('dashProteinText');
        const dashCarbsText = document.getElementById('dashCarbsText');
        const dashFatText = document.getElementById('dashFatText');
        
        if (dashProteinText) dashProteinText.textContent = `${totalPro}g`;
        if (dashCarbsText) dashCarbsText.textContent = `${totalCarb}g`;
        if (dashFatText) dashFatText.textContent = `${totalFat}g`;

        // 3. Update Today's Workout
        const savedPlan = loadFromSession('workoutPlan');
        const workoutContainer = document.getElementById('dashWorkoutContainer');
        
        // PERBAIKAN: Tangani perbedaan format key JSON dari AI (weekly_schedule vs weeklySchedule)
        const scheduleArray = savedPlan ? (savedPlan.weekly_schedule || savedPlan.weeklySchedule) : null;
        
        if (workoutContainer && scheduleArray && scheduleArray.length > 0) {
            const todayPlan = scheduleArray[0]; 
            
            let exercisesHTML = '';
            if (todayPlan.exercises && todayPlan.exercises.length > 0) {
                exercisesHTML = todayPlan.exercises.slice(0, 3).map(ex => 
                    `<div style="font-size: 0.85rem; padding: 8px; background: var(--glass-input); border-radius: 6px; margin-bottom: 5px;">
                        <strong>${ex.name}</strong> • ${ex.sets} Sets
                    </div>`
                ).join('');
                // Tampilkan label + N more jika lebih dari 3 latihan
                if (todayPlan.exercises.length > 3) {
                    exercisesHTML += `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-top: 5px;">+ ${todayPlan.exercises.length - 3} more exercises</div>`;
                }
            } else {
                exercisesHTML = `<p class="text-muted" style="font-size: 0.85rem; text-align: center; margin-top: 10px;">Rest day. Fokus pada pemulihan Anda.</p>`;
            }

            workoutContainer.innerHTML = `
                <h4 style="color: var(--primary-color); margin-bottom: 5px;">${todayPlan.day || 'Day 1'}: ${todayPlan.type || 'Workout'}</h4>
                <div style="margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px;">
                    ${exercisesHTML}
                </div>
                <button onclick="document.querySelector('[data-target=\\'progress-view\\']').click()" class="btn-primary glass-btn" style="width: 100%; padding: 8px;">
                    <i class="fas fa-play"></i> Start Session
                </button>
            `;
        }
    }

    // --- 8. AI CHATBOT LOGIC ---
    const chatInput = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiSendBtn');
    const chatContainer = document.getElementById('chatHistoryContainer');
    const personalityRadios = document.querySelectorAll('input[name="personality"]');
    
    // 4.4.6 Load Session Storage
    let chatHistory = loadFromSession('chatHistory') || [];
    let currentPersonality = loadFromSession('chatPersonality') || 'friendly';

    // Set personality di UI berdasarkan session
    personalityRadios.forEach(radio => {
        if(radio.value === currentPersonality) radio.checked = true;
        radio.addEventListener('change', (e) => {
            currentPersonality = e.target.value;
            saveToSession('chatPersonality', currentPersonality);
        });
    });

    // Render riwayat awal
    if (chatHistory.length > 0) {
        chatHistory.forEach(msg => renderChatMessage(msg.role, msg.content, false));
        scrollToBottom();
    }

    // 4.4.4 Fungsi render chat bubbles
    function renderChatMessage(role, content, save = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role === 'user' ? 'user' : 'assistant'}`;
        // Ganti baris baru menjadi tag <br> agar rapi
        bubble.innerHTML = content.replace(/\n/g, '<br>');
        chatContainer.appendChild(bubble);
        
        if (save) {
            chatHistory.push({ role, content, timestamp: new Date().toISOString() });
            saveToSession('chatHistory', chatHistory); // Update session storage
        }
        scrollToBottom();
    }

    function scrollToBottom() {
        if(chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // 4.4.5 Typing Indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'chat-bubble assistant typing-indicator';
        indicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatContainer.appendChild(indicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    let isRateLimited = false;

    // 4.4.8 Handling Rate Limit UI Timer
    function handleRateLimit(seconds) {
        isRateLimited = true;
        const banner = document.getElementById('rateLimitBanner');
        const timerSpan = document.getElementById('rateLimitTimer');
        banner.style.display = 'block';
        chatInput.disabled = true;
        sendBtn.disabled = true;

        let timeLeft = seconds;
        timerSpan.textContent = timeLeft;

        const interval = setInterval(() => {
            timeLeft -= 1;
            timerSpan.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                isRateLimited = false;
                banner.style.display = 'none';
                chatInput.disabled = false;
                sendBtn.disabled = false;
            }
        }, 1000);
    }

    // 4.4.3 API Call / Kirim Pesan
    async function sendChatMessage(message) {
        if (!message.trim() || isRateLimited) return;

        // Auto redirect ke halaman chat jika pengguna mengetik dari global chatbar di halaman lain
        const chatbotNav = document.querySelector('[data-target="chatbot-view"]');
        if(chatbotNav && !chatbotNav.classList.contains('active')) {
            chatbotNav.click();
        }

        renderChatMessage('user', message);
        chatInput.value = '';
        
        // Sembunyikan banner safety lama (jika ada)
        document.getElementById('safetyWarningBanner').style.display = 'none';

        showTypingIndicator();

        // Siapkan Context
        const userProfile = loadFromSession('userProfile') || {};
        const workoutPlan = loadFromSession('workoutPlan');
        
        const context = {
            bmi: userProfile.bmi || null,
            fitness_goal: userProfile.fitnessGoal || null,
            experience_level: 'beginner', // Fallback default
            workout_plan_reference: workoutPlan ? workoutPlan.weeklySchedule : null
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    personality: currentPersonality,
                    // Kirim semua history kecuali pesan 'user' terakhir (krn sudah di-inject sebagai message baru di backend)
                    conversation_history: chatHistory.slice(0, -1), 
                    user_context: context
                })
            });

            removeTypingIndicator();

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
                handleRateLimit(retryAfter);
                chatHistory.pop(); // Hapus chat lokal karena gagal dikirim ke backend
                saveToSession('chatHistory', chatHistory);
                return;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.details || 'Gagal menghubungi AI Coach');
            }

            // 4.4.7 Handle Safety Flag UI
            if (data.safety_flag) {
                const banner = document.getElementById('safetyWarningBanner');
                const bannerText = document.getElementById('safetyWarningText');
                bannerText.textContent = data.safety_message || "Terdeteksi keluhan medis. Harap konsultasi dengan dokter.";
                banner.style.display = 'block';
            }

            // Render respons Asisten
            renderChatMessage('assistant', data.response);

        } catch (error) {
            removeTypingIndicator();
            showToast(error.message, 'error');
            chatHistory.pop(); // Revert chat pada UI jika terjadi error (network/503)
            saveToSession('chatHistory', chatHistory);
        }
    }

    // Trigger Events dari Global Chatbar
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', () => {
            sendChatMessage(chatInput.value);
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage(chatInput.value);
            }
        });
    }

    // 4.4.4 Fungsi Parser Markdown Ringan (Vanilla JS)
    function parseMarkdown(text) {
        if (!text) return '';
        
        let html = text
            // Headings (###, ##, #)
            .replace(/^### (.*$)/gim, '<h4 style="margin: 12px 0 6px; color: var(--primary-color);">$1</h4>')
            .replace(/^## (.*$)/gim, '<h3 style="margin: 14px 0 8px; color: var(--primary-color);">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 style="margin: 16px 0 10px; color: var(--primary-color);">$1</h2>')
            
            // Teks Tebal (**teks**)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            
            // Unordered Lists (* item atau - item)
            .replace(/^\s*[-*] (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px; line-height: 1.5;">$1</li>')
            
            // Ordered Lists (1. item)
            .replace(/^\s*\d+\. (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px; line-height: 1.5; list-style-type: decimal;">$1</li>')
            
            // Line Breaks (Ganti enter menjadi <br>)
            .replace(/\n/g, '<br>');

        // Cleanup: Menghapus <br> berlebih yang terbentuk secara otomatis setelah list atau heading
        html = html.replace(/(<\/h[2-4]>|<li[^>]*>.*?<\/li>)<br>/g, '$1');
        html = html.replace(/<br>(<h[2-4]>|<li)/g, '$1');

        return html;
    }

    // 4.4.4 Fungsi render chat bubbles (DIPERBARUI)
    function renderChatMessage(role, content, save = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role === 'user' ? 'user' : 'assistant'}`;
        
        // FIX: Terapkan parseMarkdown sebelum menyuntikkan ke HTML
        if (role === 'assistant') {
            bubble.innerHTML = parseMarkdown(content);
        } else {
            // Teks user tetap dibiarkan plain text dengan jeda baris biasa
            bubble.innerHTML = content.replace(/\n/g, '<br>');
        }
        
        chatContainer.appendChild(bubble);
        
        if (save) {
            chatHistory.push({ role, content, timestamp: new Date().toISOString() });
            saveToSession('chatHistory', chatHistory); // Update session storage
        }
        scrollToBottom();
    }

    // --- 9. SESSION PROGRESS TRACKER LOGIC ---
    const sessionPre = document.getElementById('sessionPre');
    const sessionActive = document.getElementById('sessionActive');
    const sessionReportUI = document.getElementById('sessionReport');
    const sessionLoading = document.getElementById('sessionLoading');

    let sessionTimerInterval;

    // Inisialisasi State Sesi (Load dari session storage jika ada)
    let currentSession = loadFromSession('sessionLog') || {
        startTime: null,
        exercises: [], 
        nutritionLog: [], 
        waterIntakeGlasses: 0,
        isActive: false
    };

    // 5.3.2 Start Session
    document.getElementById('startSessionBtn')?.addEventListener('click', () => {
        currentSession.isActive = true;
        currentSession.startTime = new Date().toISOString();
        currentSession.exercises = [];
        currentSession.nutritionLog = [];
        currentSession.waterIntakeGlasses = 0;
        
        saveToSession('sessionLog', currentSession);
        renderActiveSessionUI();
    });

    // Populate Autocomplete Exercise List dari Workout Plan Session Storage
    function populateExerciseOptions() {
        const datalist = document.getElementById('exerciseOptions');
        const savedPlan = loadFromSession('workoutPlan');
        if (datalist && savedPlan && savedPlan.weeklySchedule) {
            datalist.innerHTML = '';
            const uniqueExercises = new Set();
            savedPlan.weeklySchedule.forEach(day => {
                if (day.type !== 'rest' && day.session?.exercises) {
                    day.session.exercises.forEach(ex => uniqueExercises.add(ex.name));
                }
            });
            uniqueExercises.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
        }
    }

    // Timer Update Logic
    function updateTimer() {
        if (!currentSession.isActive || !currentSession.startTime) return;
        const start = new Date(currentSession.startTime);
        const now = new Date();
        const diffMs = now - start;
        
        const totalSeconds = Math.floor(diffMs / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        
        const timerEl = document.getElementById('sessionTimer');
        if(timerEl) timerEl.textContent = `${minutes}:${seconds}`;
    }

    // 5.3.6 Hitung & Render Running Totals
    function updateRunningTotals() {
        let totalVolume = 0;
        currentSession.exercises.forEach(ex => {
            ex.sets.forEach(set => {
                totalVolume += (set.reps * set.weight_kg);
            });
        });

        let totalCalories = 0;
        currentSession.nutritionLog.forEach(food => {
            totalCalories += food.calories;
        });

        const profile = loadFromSession('userProfile');
        const targetCals = profile ? Math.round(profile.targetCalories) : 0;

        document.getElementById('displayTotalVolume').textContent = `${totalVolume} kg`;
        document.getElementById('displayTotalCalories').textContent = `${totalCalories} / ${targetCals}`;
        document.getElementById('displayWater').textContent = `${currentSession.waterIntakeGlasses} / 8`;
    }

    // UI State Manager untuk Sesi
    function renderActiveSessionUI() {
        if (currentSession.isActive) {
            sessionPre.style.display = 'none';
            sessionReportUI.style.display = 'none';
            sessionActive.style.display = 'block';
            
            populateExerciseOptions();
            updateRunningTotals();
            updateTimer();
            clearInterval(sessionTimerInterval);
            sessionTimerInterval = setInterval(updateTimer, 1000);
        } else {
            sessionActive.style.display = 'none';
            // Cek apakah ada data report lama di storage
            const savedReport = loadFromSession('sessionReportData');
            if(savedReport) {
                renderReportData(savedReport);
                sessionPre.style.display = 'none';
            } else {
                sessionPre.style.display = 'block';
                sessionReportUI.style.display = 'none';
            }
        }
    }

    // 5.3.3 Log Exercise Submit
    document.getElementById('logExerciseForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('exerciseNameInput').value.trim();
        const weight = parseFloat(document.getElementById('exerciseWeightInput').value);
        const reps = parseInt(document.getElementById('exerciseRepsInput').value);

        // Cari apakah exercise sudah ada di sesi ini
        let exObj = currentSession.exercises.find(ex => ex.name.toLowerCase() === name.toLowerCase());
        if (!exObj) {
            exObj = { name: name, sets: [] };
            currentSession.exercises.push(exObj);
        }
        exObj.sets.push({ reps: reps, weight_kg: weight });

        saveToSession('sessionLog', currentSession);
        updateRunningTotals();
        showToast(`Set ditambahkan: ${name} (${weight}kg x ${reps})`, 'success');
        
        document.getElementById('exerciseWeightInput').value = '';
        document.getElementById('exerciseRepsInput').value = '';
        document.getElementById('exerciseWeightInput').focus();
    });

    // 5.3.4 Log Nutrition Submit
    document.getElementById('logNutritionForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const food = document.getElementById('foodNameInput').value.trim();
        const cals = parseInt(document.getElementById('foodCalInput').value);

        currentSession.nutritionLog.push({ food: food, calories: cals });
        saveToSession('sessionLog', currentSession);
        updateRunningTotals();
        showToast(`Makanan dicatat: ${food} (${cals} kcal)`, 'success');
        
        e.target.reset();
    });

    // 5.3.5 Water Button
    document.getElementById('addWaterBtn')?.addEventListener('click', () => {
        currentSession.waterIntakeGlasses += 1;
        saveToSession('sessionLog', currentSession);
        updateRunningTotals();
        showToast('+1 Gelas Air', 'info');
    });

    // 5.4.1 End Session & Call API
    document.getElementById('endSessionBtn')?.addEventListener('click', async () => {
        if(!confirm("Anda yakin ingin mengakhiri sesi dan membuat laporan?")) return;

        clearInterval(sessionTimerInterval);
        const durationMin = Math.round((new Date() - new Date(currentSession.startTime)) / 60000);
        currentSession.duration_minutes = durationMin;
        
        sessionActive.style.display = 'none';
        sessionLoading.style.display = 'block';

        // Pastikan payload di script.js memiliki kunci berikut:
        const mappedSessionLog = {
            duration_minutes: durationMin,
            exercises: currentSession.exercises,
            nutrition_log: currentSession.nutritionLog, // Perhatikan snake_case!
            water_intake_glasses: currentSession.waterIntakeGlasses
};

        const payload = {
            session_log: mappedSessionLog,
            user_context: loadFromSession('userProfile') || {},
            workout_plan_reference: loadFromSession('workoutPlan') || {}
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/session-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.details || 'Gagal memproses report');

            // Set state menjadi inactive
            currentSession.isActive = false;
            saveToSession('sessionLog', currentSession);
            saveToSession('sessionReportData', data); // Simpan report view cache

            sessionLoading.style.display = 'none';
            renderReportData(data);
            showToast('Laporan Sesi Berhasil Dibuat!', 'success');

        } catch (error) {
            sessionLoading.style.display = 'none';
            sessionActive.style.display = 'block'; // Kembalikan state jika gagal
            sessionTimerInterval = setInterval(updateTimer, 1000);
            showToast(error.message, 'error');
        }
    });

    // 5.4.2 Render Report Data
    function renderReportData(data) {
        document.getElementById('reportVolume').textContent = data.total_volume_kg;
        document.getElementById('reportBurned').textContent = Math.round(data.calories_burned_estimate);
        document.getElementById('reportConsumed').textContent = data.calories_consumed;
        
        document.getElementById('reportNarrative').innerHTML = parseMarkdown(data.ai_narrative || "");
        document.getElementById('reportNextFocus').innerHTML = parseMarkdown(data.next_session_recommendation || "");
        document.getElementById('reportMotivation').innerHTML = parseMarkdown(data.motivational_message || "");

        sessionReportUI.style.display = 'block';
    }

    // 5.4.4 Action Buttons (Download, Print, New Session)
    document.getElementById('printReportBtn')?.addEventListener('click', () => {
        window.print();
    });

    document.getElementById('downloadReportBtn')?.addEventListener('click', () => {
        const reportData = loadFromSession('sessionReportData');
        const sessionData = loadFromSession('sessionLog');
        if (!reportData || !sessionData) return;

        let txt = `🏆 FITNESS SESSION REPORT 🏆\nDate: ${new Date(sessionData.startTime).toLocaleString()}\n`;
        txt += `Duration: ${sessionData.duration_minutes} minutes\n\n`;
        txt += `📊 METRICS:\n- Total Volume: ${reportData.total_volume_kg} kg\n`;
        txt += `- Est. Burned: ${Math.round(reportData.calories_burned_estimate)} kcal\n`;
        txt += `- Consumed: ${reportData.calories_consumed} kcal\n`;
        txt += `- Water Intake: ${sessionData.waterIntakeGlasses} glasses\n\n`;
        txt += `🧠 AI COACH NARRATIVE:\n${reportData.ai_narrative.replace(/<[^>]*>?/gm, '')}\n\n`;
        txt += `🎯 NEXT FOCUS:\n${reportData.next_session_recommendation.replace(/<[^>]*>?/gm, '')}\n\n`;
        txt += `💪 COACH SAYS: "${reportData.motivational_message.replace(/<[^>]*>?/gm, '')}"`;

        const blob = new Blob([txt], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Fitness_Report_${new Date().getTime()}.txt`;
        a.click();
    });

    document.getElementById('startNewSessionBtn')?.addEventListener('click', () => {
        currentSession.isActive = false;
        saveToSession('sessionLog', currentSession);
        sessionReportUI.style.display = 'none';
        sessionPre.style.display = 'block';
    });

    // Panggil render saat tab Progress dibuka atau aplikasi dimuat
    document.querySelector('[data-target="progress-view"]').addEventListener('click', renderActiveSessionUI);
    
    // Inisialisasi awal UI
    if (currentSession.isActive) {
        // Otomatis arahkan ke tab progress jika sesi sedang aktif
        document.querySelector('[data-target="progress-view"]').click();
    }

    // --- 10. SETTINGS LOGIC ---
    document.getElementById('clearDataBtn')?.addEventListener('click', () => {
        if(confirm("Apakah Anda yakin ingin menghapus semua data? Aplikasi akan dimuat ulang.")) {
            sessionStorage.clear();
            window.location.reload(); 
        }
    });

});