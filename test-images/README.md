# Test Images Directory

This directory contains sample images for testing the AI search functionality.

## Usage

Place test images here to use with the API testing scripts:

- `sample.jpg` - Used by `scripts/test-api.sh` for automated testing
- Add any other test images for manual testing

## Recommended Test Images

For best results, use images that contain:

1. **Clear objects** - Cars, people, animals, furniture
2. **Recognizable scenes** - Kitchen, bedroom, outdoor, office
3. **Good lighting** - Well-lit, not too dark or overexposed
4. **Multiple objects** - To test object detection capabilities

## Image Requirements

- **Format**: JPG, PNG, WebP
- **Size**: Up to 100MB (as configured in backend)
- **Resolution**: Any, but 640x640+ recommended for better detection

## Example Test Scenarios

1. **Object Detection**: Upload image with cars, people, animals
2. **Scene Classification**: Upload kitchen, bedroom, outdoor scenes  
3. **Text Search**: Search for "red car", "person walking", "kitchen"
4. **Similar Image Search**: Upload image and find similar ones

## Adding Test Images

```bash
# Download sample images
curl -o test-images/sample.jpg "https://example.com/sample-image.jpg"

# Or copy your own images
cp ~/Pictures/test-photo.jpg test-images/
```

## Running Tests

```bash
# Make sure you have a sample.jpg file
ls test-images/sample.jpg

# Run API tests
./scripts/test-api.sh
```
