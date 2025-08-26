import { EventEmitter } from 'events';
import { modelService } from './modelService.js';
import { vectorService } from './vectorService.js';
import { ImageModel } from '../models/ImageModel.js';
import { ObjectModel } from '../models/ObjectModel.js';
import { VectorModel } from '../models/VectorModel.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export interface ImageProcessingJob {
  imageId: string;
  imagePath: string;
  ownerId: string;
}

export interface EmbeddingJob {
  imageId: string;
  objectId?: string;
  imagePath: string;
  cropPath?: string;
}

// In-memory job queue implementation
class InMemoryJobQueue extends EventEmitter {
  private jobs: Map<string, any> = new Map();
  private workers: Map<string, Function> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  async add(queueName: string, jobType: string, data: any): Promise<string> {
    const jobId = `${queueName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.jobs.set(jobId, {
      id: jobId,
      queueName,
      jobType,
      data,
      status: 'waiting',
      createdAt: new Date()
    });

    // Process immediately if worker is available
    setImmediate(() => this.processNext(queueName));
    
    return jobId;
  }

  registerWorker(queueName: string, processor: Function) {
    this.workers.set(queueName, processor);
  }

  private async processNext(queueName: string) {
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    const worker = this.workers.get(queueName);
    if (!worker) {
      return;
    }

    // Find next waiting job for this queue
    const waitingJob = Array.from(this.jobs.values())
      .find(job => job.queueName === queueName && job.status === 'waiting');

    if (!waitingJob) {
      return;
    }

    this.processing.add(waitingJob.id);
    waitingJob.status = 'processing';

    try {
      await worker({ data: waitingJob.data });
      waitingJob.status = 'completed';
      this.jobs.delete(waitingJob.id);
    } catch (error) {
      waitingJob.status = 'failed';
      waitingJob.error = error;
      console.error(`Job ${waitingJob.id} failed:`, error);
    } finally {
      this.processing.delete(waitingJob.id);
      // Process next job
      setImmediate(() => this.processNext(queueName));
    }
  }

  getStats() {
    const stats = {
      total: this.jobs.size,
      waiting: 0,
      processing: this.processing.size,
      failed: 0
    };

    for (const job of this.jobs.values()) {
      if (job.status === 'waiting') stats.waiting++;
      if (job.status === 'failed') stats.failed++;
    }

    return stats;
  }
}

// Create job queue instance
const jobQueue = new InMemoryJobQueue(parseInt(process.env.MAX_CONCURRENT_JOBS || '3'));

// Export queue interface
export const imageProcessingQueue = {
  add: (jobType: string, data: ImageProcessingJob) => jobQueue.add('image-processing', jobType, data)
};

export const embeddingQueue = {
  add: (jobType: string, data: EmbeddingJob) => jobQueue.add('embedding-generation', jobType, data)
};

// Register image processing worker
jobQueue.registerWorker('image-processing', async (job: { data: ImageProcessingJob }) => {
  const { imageId, imagePath, ownerId } = job.data;
  
  try {
    console.log(`Processing image: ${imageId}`);
    
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // Run detection and scene classification
    const detectionResult = await modelService.detectObjects(imageBase64);
    
    // Create thumbnails and crops
    const uploadsDir = process.env.UPLOAD_DIR || './uploads';
    const thumbnailPath = path.join(uploadsDir, 'thumbnails', `thumb_${path.basename(imagePath)}`);
    
    // Create thumbnail
    await sharp(imageBuffer)
      .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // Update image document
    await ImageModel.findByIdAndUpdate(imageId, {
      scene: detectionResult.scene,
      thumbnailUrl: `/uploads/thumbnails/thumb_${path.basename(imagePath)}`,
      processingStatus: 'detected'
    });
    
    // Create object documents and crops
    const objectIds = [];
    for (let i = 0; i < detectionResult.objects.length; i++) {
      const obj = detectionResult.objects[i];
      
      // Create crop
      const [x, y, w, h] = obj.bbox;
      const cropPath = path.join(uploadsDir, 'crops', `crop_${imageId}_${i}.jpg`);
      
      await sharp(imageBuffer)
        .extract({ 
          left: Math.max(0, Math.floor(x)), 
          top: Math.max(0, Math.floor(y)), 
          width: Math.floor(w), 
          height: Math.floor(h) 
        })
        .jpeg({ quality: 85 })
        .toFile(cropPath);
      
      // Create object document
      const objectDoc = await ObjectModel.create({
        imageId,
        class: obj.class,
        score: obj.score,
        bbox: obj.bbox,
        cropUrl: `/uploads/crops/crop_${imageId}_${i}.jpg`,
        ownerId
      });
      
      objectIds.push(objectDoc._id.toString());
    }
    
    // Update image with object references
    await ImageModel.findByIdAndUpdate(imageId, {
      objects: objectIds,
      processingStatus: 'cropped'
    });
    
    // Queue embedding job for full image
    await embeddingQueue.add('generate-embedding', {
      imageId,
      imagePath
    });
    
    console.log(`Image processing completed: ${imageId}`);
    
  } catch (error) {
    console.error(`Image processing failed for ${imageId}:`, error);
    await ImageModel.findByIdAndUpdate(imageId, {
      processingStatus: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

// Register embedding generation worker
jobQueue.registerWorker('embedding-generation', async (job: { data: EmbeddingJob }) => {
  const { imageId, objectId, imagePath, cropPath } = job.data;
  
  try {
    console.log(`Generating embedding for ${objectId ? 'object' : 'image'}: ${imageId}`);
    
    // Use crop if available, otherwise full image
    const targetPath = cropPath || imagePath;
    const imageBuffer = await fs.readFile(targetPath);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // Generate embedding
    const embeddingResult = await modelService.generateEmbedding(imageBase64);
    
    // Get metadata
    let metadata: any = {};
    if (objectId) {
      const objectDoc = await ObjectModel.findById(objectId);
      if (objectDoc) {
        metadata = {
          label: objectDoc.class,
          bbox: objectDoc.bbox,
          score: objectDoc.score,
          class: objectDoc.class
        };
      }
    } else {
      const imageDoc = await ImageModel.findById(imageId);
      if (imageDoc && imageDoc.scene) {
        metadata = {
          scene: imageDoc.scene.primary
        };
      }
    }
    
    // Create vector document
    const vectorDoc = await VectorModel.create({
      imageId,
      objectId,
      vector: embeddingResult.embedding,
      dims: embeddingResult.dims,
      model: 'clip',
      metadata
    });
    
    // Upsert to vector database
    await vectorService.upsertVectors([{
      id: vectorDoc._id.toString(),
      imageId,
      objectId,
      embedding: embeddingResult.embedding,
      metadata
    }]);
    
    console.log(`Embedding generated: ${vectorDoc._id}`);
    
    // Update processing status if this was the last embedding for the image
    if (!objectId) {
      await ImageModel.findByIdAndUpdate(imageId, {
        processingStatus: 'completed'
      });
    }
    
  } catch (error) {
    console.error(`Embedding generation failed for ${imageId}:`, error);
    throw error;
  }
});

// Export job queue stats
export const getJobQueueStats = () => jobQueue.getStats();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down job queue...');
});

export { jobQueue };
