import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Maximize2 } from 'lucide-react';

interface DetectedObject {
  objectId: string;
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  cropUrl?: string;
  similarity?: number;
}

interface DetectionOverlayProps {
  imageUrl: string;
  objects: DetectedObject[];
  scene?: {
    primary: string;
    labels: Array<{ label: string; score: number }>;
  };
  onObjectClick?: (object: DetectedObject) => void;
  showOverlay?: boolean;
  className?: string;
}

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  imageUrl,
  objects,
  scene,
  onObjectClick,
  showOverlay = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(showOverlay);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);

  useEffect(() => {
    if (imageLoaded && canvasRef.current && imageRef.current) {
      drawOverlay();
    }
  }, [imageLoaded, objects, overlayVisible, selectedObject]);

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image display size
    const rect = image.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!overlayVisible) return;

    // Calculate scale factors
    const scaleX = canvas.width / image.naturalWidth;
    const scaleY = canvas.height / image.naturalHeight;

    // Draw bounding boxes
    objects.forEach((obj, index) => {
      const [x, y, w, h] = obj.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledW = w * scaleX;
      const scaledH = h * scaleY;

      // Determine color based on confidence and selection
      const isSelected = selectedObject?.objectId === obj.objectId;
      const alpha = isSelected ? 0.8 : 0.6;
      const color = getObjectColor(obj.class, obj.score);

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);
      ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

      // Draw filled background for label
      ctx.fillStyle = color + '40'; // Add transparency
      ctx.fillRect(scaledX, scaledY - 25, scaledW, 25);

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${obj.class} ${(obj.score * 100).toFixed(0)}%${obj.similarity ? ` (${(obj.similarity * 100).toFixed(0)}%)` : ''}`,
        scaledX + 4,
        scaledY - 8
      );

      // Reset line dash
      ctx.setLineDash([]);
    });
  };

  const getObjectColor = (className: string, score: number): string => {
    // Color based on class and confidence
    const colors = {
      person: '#ff6b6b',
      car: '#4ecdc4',
      dog: '#45b7d1',
      cat: '#96ceb4',
      bird: '#feca57',
      default: '#6c5ce7'
    };

    const baseColor = colors[className as keyof typeof colors] || colors.default;
    
    // Adjust opacity based on confidence
    const opacity = Math.max(0.6, score);
    return baseColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageRef.current || !overlayVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate scale factors
    const scaleX = canvas.width / imageRef.current.naturalWidth;
    const scaleY = canvas.height / imageRef.current.naturalHeight;

    // Find clicked object
    const clickedObject = objects.find(obj => {
      const [objX, objY, objW, objH] = obj.bbox;
      const scaledX = objX * scaleX;
      const scaledY = objY * scaleY;
      const scaledW = objW * scaleX;
      const scaledH = objH * scaleY;

      return x >= scaledX && x <= scaledX + scaledW && 
             y >= scaledY && y <= scaledY + scaledH;
    });

    if (clickedObject) {
      setSelectedObject(selectedObject?.objectId === clickedObject.objectId ? null : clickedObject);
      onObjectClick?.(clickedObject);
    } else {
      setSelectedObject(null);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative inline-block">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Analyzed image"
          className="max-w-full h-auto rounded-lg"
          onLoad={handleImageLoad}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 cursor-pointer"
          onClick={handleCanvasClick}
          style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}
        />

        {/* Controls */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOverlayVisible(!overlayVisible)}
            className="bg-black/50 hover:bg-black/70 text-white"
          >
            {overlayVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Scene label */}
        {scene && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              Scene: {scene.primary} ({(scene.labels[0]?.score * 100 || 0).toFixed(0)}%)
            </Badge>
          </div>
        )}

        {/* Object count */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/50 text-white">
            {objects.length} objects detected
          </Badge>
        </div>
      </div>

      {/* Selected object details */}
      {selectedObject && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Object Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedObject(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Class:</strong> {selectedObject.class}</p>
                <p><strong>Confidence:</strong> {(selectedObject.score * 100).toFixed(1)}%</p>
                {selectedObject.similarity && (
                  <p><strong>Search Similarity:</strong> {(selectedObject.similarity * 100).toFixed(1)}%</p>
                )}
                <p><strong>Position:</strong> ({selectedObject.bbox[0].toFixed(0)}, {selectedObject.bbox[1].toFixed(0)})</p>
                <p><strong>Size:</strong> {selectedObject.bbox[2].toFixed(0)} × {selectedObject.bbox[3].toFixed(0)}</p>
              </div>
              
              {selectedObject.cropUrl && (
                <div>
                  <p className="mb-2"><strong>Object Crop:</strong></p>
                  <img
                    src={selectedObject.cropUrl}
                    alt={`${selectedObject.class} crop`}
                    className="w-full h-auto rounded border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objects list */}
      {objects.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detected Objects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {objects.map((obj, index) => (
                <Badge
                  key={obj.objectId}
                  variant={selectedObject?.objectId === obj.objectId ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedObject(obj)}
                >
                  {obj.class} ({(obj.score * 100).toFixed(0)}%)
                  {obj.similarity && ` - ${(obj.similarity * 100).toFixed(0)}%`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
