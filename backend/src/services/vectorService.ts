import fs from 'fs/promises';
import path from 'path';

export interface VectorDocument {
  id: string;
  imageId: string;
  objectId?: string;
  embedding: number[];
  metadata: {
    label?: string;
    bbox?: number[];
    score?: number;
    scene?: string;
    class?: string;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  payload: VectorDocument['metadata'] & {
    imageId: string;
    objectId?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
}

interface VectorEntry {
  id: string;
  vector: number[];
  metadata: any;
}

interface VectorIndex {
  entries: VectorEntry[];
  dimension: number;
}

class VectorService {
  private indexPath: string;
  private index: VectorIndex;

  constructor() {
    this.indexPath = path.join(process.cwd(), 'data', 'vector_index.json');
    this.index = { entries: [], dimension: 512 };
  }

  async initialize(): Promise<void> {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.indexPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Load existing index if it exists
      try {
        const indexData = await fs.readFile(this.indexPath, 'utf-8');
        this.index = JSON.parse(indexData);
        console.log(`Loaded vector index with ${this.index.entries.length} entries`);
      } catch (error) {
        // Index doesn't exist, create new one
        await this.saveIndex();
        console.log('Created new vector index');
      }
    } catch (error) {
      console.error('Failed to initialize vector service:', error);
      throw error;
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
    } catch (error) {
      console.error('Failed to save vector index:', error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async upsertVectors(vectors: VectorDocument[]): Promise<void> {
    try {
      for (const vector of vectors) {
        // Remove existing entry with same ID
        this.index.entries = this.index.entries.filter(entry => entry.id !== vector.id);
        
        // Add new entry
        this.index.entries.push({
          id: vector.id,
          vector: vector.embedding,
          metadata: {
            imageId: vector.imageId,
            objectId: vector.objectId,
            ...vector.metadata,
            timestamp: new Date().toISOString()
          }
        });
      }

      await this.saveIndex();
      console.log(`Upserted ${vectors.length} vectors`);
    } catch (error) {
      console.error('Failed to upsert vectors:', error);
      throw error;
    }
  }

  async searchVectors(
    queryVector: number[],
    topK: number = 10,
    filter?: any
  ): Promise<SearchResponse> {
    try {
      // Calculate similarities
      const similarities = this.index.entries.map(entry => ({
        id: entry.id,
        score: this.cosineSimilarity(queryVector, entry.vector),
        payload: entry.metadata
      }));

      // Apply filter if provided
      let filteredResults = similarities;
      if (filter) {
        filteredResults = similarities.filter(result => {
          if (filter.imageId && result.payload.imageId !== filter.imageId) {
            return false;
          }
          if (filter.ownerId && result.payload.ownerId !== filter.ownerId) {
            return false;
          }
          return true;
        });
      }

      // Sort by similarity score (descending) and limit results
      const results = filteredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return { results };
    } catch (error) {
      console.error('Vector search failed:', error);
      throw error;
    }
  }

  async deleteVectors(ids: string[]): Promise<void> {
    try {
      this.index.entries = this.index.entries.filter(entry => !ids.includes(entry.id));
      await this.saveIndex();
      console.log(`Deleted ${ids.length} vectors`);
    } catch (error) {
      console.error('Failed to delete vectors:', error);
      throw error;
    }
  }

  async deleteByImageId(imageId: string): Promise<void> {
    try {
      const initialLength = this.index.entries.length;
      this.index.entries = this.index.entries.filter(entry => entry.metadata.imageId !== imageId);
      
      if (this.index.entries.length < initialLength) {
        await this.saveIndex();
        console.log(`Deleted vectors for image: ${imageId}`);
      }
    } catch (error) {
      console.error('Failed to delete vectors by imageId:', error);
      throw error;
    }
  }

  async getCollection() {
    return {
      name: 'image_embeddings',
      vectors_count: this.index.entries.length,
      dimension: this.index.dimension,
      status: 'ready'
    };
  }
}

export const vectorService = new VectorService();
