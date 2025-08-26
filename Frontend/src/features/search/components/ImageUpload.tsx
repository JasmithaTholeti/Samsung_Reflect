import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploadProps {
  onUploadComplete: (imageId: string, imageUrl: string) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onUploadStart,
  disabled = false
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    setError(null);
    setUploadProgress({
      progress: 0,
      status: 'uploading',
      message: 'Uploading image...'
    });

    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('image', file);

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/api/images/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadProgress({
        progress: 50,
        status: 'processing',
        message: 'Processing image with AI...'
      });

      // Poll for processing completion
      await pollProcessingStatus(result.imageId);
      
      setUploadProgress({
        progress: 100,
        status: 'completed',
        message: 'Processing complete!'
      });

      onUploadComplete(result.imageId, result.uploadUrl);
      
      // Clear progress after a delay
      setTimeout(() => setUploadProgress(null), 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadProgress({
        progress: 0,
        status: 'error',
        message: errorMessage
      });
    }
  };

  const pollProcessingStatus = async (imageId: string): Promise<void> => {
    const maxAttempts = 30; // 30 seconds timeout
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const response = await fetch(`${API_BASE}/api/images/${imageId}`);
          if (!response.ok) {
            throw new Error('Failed to check processing status');
          }

          const image = await response.json();
          
          if (image.processingStatus === 'completed') {
            resolve();
          } else if (image.processingStatus === 'failed') {
            reject(new Error(image.error || 'Processing failed'));
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              reject(new Error('Processing timeout'));
            } else {
              // Update progress based on status
              let progress = 50;
              if (image.processingStatus === 'detected') progress = 70;
              if (image.processingStatus === 'cropped') progress = 90;
              
              setUploadProgress(prev => prev ? {
                ...prev,
                progress,
                message: `Processing: ${image.processingStatus}...`
              } : null);
              
              setTimeout(checkStatus, 1000);
            }
          }
        } catch (err) {
          reject(err);
        }
      };

      checkStatus();
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadImage(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || uploadProgress?.status === 'uploading' || uploadProgress?.status === 'processing'
  });

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            uploadImage(file);
          }
          
          // Stop camera
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg', 0.9);
      };
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
              ${disabled || uploadProgress ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadProgress ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {uploadProgress.status === 'error' ? (
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  ) : (
                    <Upload className="h-12 w-12 text-primary animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">{uploadProgress.message}</p>
                  <Progress value={uploadProgress.progress} className="w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop image here' : 'Upload an image'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Drag and drop or click to select • JPEG, PNG, WebP up to 100MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={handleCameraCapture}
              disabled={disabled || !!uploadProgress}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Use Camera
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
    </div>
  );
};
