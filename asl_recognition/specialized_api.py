from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import mediapipe as mp
from io import BytesIO
import base64
import uvicorn
from pydantic import BaseModel
from typing import Optional, List, Dict
import os

# Use relative imports
from asl_recognition.utils.landmark_extraction import extract_landmarks, normalize_landmarks
from asl_recognition.models.classifier import ASLClassifier

# Initialize FastAPI app
app = FastAPI(
    title="ASL Recognition API with Specialized Models",
    description="API for recognizing American Sign Language signs from images using specialized models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you may want to restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

# Initialize the classifiers
general_classifier = ASLClassifier()
specialized_classifiers = {}

# Model paths
GENERAL_MODEL_PATH = os.path.join('asl_recognition', 'data', 'asl_model.pkl')
SPECIALIZED_MODELS_DIR = os.path.join('asl_recognition', 'data', 'specialized')

# Letter range directories
LETTER_RANGES = [
    ('A', 'F'),
    ('G', 'K'),
    ('L', 'P'),
    ('Q', 'U'),
    ('V', 'Z')
]

# Load models on startup
@app.on_event("startup")
async def startup_event():
    # Load general model
    try:
        general_classifier.load(GENERAL_MODEL_PATH)
        print(f"General model loaded successfully from {GENERAL_MODEL_PATH}")
    except Exception as e:
        print(f"Error loading general model: {e}")
    
    # Load specialized models from structured directories
    for start_letter, end_letter in LETTER_RANGES:
        model_key = f"{start_letter}_to_{end_letter}"
        model_dir = os.path.join(SPECIALIZED_MODELS_DIR, model_key)
        model_path = os.path.join(model_dir, f"asl_model_{start_letter}_to_{end_letter}.pkl")
        
        if os.path.exists(model_path):
            try:
                classifier = ASLClassifier()
                classifier.load(model_path)
                specialized_classifiers[model_key] = classifier
                print(f"Specialized model {model_key} loaded from {model_path}")
            except Exception as e:
                print(f"Error loading specialized model {model_key}: {e}")

# Response models
class PredictionResponse(BaseModel):
    sign: str
    confidence: float
    landmarks: List[Dict[str, float]]
    has_hand: bool
    model_used: str

class HealthResponse(BaseModel):
    status: str
    general_model_loaded: bool
    specialized_models: List[str]

class AvailableModelsResponse(BaseModel):
    models: List[str]

# Health endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    general_model_loaded = hasattr(general_classifier, 'model') and general_classifier.model is not None
    return {
        "status": "healthy",
        "general_model_loaded": general_model_loaded,
        "specialized_models": list(specialized_classifiers.keys())
    }

# Available models endpoint
@app.get("/models", response_model=AvailableModelsResponse)
async def get_available_models():
    models = ["general"] + list(specialized_classifiers.keys())
    return {
        "models": models
    }

# Prediction function
def process_image_and_predict(image, model_key=None):
    # Convert to RGB (MediaPipe requires RGB input)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process the image with MediaPipe
    results = hands.process(image_rgb)
    
    # Check if hand is detected
    if not results.multi_hand_landmarks:
        return {
            "sign": "no_hand",
            "confidence": 0.0,
            "landmarks": [],
            "has_hand": False,
            "model_used": model_key or "general"
        }
    
    # Extract landmarks
    landmarks_array = np.zeros((21, 3))
    for i, landmark in enumerate(results.multi_hand_landmarks[0].landmark):
        landmarks_array[i] = [landmark.x, landmark.y, landmark.z]
    
    # Normalize landmarks
    normalized_landmarks = normalize_landmarks(landmarks_array)
    
    # Select classifier
    if model_key and model_key in specialized_classifiers:
        classifier = specialized_classifiers[model_key]
        model_used = model_key
    else:
        classifier = general_classifier
        model_used = "general"
    
    # Make prediction
    label, confidence = classifier.predict(normalized_landmarks)
    
    # Format landmarks for response
    landmarks_list = []
    for i, landmark in enumerate(landmarks_array):
        landmarks_list.append({
            "x": float(landmark[0]),
            "y": float(landmark[1]),
            "z": float(landmark[2]),
            "index": i
        })
    
    return {
        "sign": label,
        "confidence": float(confidence),
        "landmarks": landmarks_list,
        "has_hand": True,
        "model_used": model_used
    }

# Prediction endpoint for uploaded images
@app.post("/predict", response_model=PredictionResponse)
async def predict_sign(
    file: UploadFile = File(...),
    model: str = Query(None, description="Specialized model to use (e.g., 'A_to_F') or 'general'")
):
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Process and predict
        return process_image_and_predict(image, model)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Prediction from base64 encoded image
class Base64ImageRequest(BaseModel):
    image: str
    model: Optional[str] = None

@app.post("/predict/base64", response_model=PredictionResponse)
async def predict_sign_base64(request: Base64ImageRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Process and predict
        return process_image_and_predict(image, request.model)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Run the server
if __name__ == "__main__":
    uvicorn.run("asl_recognition.specialized_api:app", host="0.0.0.0", port=8000, reload=True) 