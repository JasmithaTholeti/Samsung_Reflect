#!/bin/bash

# Samsung Reflect AI Models Download Script
set -e

echo "📥 Downloading AI models for Samsung Reflect..."

# Create model directories
mkdir -p models/{yolo,places365,clip,onnx}

# Download YOLOv8 models
echo "🎯 Downloading YOLO models..."
cd models/yolo

# YOLOv8 Nano (fastest, least accurate)
if [ ! -f "yolov8n.pt" ]; then
    echo "  Downloading YOLOv8n (6MB)..."
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o yolov8n.pt
fi

# YOLOv8 Small (balanced)
if [ ! -f "yolov8s.pt" ]; then
    echo "  Downloading YOLOv8s (22MB)..."
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt -o yolov8s.pt
fi

# YOLOv8 Medium (more accurate)
if [ ! -f "yolov8m.pt" ]; then
    echo "  Downloading YOLOv8m (52MB)..."
    curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt -o yolov8m.pt
fi

cd ../..

# Download Places365 model
echo "🏞️ Downloading Places365 model..."
cd models/places365

if [ ! -f "resnet50_places365.pth.tar" ]; then
    echo "  Downloading ResNet50-Places365 (102MB)..."
    curl -L http://places2.csail.mit.edu/models_places365/resnet50_places365.pth.tar -o resnet50_places365.pth.tar
fi

# Download class names
if [ ! -f "categories_places365.txt" ]; then
    echo "  Downloading Places365 categories..."
    curl -L https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt -o categories_places365.txt
fi

cd ../..

# CLIP models will be downloaded automatically by transformers library
echo "🔗 CLIP models will be downloaded automatically on first use"

# Download ONNX versions (optional, for faster inference)
echo "⚡ Downloading ONNX models (optional)..."
cd models/onnx

# YOLOv8n ONNX
if [ ! -f "yolov8n.onnx" ]; then
    echo "  Converting YOLOv8n to ONNX..."
    python3 -c "
from ultralytics import YOLO
import os
if os.path.exists('../yolo/yolov8n.pt'):
    model = YOLO('../yolo/yolov8n.pt')
    model.export(format='onnx', simplify=True)
    print('YOLOv8n ONNX export complete')
else:
    print('YOLOv8n PyTorch model not found, skipping ONNX export')
" || echo "  ONNX export failed (requires ultralytics)"
fi

cd ../..

echo ""
echo "✅ Model download complete!"
echo ""
echo "📊 Downloaded models:"
echo "  YOLO: $(ls -la models/yolo/ | grep -E '\.(pt|onnx)$' | wc -l) files"
echo "  Places365: $(ls -la models/places365/ | grep -E '\.(pth|txt)$' | wc -l) files"
echo "  ONNX: $(ls -la models/onnx/ | grep '\.onnx$' | wc -l) files"
echo ""
echo "💾 Total size: $(du -sh models/ | cut -f1)"
echo ""
echo "🚀 Ready to start the AI services!"
