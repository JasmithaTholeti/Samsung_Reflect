# ML Service – Samsung Reflect 🧠

## 1. Overview

The `ml-service` directory implements the **AI inference server** for Samsung Reflect. It’s a Python application built with **FastAPI**, providing dedicated endpoints for object detection, scene classification, and image embedding. The service hosts and manages critical ML models (YOLOv8, Places365, CLIP), exposing a fast, asynchronous HTTP API for use by the core backend.

***

## 2. Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **FastAPI** | High-performance, asynchronous Python web server. |
| **Object Detection** | **YOLOv8** | Used for detecting 80+ object classes. |
| **Scene Classification** | **Places365 ResNet50** | Used for recognizing 365 scene categories. |
| **Embeddings** | **CLIP ViT-B/32** | Generates vector representations for semantic search. |
| **Inference Engine** | **PyTorch** | Core library for model execution, supporting GPU/CPU. |
| **Performance** | **GPU Acceleration** | Optimized for CUDA, with automatic CPU fallback. |

***

## 3. Prerequisites

To run the ML Service locally, you need:

* **Python 3.11+** (It is recommended to use a tool like `pyenv` for environment management).
* **Hardware:** A GPU with CUDA support is highly recommended for optimal performance, though the service will run correctly using CPU fallback.
* **(Optional) Software:** Install the CUDA Toolkit and/or ONNX Runtime if you intend to optimize GPU or ONNX inference paths.

***

## 4. Installation & Setup

Follow these steps to set up the Python environment and run the FastAPI server:

```bash
# Navigate into the ml-service directory from the project root
cd ml-service

# 1. Create and activate a Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# 2. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Create the models directory and download YOLOv8 nano model (Manual Step)
mkdir -p models/yolo
wget [https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt](https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt) -O models/yolo/yolov8n.pt

# (Note: Places365 and CLIP models will be downloaded automatically on first run.)
```


## 5. Model Management

This service is designed for efficient and flexible model handling:

* **Model Storage:** All models are expected to be stored in the `models/` directory at the root of `ml-service/`.
* **YOLOv8 Requirement:** The YOLOv8 model (`yolov8n.pt`) **must be downloaded manually** before starting the service (see step 3 in Installation).
* **Auto-Download:** The Places365 and CLIP models are downloaded and cached automatically by the service on the very first inference request if they are not already present.
* **Configuration:** You may change model paths and inference options via environment variables or in the code (see `main.py` and config parsing).
* **ONNX Support:** If optimized ONNX models are present, the service will utilize **ONNX Runtime** for inference when enabled via configuration.

***

## 6. Key Endpoints

The service exposes the following endpoints for inference and health checks:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status. |
| `GET` | `/models/health` | Status of all loaded ML models (availability/readiness). |
| `POST` | `/detect` | Run object detection (YOLOv8) on an uploaded image. |
| `POST` | `/classify` | Run scene classification (Places365) on an uploaded image. |
| `POST` | `/embed` | Generate CLIP embedding for an image or text input. |

# 4. Start the FastAPI server (development mode, hot reload)
uvicorn main:app --reload

## 7. Testing

To run the full test suite (which requires Python dependencies to be installed):

```bash
python -m pytest


## 8. Developer Notes 🛠️

1.  **Performance:**
    * **GPU Acceleration:** If PyTorch detects a CUDA-enabled GPU, inference will be significantly faster (e.g., YOLOv8: ~1ms/image).
    * **CPU Fallback:** The service is configured to automatically fall back to CPU when no GPU is detected (~50-300ms/image, depending on model).
2.  **Adding New Models:**
    * Place new model files in the appropriate subdirectory under the `models/` folder.
    * Extend `main.py` (or add a new route/service) for the new inference type and model loading logic.
3.  **Inference Configuration:**
    * The `SERVER_INFERENCE` flag (managed via `.env`) enables/disables server-side inference.
    * Other flags, such as `MIN_DETECTION_SCORE` and `MODEL_DIR`, are configurable via environment variables.
4.  **Production Notes:** For production deployment, consider running with multiple workers: `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2`. Use Docker for containerized deployment (see root README).
