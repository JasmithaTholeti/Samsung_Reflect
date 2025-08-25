/// <reference types="vite/client" />

// JournalCanvas.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { DraggableText } from "./DraggableText";
import { DraggableImage } from "./DraggableImage";
import { MoodTracker } from "./MoodTracker";
import { MediaControls } from "./MediaControls";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Type, Image, Smile, Save, Loader2 } from "lucide-react"; // ← ADD Save + Loader2

// ──────────────────────────────────────────────────────────────────────────────
// Backend wiring: store entire canvas as an opaque document
type EntryDoc = {
  type: "journal-canvas";
  version: 1;
  state: any; // we keep it opaque for backend
};

type Entry = {
  _id?: string;
  date: string; // yyyy-mm-dd
  title?: string;
  mood?: "happy" | "calm" | "excited" | "stressed" | "tired" | null;
  document: EntryDoc;
  previewUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEV_USER = "demo-user"; // replace with your real auth later
const jsonHeaders = { "Content-Type": "application/json", "X-User-Id": DEV_USER } as const;

const dayKey = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

async function getEntry(date: string): Promise<Entry | null> {
  const r = await fetch(`${API}/api/entries/${date}`, { headers: { "X-User-Id": DEV_USER } as any });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Failed to fetch entry");
  return r.json();
}

async function upsertEntry(entry: Entry): Promise<Entry> {
  const r = await fetch(`${API}/api/entries`, {
    method: "POST",
    headers: jsonHeaders as any,
    body: JSON.stringify(entry),
  });
  if (!r.ok) throw new Error("Failed to save entry");
  return r.json();
}
// ──────────────────────────────────────────────────────────────────────────────

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
  const [saving, setSaving] = useState(false); // ← ADD saving state
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // persistence state (kept minimal; UI unchanged)
  const [date] = useState<string>(dayKey());
  const [title, setTitle] = useState<string>("");
  const [mood, setMood] = useState<Entry["mood"]>(null);

  // Load existing entry on mount (sets elements from document.state.elements if present)
  useEffect(() => {
    (async () => {
      try {
        const existing = await getEntry(date);
        if (existing?.document?.state?.elements) {
          setElements(existing.document.state.elements as CanvasElement[]);
        }
        if (existing?.title) setTitle(existing.title);
        if (existing?.mood !== undefined) setMood(existing.mood ?? null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [date]);

  // Manual Save (button + hotkey can call this)
  const saveEntryNow = useCallback(async () => {
    setSaving(true);
    try {
      const document: EntryDoc = {
        type: "journal-canvas",
        version: 1,
        state: { elements }, // store entire canvas state here (expand later if needed)
      };
      const payload: Entry = {
        date,
        title,
        mood: mood ?? null,
        document,
      };
      await upsertEntry(payload); // persists to Mongo via backend upsert
      // optional: console feedback
      console.log("Saved");
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  }, [date, title, mood, JSON.stringify(elements)]);

  // Debounced autosave (kept as-is; optional to remove if you only want manual)
  useEffect(() => {
    const handle = setTimeout(() => {
      // fire-and-forget; rely on saveEntryNow for error feedback
      saveEntryNow();
    }, 400);
    return () => clearTimeout(handle);
  }, [date, title, mood, JSON.stringify(elements), saveEntryNow]);

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
        className={`journal-canvas relative w-full min-h-screen p-4 ${isMobile ? 'pt-16 pb-24' : 'pt-20 pb-8'}`}
      >
        {/* Floating Action Buttons */}
        <div className={`fixed ${isMobile ? 'right-4 bottom-28' : 'right-6 top-24'} flex ${isMobile ? 'flex-row space-x-3' : 'flex-col space-y-3'
          } z-40`}>

          {/* SAVE button (new) — matches your existing FAB style */}
          <Button
            onClick={saveEntryNow}
            variant="secondary"
            size="sm"
            disabled={saving}
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full shadow-lg`}
            aria-label="Save"
            title="Save"
          >
            {saving ? (
              <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
            ) : (
              <Save className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            )}
          </Button>

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
          <div className={`fixed ${isMobile ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : 'right-6 top-80'} z-40`}>
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
          <div className={`flex flex-col items-center justify-center ${isMobile ? 'min-h-[50vh] px-4' : 'min-h-[60vh]'} text-center animate-fade-in`}>
            <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 animate-pulse-glow`}>
              <Plus className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-white`} />
            </div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-foreground mb-2`}>
              Start Your Reflection
            </h2>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm max-w-xs' : 'max-w-md'} mb-6`}>
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

export default JournalCanvas;
