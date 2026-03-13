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

def load_productivity_model_real():
    """
    Loads the saved model, feature names, and calculates feature means from
    the cleaned training data. Caches them for subsequent calls.
    """
    global _MODEL_CACHE, _FEATURE_NAMES_CACHE, _FEATURE_MEANS_CACHE

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
    work_hours_per_day=None
):
    """
    Predicts the productive score based on input features.
    """
    model, feature_names, feature_means = load_productivity_model_real()

    # Collect input values, prioritizing provided arguments
    input_kwargs = {
        'phone_hours': phone_hours,
        'sleep_hours': sleep_hours,
        'notifications_per_day': notifications_per_day,
        'work_hours_per_day': work_hours_per_day
    }

    # Build the feature vector in the exact order the model expects
    feature_vector = []
    for feature in feature_names:
        value = input_kwargs.get(feature)

        if value is not None:
            feature_vector.append(value)
        else:
            # If the value is None (not provided), use the cached mean for imputation
            if feature in feature_means:
                feature_vector.append(feature_means[feature])
            else:
                raise ValueError(f"Feature '{feature}' is expected by the model but was not provided and its mean is not available.")

    # Convert the list to a numpy array and reshape for single prediction
    X_predict = np.array(feature_vector).reshape(1, -1)

    # Make prediction
    prediction = model.predict(X_predict)[0]

    # Clip the result to [0, 10]
    clipped_prediction = np.clip(prediction, 0, 10)

    return float(clipped_prediction)

def generate_productivity_message_score(predicted_score, historical_mean=None):
    if predicted_score < 3.0:
        label = "🔴 Very Low"
    elif predicted_score < 5.0:
        label = "🟡 Below Average" 
    elif predicted_score < 7.5:
        label = "🟢 Decent"
    else:
        label = "🟢 High Productivity"
    
    message = f"Predicted: {predicted_score:.1f}/10 ({label})"
    if historical_mean:
        if predicted_score >= historical_mean * 1.1:
            message += " ⭐ Better than average!"
        elif predicted_score <= historical_mean * 0.9:
            message += " ⚠️ Below your usual performance"
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

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        score = predict_productive_score(
            phone_hours=request.phone_hours,
            sleep_hours=request.sleep_hours,
            notifications_per_day=request.notifications_per_day,
            work_hours_per_day=request.work_hours_per_day
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
