from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import sys
from typing import Optional

# --- ML Logic & Caches ---
_MODEL_CACHE = None
_FEATURE_NAMES_CACHE = None
_FEATURE_MEANS_CACHE = None
_SCORE_MIN = 0.0
_SCORE_MAX = 5.0 # Fallback

def load_productivity_model_real():
    """
    Loads the saved model, feature names, and calculates feature means from
    the cleaned training data. Caches them for subsequent calls.
    Now also caches score min/max for 0-10 scaling.
    """
    global _MODEL_CACHE, _FEATURE_NAMES_CACHE, _FEATURE_MEANS_CACHE, _SCORE_MIN, _SCORE_MAX

    if _MODEL_CACHE is None or _FEATURE_NAMES_CACHE is None or _FEATURE_MEANS_CACHE is None:
        print("Loading model, feature names, and calculating feature means...")
        try:
            _MODEL_CACHE = joblib.load('productivity_model_real.pkl')
            _FEATURE_NAMES_CACHE = joblib.load('feature_names_real.pkl')

            # Load the cleaned data to calculate feature means for imputation
            cleaned_df = pd.read_csv('productivity_data_real.csv')

            _FEATURE_MEANS_CACHE = {}
            for feature in _FEATURE_NAMES_CACHE:
                if feature in cleaned_df.columns:
                    _FEATURE_MEANS_CACHE[feature] = cleaned_df[feature].mean()
                else:
                    print(f"Warning: Feature '{feature}' required by the model is not found in 'productivity_data_real.csv'.")

            # Store min/max for scaling
            if 'productive_score' in cleaned_df.columns:
                _SCORE_MIN = float(cleaned_df['productive_score'].min())
                _SCORE_MAX = float(cleaned_df['productive_score'].max())
                print(f"Dataset range for 'productive_score': [{_SCORE_MIN}, {_SCORE_MAX}]")

            print("Model, feature names, and feature means loaded successfully.")
        except FileNotFoundError as e:
            # In a production app, we might want to log this and raise an exception rather than sys.exit
            print(f"Error: Required file not found: {e}")
            raise RuntimeError(f"Required model files not found: {e}")
        except Exception as e:
            print(f"An unexpected error occurred during model loading: {e}")
            raise e

    return _MODEL_CACHE, _FEATURE_NAMES_CACHE, _FEATURE_MEANS_CACHE

def predict_productive_score(
    phone_hours,
    sleep_hours=None,
    notifications_per_day=None,
    work_hours_per_day=None,
    optimistic_mode=False
):
    """
    Predicts and scales the productive score to [0, 10].
    """
    model, feature_names, feature_means = load_productivity_model_real()

    # Collect input values
    input_kwargs = {
        'phone_hours': phone_hours,
        'sleep_hours': sleep_hours,
        'notifications_per_day': notifications_per_day,
        'work_hours_per_day': work_hours_per_day
    }

    # Build the feature vector
    feature_vector = []
    for feature in feature_names:
        value = input_kwargs.get(feature)
        if value is not None:
            feature_vector.append(value)
        else:
            feature_vector.append(feature_means.get(feature, 0.0))

    X_predict = np.array(feature_vector).reshape(1, -1)
    raw_prediction = model.predict(X_predict)[0]

    # 1. Scale from original range (0-5) to universal range (0-10)
    # Formula: (val - min) / (max - min) * 10
    range_span = _SCORE_MAX - _SCORE_MIN
    if range_span > 0:
        scaled_prediction = (raw_prediction - _SCORE_MIN) / range_span * 10
    else:
        scaled_prediction = raw_prediction * 2 # Fallback if data is monolithic

    # 2. Apply Optimistic Mode boost
    if optimistic_mode:
        scaled_prediction = scaled_prediction * 1.3
    
    # Clip the results to [0, 10]
    final_prediction = np.clip(scaled_prediction, 0, 10)

    return float(final_prediction)

def generate_productivity_message_score(predicted_score, historical_mean=None):
    # Updated 0-10 scale labels
    if predicted_score < 3.0:
        label = "🔴 Very Low"
        desc = "Your habits are heavily impacting performance."
    elif predicted_score < 5.0:
        label = "🟡 Below Average"
        desc = "Consider reducing distractions to regain focus."
    elif predicted_score < 7.5:
        label = "🟢 Good"
        desc = "Solid performance. You're in a productive rhythm."
    elif predicted_score < 9.0:
        label = "🟢🟢 Great"
        desc = "Excellent! You're operating at high efficiency."
    else:
        label = "🟢🟢🟢 Exceptional"
        desc = "Flow state achieved. Maximum output possible."
    
    message = f"Score: {predicted_score:.1f}/10 - {label}"
    if historical_mean:
        prev_scaled = historical_mean # Assume user provides already scaled mean or we scale if needed
        if predicted_score >= prev_scaled * 1.1:
            message += " ⭐ Peak Performance!"
            
    return label, message

# --- FastAPI App ---
app = FastAPI(title="FocusFlow Predictor API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class PredictRequest(BaseModel):
    phone_hours: float
    sleep_hours: Optional[float] = None
    notifications_per_day: Optional[float] = None
    work_hours_per_day: Optional[float] = None
    historical_mean: Optional[float] = None
    optimistic_mode: bool = False

class PredictResponse(BaseModel):
    predicted_score: float
    label: str
    message: str

@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    try:
        load_productivity_model_real()
    except Exception as e:
        print(f"FAILED TO LOAD MODEL ON STARTUP: {e}")

class DatasetStats(BaseModel):
    avgPhoneHours: float
    avgSleepHours: float
    avgProductivity: float
    totalRecords: int

class DatasetCorrelations(BaseModel):
    phoneVsScore: float
    sleepVsScore: float
    phoneVsSleep: float

class DataRow(BaseModel):
    phone_hours: float
    sleep_hours: float
    productive_score: float

class DatasetResponse(BaseModel):
    stats: DatasetStats
    correlations: DatasetCorrelations
    data: list[DataRow]

@app.get("/dataset", response_model=DatasetResponse)
async def get_dataset():
    try:
        df = pd.read_csv('productivity_data_real.csv')
        
        # Calculate stats
        avg_phone = float(df['phone_hours'].mean())
        # Use sleep_hours if it exists, otherwise 0
        avg_sleep = float(df['sleep_hours'].mean()) if 'sleep_hours' in df.columns else 0.0
        avg_productivity = float(df['productive_score'].mean())
        total_records = len(df)
        
        # Calculate correlations
        # We need to handle potential missing columns gracefully
        phone_vs_score = float(df['phone_hours'].corr(df['productive_score']))
        
        sleep_vs_score = 0.0
        phone_vs_sleep = 0.0
        if 'sleep_hours' in df.columns:
            sleep_vs_score = float(df['sleep_hours'].corr(df['productive_score']))
            phone_vs_sleep = float(df['phone_hours'].corr(df['sleep_hours']))

        # Prepare preview data (first 10 rows)
        preview_data = []
        for _, row in df.head(10).iterrows():
            preview_data.append(DataRow(
                phone_hours=float(row['phone_hours']),
                sleep_hours=float(row.get('sleep_hours', 0.0)),
                productive_score=float(row['productive_score'])
            ))

        return DatasetResponse(
            stats=DatasetStats(
                avgPhoneHours=round(avg_phone, 2),
                avgSleepHours=round(avg_sleep, 2),
                avgProductivity=round(avg_productivity, 2),
                totalRecords=total_records
            ),
            correlations=DatasetCorrelations(
                phoneVsScore=round(phone_vs_score, 2),
                sleepVsScore=round(sleep_vs_score, 2),
                phoneVsSleep=round(phone_vs_sleep, 2)
            ),
            data=preview_data
        )
    except Exception as e:
        print(f"Error fetching dataset stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        score = predict_productive_score(
            phone_hours=request.phone_hours,
            sleep_hours=request.sleep_hours,
            notifications_per_day=request.notifications_per_day,
            work_hours_per_day=request.work_hours_per_day,
            optimistic_mode=request.optimistic_mode
        )
        label, message = generate_productivity_message_score(score, request.historical_mean)
        return PredictResponse(
            predicted_score=score,
            label=label,
            message=message
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
