# AI Models Configuration

This directory contains the AI models used for object detection, scene classification, and embedding generation.

## Model Structure

```
models/
├── yolo/
│   ├── yolov8n.pt          # YOLOv8 nano model (recommended for speed)
│   ├── yolov8s.pt          # YOLOv8 small model (balanced)
│   └── yolov8m.pt          # YOLOv8 medium model (higher accuracy)
├── places365/
│   ├── resnet50_places365.pth    # ResNet50 trained on Places365
│   └── mobilenet_places365.pth  # MobileNet for faster inference
├── clip/
│   ├── image_encoder.pt    # CLIP image encoder
│   ├── text_encoder.pt     # CLIP text encoder
│   └── tokenizer.json      # CLIP tokenizer
└── onnx/                   # ONNX versions for production
    ├── yolo.onnx
    ├── places365.onnx
    └── clip.onnx
```

## Model Download Instructions

### YOLO Models
```bash
# Download YOLOv8 models
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O models/yolo/yolov8n.pt
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt -O models/yolo/yolov8s.pt
```

### Places365 Models
```bash
# Download Places365 ResNet50 model
wget http://places2.csail.mit.edu/models_places365/resnet50_places365.pth.tar -O models/places365/resnet50_places365.pth.tar
```

### CLIP Models
```bash
# CLIP models will be downloaded automatically by the transformers library
# Or manually download from Hugging Face:
# https://huggingface.co/openai/clip-vit-base-patch32
```

## Model Specifications

### YOLOv8 Configuration
- **Input Size**: 640x640 pixels
- **Classes**: 80 COCO classes
- **Confidence Threshold**: 0.25 (configurable via MIN_DETECTION_SCORE)
- **NMS IoU Threshold**: 0.45 (configurable via NMS_IOU_THRESHOLD)

### Places365 Configuration
- **Input Size**: 224x224 pixels
- **Classes**: 365 scene categories
- **Preprocessing**: ImageNet normalization

### CLIP Configuration
- **Image Input**: 224x224 pixels
- **Text Input**: Max 77 tokens
- **Embedding Dimension**: 512
- **Model**: ViT-B/32 (recommended) or RN50

## Model Versioning

Models are versioned using the format: `vYYYYMMDD` or semantic versioning.

Example:
- `yolov8n_v20240101.pt`
- `clip_v1.2.0.pt`

## Performance Benchmarks

### YOLOv8n (Nano)
- **Speed**: ~1ms on GPU, ~50ms on CPU
- **Accuracy**: mAP 37.3
- **Size**: 6.2MB

### YOLOv8s (Small)
- **Speed**: ~2ms on GPU, ~100ms on CPU
- **Accuracy**: mAP 44.9
- **Size**: 21.5MB

### Places365 ResNet50
- **Speed**: ~10ms on GPU, ~200ms on CPU
- **Top-1 Accuracy**: 54.7%
- **Size**: 100MB

### CLIP ViT-B/32
- **Speed**: ~15ms on GPU, ~300ms on CPU
- **Zero-shot Accuracy**: 63.2% on ImageNet
- **Size**: 338MB

## Model Optimization

### For Production
1. Convert to ONNX format for faster inference
2. Use quantization to reduce model size
3. Consider TensorRT optimization for NVIDIA GPUs

### For Client-side (Browser)
1. Convert to TensorFlow.js format
2. Use quantized models (INT8)
3. Implement model sharding for large models

## Environment Variables

Configure model paths and settings in your `.env` file:

```bash
MODEL_DIR=./models
MIN_DETECTION_SCORE=0.25
NMS_IOU_THRESHOLD=0.45
CLIP_MODEL_NAME=openai/clip-vit-base-patch32
PLACES365_MODEL_PATH=./models/places365/resnet50_places365.pth
```

## Troubleshooting

### Common Issues

1. **Model not found**: Ensure models are downloaded to the correct paths
2. **CUDA out of memory**: Reduce batch size or use smaller models
3. **Slow inference**: Check if GPU acceleration is enabled
4. **Accuracy issues**: Verify preprocessing steps match training configuration

### Model Health Check

Use the `/api/models/health` endpoint to verify model loading status:

```bash
curl http://localhost:3001/api/models/health
```

Expected response:
```json
{
  "yolo": true,
  "places365": true,
  "clip": true
}
```
