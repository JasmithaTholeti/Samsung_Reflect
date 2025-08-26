#!/bin/bash

# Samsung Reflect AI Search Setup Script
set -e

echo "🚀 Setting up Samsung Reflect AI Search System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models/{yolo,places365,clip,onnx}
mkdir -p uploads/{thumbnails,crops}
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Download YOLO model
echo "📥 Downloading YOLO model..."
if [ ! -f models/yolo/yolov8n.pt ]; then
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o models/yolo/yolov8n.pt
    echo "✅ YOLOv8n model downloaded"
else
    echo "✅ YOLO model already exists"
fi

# Build and start services
echo "🐳 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check API health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service is not responding"
fi

# Check ML service health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ ML service is healthy"
else
    echo "❌ ML service is not responding"
fi

# Check model health
echo "🤖 Checking AI models..."
curl -s http://localhost:3001/api/models/health | python3 -m json.tool || echo "❌ Model health check failed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   API: http://localhost:3001"
echo "   AI Search: http://localhost:5173/search"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "📚 Next steps:"
echo "   1. Upload some images via the AI Search interface"
echo "   2. Try searching with natural language queries"
echo "   3. Explore object detection and scene classification"
echo ""
