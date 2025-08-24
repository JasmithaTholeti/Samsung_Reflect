import { useState, useRef, useCallback } from "react";
import { DraggableText } from "./DraggableText";
import { DraggableImage } from "./DraggableImage";
import { MoodTracker } from "./MoodTracker";
import { MediaControls } from "./MediaControls";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Type, Image, Mic, Music, Video, Smile } from "lucide-react";

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video';
  position: { x: number; y: number };
  content: any;
  size?: { width: number; height: number };
}

export const JournalCanvas = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const addTextElement = useCallback(() => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      position: { x: isMobile ? 50 : 100, y: isMobile ? 100 : 200 },
      content: 'Start typing your thoughts...',
      size: { 
        width: isMobile ? 250 : 300, 
        height: isMobile ? 100 : 120 
      },
    };
    setElements(prev => [...prev, newElement]);
  }, [isMobile]);

  const addImageElement = useCallback(() => {
    const newElement: CanvasElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      position: { x: isMobile ? 50 : 200, y: isMobile ? 200 : 300 },
      content: '/placeholder.svg',
      size: { 
        width: isMobile ? 180 : 200, 
        height: isMobile ? 120 : 150 
      },
    };
    setElements(prev => [...prev, newElement]);
  }, [isMobile]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
  }, []);

  return (
    <div className="relative min-h-screen bg-canvas">
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className={`journal-canvas relative w-full min-h-screen p-4 ${
          isMobile ? 'pt-16 pb-24' : 'pt-20 pb-8'
        }`}
      >
        {/* Floating Action Buttons */}
        <div className={`fixed ${isMobile ? 'right-4 bottom-28' : 'right-6 top-24'} flex ${
          isMobile ? 'flex-row space-x-3' : 'flex-col space-y-3'
        } z-40`}>
          <Button
            onClick={addTextElement}
            size="sm"
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-primary hover:bg-primary/90 shadow-lg animate-pulse-glow`}
          >
            <Type className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </Button>
          
          <Button
            onClick={addImageElement}
            variant="secondary"
            size="sm"
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full shadow-lg`}
          >
            <Image className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </Button>

          <Button
            onClick={() => setShowMoodTracker(!showMoodTracker)}
            variant="secondary"
            size="sm"
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full shadow-lg`}
          >
            <Smile className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </Button>
        </div>

        {/* Media Controls Toolbar */}
        {!isMobile && <MediaControls />}

        {/* Mood Tracker */}
        {showMoodTracker && (
          <div className={`fixed ${
            isMobile ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : 'right-6 top-80'
          } z-40`}>
            <MoodTracker onClose={() => setShowMoodTracker(false)} />
          </div>
        )}

        {/* Canvas Elements */}
        {elements.map(element => {
          switch (element.type) {
            case 'text':
              return (
                <DraggableText
                  key={element.id}
                  element={element}
                  onUpdate={updateElement}
                  onDelete={deleteElement}
                />
              );
            case 'image':
              return (
                <DraggableImage
                  key={element.id}
                  element={element}
                  onUpdate={updateElement}
                  onDelete={deleteElement}
                />
              );
            default:
              return null;
          }
        })}

        {/* Empty State */}
        {elements.length === 0 && (
          <div className={`flex flex-col items-center justify-center ${
            isMobile ? 'min-h-[50vh] px-4' : 'min-h-[60vh]'
          } text-center animate-fade-in`}>
            <div className={`${
              isMobile ? 'w-20 h-20' : 'w-24 h-24'
            } rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 animate-pulse-glow`}>
              <Plus className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-white`} />
            </div>
            <h2 className={`${
              isMobile ? 'text-xl' : 'text-2xl'
            } font-semibold text-foreground mb-2`}>
              Start Your Reflection
            </h2>
            <p className={`text-muted-foreground ${
              isMobile ? 'text-sm max-w-xs' : 'max-w-md'
            } mb-6`}>
              Add text, images, voice memos, and memories to create your personal journal entry. 
              Your thoughts, beautifully arranged.
            </p>
            <Button 
              onClick={addTextElement}
              className="bg-primary hover:bg-primary/90"
              size={isMobile ? "sm" : "default"}
            >
              <Type className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              Add Your First Thought
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};