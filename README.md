# AI Skin Care Expert System with Dynamic Skin Digital Twin

### Real-Time Face Analysis Without Machine Learning + Personalized Skin Recovery Planner

An academic and clinical-grade full-stack platform that analyzes a user's face through a live webcam using **traditional computer vision (100% non-machine-learning)**, creates an explainable **Dynamic Skin Digital Twin**, recommends a soothing daily skincare routine, suggests balanced food & hydration habits, tracks genuine routine adherence over time, and delivers real scheduled browser notifications.

---

## 1. Project Overview & Main Features

* **Smart Skin Analyzer:** Real-time webcam analysis using deterministic Viola-Jones Haar Cascade face detection, discrete Laplacian sharpness calculation, luminance checks, and CIELAB color space transformation.
* **Segregated Dynamic Skin Digital Twin:** Maintains 3 independent, non-merged categories:
  - *Category A:* Image-Derived Observations (Luminance, Laplacian variance, CIELAB D65 values, Delta E).
  - *Category B:* User-Reported Information (Comfort, tightness, burning/stinging, current products).
  - *Category C:* Rule-Derived Conclusions (Fired rules, operating mode, barrier index).
* **Personalized Routine Planner:** Dynamic morning and evening routines with Soothing Mode lockout for sensitized skin.
* **Recovery Timeline & Adherence:** Tracks 7, 14, and 28-day routine completion rates and symptom trends with interactive Recharts.
* **Food & Hydration Diary:** Daily water tracker (2,500 ml target) and nutritional journaling respecting Indian dietary preferences.
* **Browser Reminders:** Native HTML5 notification scheduling and service worker integration.
* **Dark / Light Theme:** Instant theme switching persisted in `localStorage`.
* **Security & Isolation:** PBKDF2-HMAC-SHA256 password hashing, token-based authentication, and user data privacy purge.

---

## 2. Technologies Actually Used

* **Frontend:**
  - React 19 (SPA)
  - Vite 8
  - Lucide React (Icons)
  - Recharts (Data Visualizations)
  - Vanilla CSS with Design System Variables
* **Backend:**
  - Python 3.10+ / 3.13
  - Flask 3.0+ (REST API)
  - Flask-CORS 4.0+
  - OpenCV Headless 4.10+ (`cv2`) & NumPy 2.0+ (Traditional Computer Vision)
  - Gunicorn 21.2+ (Production WSGI Server)
* **Database & Persistence:**
  - SQLite3 with parameterized queries and migrations
  - Configurable `DATABASE_PATH` for persistent disk storage

---

## 3. System Architecture

```
[ User Browser / Webcam ]
         │
         ▼
[ React + Vite SPA (Vercel / Netlify / Static Host) ]
         │ HTTPS / JSON API
         ▼
[ Flask REST API + Gunicorn (Render / Railway / Cloud Host) ]
  ├── Traditional CV Engine (OpenCV Haar Cascade + Laplacian + CIELAB)
  ├── Symbolic Inference Engine (Forward chaining + Rule Priorities)
  └── SQLite Persistent Store (User Accounts, Twins, Routines, Logs)
```

---

## 4. Project Folder Structure

```
ai-skin-care-expert-system/
├── backend/
│   ├── ai_engine/
│   │   ├── data/
│   │   │   └── haarcascade_frontalface_default.xml   # Haar Cascade model
│   │   ├── cv_processor.py                          # Deterministic CV analyzer
│   │   ├── digital_twin.py                          # 3-Category Digital Twin
│   │   ├── explanation_engine.py                    # Symbolic reasoning graph
│   │   ├── fuzzy_logic.py                           # Membership functions
│   │   ├── inference_engine.py                      # Forward chaining rules
│   │   ├── knowledge_base.py                        # Rule definitions (S01-S06, R01-R15)
│   │   └── simulator.py                             # What-If simulator
│   ├── tests/
│   │   └── test_expert_system.py                    # Unit tests
│   ├── app.py                                       # Flask application & endpoints
│   ├── database.py                                  # SQLite connection & migrations
│   ├── Procfile                                     # Production process file
│   ├── requirements.txt                             # Python dependencies
│   └── .env.example                                 # Backend environment template
├── frontend/
│   ├── public/
│   │   ├── _redirects                               # Netlify SPA routing
│   │   ├── sw.js                                    # Notification Service Worker
│   │   └── haarcascade_frontalface_default.xml      # Client fallback cascade
│   ├── src/
│   │   ├── components/                              # Sidebar, Navbar, ThemeToggle, Logo
│   │   ├── context/                                 # AuthContext
│   │   ├── pages/                                   # Dashboard, Analyzer, Report, Twin, Routine...
│   │   ├── services/                                # api.js, faceAnalysisCV.js
│   │   ├── App.jsx
│   │   └── index.css                                # Design system & dark mode tokens
│   ├── package.json
│   ├── vercel.json                                  # Vercel SPA routing
│   ├── vite.config.js
│   └── .env.example                                 # Frontend environment template
├── .env.example                                     # Unified environment template
├── .gitignore                                       # Git ignore protecting secrets & DB
├── render.yaml                                      # Render blueprint deployment
└── README.md
```

---

## 5. Prerequisites

* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **Python:** 3.10 or higher
* **Git:** Installed and configured
* **Webcam:** Any standard USB or built-in webcam (HTTPS or localhost required for browser camera access)

---

## 6. Local Installation & Startup

### Step 1: Clone Repository
```bash
git clone https://github.com/Arifahanifa/ai-skin-care-expert-system.git
cd ai-skin-care-expert-system
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
* Backend runs on: `http://127.0.0.1:5000`
* Health Check: `http://127.0.0.1:5000/health`

### Step 3: Frontend Setup (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs on: `http://localhost:5173`

### Academic Evaluator Demo Account
* **Email:** `demo@foai-expert.edu`
* **Password:** `DemoViva2026!`

---

## 7. Environment Variables Configuration

Copy `.env.example` to `.env` in both folders:

### Backend (`backend/.env`)
```ini
PORT=5000
HOST=0.0.0.0
FLASK_DEBUG=0
CORS_ORIGINS=*

# Optional: Custom database location (e.g. on a mounted persistent volume)
DATABASE_PATH=skincare_expert.db

# Optional: SMTP Credentials for Password Reset Emails
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

### Frontend (`frontend/.env`)
```ini
# Leave empty for local development (Vite proxies /api to port 5000)
# Set to your deployed backend URL for production:
VITE_API_BASE_URL=https://your-backend.onrender.com
```

---

## 8. Production Deployment Guide

### Option A: Render (Full Stack Blueprint)
1. Fork or push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select this repository. Render automatically reads `render.yaml` and provisions:
   - **Backend Web Service:** `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Frontend Static Site:** `npm run build` outputting `frontend/dist`
4. Set `VITE_API_BASE_URL` in the frontend service to the backend service URL.

### Option B: Split Deployment (Vercel Frontend + Render/Railway Backend)
1. **Deploy Backend (Render / Railway):**
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Environment Variables: `FLASK_DEBUG=0`, `CORS_ORIGINS=https://your-frontend.vercel.app`
2. **Deploy Frontend (Vercel / Netlify):**
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_BASE_URL=https://your-deployed-backend.onrender.com`

---

## 9. Deployment & Repository Links

* **Live Public Website:** https://ai-skin-care-expert-frontend.onrender.com/
* **GitHub Repository:(https://github.com/Arifahanifa/AI-Skin-Care-Expert-System-with-Smart-Skin-Analyzer)

---

## 10. Important Scientific Limitations & Privacy

1. **Academic & Demonstrative Scope:** This system is an academic knowledge-based expert system and traditional computer vision project. It does **NOT** provide medical diagnoses or replace a licensed dermatologist.
2. **Sensor Physical Limitations:** An ordinary consumer RGB webcam cannot measure biological epidermal hydration percentages, sebum sebum excretion rates, or molecular barrier integrity. Image-derived indicators reflect surface color distribution (CIELAB), illumination balance, and Laplacian spatial edge variance only.
3. **Privacy by Design:** Personal photos are analyzed in memory using NumPy/OpenCV arrays and are never saved to disk or transmitted to third-party cloud AI vendors. A one-click **Privacy Data Purge** is available in the profile settings to erase all user records.
