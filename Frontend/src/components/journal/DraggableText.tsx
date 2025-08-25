import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";

interface DraggableTextProps {
  element: {
    id: string;
    position: { x: number; y: number };
    content: string;
    size?: { width: number; height: number };
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export const DraggableText = ({ element, onUpdate, onDelete }: DraggableTextProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(element.content);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const size = element.size || { width: 300, height: 120 };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === textareaRef.current) return;
    
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
        width: Math.max(200, resizeStart.width + deltaX),
        height: Math.max(80, resizeStart.height + deltaY),
      };
      onUpdate(element.id, { size: newSize });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleTextChange = (value: string) => {
    setContent(value);
    onUpdate(element.id, { content: value });
  };

  const handleTextClick = () => {
    if (!isDragging) {
      setIsEditing(true);
    }
  };

  const handleTextBlur = () => {
    setIsEditing(false);
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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  return (
    <div
      ref={elementRef}
      className={`draggable-element group absolute bg-card border-2 border-transparent hover:border-primary/20 rounded-lg p-3 shadow-soft ${
        isDragging ? 'dragging cursor-grabbing scale-105 shadow-drag' : 
        isResizing ? 'cursor-se-resize' : 'cursor-grab'
      }`}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: size.width,
        height: size.height,
        transform: (isDragging || isResizing) ? 'translate3d(0, 0, 0)' : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div className="absolute -left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(element.id)}
        className="absolute -right-2 -top-2 w-6 h-6 p-0 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"
      >
        <X className="w-3 h-3" />
      </Button>

      {/* Text Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleTextBlur}
          className="w-full h-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground p-2"
          placeholder="Start typing your thoughts..."
          style={{ minHeight: size.height - 24 }}
        />
      ) : (
        <div
          onClick={handleTextClick}
          className="w-full h-full text-foreground whitespace-pre-wrap cursor-text hover:bg-accent/50 rounded p-2 transition-colors overflow-hidden"
          style={{ minHeight: size.height - 24 }}
        >
          {content || "Click to edit text..."}
        </div>
      )}

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