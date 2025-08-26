import axios from 'axios';
import { config } from '../config.js';

export interface DetectionResult {
  objectId: string;
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  cropUrl?: string;
}

export interface SceneResult {
  primary: string;
  labels: Array<{ label: string; score: number }>;
}

export interface DetectionResponse {
  imageId: string;
  objects: DetectionResult[];
  scene: SceneResult;
}

export interface EmbeddingResponse {
  embedding: number[];
  dims: number;
}

export interface ModelHealth {
  yolo: boolean;
  places365: boolean;
  clip: boolean;
}

class ModelService {
  private pythonServiceUrl: string;
  private serverInference: boolean;

  constructor() {
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    this.serverInference = process.env.SERVER_INFERENCE === 'true';
  }

  async getHealth(): Promise<ModelHealth> {
    try {
      if (!this.serverInference) {
        return { yolo: false, places365: false, clip: false };
      }

      const response = await axios.get(`${this.pythonServiceUrl}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Model health check failed:', error);
      return { yolo: false, places365: false, clip: false };
    }
  }

  async detectObjects(imageBase64: string): Promise<DetectionResponse> {
    if (!this.serverInference) {
      throw new Error('Server inference is disabled. Use client-side inference.');
    }

    try {
      const response = await axios.post(`${this.pythonServiceUrl}/detect`, {
        image_base64: imageBase64
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      return {
        imageId: data.image_id,
        objects: data.objects.map((obj: any) => ({
          objectId: obj.object_id,
          class: obj.class_name,
          score: obj.score,
          bbox: obj.bbox,
          cropUrl: obj.crop_url
        })),
        scene: data.scene
      };
    } catch (error) {
      console.error('Object detection failed:', error);
      throw new Error(`Detection failed: ${error}`);
    }
  }

  async classifyScene(imageBase64: string): Promise<SceneResult> {
    if (!this.serverInference) {
      throw new Error('Server inference is disabled. Use client-side inference.');
    }

    try {
      const response = await axios.post(`${this.pythonServiceUrl}/scene`, {
        image_base64: imageBase64
      }, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('Scene classification failed:', error);
      throw new Error(`Scene classification failed: ${error}`);
    }
  }

  async generateEmbedding(imageBase64: string, model: string = 'clip'): Promise<EmbeddingResponse> {
    if (!this.serverInference) {
      throw new Error('Server inference is disabled. Use client-side inference.');
    }

    try {
      const response = await axios.post(`${this.pythonServiceUrl}/embed`, {
        image_base64: imageBase64,
        model
      }, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  async generateTextEmbedding(text: string, model: string = 'clip'): Promise<EmbeddingResponse> {
    if (!this.serverInference) {
      throw new Error('Server inference is disabled. Use client-side inference.');
    }

    // Retry logic for ML service connection
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if ML service is healthy before making request
        await this.getHealth();
        
        const response = await axios.post(`${this.pythonServiceUrl}/embed-text`, {
          text,
          model
        }, {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        });

        return response.data;
      } catch (error: any) {
        lastError = error;
        console.error(`Text embedding attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error('Text embedding generation failed after all retries:', lastError);
    throw new Error(`Text embedding generation failed: ${lastError}`);
  }
}

export const modelService = new ModelService();
