import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Sparkles } from "lucide-react";
import { generateText } from "@/services/api";

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
  
  // AI State
  const [suggestion, setSuggestion] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const size = element.size || { width: 300, height: 120 };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === textareaRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - element.position.x, y: e.clientY - element.position.y });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ width: size.width, height: size.height, x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      onUpdate(element.id, { position: newPosition });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newSize = { width: Math.max(200, resizeStart.width + deltaX), height: Math.max(80, resizeStart.height + deltaY) };
      onUpdate(element.id, { size: newSize });
    }
  };

  const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };

  // --- DEBUGGED AI LOGIC ---
  const handleTextChange = (value: string) => {
    console.log("📝 1. User Typed:", value); // DEBUG
    setContent(value);
    onUpdate(element.id, { content: value });
    setSuggestion("");

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.length > 5) {
      console.log("⏳ 2. Timer Started (Waiting 1s)..."); // DEBUG
      setIsGenerating(true);
      
      debounceTimer.current = setTimeout(async () => {
        console.log("🚀 3. Timer Finished! Calling AI..."); // DEBUG
        
        try {
            const fullGeneratedText = await generateText(value);
            console.log("🤖 4. AI Responded:", fullGeneratedText); // DEBUG
            
            setIsGenerating(false);
            
            if (fullGeneratedText && fullGeneratedText.includes(value)) {
                const newPart = fullGeneratedText.replace(value, "");
                console.log("✨ 5. Setting Suggestion:", newPart); // DEBUG
                setSuggestion(newPart);
            } else {
                console.log("⚠️ AI response didn't contain original text, ignoring.");
            }
        } catch (err) {
            console.error("❌ AI Error:", err);
            setIsGenerating(false);
        }
      }, 1000);
    } else {
        setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const newContent = content + suggestion;
      setContent(newContent);
      onUpdate(element.id, { content: newContent });
      setSuggestion("");
    }
  };

  const handleTextClick = () => { if (!isDragging) setIsEditing(true); };
  const handleTextBlur = () => { 
      // setIsEditing(false); // COMMENTED OUT FOR DEBUGGING (Keeps text box active so you can see logs)
      // setSuggestion(""); 
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
    }
  }, [isEditing]);

  return (
    <div
      ref={elementRef}
      className={`draggable-element group absolute bg-card border-2 border-transparent hover:border-primary/20 rounded-lg p-3 shadow-soft ${
        isDragging ? 'dragging cursor-grabbing scale-105 shadow-drag' : isResizing ? 'cursor-se-resize' : 'cursor-grab'
      }`}
      style={{
        left: element.position.x, top: element.position.y,
        width: size.width, height: size.height,
        transform: (isDragging || isResizing) ? 'translate3d(0, 0, 0)' : 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute -left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical className="w-4 h-4 text-muted-foreground" /></div>
      <Button variant="ghost" size="sm" onClick={() => onDelete(element.id)} className="absolute -right-2 -top-2 w-6 h-6 p-0 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"><X className="w-3 h-3" /></Button>

      {/* EDIT MODE */}
      {isEditing ? (
        <div className="w-full h-full relative">
            <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleTextBlur}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground p-2 font-sans"
            placeholder="Start typing..."
            style={{ minHeight: size.height - 24 }}
            />
            {/* AI OVERLAY */}
            {(suggestion || isGenerating) && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-2 bg-black text-white px-3 py-1 rounded-full z-50 shadow-lg">
                   {isGenerating ? (
                        <span className="text-xs animate-pulse">Thinking...</span>
                   ) : (
                       <>
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs">
                            Press TAB: <span className="text-gray-300">{suggestion}</span>
                        </span>
                       </>
                   )}
                </div>
            )}
        </div>
      ) : (
        <div onClick={handleTextClick} className="w-full h-full text-foreground whitespace-pre-wrap cursor-text hover:bg-accent/50 rounded p-2 transition-colors overflow-hidden" style={{ minHeight: size.height - 24 }}>
          {content || "Click to edit text..."}
        </div>
      )}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={handleResizeStart}><div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-white"></div></div>
    </div>
  );
};