@echo off
REM Samsung Reflect AI - Complete Web Application Startup Script for Windows
setlocal enabledelayedexpansion

echo 🚀 Samsung Reflect AI - Complete Setup ^& Launch
echo ================================================

REM Check prerequisites
echo 🔍 Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check Docker
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

echo ✅ All prerequisites found

REM Create necessary directories
echo 📁 Creating directories...
if not exist "models\yolo" mkdir models\yolo
if not exist "models\places365" mkdir models\places365
if not exist "models\clip" mkdir models\clip
if not exist "models\onnx" mkdir models\onnx
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "uploads\crops" mkdir uploads\crops
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

REM Setup environment
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ .env file created - please edit if needed
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
if not exist "node_modules" (
    echo   Installing Node.js packages...
    npm install
) else (
    echo   ✅ Backend dependencies already installed
)
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd Frontend
if not exist "node_modules" (
    echo   Installing React packages...
    npm install
) else (
    echo   ✅ Frontend dependencies already installed
)
cd ..

REM Install ML service dependencies
echo 🤖 Installing ML service dependencies...
cd ml-service
if not exist "requirements_installed.flag" (
    echo   Installing Python packages...
    pip install -r requirements.txt
    echo. > requirements_installed.flag
) else (
    echo   ✅ ML dependencies already installed
)
cd ..

REM Download AI models
echo 📥 Downloading AI models...

REM YOLO models
echo   🎯 Downloading YOLO models...
cd models\yolo
if not exist "yolov8n.pt" (
    echo     Downloading YOLOv8n (6MB)...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt' -OutFile 'yolov8n.pt'"
)
if not exist "yolov8s.pt" (
    echo     Downloading YOLOv8s (22MB)...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt' -OutFile 'yolov8s.pt'"
)
if not exist "yolov8m.pt" (
    echo     Downloading YOLOv8m (52MB)...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt' -OutFile 'yolov8m.pt'"
)
cd ..\..

REM Places365 model
echo   🏞️ Downloading Places365 model...
cd models\places365
if not exist "resnet50_places365.pth.tar" (
    echo     Downloading ResNet50-Places365 (102MB)...
    powershell -Command "Invoke-WebRequest -Uri 'http://places2.csail.mit.edu/models_places365/resnet50_places365.pth.tar' -OutFile 'resnet50_places365.pth.tar'"
)
if not exist "categories_places365.txt" (
    echo     Downloading Places365 categories...
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt' -OutFile 'categories_places365.txt'"
)
cd ..\..

echo ✅ All models downloaded

REM Initialize native services
echo 🔧 Initializing native services...
echo ✅ Using MongoDB Atlas (cloud-hosted)
echo ✅ Using file-based vector storage
echo ✅ Using in-memory job queue

REM Start ML service
echo 🤖 Starting ML service...
cd ml-service
start /b python main.py
cd ..

REM Wait for ML service
echo ⏳ Waiting for ML service...
timeout /t 10 /nobreak >nul

REM Start backend
echo 🔧 Starting backend API...
cd backend
start /b npm run dev
cd ..

REM Wait for backend
echo ⏳ Waiting for backend API...
timeout /t 10 /nobreak >nul

REM Start frontend
echo ⚛️ Starting frontend...
cd Frontend
start /b npm run dev
cd ..

REM Wait for frontend
echo ⏳ Waiting for frontend...
timeout /t 15 /nobreak >nul

echo.
echo 🎉 Samsung Reflect AI is now running!
echo ================================================
echo.
echo 📱 Access your application:
echo    🌐 Frontend:     http://localhost:5173
echo    🔍 AI Search:    http://localhost:5173/search
echo    📝 Journal:      http://localhost:5173/
echo    🧠 Memories:     http://localhost:5173/memories
echo    📊 Insights:     http://localhost:5173/insights
echo    ⚙️  Settings:     http://localhost:5173/settings
echo.
echo 🔧 API Endpoints:
echo    📡 Backend API:  http://localhost:4000
echo    🤖 ML Service:   http://localhost:8000
echo    🗄️  MongoDB:     Atlas Cloud (connected)
echo    💾 Vector DB:    File-based storage
echo    🔄 Job Queue:    In-memory processing
echo.
echo 📚 Quick Start:
echo    1. Open http://localhost:5173/search
echo    2. Upload an image using drag ^& drop
echo    3. Wait for AI processing to complete
echo    4. Try searching with text like 'red car' or 'person in kitchen'
echo.
echo 🛑 To stop all services:
echo    Close this window or run: docker-compose down
echo.
echo 🔄 Services are running. Keep this window open.
echo.
pause
