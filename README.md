# Samsung Reflect – AI-Powered Journaling Companion

## Preview
https://github.com/user-attachments/assets/71ad95c6-cfdb-49df-9a4d-7f5621193cf4

## Youtube Demo 
[![Watch the video](https://img.youtube.com/vi/X5jNAz6htws/0.jpg)](https://youtu.be/X5jNAz6htws)

🔗 [Watch the full demo on YouTube](https://youtu.be/X5jNAz6htws)

A comprehensive **MERN stack application** focused on **smart journaling and self-reflection**, powered by **multi-modal AI** for seamless use of text, photos, audio, and intelligent media processing.

---

## ✨ Features

### 📔 Core Journaling Experience
- **Intelligent Journal System**  
  Create rich stories combining text, photos, videos, and audio, enhanced with **AI mood detection**.

- **Smart Media Suggestions**  
  Get relevant photo, video, or audio recommendations from your gallery as you type.

- **Flexible Canvas**  
  Drag, resize, and crop journal elements to design your stories your way.

- **Memories Library**  
  Save, revisit, edit, and favorite your journals with **privacy controls** like pass-key-locked folders.

- **Insights Dashboard**  
  View **streaks, activity reports, and mood trends** to stay motivated.

- **Settings & Privacy**  
  Manage preferences, data, and security with full control.

- **Standby Mode**  
  Access and use your journals in **standby mode** across all your Samsung devices, keeping your reflections available anytime, even when your device is idle.
---

### 🤖 Enhanced AI Features
- **Generative AI Storytelling**
    Instantly turn keywords into rich, descriptive diary entries using **Zephyr-7B** (via Hugging Face).
  
- **Smart "Thinking" Autocomplete**
    Context-aware text suggestions that finish your sentences as you type, powered by LLMs.
  
- **Text-to-Image Generation**
    Create custom cover art and illustrations for your journals using **Stable Diffusion XL**.
  
- **Semantic Media Search**  
  Quickly find the right photos, videos, or audio by **location, objects, context, and more** to enrich your journal entries.

- **Object & Scene Detection**  
  Automatically identify **objects, scenes, and faces** in your media to improve recommendations and organization.

- **AI-Powered Media Processing**  
  Analyze and process **images, audio, and text in real time** for smart suggestions, mood insights, and seamless journal creation.

- **Real-Time Performance**  
  Fast and efficient pipeline for **media clustering, retrieval, and personalized recommendations**.

- **Android WebView Support**  
  Smooth and optimized experience for **mobile devices**.

---

## 🚀 About Samsung Reflect
Samsung Reflect is designed to make **journaling more meaningful and intelligent**, transforming memories into personalized stories while keeping your data secure and accessible across Samsung devices.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: Vite + React 18 + TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: React Router v6
- **AI Features**: 
  - Image upload with drag & drop
  - Real-time detection overlays
  - Search interface with filters
  - Results visualization

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express and TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Job Queue**: BullMQ with Redis
- **File Processing**: Sharp for image manipulation
- **Vector Search**: Qdrant vector database
- **API Design**: RESTful with comprehensive error handling

#### ML Service (Python + FastAPI)

- **Framework:** FastAPI with async support
- **Generative AI (New):**
    * **Text & Logic:** Hugging Face Inference API (**Zephyr-7B-Beta**) for storytelling and autocomplete.
    * **Image Generation:** Stable Diffusion XL Base 1.0.
- **Computer Vision (Local):**
    * **Object Detection:** YOLOv8
    * **Scene Classification:** Places365 ResNet50
    * **Embeddings:** CLIP ViT-B/32
- **Security:** Environment-based secret management (`.env`) for API keys.

## Quick Start

### Prerequisites
- Node.js 18+ (for local development)
- Python 3.11+ (for ML service development)
- Docker v20.10+ – for consistent environment setup

### Development Setup

1. **Clone and Configure**
   ```bash
   git clone https://github.com/JasmithaTholeti/Samsung_Reflect.git
   cd Samsung_Reflect
   ```
2. **Set up ML Service Secrets**
   ```bash
    cd ml-service
    touch .env
    echo "HF_API_KEY=your_hugging_face_token_here" >> .env
    cd ..
   ```

3. **Download AI Models**
   ```bash
   # Create models directory
   mkdir -p models/{yolo,places365,clip}
   
   # Download YOLOv8 nano model (6MB)
   wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O models/yolo/yolov8n.pt
   
   # Places365 and CLIP models will be downloaded automatically on first run
   ```

4. **Start Services**
   ```bash
   docker-compose up -d
   ```

5. **Verify Installation**
   ```bash
   # Check API health
   curl http://localhost:3001/api/health
   
   # Check AI models
   curl http://localhost:3001/api/models/health
   ```

6. **Access Application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3001
   - ML Service: http://localhost:8000
   - AI Search: http://localhost:5173/search

## Configuration

### Environment Variables
```bash
# Database
MONGO_URI=mongodb://localhost:27017/samsung-reflect

# AI Configuration
SERVER_INFERENCE=true
MODEL_DIR=./models
MIN_DETECTION_SCORE=0.25
VECTOR_DB_URL=http://localhost:6333

# Feature Flags
ENABLE_CLIENT_INFERENCE=false
ENABLE_RERANKING=true

# Ranking Weights
OBJECT_WEIGHT=0.7
SCENE_WEIGHT=0.3
AGGREGATION_METHOD=weighted

# Generative AI Secrets (Required)
HF_API_KEY=your_hugging_face_token_here
```

## Development

### Project Structure
```
SamsungReflect/
├── Frontend/                 # React application
│   ├── src/
│   │   ├── features/search/  # AI search components
│   │   ├── components/       # Shared UI components
│   │   └── pages/           # Application pages
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
├── ml-service/              # Python ML service
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
├── models/                 # AI model files
├── config/                # Configuration files
└── docker-compose.yml     # Development setup
```
