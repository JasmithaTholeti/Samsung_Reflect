import { Router } from 'express';
import { modelService } from '../services/modelService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Model health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const health = await modelService.getHealth();
    res.json(health);
  } catch (error) {
    console.error('Model health check failed:', error);
    res.status(503).json({
      yolo: false,
      places365: false,
      clip: false,
      error: 'Health check failed'
    });
  }
}));

// Direct detection endpoint (for testing/debugging)
router.post('/detect', asyncHandler(async (req, res) => {
  const { image_base64 } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'image_base64 is required' });
  }

  try {
    const result = await modelService.detectObjects(image_base64);
    res.json(result);
  } catch (error) {
    console.error('Detection failed:', error);
    res.status(500).json({ error: 'Detection failed' });
  }
}));

// Direct scene classification endpoint
router.post('/scene', asyncHandler(async (req, res) => {
  const { image_base64 } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'image_base64 is required' });
  }

  try {
    const result = await modelService.classifyScene(image_base64);
    res.json(result);
  } catch (error) {
    console.error('Scene classification failed:', error);
    res.status(500).json({ error: 'Scene classification failed' });
  }
}));

// Direct embedding generation endpoint
router.post('/embed', asyncHandler(async (req, res) => {
  const { image_base64, text, model = 'clip' } = req.body;

  if (!image_base64 && !text) {
    return res.status(400).json({ error: 'Either image_base64 or text is required' });
  }

  try {
    let result;
    if (text) {
      result = await modelService.generateTextEmbedding(text, model);
    } else {
      result = await modelService.generateEmbedding(image_base64, model);
    }
    res.json(result);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    res.status(500).json({ error: 'Embedding generation failed' });
  }
}));

export default router;
