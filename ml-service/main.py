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
import cv2
from ultralytics import YOLO, YOLOE
import logging

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
    "clip": None
}

# Pydantic models
class DetectionRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class DetectionResult(BaseModel):
    object_id: str
    class_name: str
    score: float
    bbox: List[float]  # [x, y, w, h]
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

def load_models():
    """Load all ML models on startup"""
    global models
    
    try:
        # Load YOLO model
        yolo_path = os.path.join(MODEL_DIR, "yolo", "yoloe-11l-seg-pf.pt")
        if os.path.exists(yolo_path):
            models["yolo"] = YOLOE(yolo_path)
            logger.info("YOLO model loaded successfully")
        else:
            logger.warning(f"YOLO model not found at {yolo_path}")
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
    
    try:
        # Load Places365 model (placeholder - implement based on chosen model)
        places_path = os.path.join(MODEL_DIR, "places365", "resnet50_places365.pth")
        if os.path.exists(places_path):
            # models["places365"] = load_places365_model(places_path)
            logger.info("Places365 model path found")
        else:
            logger.warning(f"Places365 model not found at {places_path}")
    except Exception as e:
        logger.error(f"Failed to load Places365 model: {e}")
    
    try:
        # Load CLIP model
        clip_path = os.path.join(MODEL_DIR, "clip")
        if os.path.exists(clip_path):
            import clip
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            models["clip"], _ = clip.load("ViT-B/32", device=device)
            logger.info("CLIP model loaded successfully")
        else:
            logger.warning(f"CLIP model not found at {clip_path}")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")

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
            
            # Convert to [x, y, w, h] format
            bbox = [x1, y1, x2 - x1, y2 - y1]
            
            detection = DetectionResult(
                object_id=f"obj_{i}_{int(cls)}",
                class_name=class_name,
                score=conf,
                bbox=bbox,
                crop_url=None  # Will be set after cropping
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
        clip=models["clip"] is not None
    )

@app.post("/detect", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest):
    """Run object detection on image"""
    if not request.image_base64 and not request.image_url:
        raise HTTPException(status_code=400, detail="Either image_base64 or image_url must be provided")
    
    # For now, only support base64 images
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="Only base64 images supported currently")
    
    # Decode image
    image = decode_image(request.image_base64)
    
    # Run YOLO detection
    detections = run_yolo_detection(image)
    
    # Placeholder scene classification
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
        
        # Decode image
        image = decode_image(request.image_base64)
        image_pil = Image.fromarray(image)
        
        # Preprocess and generate embedding
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
    """Classify scene using Places365"""
    if models["places365"] is None:
        raise HTTPException(status_code=503, detail="Places365 model not loaded")
    
    # Placeholder implementation
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
