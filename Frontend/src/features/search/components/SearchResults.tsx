import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Info, Maximize2, Star } from 'lucide-react';
import { DetectionOverlay } from './DetectionOverlay';

interface SearchResultObject {
  objectId: string;
  class: string;
  score: number;
  bbox: number[];
  similarity: number;
}

interface SearchResult {
  imageId: string;
  score: number;
  topObjects: SearchResultObject[];
  scene?: string;
  thumbnailUrl?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  onImageClick?: (imageId: string) => void;
  onSimilarSearch?: (imageId: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  isLoading = false,
  onImageClick,
  onSimilarSearch
}) => {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Searching...</h3>
          <p className="text-gray-600">Finding images that match "{query}"</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-full h-48 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600 mb-4">
          No images match your search for "{query}". Try:
        </p>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• Using different keywords</li>
          <li>• Being more specific or more general</li>
          <li>• Checking your spelling</li>
          <li>• Uploading more images to search through</li>
        </ul>
      </div>
    );
  }

  const handleImageClick = (result: SearchResult) => {
    setSelectedResult(result);
    onImageClick?.(result.imageId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Search Results</h3>
          <p className="text-gray-600">
            Found {results.length} images matching "{query}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <Card key={result.imageId} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={result.thumbnailUrl || '/api/placeholder-image'}
                alt="Search result"
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => handleImageClick(result)}
              />
              
              {/* Score overlay */}
              <div className="absolute top-2 right-2">
                <Badge className={`${getScoreColor(result.score)} font-mono text-xs`}>
                  {(result.score * 100).toFixed(0)}%
                </Badge>
              </div>

              {/* Scene badge */}
              {result.scene && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                    {result.scene}
                  </Badge>
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute top-2 left-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleImageClick(result)}
                  className="bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDetails(showDetails === result.imageId ? null : result.imageId)}
                  className="bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-0"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Top matching objects */}
                {result.topObjects.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Matching Objects:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.topObjects.slice(0, 3).map((obj) => (
                        <Badge
                          key={obj.objectId}
                          variant="outline"
                          className="text-xs"
                        >
                          {obj.class} ({(obj.similarity * 100).toFixed(0)}%)
                        </Badge>
                      ))}
                      {result.topObjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.topObjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSimilarSearch?.(result.imageId)}
                    className="flex-1"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Similar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImageClick(result)}
                    className="flex-1"
                  >
                    <Maximize2 className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Expandable details */}
            {showDetails === result.imageId && (
              <CardContent className="pt-0 border-t">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overall Score:</span>
                    <span className="font-mono">{(result.score * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Objects Found:</span>
                    <span>{result.topObjects.length}</span>
                  </div>
                  {result.scene && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scene:</span>
                      <span className="capitalize">{result.scene}</span>
                    </div>
                  )}
                  
                  {/* Detailed object list */}
                  {result.topObjects.length > 0 && (
                    <div className="mt-3">
                      <p className="text-gray-600 mb-2">Object Details:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {result.topObjects.map((obj) => (
                          <div key={obj.objectId} className="flex justify-between text-xs">
                            <span className="capitalize">{obj.class}</span>
                            <span className="font-mono">
                              {(obj.similarity * 100).toFixed(0)}% ({(obj.score * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Selected image modal/overlay */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Image Details</h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              
              <DetectionOverlay
                imageUrl={selectedResult.thumbnailUrl || '/api/placeholder-image'}
                objects={selectedResult.topObjects.map(obj => ({
                  objectId: obj.objectId,
                  class: obj.class,
                  score: obj.score,
                  bbox: obj.bbox as [number, number, number, number],
                  similarity: obj.similarity
                }))}
                scene={selectedResult.scene ? {
                  primary: selectedResult.scene,
                  labels: [{ label: selectedResult.scene, score: 0.9 }]
                } : undefined}
                onObjectClick={(obj) => console.log('Object clicked:', obj)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
