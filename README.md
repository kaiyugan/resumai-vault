# 🚀 ResumAI Vault - Career Intelligence Platform

A privacy-first, multi-tenant AI platform that helps candidates build tailored, high-converting resumes, track target job applications, simulate AI mock interviews, and optimize ATS scores.

---

## 🌐 Sharing Options Overview

Depending on who you are sharing this with, choose the option that best fits:

| Share Option | Best For | Technical Effort Required |
| :--- | :--- | :--- |
| **Method 1: Cloud Deployment (URL)** | Non-technical users, recruiters, beta testers | **Zero** (Click a web link on any device) |
| **Method 2: 1-Command Docker** | Testers with Docker installed | **Low** (`docker-compose up`) |
| **Method 3: Local Repository Run** | Developers customizing code | **Medium** (`npm` + `python`) |

---

## ☁️ Method 1: Cloud Web Link (Recommended for Beta Testers)

You can host this project on free tier cloud providers and share a single web link (`https://your-app.vercel.app`) with anyone.

### 1. Deploy Backend to Render.com (1-Click)
1. Push this repository to GitHub.
2. Log in to [Render.com](https://render.com) and click **New > Blueprint**.
3. Select your GitHub repository. Render automatically reads `render.yaml` and provisions:
   - FastAPI Backend Web Service
   - PostgreSQL Database
4. Copy your backend URL (e.g. `https://resumai-api.onrender.com`).

### 2. Deploy Frontend to Vercel (1-Click)
1. Log in to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your GitHub repository. Vercel automatically detects Vite.
3. Add environment variable: `VITE_API_BASE_URL` = `https://your-render-backend-url.onrender.com`
4. Click **Deploy**. You will get a shareable HTTPS web link!

---

## 🐳 Method 2: Docker Compose (1-Command Local Run)

If the recipient has [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed:

1. Clone or download this project folder.
2. Open a terminal inside the project directory and run:
   ```bash
   docker-compose up --build
   ```
3. Open your browser to:
   - **App**: `http://localhost:5173`
   - **API Docs**: `http://localhost:8090/docs`

---

## 💻 Method 3: Local Manual Setup (Developers)

If running directly from source code on macOS, Linux, or Windows:

### Prerequisites
- Node.js >= 18
- Python >= 3.10

### 1. Start Backend (FastAPI)
```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload
```

### 2. Start Frontend (React + Vite)
In a new terminal window:
```bash
# In the root project directory
npm install
npm run dev
```

Open your browser to **`http://localhost:5173`**.

---

## 🔒 Candidate Multi-Tenant Data Isolation

Every user who creates an account or signs in via Google 1-Click receives an isolated candidate profile (`profile_id`). 
- Master Vault achievements, saved target jobs, micro-interviews, and final resume exports are automatically scoped to that user.
- Multiple candidates can log in from different devices without seeing or overwriting each other's data.

---

## 🧩 Chrome Extension (Optional)

To extract Job Descriptions with 1-click directly from LinkedIn or Indeed:
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the [`chrome-extension/`](./chrome-extension) directory in this repo.
