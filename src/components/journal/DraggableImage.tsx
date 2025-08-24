import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical, RotateCw } from "lucide-react";

interface DraggableImageProps {
  element: {
    id: string;
    position: { x: number; y: number };
    content: string;
    size?: { width: number; height: number };
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export const DraggableImage = ({ element, onUpdate, onDelete }: DraggableImageProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const size = element.size || { width: 200, height: 150 };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.position.x,
      y: e.clientY - element.position.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      onUpdate(element.id, { position: newPosition });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newSize = {
        width: Math.max(100, resizeStart.width + deltaX),
        height: Math.max(75, resizeStart.height + deltaY),
      };
      onUpdate(element.id, { size: newSize });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart]);

  return (
    <div
      ref={elementRef}
      className={`draggable-element group absolute border-2 border-transparent hover:border-primary/20 rounded-lg overflow-hidden shadow-soft ${
        isDragging ? 'dragging cursor-grabbing scale-105 shadow-drag' : 'cursor-grab'
      }`}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: size.width,
        height: size.height,
        transform: isDragging || isResizing ? 'translate3d(0, 0, 0)' : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/50 rounded p-1">
          <GripVertical className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 bg-black/50 text-white hover:bg-black/70"
        >
          <RotateCw className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(element.id)}
          className="w-6 h-6 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/80"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Image */}
      <img
        src={element.content}
        alt="Journal content"
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-white"></div>
      </div>
    </div>
  );
};