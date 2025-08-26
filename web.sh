#!/bin/bash

# Samsung Reflect AI - Complete Web Application Startup Script
set -e

echo "🚀 Samsung Reflect AI - Complete Setup & Launch"
echo "================================================"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ All prerequisites found"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models/{yolo,places365,clip,onnx}
mkdir -p uploads/{thumbnails,crops}
mkdir -p logs
mkdir -p backups

# Setup environment
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created - please edit if needed"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "  Installing Node.js packages..."
    npm install
else
    echo "  ✅ Backend dependencies already installed"
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd Frontend
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "  Installing React packages..."
    npm install
else
    echo "  ✅ Frontend dependencies already installed"
fi
cd ..

# Install ML service dependencies
echo "🤖 Installing ML service dependencies..."
cd ml-service
if [ ! -f "requirements_installed.flag" ]; then
    echo "  Installing Python packages..."
    pip3 install -r requirements.txt
    touch requirements_installed.flag
else
    echo "  ✅ ML dependencies already installed"
fi
cd ..

# Download AI models
echo "📥 Downloading AI models..."

# YOLO models
echo "  🎯 Downloading YOLO models..."
cd models/yolo
if [ ! -f "yolov8n.pt" ]; then
    echo "    Downloading YOLOv8n (6MB)..."
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o yolov8n.pt
fi
if [ ! -f "yolov8s.pt" ]; then
    echo "    Downloading YOLOv8s (22MB)..."
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt -o yolov8s.pt
fi
if [ ! -f "yolov8m.pt" ]; then
    echo "    Downloading YOLOv8m (52MB)..."
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt -o yolov8m.pt
fi
cd ../..

# Places365 model
echo "  🏞️ Downloading Places365 model..."
cd models/places365
if [ ! -f "resnet50_places365.pth.tar" ]; then
    echo "    Downloading ResNet50-Places365 (102MB)..."
    curl -L http://places2.csail.mit.edu/models_places365/resnet50_places365.pth.tar -o resnet50_places365.pth.tar
fi
if [ ! -f "categories_places365.txt" ]; then
    echo "    Downloading Places365 categories..."
    curl -L https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt -o categories_places365.txt
fi
cd ../..

echo "✅ All models downloaded"

# Initialize native services
echo "🔧 Initializing native services..."
echo "✅ Using MongoDB Atlas (cloud-hosted)"
echo "✅ Using file-based vector storage"
echo "✅ Using in-memory job queue"

# Start ML service
echo "🤖 Starting ML service..."
cd ml-service
python3 main.py &
ML_PID=$!
cd ..

# Wait for ML service
echo "⏳ Waiting for ML service..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ ML service is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ ML service failed to start"
        kill $ML_PID 2>/dev/null || true
        exit 1
    fi
    sleep 3
done

# Start backend
echo "🔧 Starting backend API..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "⏳ Waiting for backend API..."
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend API failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        kill $ML_PID 2>/dev/null || true
        exit 1
    fi
    sleep 2
done

# Start frontend
echo "⚛️ Starting frontend..."
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..30}; do
    if curl -f http://localhost:5173 >/dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend failed to start"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        kill $ML_PID 2>/dev/null || true
        exit 1
    fi
    sleep 2
done

# Final health check
echo "🔍 Final system health check..."
echo "  Testing API health..."
curl -s http://localhost:3001/api/health | python3 -m json.tool || echo "❌ API health check failed"

echo "  Testing ML service..."
curl -s http://localhost:8000/health | python3 -m json.tool || echo "❌ ML service health check failed"

echo "  Testing model health..."
curl -s http://localhost:3001/api/models/health | python3 -m json.tool || echo "❌ Model health check failed"

echo ""
echo "🎉 Samsung Reflect AI is now running!"
echo "================================================"
echo ""
echo "📱 Access your application:"
echo "   🌐 Frontend:     http://localhost:5173"
echo "   🔍 AI Search:    http://localhost:5173/search"
echo "   📝 Journal:      http://localhost:5173/"
echo "   🧠 Memories:     http://localhost:5173/memories"
echo "   📊 Insights:     http://localhost:5173/insights"
echo "   ⚙️  Settings:     http://localhost:5173/settings"
echo ""
echo "🔧 API Endpoints:"
echo "   📡 Backend API:  http://localhost:4000"
echo "   🤖 ML Service:   http://localhost:8000"
echo "   🗄️  MongoDB:     Atlas Cloud (connected)"
echo "   💾 Vector DB:    File-based storage"
echo "   🔄 Job Queue:    In-memory processing"
echo ""
echo "📚 Quick Start:"
echo "   1. Open http://localhost:5173/search"
echo "   2. Upload an image using drag & drop"
echo "   3. Wait for AI processing to complete"
echo "   4. Try searching with text like 'red car' or 'person in kitchen'"
echo ""
echo "🛑 To stop all services:"
echo "   Press Ctrl+C or run: ./scripts/stop.sh"
echo ""

# Create stop script
cat > scripts/stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Samsung Reflect AI services..."
kill $FRONTEND_PID 2>/dev/null || true
kill $BACKEND_PID 2>/dev/null || true  
kill $ML_PID 2>/dev/null || true
docker-compose down
echo "✅ All services stopped"
EOF
chmod +x scripts/stop.sh

# Save PIDs for cleanup
echo "FRONTEND_PID=$FRONTEND_PID" > .pids
echo "BACKEND_PID=$BACKEND_PID" >> .pids
echo "ML_PID=$ML_PID" >> .pids

# Keep script running and handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $ML_PID 2>/dev/null || true
    docker-compose down
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "🔄 Services are running. Press Ctrl+C to stop all services."
echo ""

# Keep the script running
while true; do
    sleep 10
    # Check if services are still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend stopped unexpectedly"
        cleanup
    fi
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend stopped unexpectedly"
        cleanup
    fi
    if ! kill -0 $ML_PID 2>/dev/null; then
        echo "❌ ML service stopped unexpectedly"
        cleanup
    fi
done
