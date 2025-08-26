# Samsung Reflect AI Search - Operations Runbook

## Quick Start

### Development Environment
```bash
# Clone and setup
git clone <repository>
cd SamsungReflect

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Check service health
curl http://localhost:3001/api/health
curl http://localhost:3001/api/models/health
```

### Production Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl https://your-domain.com/api/health
```

## Service Architecture

### Core Services
- **Frontend**: React/Vite app on port 5173
- **Backend**: Node.js/Express API on port 3001
- **ML Service**: FastAPI Python service on port 8000
- **MongoDB**: Database on port 27017
- **Redis**: Job queue on port 6379
- **Qdrant**: Vector database on port 6333

### Data Flow
1. User uploads image → Backend API
2. Image queued for processing → Redis
3. Worker processes image → ML Service
4. Objects detected & cropped → File system
5. Embeddings generated → Vector DB
6. User searches → Vector similarity + reranking

## Common Operations

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api
docker-compose restart python-ml
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f python-ml
```

### Database Operations
```bash
# MongoDB shell
docker-compose exec mongo mongosh samsung-reflect

# Redis CLI
docker-compose exec redis redis-cli

# Qdrant operations
curl http://localhost:6333/collections
```

## Troubleshooting

### Model Loading Issues

**Problem**: Models not loading (health check returns false)
```bash
# Check model files exist
ls -la models/yolo/
ls -la models/places365/
ls -la models/clip/

# Check Python service logs
docker-compose logs python-ml

# Restart ML service
docker-compose restart python-ml
```

**Solution**: Download missing models using instructions in `models/README.md`

### Memory Issues

**Problem**: Out of memory errors during inference
```bash
# Check memory usage
docker stats

# Reduce batch size in ML service
# Edit ml-service/main.py and restart
```

**Solution**: 
- Use smaller models (YOLOv8n instead of YOLOv8m)
- Reduce image resolution
- Add memory limits to docker-compose.yml

### Queue Processing Issues

**Problem**: Images stuck in processing queue
```bash
# Check Redis queue
docker-compose exec redis redis-cli
> LLEN bull:image-processing:waiting
> LLEN bull:image-processing:active

# Check worker logs
docker-compose logs api | grep "worker"
```

**Solution**:
- Restart API service to restart workers
- Clear stuck jobs: `FLUSHDB` in Redis (development only)

### Vector Search Issues

**Problem**: Search returns no results
```bash
# Check vector collection
curl http://localhost:6333/collections/image_embeddings

# Check vector count
curl http://localhost:6333/collections/image_embeddings/points/count
```

**Solution**:
- Verify embeddings are being generated
- Check vector dimensions match (512 for CLIP)
- Re-index existing images if needed

## Monitoring

### Health Checks
```bash
# API health
curl http://localhost:3001/api/health

# Model health
curl http://localhost:3001/api/models/health

# Database connections
curl http://localhost:6333/collections
```

### Performance Metrics
```bash
# Processing queue length
curl http://localhost:3001/api/queue/stats

# Vector database stats
curl http://localhost:6333/metrics
```

### Log Monitoring
```bash
# Error logs
docker-compose logs | grep ERROR

# Processing times
docker-compose logs api | grep "processing completed"

# Search performance
docker-compose logs api | grep "search completed"
```

## Backup & Recovery

### Database Backup
```bash
# MongoDB backup
docker-compose exec mongo mongodump --db samsung-reflect --out /backup

# Vector database backup
curl -X POST http://localhost:6333/collections/image_embeddings/snapshots
```

### Model Backup
```bash
# Backup models directory
tar -czf models-backup-$(date +%Y%m%d).tar.gz models/
```

### Full System Backup
```bash
# Stop services
docker-compose down

# Backup data volumes
docker run --rm -v samsung-reflect_mongo_data:/data -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data
docker run --rm -v samsung-reflect_qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant-backup.tar.gz /data

# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## Model Management

### Update Models
```bash
# Download new model
wget <model-url> -O models/yolo/yolov8n-v2.pt

# Update model path in environment
# Restart ML service
docker-compose restart python-ml

# Verify new model loaded
curl http://localhost:3001/api/models/health
```

### Re-index Images
```bash
# Clear vector database
curl -X DELETE http://localhost:6333/collections/image_embeddings

# Trigger re-processing of all images
curl -X POST http://localhost:3001/api/admin/reindex
```

## Security

### API Keys
- Store in environment variables, never in code
- Rotate keys regularly
- Use different keys for dev/staging/prod

### File Uploads
- Validate file types and sizes
- Scan for malware in production
- Use signed URLs for cloud storage

### Database Security
- Use authentication in production
- Encrypt connections (TLS)
- Regular security updates

## Performance Optimization

### Model Optimization
```bash
# Convert to ONNX for faster inference
python scripts/convert_to_onnx.py

# Use quantized models
python scripts/quantize_models.py
```

### Database Optimization
```bash
# MongoDB indexes
db.images.createIndex({ "ownerId": 1, "createdAt": -1 })
db.objects.createIndex({ "imageId": 1, "class": 1 })

# Vector database optimization
curl -X PUT http://localhost:6333/collections/image_embeddings \
  -H "Content-Type: application/json" \
  -d '{"optimizer_config": {"max_segment_size": 20000}}'
```

## Scaling

### Horizontal Scaling
- Add more worker processes
- Use load balancer for API
- Shard vector database
- Use CDN for image serving

### Vertical Scaling
- Increase memory for ML service
- Use GPU acceleration
- Faster storage (SSD)

## Emergency Procedures

### Service Down
1. Check service status: `docker-compose ps`
2. Check logs: `docker-compose logs <service>`
3. Restart service: `docker-compose restart <service>`
4. If persistent, check resources: `docker stats`

### Data Corruption
1. Stop services: `docker-compose down`
2. Restore from backup
3. Verify data integrity
4. Restart services: `docker-compose up -d`

### High Load
1. Check queue length and processing times
2. Scale workers if needed
3. Enable rate limiting
4. Consider caching frequently accessed data

## Contact Information

- **Development Team**: dev-team@company.com
- **Operations**: ops@company.com
- **Emergency**: +1-xxx-xxx-xxxx
