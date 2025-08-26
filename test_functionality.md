# Samsung Reflect - API & Search Functionality Test Plan

## 🔧 Critical Fixes Applied

### 1. **Missing /embed-text Endpoint** ✅
- **Issue**: Backend called `/embed-text` but ML service only had `/embed`
- **Fix**: Added `/embed-text` endpoint in ML service for text embedding generation
- **Implementation**: Uses CLIP model to generate text embeddings

### 2. **Connection Stability** ✅  
- **Issue**: ECONNREFUSED errors when ML service goes down
- **Fix**: Added retry logic with exponential backoff (3 attempts)
- **Implementation**: Health check before requests + timeout handling

### 3. **Text Embedding Implementation** ✅
- **Issue**: Text search functionality not working
- **Fix**: Proper CLIP text tokenization and embedding generation
- **Implementation**: `clip.tokenize()` + `encode_text()` pipeline

## 🧪 Test Plan - Execute in Order

### Phase 1: Service Health Check
```bash
# 1. Start ML Service
cd ml-service
python3 main.py

# 2. Start Backend  
cd backend
npm run dev

# 3. Start Frontend
cd Frontend
npm run dev
```

### Phase 2: API Endpoint Testing
```bash
# Test ML service endpoints directly
curl -X POST http://localhost:8000/health
curl -X POST http://localhost:8000/embed-text -H "Content-Type: application/json" -d '{"text":"dog in park"}'
```

### Phase 3: Functionality Testing

#### A. **Image Upload Test**
1. Navigate to http://localhost:5173
2. Go to AI Search page
3. Upload tab → drag/drop image
4. Verify: Object detection overlay appears
5. Verify: No console errors
6. Expected: Image processes successfully with YOLO detection

#### B. **Text Search Test**  
1. Search tab → enter "dog" or "person"
2. Click search button
3. Verify: Results appear with similarity scores
4. Expected: Text embedding → vector search → ranked results

#### C. **Similar Image Search Test**
1. Upload tab → click on uploaded image
2. Should trigger similar search
3. Verify: Similar images appear in results
4. Expected: Image embedding → vector similarity → results

### Phase 4: Error Scenarios
1. Stop ML service → try search (should show retry attempts)
2. Invalid search query → should handle gracefully
3. Large image upload → should process without timeout

## 🎯 Success Criteria
- ✅ All three services running without errors
- ✅ Image upload completes with object detection
- ✅ Text search returns relevant results  
- ✅ Similar image search works
- ✅ No 404 or 503 errors in console
- ✅ Retry logic handles ML service disconnections

## 🚨 Known Issues to Monitor
- ML service memory usage with large images
- Vector index performance with many embeddings
- CORS issues between services
