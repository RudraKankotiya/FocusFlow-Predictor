# 🚀 FocusFlow - Predictor

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://focus-flow-predictor.vercel.app/)
[![Railway Backend](https://img.shields.io/badge/Backend-Railway-blueviolet?style=for-the-badge&logo=railway)](https://web-production-098d6.up.railway.app/docs)

**FocusFlow Predictor** is a premium, AI-powered productivity tracking and forecasting application. It leverages Machine Learning to analyze your habits—specifically screen time and sleep—to predict your daily focus potential and help you optimize your routine.

---

## ✨ Key Features

### 🧠 AI Prediction Engine
- **Intelligent Forecasting**: Predicts your productivity score (0-10) using a trained Scikit-Learn model.
- **Heuristic Sensitivity Layer**: Balanced AI that responds realistically to sleep deprivation and excessive phone usage.
- **Modern Interpretation**: Scores are categorized into "Flow State", "Great", "Good", and "Recovery" with descriptive advice.

### 📊 Dataset Insights
- **CSV Data Upload**: Upload your own tracking data to see instant metrics and correlations.
- **Dynamic Metrics**: Real-time calculation of average phone hours, sleep, and productivity levels.
- **Interactive Previews**: View your data in a glassmorphism-styled table.

### 📅 Schedule Optimizer
- **Diverse Grid Search**: Tests over 50+ unique habit combinations to find your "Goldilocks Zone".
- **Unique Recommendations**: Strict uniqueness filtering ensures you get 5 distinct, high-impact schedule options.
- **Batch Processing**: Smart API batching for fast, reliable results without network throttling.

### 🎨 Premium UI/UX
- **Night Mode Aesthetic**: Sleek dark mode with glassmorphism and vibrant gradients.
- **Micro-Animations**: Smooth transitions, loading spinners, and interactive hover states.
- **Responsive Design**: Fully optimized for both desktop and mobile experiences.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS with [Shadcn UI](https://ui.shadcn.com/) components
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Handling**: Next.js API Routes (Proxy mode) for secure and logged backend communication.

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **ML Engine**: Scikit-Learn (Linear Regression)
- **Deployment**: [Railway](https://railway.app/)
- **Data Handling**: Pandas & NumPy

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend Setup
1. Navigate to the root directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📡 API Reference

### POST `/predict`
Takes habit data and returns a productivity prediction.
```json
{
  "phone_hours": 2.5,
  "sleep_hours": 7.5,
  "notifications_per_day": null,
  "work_hours_per_day": null
}
```

### GET `/debug`
Returns the internal state of the ML model, including cached feature means and dataset stats.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
Created with ❤️ by [Rudra Kankotiya](https://github.com/RudraKankotiya)