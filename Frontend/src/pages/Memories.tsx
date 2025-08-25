// src/pages/Memories.tsx
/// <reference types="vite/client" />
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Heart,
  Image as ImageIcon,
  Star,
  Clock,
  X,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { getEntryById, listEntries, type Entry } from "@/lib/journalApi";

// --- local API helper for delete ---
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEV_USER = "demo-user";
const jsonHeaders = {
  "Content-Type": "application/json",
  "X-User-Id": DEV_USER,
  "Cache-Control": "no-store",
} as const;
const bust = () => `t=${Date.now()}`;
async function deleteEntry(id: string): Promise<void> {
  const r = await fetch(`${API}/api/entries/${id}?${bust()}`, {
    method: "DELETE",
    headers: jsonHeaders,
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Failed to delete entry");
}

const moodColor = (m: string) =>
({
  happy: "bg-mood-happy",
  calm: "bg-mood-calm",
  excited: "bg-mood-excited",
  stressed: "bg-mood-stressed",
  tired: "bg-mood-tired",
}[m] || "bg-muted");

function measureCanvasHeight(root: HTMLElement) {
  const els = Array.from(root.querySelectorAll<HTMLElement>(".js-el"));
  let max = 520;
  els.forEach((n) => {
    const top = parseFloat(n.style.top || "0");
    const rectH = n.getBoundingClientRect().height;
    const styleH = parseFloat(n.style.height || "0");
    const h = rectH || styleH || 0;
    max = Math.max(max, top + h + 48);
  });
  return Math.ceil(max);
}

export default function Memories() {
  const navigate = useNavigate();

  const [memories, setMemories] = useState<Entry[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [errorMemories, setErrorMemories] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites" | "recent">("all");

  // viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerHtml, setViewerHtml] = useState("");
  const [viewerHeight, setViewerHeight] = useState<number>(560);
  const [viewerHeader, setViewerHeader] = useState<{
    id: string;
    date?: string;
    title?: string;
    mood: string | null;
  }>({ id: "", date: "", title: "", mood: null });

  // zoom state
  const [viewerScale, setViewerScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null); // measures base width for scaling
  const viewerCanvasRef = useRef<HTMLDivElement>(null);
  const [baseWidth, setBaseWidth] = useState<number>(0);

  async function refreshMemories(withLoading = true) {
    if (withLoading) setLoadingMemories(true);
    setErrorMemories(null);
    try {
      const list = await listEntries();
      list.sort((a, b) => (a.createdAt! < b.createdAt! ? 1 : -1));
      setMemories(list);
    } catch (e: any) {
      setErrorMemories(e?.message || "Failed to fetch memories");
    } finally {
      setLoadingMemories(false);
    }
  }
  useEffect(() => {
    refreshMemories();
  }, []);

  const previewOf = (e: Entry) => {
    const html = e.document?.state?.html || "";
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) return text.slice(0, 160) + (text.length > 160 ? "…" : "");
    const imageCount = (html.match(/<img\b[^>]*>/gi) || []).length;
    return imageCount ? `${imageCount} photo${imageCount > 1 ? "s" : ""}` : "No content yet";
  };
  const typeOf = (e: Entry): "text" | "image" | "mixed" => {
    const html = e.document?.state?.html || "";
    const hasImg = /<img\b/i.test(html);
    const hasText = !!html.replace(/<[^>]+>/g, "").trim();
    return hasImg && hasText ? "mixed" : hasImg ? "image" : "text";
  };
  const filteredMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = memories.map((e) => ({
      id: String(e._id),
      date: e.date,
      title: e.title || "Untitled entry",
      mood: (e.mood || "calm") as string,
      preview: previewOf(e),
      type: typeOf(e),
      tags: [e.mood || "calm"],
      isFavorite: false,
    }));
    if (q) {
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q) ||
          m.tags.some((t) => (t || "").toLowerCase().includes(q))
      );
    }
    if (filter === "favorites") list = list.filter((m) => m.isFavorite);
    if (filter === "recent") list = list.slice(0, 12);
    return list;
  }, [memories, searchQuery, filter]);

  const openMemoryViewer = useCallback(async (id: string) => {
    const e = await getEntryById(id);
    const html = e.document?.state?.html || "";
    const h = e.document?.state?.height ?? 560;
    setViewerHtml(html);
    setViewerHeight(h);
    setViewerHeader({
      id: String(e._id),
      date: e.date,
      title: e.title || "Untitled entry",
      mood: (e.mood || null) as any,
    });
    setViewerScale(1); // reset zoom each time
    setViewerOpen(true);
  }, []);

  const openInEditor = useCallback((id: string) => navigate(`/journal/${id}`), [navigate]);

  // delete (icon-only, confirm, optimistic)
  const onDelete = useCallback(
    async (id: string) => {
      const confirm = window.confirm("Delete this entry? This cannot be undone.");
      if (!confirm) return;

      const prev = memories;
      setMemories((m) => m.filter((e) => String(e._id) !== id));
      if (viewerOpen && viewerHeader.id === id) setViewerOpen(false);

      try {
        await deleteEntry(id);
      } catch (e: any) {
        setMemories(prev);
        setErrorMemories(e?.message || "Failed to delete entry");
      }
    },
    [memories, viewerOpen, viewerHeader.id]
  );

  // Measure height fallback + base width for zoom layout
  useEffect(() => {
    if (!viewerOpen) return;

    // re-measure height (after images load)
    const t = setTimeout(() => {
      if (!viewerCanvasRef.current) return;
      const measured = measureCanvasHeight(viewerCanvasRef.current);
      if (measured > viewerHeight) setViewerHeight(measured);
    }, 50);

    // measure base width for scaling & keep it updated
    const measureWidth = () => {
      if (viewportRef.current) setBaseWidth(viewportRef.current.clientWidth);
    };
    measureWidth();
    const ro = new ResizeObserver(measureWidth);
    if (viewportRef.current) ro.observe(viewportRef.current);

    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, viewerHtml]);

  // Wheel-to-zoom (Ctrl/⌘ + wheel to zoom)
  const onZoomWheel = useCallback((e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setViewerScale((s) => {
      const next = e.deltaY < 0 ? s * 1.1 : s / 1.1;
      return Math.min(3, Math.max(0.5, next));
    });
  }, []);

  const zoomIn = () => setViewerScale((s) => Math.min(3, s * 1.1));
  const zoomOut = () => setViewerScale((s) => Math.max(0.5, s / 1.1));
  const zoomReset = () => setViewerScale(1);

  return (
    <div className="min-h-screen bg-background pt-16 pb-24 md:pt-20 md:pb-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Memories</h1>
          <Link to="/journal" className="text-sm underline">Go to Journal</Link>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
                <Button variant={filter === "favorites" ? "default" : "outline"} size="sm" onClick={() => setFilter("favorites")}><Star className="w-4 h-4 mr-1" />Favorites</Button>
                <Button variant={filter === "recent" ? "default" : "outline"} size="sm" onClick={() => setFilter("recent")}><Clock className="w-4 h-4 mr-1" />Recent</Button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => refreshMemories()}>Refresh</Button>
            </div>
          </CardContent>
        </Card>

        {loadingMemories && <div className="text-muted-foreground">Loading memories…</div>}
        {errorMemories && <div className="text-destructive">{errorMemories}</div>}

        {!loadingMemories && !errorMemories && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((m, idx) => (
              <Card
                key={m.id}
                className="hover:shadow-lg transition-all duration-300 group animate-scale-in"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {m.type === "image" ? <ImageIcon className="w-4 h-4" /> : m.type === "text" ? <FileText className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{m.title}</CardTitle>
                    </div>
                    {/* sleek icon-only delete (reveals on hover) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete"
                      title="Delete"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{m.date ? new Date(m.date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${moodColor(m.mood)}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{m.preview}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {m.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={() => openMemoryViewer(m.id)}>
                    View Memory
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => openInEditor(m.id)}>
                    Open in editor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Viewer */}
      {viewerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${moodColor(viewerHeader.mood || "calm")}`} />
                <div className="text-sm text-muted-foreground">
                  {viewerHeader.date ? new Date(viewerHeader.date).toLocaleDateString() : "—"}
                </div>
                <div className="font-medium">{viewerHeader.title || "Untitled entry"}</div>
              </div>

              <div className="flex items-center gap-1">
                {/* Zoom controls */}
                <Button size="icon" variant="ghost" aria-label="Zoom out" title="Zoom out" onClick={zoomOut}>
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <span className="px-2 text-xs tabular-nums min-w-[48px] text-center">
                  {Math.round(viewerScale * 100)}%
                </span>
                <Button size="icon" variant="ghost" aria-label="Zoom in" title="Zoom in" onClick={zoomIn}>
                  <ZoomIn className="w-5 h-5" />
                </Button>
                <Button size="sm" variant="ghost" className="ml-1" onClick={zoomReset} title="Reset (100%)">
                  100%
                </Button>

                {/* Delete + Close */}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  title="Delete"
                  className="text-muted-foreground hover:text-destructive ml-2"
                  onClick={() => onDelete(viewerHeader.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setViewerOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content with zoom */}
            <div className="relative">
              <div
                className="w-full overflow-auto"
                style={{ maxHeight: "calc(90vh - 56px)" }}
                onWheel={onZoomWheel}
              >
                {/* This wrapper defines the scrollable area size while zoomed */}
                <div ref={viewportRef} className="relative w-full">
                  <div
                    className="relative"
                    // Sized to the scaled content so scrollbars match visual size
                    style={{
                      width: Math.max(1, (baseWidth || 800) * viewerScale),
                      height: viewerHeight * viewerScale,
                    }}
                  >
                    {/* Scaled content, anchored from top-left */}
                    <div
                      className="relative"
                      style={{
                        width: baseWidth || 800,
                        height: viewerHeight,
                        transform: `scale(${viewerScale})`,
                        transformOrigin: "top left",
                        willChange: "transform",
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(120,120,120,0.12) 0px, rgba(120,120,120,0.12) 1px, transparent 1px, transparent 28px)",
                        backgroundPosition: "0 24px",
                      }}
                    >
                      <div
                        ref={viewerCanvasRef}
                        className="relative w-full h-full"
                        dangerouslySetInnerHTML={{ __html: viewerHtml }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Content */}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
