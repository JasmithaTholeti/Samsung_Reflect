from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import io
import base64
import logging
import re  # <--- NEW: Regex for powerful cleaning
from huggingface_hub import InferenceClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Samsung Reflect ML Service", version="25.0.0")

# --- CONFIGURATION ---
import os
from dotenv import load_dotenv

# Load secrets from .env file
load_dotenv()

# Get the key safely
HF_API_KEY = os.getenv("HF_API_KEY")
if not HF_API_KEY:
    raise ValueError("Missing HF_API_KEY in .env file!")

# Initialize Client
client = InferenceClient(token=HF_API_KEY)

# Unified Model (Zephyr-7B)
UNIFIED_MODEL = "HuggingFaceH4/zephyr-7b-beta"
IMAGE_MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextGenerationRequest(BaseModel):
    text: str

class TextGenerationResponse(BaseModel):
    generated_text: str

class StoryRequest(BaseModel):
    images: List[str] = [] 
    keywords: str

class ImageGenRequest(BaseModel):
    prompt: str

class ImageGenResponse(BaseModel):
    image_base64: str

@app.on_event("startup")
async def startup_event():
    logger.info("✅ VERSION 25 (SCRUBBER) LOADED!")

def clean_autocomplete_output(user_input: str, ai_output: str) -> str:
    """
    Powerful cleaning function to remove tags and repetition.
    """
    # 1. Regex to remove ANY text inside brackets [] or <>
    # This catches [INST], [/INST], [ASS], <|user|>, etc.
    clean_text = re.sub(r'\[.*?\]', '', ai_output)
    clean_text = re.sub(r'<.*?>', '', clean_text)
    
    # 2. Remove generic artifacts
    clean_text = clean_text.replace('"', '').strip()
    
    # 3. Check for Repetition
    # If the AI starts by repeating the user's input, cut it off.
    # Example: User="I am", AI="I am happy" -> Result="happy"
    if clean_text.lower().startswith(user_input.lower()):
        clean_text = clean_text[len(user_input):].strip()
        
    # 4. Fallback: If AI repeated the input but with different casing or whitespace
    # We check if the input is inside the output
    if user_input.lower() in clean_text.lower():
        parts = clean_text.lower().split(user_input.lower(), 1)
        if len(parts) > 1:
            # Return only what comes AFTER the input
            # We map it back to the original string to preserve casing of the new words
            start_index = clean_text.lower().find(user_input.lower()) + len(user_input)
            clean_text = clean_text[start_index:].strip()

    return clean_text

# --- ENDPOINTS ---

@app.post("/generate", response_model=TextGenerationResponse)
async def generate_text(request: TextGenerationRequest):
    """AUTOCOMPLETE"""
    
    messages = [
        {
            "role": "system", 
            "content": "You are a text completion engine. Finish the user's sentence immediately. Do not repeat the input. Output ONLY the remaining words."
        },
        {
            "role": "user", 
            "content": f"{request.text}"
        }
    ]

    try:
        response = client.chat_completion(
            model=UNIFIED_MODEL, 
            messages=messages, 
            max_tokens=30,  
            temperature=0.3 
        )
        
        raw_output = response.choices[0].message.content
        
        # Apply the Scrubber
        final_text = clean_autocomplete_output(request.text, raw_output)

        return TextGenerationResponse(generated_text=final_text)

    except Exception as e:
        logger.error(f"Autocomplete Failed: {e}")
        return TextGenerationResponse(generated_text="")

@app.post("/generate-story", response_model=TextGenerationResponse)
async def generate_story(request: StoryRequest):
    """STORY WRITER"""
    logger.info(f"📝 Generating story for: {request.keywords}")

    messages = [
        {
            "role": "system", 
            "content": "You are a personal diary assistant. Write a happy, descriptive diary entry based on the user's keywords. Do NOT use headers. Just write the paragraph."
        },
        {
            "role": "user", 
            "content": f"Write a diary entry using these exact keywords: {request.keywords}"
        }
    ]

    try:
        response = client.chat_completion(
            model=UNIFIED_MODEL, 
            messages=messages, 
            max_tokens=300,
            temperature=0.85
        )
        # We also lightly clean the story just in case
        story = response.choices[0].message.content
        story = re.sub(r'\[.*?\]', '', story) # Remove accidental tags
        return TextGenerationResponse(generated_text=story)

    except Exception as e:
        logger.error(f"❌ STORY API FAILED: {e}")
        return TextGenerationResponse(generated_text=f"AI Error: {str(e)}")

@app.post("/generate-image", response_model=ImageGenResponse)
async def generate_image(request: ImageGenRequest):
    """IMAGE GEN"""
    logger.info(f"🎨 Generating image: {request.prompt}")
    try:
        image_bytes = client.text_to_image(
            model=IMAGE_MODEL_ID,
            prompt=request.prompt
        )
        buffered = io.BytesIO()
        image_bytes.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return ImageGenResponse(image_base64=f"data:image/jpeg;base64,{img_str}")
        
    except Exception as e:
        logger.error(f"Image API Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)