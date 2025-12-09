from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import io
import base64
import numpy as np
from PIL import Image
import torch
# Removed cv2 import as it wasn't used in the provided snippet, 
# but if you need it for other parts, keep it. 
# from ultralytics import YOLO, YOLOE # Commented out if not installed yet, ensure they are in requirements
from ultralytics import YOLO
import logging

# --- NEW IMPORT FOR GENAI ---
from transformers import pipeline, set_seed

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Samsung Reflect ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_DIR = os.getenv("MODEL_DIR", "./models")
MIN_DETECTION_SCORE = float(os.getenv("MIN_DETECTION_SCORE", "0.25"))
NMS_IOU_THRESHOLD = float(os.getenv("NMS_IOU_THRESHOLD", "0.45"))

# Global model storage
models = {
    "yolo": None,
    "places365": None,
    "clip": None,
    "generator": None  # <--- Added storage for the GenAI model
}

# Pydantic models
class DetectionRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class DetectionResult(BaseModel):
    object_id: str
    class_name: str
    score: float
    bbox: List[float]
    crop_url: Optional[str] = None

class SceneResult(BaseModel):
    label: str
    score: float

class DetectionResponse(BaseModel):
    image_id: str
    objects: List[DetectionResult]
    scene: Dict[str, Any]

class EmbeddingRequest(BaseModel):
    image_base64: str
    model: str = "clip"

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dims: int

class HealthResponse(BaseModel):
    yolo: bool
    places365: bool
    clip: bool
    generator: bool # <--- Added to health check

# --- NEW MODELS FOR TEXT GENERATION ---
class TextGenerationRequest(BaseModel):
    text: str
    max_length: int = 50  # How many words to generate maximum

class TextGenerationResponse(BaseModel):
    generated_text: str

def load_models():
    """Load all ML models on startup"""
    global models
    
    # 1. Load YOLO model
    try:
        # Note: Ensure the file name matches exactly what you downloaded (yolov8n.pt usually)
        # I changed the path to match the standard download name 'yolov8n.pt' based on our previous chat
        # If your file is named 'yoloe-11l-seg-pf.pt', change it back!
        yolo_path = os.path.join(MODEL_DIR, "yolo", "yolov8n.pt") 
        if os.path.exists(yolo_path):
            models["yolo"] = YOLO(yolo_path) # Changed YOLOE to YOLO for standard v8
            logger.info("YOLO model loaded successfully")
        else:
            logger.warning(f"YOLO model not found at {yolo_path}")
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
    
    # 2. Load Places365 model
    try:
        places_path = os.path.join(MODEL_DIR, "places365", "resnet50_places365.pth")
        if os.path.exists(places_path):
            # models["places365"] = load_places365_model(places_path)
            logger.info("Places365 model path found")
        else:
            logger.warning(f"Places365 model not found at {places_path}")
    except Exception as e:
        logger.error(f"Failed to load Places365 model: {e}")
    
    # 3. Load CLIP model
    try:
        clip_path = os.path.join(MODEL_DIR, "clip")
        # We don't strictly need the file path if we use the library, but good for checking
        import clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        models["clip"], _ = clip.load("ViT-B/32", device=device)
        logger.info("CLIP model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")

    # 4. Load GENAI Text Generator (New!)
    try:
        logger.info("Loading DistilGPT-2 model...")
        # 'pipeline' handles downloading and setting up the model automatically
        models["generator"] = pipeline('text-generation', model='distilgpt2')
        logger.info("DistilGPT-2 loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Generator model: {e}")


def decode_image(image_base64: str) -> np.ndarray:
    """Decode base64 image to numpy array"""
    try:
        image_data = base64.b64decode(image_base64.split(',')[-1])
        image = Image.open(io.BytesIO(image_data))
        return np.array(image.convert('RGB'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

def run_yolo_detection(image: np.ndarray) -> List[DetectionResult]:
    """Run YOLO detection on image"""
    if models["yolo"] is None:
        raise HTTPException(status_code=503, detail="YOLO model not loaded")
    
    try:
        results = models["yolo"](image, conf=MIN_DETECTION_SCORE, iou=NMS_IOU_THRESHOLD)
        detections = []
        
        for i, result in enumerate(results[0].boxes.data):
            x1, y1, x2, y2, conf, cls = result.tolist()
            class_name = models["yolo"].names[int(cls)]
            
            bbox = [x1, y1, x2 - x1, y2 - y1]
            
            detection = DetectionResult(
                object_id=f"obj_{i}_{int(cls)}",
                class_name=class_name,
                score=conf,
                bbox=bbox,
                crop_url=None
            )
            detections.append(detection)
        
        return detections
    except Exception as e:
        logger.error(f"YOLO detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {e}")

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    logger.info("Loading ML models...")
    load_models()
    logger.info("ML service startup complete")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check model health status"""
    return HealthResponse(
        yolo=models["yolo"] is not None,
        places365=models["places365"] is not None,
        clip=models["clip"] is not None,
        generator=models["generator"] is not None
    )

# --- NEW ENDPOINT FOR TEXT GENERATION ---
@app.post("/generate", response_model=TextGenerationResponse)
async def generate_text(request: TextGenerationRequest):
    """
    Generate text based on the input prompt.
    This provides the 'Autocomplete' functionality.
    """
    if models["generator"] is None:
        raise HTTPException(status_code=503, detail="Generator model not loaded")
    
    try:
        # Generate text
        # max_new_tokens limits how much it writes (to keep it fast)
        # num_return_sequences=1 means just give me 1 suggestion
       
        output = models["generator"](
            request.text, 
            max_new_tokens=15,       # Generate 15 new words max
            num_return_sequences=1,
            do_sample=True,          # Enable creativity
            temperature=0.8,         # Higher = more creative (0.7 -> 0.8)
            repetition_penalty=1.3,  # <--- THIS IS THE FIX (Punishes repeating words)
            truncation=True          # Ensure it handles length properly
        )
        
        # The pipeline returns a list of dicts: [{'generated_text': '...'}]
        generated_full_text = output[0]['generated_text']
        
        # Usually, we only want the *new* part, but for now, let's return the whole thing
        # The frontend can decide how to display it.
        return TextGenerationResponse(generated_text=generated_full_text)

    except Exception as e:
        logger.error(f"Text generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

@app.post("/detect", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest):
    """Run object detection on image"""
    if not request.image_base64 and not request.image_url:
        raise HTTPException(status_code=400, detail="Either image_base64 or image_url must be provided")
    
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="Only base64 images supported currently")
    
    image = decode_image(request.image_base64)
    detections = run_yolo_detection(image)
    
    scene = {
        "primary": "unknown",
        "labels": [{"label": "unknown", "score": 0.0}]
    }
    
    return DetectionResponse(
        image_id=f"img_{hash(request.image_base64[:100])}",
        objects=detections,
        scene=scene
    )

@app.post("/embed", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """Generate image embedding"""
    if models["clip"] is None:
        raise HTTPException(status_code=503, detail="CLIP model not loaded")
    
    try:
        import clip
        import torch
        from PIL import Image
        
        image = decode_image(request.image_base64)
        image_pil = Image.fromarray(image)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        preprocess = clip.load("ViT-B/32", device=device)[1]
        image_input = preprocess(image_pil).unsqueeze(0).to(device)
        
        with torch.no_grad():
            image_features = models["clip"].encode_image(image_input)
            embedding = image_features.cpu().numpy().flatten().tolist()
        
        return EmbeddingResponse(
            embedding=embedding,
            dims=len(embedding)
        )
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")

@app.post("/embed-text", response_model=EmbeddingResponse)
async def generate_text_embedding(request: dict):
    """Generate text embedding using CLIP"""
    if models["clip"] is None:
        raise HTTPException(status_code=503, detail="CLIP model not loaded")
    
    try:
        import clip
        import torch
        
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        text_tokens = clip.tokenize([text]).to(device)
        
        with torch.no_grad():
            text_features = models["clip"].encode_text(text_tokens)
            embedding = text_features.cpu().numpy().flatten().tolist()
        
        return EmbeddingResponse(
            embedding=embedding,
            dims=len(embedding)
        )
    except Exception as e:
        logger.error(f"Text embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text embedding generation failed: {e}")

@app.post("/scene", response_model=Dict[str, Any])
async def classify_scene(request: DetectionRequest):
    if models["places365"] is None:
        raise HTTPException(status_code=503, detail="Places365 model not loaded")
    
    return {
        "primary": "outdoor",
        "labels": [
            {"label": "outdoor", "score": 0.8},
            {"label": "natural", "score": 0.6}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)