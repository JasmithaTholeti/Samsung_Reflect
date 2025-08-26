import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { SearchBox } from '../components/SearchBox';
import { SearchResults } from '../components/SearchResults';
import { DetectionOverlay } from '../components/DetectionOverlay';

interface SearchFilters {
  classes: string[];
  scenes: string[];
}

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

interface UploadedImage {
  imageId: string;
  imageUrl: string;
  objects: Array<{
    objectId: string;
    class: string;
    score: number;
    bbox: [number, number, number, number];
    cropUrl?: string;
  }>;
  scene?: {
    primary: string;
    labels: Array<{ label: string; score: number }>;
  };
}

export const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeTab, setActiveTab] = useState('search');

  const handleSearch = useCallback(async (query: string, filters: SearchFilters) => {
    setIsSearching(true);
    setError(null);
    setLastQuery(query);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: query,
          topK: 20,
          mode: 'both',
          filter: {
            classes: filters.classes.length > 0 ? filters.classes : undefined,
            scenes: filters.scenes.length > 0 ? filters.scenes : undefined
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSimilarSearch = useCallback(async (imageId: string) => {
    setIsSearching(true);
    setError(null);
    setLastQuery(`Similar to image ${imageId}`);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/search/similar/${imageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topK: 20 }),
      });

      if (!response.ok) {
        throw new Error(`Similar search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Similar search failed';
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleUploadComplete = useCallback(async (imageId: string, imageUrl: string) => {
    try {
      // Fetch the processed image data
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/images/${imageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch image data');
      }

      const imageData = await response.json();
      
      const uploadedImage: UploadedImage = {
        imageId,
        imageUrl,
        objects: imageData.objects || [],
        scene: imageData.scene
      };

      setUploadedImages(prev => [uploadedImage, ...prev]);
      setActiveTab('upload');
    } catch (err) {
      console.error('Failed to fetch uploaded image data:', err);
    }
  }, []);

  const handleImageClick = useCallback((imageId: string) => {
    // Handle image click - could open in modal, navigate to detail page, etc.
    console.log('Image clicked:', imageId);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI-Powered Image Search
        </h1>
        <p className="text-gray-600">
          Upload images to analyze with YOLO object detection and Places365 scene classification, 
          then search using natural language queries.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Images</TabsTrigger>
          <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <SearchBox
            onSearch={handleSearch}
            isLoading={isSearching}
            placeholder="Search for objects, scenes, or describe what you're looking for..."
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <SearchResults
            results={searchResults}
            query={lastQuery}
            isLoading={isSearching}
            onImageClick={handleImageClick}
            onSimilarSearch={handleSimilarSearch}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <ImageUpload
            onUploadComplete={handleUploadComplete}
            onUploadStart={() => setError(null)}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Recently uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recently Analyzed Images</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {uploadedImages.map((image) => (
                  <Card key={image.imageId}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DetectionOverlay
                        imageUrl={image.imageUrl}
                        objects={image.objects}
                        scene={image.scene}
                        onObjectClick={(obj) => console.log('Object clicked:', obj)}
                        className="mb-4"
                      />
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleSimilarSearch(image.imageId)}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Find Similar Images
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
