# Samsung Reflect – AI-Powered Journaling Companion

[![Watch the Demo](https://img.youtube.com/vi/MTtiyKc8f2g/0.jpg)](https://youtu.be/MTtiyKc8f2g?si=BABhV4ATLIEBAtIL)

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

### ML Service (Python + FastAPI)
- **Framework**: FastAPI with async support
- **Models**: 
  - YOLOv8 for object detection
  - Places365 ResNet50 for scene classification
  - CLIP ViT-B/32 for embeddings
- **Inference**: PyTorch with optional ONNX support
- **Performance**: GPU acceleration with CPU fallback

## Quick Start

### Prerequisites
- Node.js 18+ (for local development)
- Python 3.11+ (for ML service development)
- Docker v20.10+ – for consistent environment setup

### Development Setup

1. **Clone and Configure**
   ```bash
   git clone <repository>
   cd SamsungReflect
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Download AI Models**
   ```bash
   # Create models directory
   mkdir -p models/{yolo,places365,clip}
   
   # Download YOLOv8 nano model (6MB)
   wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O models/yolo/yolov8n.pt
   
   # Places365 and CLIP models will be downloaded automatically on first run
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Verify Installation**
   ```bash
   # Check API health
   curl http://localhost:3001/api/health
   
   # Check AI models
   curl http://localhost:3001/api/models/health
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3001
   - ML Service: http://localhost:8000
   - AI Search: http://localhost:5173/search

## Usage Examples

### Upload and Analyze Image
```bash
curl -X POST http://localhost:3001/api/images/upload \
  -F "image=@photo.jpg"
```

### Search Images
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "text": "dog playing in park",
    "topK": 10,
    "filter": {
      "classes": ["dog"],
      "scenes": ["park", "outdoor"]
    }
  }'
```

### Find Similar Images
```bash
curl -X POST http://localhost:3001/api/search/similar/IMAGE_ID \
  -H "Content-Type: application/json" \
  -d '{"topK": 5}'
```

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
```

### Model Configuration
Models are configured in `models/README.md` with download instructions and performance benchmarks.

### Ranking Configuration
Search ranking parameters are configurable in `config/ranking.json`:
- Object vs scene weighting
- Aggregation methods (max, avg, weighted)
- Filtering options
- A/B testing variants

## Performance

### Scalability
- **Concurrent Users**: 100+ with proper scaling
- **Image Database**: Tested with 100K+ images
- **Search Performance**: Sub-second for most queries
- **Storage**: Configurable (local)

## Android WebView Support

### Optimizations
- **Responsive Design**: Mobile-first UI components
- **Touch Interactions**: Optimized for touch devices
- **Camera Integration**: Direct camera capture
- **Offline Capability**: Client-side inference option
- **Performance**: Lazy loading and image optimization

### Monitoring & Observability
- Health check endpoints for all services
- Structured logging with correlation IDs
- Performance metrics collection
- Error tracking and alerting

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

### Adding New Features
1. **Backend**: Add routes in `backend/src/routes/`
2. **Frontend**: Add components in `Frontend/src/features/`
3. **ML**: Extend `ml-service/main.py`
4. **Database**: Add models in `backend/src/models/`

### Testing
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd Frontend && npm test

# Run ML service tests
cd ml-service && python -m pytest
```
