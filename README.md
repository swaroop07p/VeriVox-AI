# 🎙️ VeriVox AI — Audio Authenticity Forensics Platform

![VeriVox Banner](https://img.shields.io/badge/AI-Audio%20Forensics-purple)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-green)
![React](https://img.shields.io/badge/frontend-React-blue)
![MongoDB](https://img.shields.io/badge/database-MongoDB-brightgreen)
![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-cyan)

VeriVox AI is an **AI-powered audio forensic analysis platform** designed to detect **synthetic or AI-generated speech** and verify **human authenticity** using advanced signal analysis and machine learning techniques.

The system analyzes uploaded audio files and generates a **forensic authenticity report**, providing insights into speech characteristics and potential AI artifacts.

---

# 🚀 Features

### 🎧 AI Voice Authenticity Detection
Detects whether an audio recording is:
- **Real Human Voice**
- **AI / Synthetic Voice**

Using signal processing and ML analysis.

---

### 🧠 Multi-Layer Forensic Analysis
The system analyzes multiple acoustic features including:

- Pitch jitter
- Cepstral peak prominence
- Spectral entropy
- Silence patterns
- MFCC temporal variance
- Energy modulation

---

### 🔬 Visual Forensic Insights
Users receive explanations about the verdict including:

- Detected anomalies
- Speech texture inconsistencies
- Synthetic voice artifacts
- Organic vocal patterns

---

### 📊 Biometric Confidence Score
The system generates:

- AI Probability
- Human Alignment Score

Displayed using interactive visual charts.

---

### 📄 Notarized Forensic Report
Authenticated users can download a **PDF forensic report** containing:

- Verdict
- Confidence scores
- Feature breakdown
- Timestamp
- Metadata

---

### 🔐 Authentication System
Supports:

- JWT authentication
- User accounts
- Guest access

Guests can analyze audio but cannot download reports.

---

### 🌐 Modern UI Dashboard
The frontend includes:

- Animated waveform visuals
- Interactive charts
- Glassmorphism UI
- Responsive design
- Aurora animated backgrounds

---

# 🧠 Tech Stack

## Frontend

- React (Vite)
- TailwindCSS
- Recharts
- React Icons
- React Context API

---

## Backend

- FastAPI
- Python
- Librosa
- PyTorch
- OpenAI Whisper
- SciPy
- NumPy

---

## Database

- MongoDB Atlas

---

## Deployment

- Docker support
- Procfile for cloud deployment

---

## 📂 Project Structure

To maintain a clean separation of concerns, the project is divided into a FastAPI backend and a React frontend.
```
VeriVox-AI
│
├── audio-notary-backend
│   ├── app
│   │   ├── routes
│   │   │   ├── analyze.py
│   │   │   ├── auth_routes.py
│   │   │   └── explain.py
│   │   │
│   │   ├── services
│   │   │   ├── forensics.py
│   │   │   └── pdf_service.py
│   │   │
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── Procfile
│
├── audio-notary-frontend
│   ├── public
│   │   └── favicon.ico
│   │
│   ├── src
│   │   ├── assets
│   │   │   ├── logo.png
│   │   │   └── waveform.svg
│   │   │
│   │   ├── components
│   │   │   ├── ResultsView.jsx
│   │   │   ├── AuthForm.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ScannerOverlay.jsx
│   │   │
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   └── ScanContext.jsx
│   │   │
│   │   ├── pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Explain.jsx
│   │   │
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── vercel.json
│
└── README.md
```

---

## ⚙️ Backend Setup

Follow these steps to get the server-side logic running:

## 1. Clone the Repository
git clone [https://github.com/swaroop07p/VeriVox-AI.git](https://github.com/swaroop07p/VeriVox-AI.git) <br/>
cd VeriVox-AI/audio-notary-backend

## 2. Create a Virtual Environment
- Windows:<br/>
python -m venv venv <br/>
venv\Scripts\activate <br/>
- Linux / Mac:<br/>
python -m venv venv <br/>
source venv/bin/activate <br/>

## 3. Install Dependencies
pip install -r requirements.txt

## 4. Configure Environment Variables
Create a .env file in the audio-notary-backend directory and add your credentials: <br/>
Code snippet <br/>

MONGO_URI=your_mongodb_connection_string <br/>
SECRET_KEY=your_secret_key <br/>
GEMINI_API_KEY=your_gemin_api_key <br/>

## 5. Run the Backend Server
uvicorn app.main:app --reload || python -m uvicorn app.main:app --reload <br/>
#### Note: The backend will be accessible at: http://localhost:8000

---

## 🎨 Frontend Setup
Ensure your backend is running, then open a new terminal:

- 1. Navigate to Frontend
cd ../audio-notary-frontend

- 2. Install Packages
npm install

- 3. Start Development Server
npm run dev <br/>
#### Note: The frontend will be accessible at: http://localhost:5173

---

## 🚀 Deployment
- Backend: Ready for Docker or Heroku (via Dockerfile and Procfile).
- Database: Uses MongoDB for flexible document storage.