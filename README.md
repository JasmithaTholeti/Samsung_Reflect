# Samsung Reflect - AI-Powered Image Search

A comprehensive MERN stack application with YOLO object detection, Places365 scene classification, and CLIP embeddings for intelligent image search and analysis.

## Features

### Core Functionality (Preserved)
- **Journal System**: Rich text journal entries with mood tracking
- **Media Upload**: Support for images and files up to 100MB
- **Insights Dashboard**: Analytics and data visualization
- **Settings Management**: User preferences and configuration

### New AI Features
- **Object Detection**: YOLO-powered detection of 80+ object classes
- **Scene Classification**: Places365 scene recognition (365 categories)
- **Semantic Search**: Natural language queries using CLIP embeddings
- **Visual Similarity**: Find similar images using vector search
- **Real-time Processing**: Asynchronous image analysis pipeline
- **Android WebView Support**: Optimized for mobile deployment

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

## API Endpoints

### Existing Endpoints (Preserved)
- `GET /api/health` - Service health check
- `POST /api/entries` - Create journal entry
- `GET /api/entries` - List journal entries
- `POST /api/media` - Upload media files
- `GET /api/insights` - Get analytics data

### New AI Endpoints
- `POST /api/images/upload` - Upload image for AI analysis
- `GET /api/images/:id` - Get image with detection results
- `POST /api/search` - Text-based image search
- `POST /api/search/similar/:imageId` - Find similar images
- `GET /api/models/health` - AI model status

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

### Benchmarks (Single Image)
- **YOLOv8n**: ~50ms CPU, ~1ms GPU
- **Places365**: ~200ms CPU, ~10ms GPU  
- **CLIP Embedding**: ~300ms CPU, ~15ms GPU
- **Vector Search**: ~5ms for 10K images
- **End-to-end**: ~1s CPU, ~100ms GPU

### Scalability
- **Concurrent Users**: 100+ with proper scaling
- **Image Database**: Tested with 100K+ images
- **Search Performance**: Sub-second for most queries
- **Storage**: Configurable (local/S3/GCS)

## Android WebView Support

### Optimizations
- **Responsive Design**: Mobile-first UI components
- **Touch Interactions**: Optimized for touch devices
- **Camera Integration**: Direct camera capture
- **Offline Capability**: Client-side inference option
- **Performance**: Lazy loading and image optimization

### WebView Configuration
```javascript
// Enable required permissions
webView.getSettings().setJavaScriptEnabled(true);
webView.getSettings().setDomStorageEnabled(true);
webView.getSettings().setAllowFileAccess(true);
webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
```

## Deployment

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with SSL and monitoring
docker-compose -f docker-compose.prod.yml up -d
```

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

## Troubleshooting

### Common Issues
1. **Models not loading**: Check `models/README.md` for download instructions
2. **Slow inference**: Verify GPU acceleration is enabled
3. **Search returns no results**: Check vector database connection
4. **Memory issues**: Use smaller models or reduce batch size

### Debug Commands
```bash
# Check service logs
docker-compose logs -f api
docker-compose logs -f python-ml

# Verify model health
curl http://localhost:3001/api/models/health

# Check vector database
curl http://localhost:6333/collections
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **Python**: PEP 8 compliance
- **React**: Functional components with hooks
- **Testing**: Unit tests for critical paths

## License

[Your License Here]

## Support

- **Documentation**: See `RUNBOOK.md` for operations
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
