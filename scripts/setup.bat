@echo off
REM Samsung Reflect AI Search Setup Script for Windows
setlocal enabledelayedexpansion

echo 🚀 Setting up Samsung Reflect AI Search System...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "models\yolo" mkdir models\yolo
if not exist "models\places365" mkdir models\places365
if not exist "models\clip" mkdir models\clip
if not exist "models\onnx" mkdir models\onnx
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "uploads\crops" mkdir uploads\crops
if not exist "logs" mkdir logs

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ Please edit .env file with your configuration
) else (
    echo ✅ .env file already exists
)

REM Download YOLO model
echo 📥 Downloading YOLO model...
if not exist "models\yolo\yolov8n.pt" (
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt' -OutFile 'models\yolo\yolov8n.pt'"
    echo ✅ YOLOv8n model downloaded
) else (
    echo ✅ YOLO model already exists
)

REM Build and start services
echo 🐳 Building Docker images...
docker-compose build

echo 🚀 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...

REM Check API health
curl -f http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ API service is not responding
) else (
    echo ✅ API service is healthy
)

REM Check ML service health
curl -f http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ ML service is not responding
) else (
    echo ✅ ML service is healthy
)

REM Check model health
echo 🤖 Checking AI models...
curl -s http://localhost:3001/api/models/health

echo.
echo 🎉 Setup complete!
echo.
echo 📱 Access the application:
echo    Frontend: http://localhost:5173
echo    API: http://localhost:3001
echo    AI Search: http://localhost:5173/search
echo.
echo 🔧 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo.
echo 📚 Next steps:
echo    1. Upload some images via the AI Search interface
echo    2. Try searching with natural language queries
echo    3. Explore object detection and scene classification
echo.
pause
