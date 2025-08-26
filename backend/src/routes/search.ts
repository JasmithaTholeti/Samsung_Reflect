import { Router } from 'express';
import { z } from 'zod';
import { modelService } from '../services/modelService.js';
import { vectorService } from '../services/vectorService.js';
import { ImageModel } from '../models/ImageModel.js';
import { ObjectModel } from '../models/ObjectModel.js';
import { VectorModel } from '../models/VectorModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const SearchSchema = z.object({
  text: z.string().min(1),
  topK: z.number().int().min(1).max(100).default(10),
  mode: z.enum(['objects', 'images', 'both']).default('both'),
  filter: z.object({
    classes: z.array(z.string()).optional(),
    scenes: z.array(z.string()).optional()
  }).optional()
});

interface SearchResult {
  imageId: string;
  score: number;
  topObjects: Array<{
    objectId: string;
    class: string;
    score: number;
    bbox: number[];
    similarity: number;
  }>;
  scene?: string;
  thumbnailUrl?: string;
}

// Text-based search endpoint
router.post('/', asyncHandler(async (req, res) => {
  const { id: ownerId } = (req as any).user;
  const searchParams = SearchSchema.parse(req.body);

  try {
    // Generate text embedding
    const textEmbedding = await modelService.generateTextEmbedding(searchParams.text);

    // Build filter for vector search
    let vectorFilter: any = {
      must: [
        {
          key: 'ownerId',
          match: { value: ownerId }
        }
      ]
    };

    if (searchParams.filter) {
      if (searchParams.filter.classes && searchParams.filter.classes.length > 0) {
        vectorFilter.must.push({
          key: 'class',
          match: { any: searchParams.filter.classes }
        });
      }
      if (searchParams.filter.scenes && searchParams.filter.scenes.length > 0) {
        vectorFilter.must.push({
          key: 'scene',
          match: { any: searchParams.filter.scenes }
        });
      }
    }

    // Search vectors
    const searchResults = await vectorService.searchVectors(
      textEmbedding.embedding,
      searchParams.topK * 3, // Get more candidates for reranking
      vectorFilter
    );

    // Group results by image and aggregate scores
    const imageGroups = new Map<string, {
      imageId: string;
      objects: Array<{
        objectId: string;
        class: string;
        score: number;
        bbox: number[];
        similarity: number;
      }>;
      maxSimilarity: number;
      avgSimilarity: number;
      sceneScore?: number;
    }>();

    for (const result of searchResults.results) {
      const imageId = result.payload.imageId;
      
      if (!imageGroups.has(imageId)) {
        imageGroups.set(imageId, {
          imageId,
          objects: [],
          maxSimilarity: 0,
          avgSimilarity: 0
        });
      }

      const group = imageGroups.get(imageId)!;

      if (result.payload.objectId) {
        // Object-level match
        group.objects.push({
          objectId: result.payload.objectId,
          class: result.payload.class || 'unknown',
          score: result.payload.score || 0,
          bbox: result.payload.bbox || [0, 0, 0, 0],
          similarity: result.score
        });
      } else {
        // Image-level (scene) match
        group.sceneScore = result.score;
      }

      group.maxSimilarity = Math.max(group.maxSimilarity, result.score);
    }

    // Calculate aggregated scores and rank
    const rankedResults: SearchResult[] = [];
    
    for (const group of imageGroups.values()) {
      // Calculate weighted score
      const objectWeight = parseFloat(process.env.OBJECT_WEIGHT || '0.7');
      const sceneWeight = parseFloat(process.env.SCENE_WEIGHT || '0.3');
      
      let objectScore = 0;
      if (group.objects.length > 0) {
        const aggregationMethod = process.env.AGGREGATION_METHOD || 'weighted';
        
        switch (aggregationMethod) {
          case 'max':
            objectScore = Math.max(...group.objects.map(o => o.similarity));
            break;
          case 'avg':
            objectScore = group.objects.reduce((sum, o) => sum + o.similarity, 0) / group.objects.length;
            break;
          case 'weighted':
          default:
            const totalDetectionScore = group.objects.reduce((sum, o) => sum + o.score, 0);
            objectScore = group.objects.reduce((sum, o) => {
              const weight = totalDetectionScore > 0 ? o.score / totalDetectionScore : 1 / group.objects.length;
              return sum + (o.similarity * weight);
            }, 0);
            break;
        }
      }

      const sceneScore = group.sceneScore || 0;
      const finalScore = (objectScore * objectWeight) + (sceneScore * sceneWeight);

      rankedResults.push({
        imageId: group.imageId,
        score: finalScore,
        topObjects: group.objects.sort((a, b) => b.similarity - a.similarity).slice(0, 5),
        scene: undefined, // Will be populated below
        thumbnailUrl: undefined // Will be populated below
      });
    }

    // Sort by final score
    rankedResults.sort((a, b) => b.score - a.score);

    // Limit to requested topK
    const finalResults = rankedResults.slice(0, searchParams.topK);

    // Populate image metadata
    if (finalResults.length > 0) {
      const imageIds = finalResults.map(r => r.imageId);
      const images = await ImageModel.find({ _id: { $in: imageIds } });
      const imageMap = new Map(images.map(img => [img._id.toString(), img]));

      for (const result of finalResults) {
        const image = imageMap.get(result.imageId);
        if (image) {
          result.scene = image.scene?.primary;
          // Ensure URL is accessible from frontend
          const baseUrl = image.thumbnailUrl || image.originalUrl;
          if (baseUrl.startsWith('http')) {
            result.thumbnailUrl = baseUrl;
          } else if (baseUrl.startsWith('/uploads/')) {
            result.thumbnailUrl = baseUrl; // Already has correct path
          } else {
            result.thumbnailUrl = `/uploads/${baseUrl.replace('./uploads/', '')}`;
          }
        }
      }
    }

    res.json({
      query: searchParams.text,
      results: finalResults,
      totalFound: searchResults.results.length
    });

  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}));

// Get similar images by image ID
router.post('/similar/:imageId', asyncHandler(async (req, res) => {
  const { id: ownerId } = (req as any).user;
  const { imageId } = req.params;
  const { topK = 10 } = req.body;

  try {
    // Get image embedding (use global image embedding, not object embeddings)
    const imageVector = await VectorModel.findOne({ 
      imageId, 
      objectId: { $exists: false } // Global image embedding
    });

    if (!imageVector) {
      return res.status(404).json({ error: 'Image embedding not found' });
    }

    // Search for similar images
    const searchResults = await vectorService.searchVectors(
      imageVector.vector,
      topK + 1, // +1 to exclude the query image itself
      {
        must: [
          {
            key: 'ownerId',
            match: { value: ownerId }
          }
        ],
        must_not: [
          {
            key: 'imageId',
            match: { value: imageId }
          }
        ]
      }
    );

    // Get image metadata
    const imageIds = searchResults.results.map(r => r.payload.imageId);
    const images = await ImageModel.find({ _id: { $in: imageIds } });
    const imageMap = new Map(images.map(img => [img._id.toString(), img]));

    const results = searchResults.results.map(result => {
      const image = imageMap.get(result.payload.imageId);
      const baseUrl = image?.thumbnailUrl || image?.originalUrl;
      let thumbnailUrl = undefined;
      
      if (baseUrl) {
        if (baseUrl.startsWith('http')) {
          thumbnailUrl = baseUrl;
        } else if (baseUrl.startsWith('/uploads/')) {
          thumbnailUrl = baseUrl; // Already has correct path
        } else {
          thumbnailUrl = `/uploads/${baseUrl.replace('./uploads/', '')}`;
        }
      }
      
      return {
        imageId: result.payload.imageId,
        score: result.score,
        scene: image?.scene?.primary,
        thumbnailUrl,
        topObjects: [] // Add empty array for consistency with search results
      };
    });

    res.json({
      results: results.slice(0, topK)
    });

  } catch (error) {
    console.error('Similar search failed:', error);
    res.status(500).json({ error: 'Similar search failed' });
  }
}));

export default router;
