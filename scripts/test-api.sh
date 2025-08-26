#!/bin/bash

# Samsung Reflect AI API Test Script
set -e

API_BASE="http://localhost:3001"
ML_BASE="http://localhost:8000"

echo "🧪 Testing Samsung Reflect AI API..."

# Test API health
echo "1. Testing API health..."
response=$(curl -s -w "%{http_code}" -o /tmp/health.json "$API_BASE/api/health")
if [ "$response" = "200" ]; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed (HTTP $response)"
    exit 1
fi

# Test model health
echo "2. Testing AI model health..."
response=$(curl -s -w "%{http_code}" -o /tmp/model_health.json "$API_BASE/api/models/health")
if [ "$response" = "200" ]; then
    echo "✅ Model health check passed"
    cat /tmp/model_health.json | python3 -m json.tool
else
    echo "❌ Model health check failed (HTTP $response)"
fi

# Test ML service directly
echo "3. Testing ML service directly..."
response=$(curl -s -w "%{http_code}" -o /tmp/ml_health.json "$ML_BASE/health")
if [ "$response" = "200" ]; then
    echo "✅ ML service health check passed"
    cat /tmp/ml_health.json | python3 -m json.tool
else
    echo "❌ ML service health check failed (HTTP $response)"
fi

# Test image upload (if test image exists)
if [ -f "test-images/sample.jpg" ]; then
    echo "4. Testing image upload..."
    response=$(curl -s -w "%{http_code}" -o /tmp/upload.json -X POST \
        -F "image=@test-images/sample.jpg" \
        "$API_BASE/api/images/upload")
    
    if [ "$response" = "201" ]; then
        echo "✅ Image upload test passed"
        image_id=$(cat /tmp/upload.json | python3 -c "import sys, json; print(json.load(sys.stdin)['imageId'])")
        echo "   Image ID: $image_id"
        
        # Wait for processing
        echo "   Waiting for processing..."
        sleep 5
        
        # Check processing status
        response=$(curl -s -w "%{http_code}" -o /tmp/image_status.json "$API_BASE/api/images/$image_id")
        if [ "$response" = "200" ]; then
            echo "✅ Image processing status check passed"
            cat /tmp/image_status.json | python3 -m json.tool
        fi
    else
        echo "❌ Image upload test failed (HTTP $response)"
    fi
else
    echo "4. Skipping image upload test (no test image found)"
    echo "   Create test-images/sample.jpg to test image upload"
fi

# Test search API
echo "5. Testing search API..."
response=$(curl -s -w "%{http_code}" -o /tmp/search.json -X POST \
    -H "Content-Type: application/json" \
    -d '{"text": "test query", "topK": 5}' \
    "$API_BASE/api/search")

if [ "$response" = "200" ]; then
    echo "✅ Search API test passed"
    cat /tmp/search.json | python3 -m json.tool
else
    echo "❌ Search API test failed (HTTP $response)"
fi

# Test vector database
echo "6. Testing vector database..."
response=$(curl -s -w "%{http_code}" -o /tmp/collections.json "http://localhost:6333/collections")
if [ "$response" = "200" ]; then
    echo "✅ Vector database test passed"
    cat /tmp/collections.json | python3 -m json.tool
else
    echo "❌ Vector database test failed (HTTP $response)"
fi

echo ""
echo "🎉 API testing complete!"
echo ""
echo "📊 Test Results Summary:"
echo "   - API Health: $([ -f /tmp/health.json ] && echo "✅" || echo "❌")"
echo "   - Model Health: $([ -f /tmp/model_health.json ] && echo "✅" || echo "❌")"
echo "   - ML Service: $([ -f /tmp/ml_health.json ] && echo "✅" || echo "❌")"
echo "   - Search API: $([ -f /tmp/search.json ] && echo "✅" || echo "❌")"
echo "   - Vector DB: $([ -f /tmp/collections.json ] && echo "✅" || echo "❌")"
echo ""

# Cleanup
rm -f /tmp/health.json /tmp/model_health.json /tmp/ml_health.json /tmp/upload.json /tmp/image_status.json /tmp/search.json /tmp/collections.json
