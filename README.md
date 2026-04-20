# AI-Based Smart Job Matching Platform

A full-stack web application that intelligently matches users with jobs based on their skills using a custom NLP Machine Learning model.

## 🚀 Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB Atlas Account

### 1. Database Setup
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Get your connection string (URI).
3. Open `backend/.env` and replace the placeholder `MONGO_URI` with your connection string.

### 2. ML Service (Python + Flask)
This service handles the Cosine Similarity and TF-IDF logic.
```bash
cd ml-service
# Recommended: Create a virtual environment
python -m venv venv
# Activate it (Windows)
venv\Scripts\activate
# Activate it (Mac/Linux)
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
*Runs on http://localhost:5000*

### 3. Backend Service (Node.js)
```bash
cd backend
npm install
npm start
# (or use npm run dev for nodemon)
```
*Runs on http://localhost:5001*

### 4. Frontend Application (React Vite)
```bash
cd frontend
npm install
npm run dev
```
*Runs on http://localhost:3000 (or the port Vite outputs in terminal)*

---

## 🛠 Features

- **Users**: Register, Login, input skills profile, view AI precision-matched jobs.
- **Admin**: View analytics dashboard (built with Chart.js), list jobs, manage resources.
- **AI Matching**: Flask processes TF-IDF algorithm against our mock `jobs.csv` database to find similarity scores dynamically based on the user's string of skills.

---

## 📬 Example API Requests (Postman)

### 1. ML Service - Test Recommendation
**POST** `http://localhost:5000/recommend-jobs`
```json
{
    "skills": ["react", "javascript", "nodejs"]
}
```

### 2. Auth - Register
**POST** `http://localhost:5001/api/auth/register`
```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "user"    // Alternatively, "admin"
}
```

### 3. Auth - Login
**POST** `http://localhost:5001/api/auth/login`
```json
{
    "email": "jane@example.com",
    "password": "password123"
}
```

### 4. Job API - Create Job (Admin Only)
**POST** `http://localhost:5001/api/jobs`  
*Header:* `Authorization: Bearer <your_jwt_token_here>`
```json
{
    "job_id": "11",
    "title": "Software Engineer",
    "company": "Google",
    "category": "Engineering",
    "skills_required": ["python", "go", "c++"],
    "location": "Mountain View",
    "salary": "$150,000"
}
```
