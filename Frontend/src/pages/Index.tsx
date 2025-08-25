// src/pages/JournalEditor.tsx
/// <reference types="vite/client" />
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Save,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Music,
  Video as VideoIcon,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import {
  createEntry,
  updateEntry,
  getEntryById,
  type Entry,
  type EntryDoc,
  type Mood,
} from "@/lib/journalApi";

/* ----------------------- Utils ----------------------- */
function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
function stripRuntimeFromHTML(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".js-runtime").forEach((n) => n.remove());
  return clone.innerHTML;
}
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
function extractCanvasPlainText(root: HTMLElement | null) {
  if (!root) return "";
  const chunks: string[] = [];
  root.querySelectorAll<HTMLElement>(".js-editor").forEach((ed) => {
    chunks.push(ed.innerText || ed.textContent || "");
  });
  return chunks.join("\n").trim();
}
const uid = () => Math.random().toString(36).slice(2, 10);
let zCounter = 50;

/* ---------------- Frontend-only suggestions (demo) ---------------- */
function pick<T>(arr: T[], n: number) {
  const out: T[] = [];
  for (let i = 0; i < arr.length && out.length < n; i++) out.push(arr[i]);
  return out;
}
function computeSuggestions(text: string): {
  prompts: string[];
  images: string[];
  videos: string[];
} {
  const t = text.toLowerCase();

  const topics: string[] = [];
  if (/beach|sea|ocean|vacation|travel/.test(t)) topics.push("beach", "travel");
  if (/coffee|cafe|latte/.test(t)) topics.push("coffee");
  if (/workout|gym|run|yoga|health/.test(t)) topics.push("fitness");
  if (/study|exam|learn|school|college|class/.test(t)) topics.push("study");
  if (/rain|storm|cloud/.test(t)) topics.push("rain");
  if (/sunset|sunrise|golden hour/.test(t)) topics.push("sunset");
  if (/pet|dog|cat|puppy|kitten/.test(t)) topics.push("pets");
  if (/happy|grateful|excited|joy/.test(t)) topics.push("happy");
  if (/tired|stressed|anxious|overwhelmed/.test(t)) topics.push("calm");
  if (topics.length === 0) topics.push("journal");

  const images = topics.flatMap((q) => [
    `https://source.unsplash.com/480x320/?${encodeURIComponent(q)}`,
    `https://source.unsplash.com/480x320/?${encodeURIComponent(q)}&sig=1`,
    `https://source.unsplash.com/480x320/?${encodeURIComponent(q)}&sig=2`,
  ]);

  const sampleVideos = [
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
  ];

  const basePrompts = [
    "How did your day begin? One highlight?",
    "What emotion is strongest right now?",
    "One small win you’re proud of today?",
    "Something you’re grateful for right now?",
  ];
  const calmPrompts = [
    "What’s feeling heavy? Name it without judging.",
    "What would support look like for you right now?",
    "One gentle thing you could do for yourself today is…",
  ];
  const happyPrompts = [
    "Capture a moment that made you smile.",
    "Who contributed to your joy today?",
    "If today had a soundtrack, what song would play?",
  ];

  let prompts = basePrompts;
  if (topics.includes("calm")) prompts = [...prompts, ...calmPrompts];
  if (topics.includes("happy")) prompts = [...prompts, ...happyPrompts];

  return {
    prompts: pick([...new Set(prompts)], 6),
    images: pick(images, 9),
    videos: pick(sampleVideos, 2),
  };
}

/* ---------------- Gemini Mood Auto-detect (frontend) ----------------
   Hardened: tries v1 and v1beta, header and URL key, has timeout + heuristic.
--------------------------------------------------------------------- */
const GEMINI_V1_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
const GEMINI_V1BETA_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Flip this to true in DevTools if you want verbose logs
const GEMINI_DEBUG = (window as any).__GEMINI_DEBUG__ ?? false;

function fallbackMoodHeuristic(text: string): Mood {
  const t = text.toLowerCase();
  if (/(grateful|smile|happy|joy|yay|great)/.test(t)) return "happy";
  if (/(calm|peaceful|ok|fine|relaxed)/.test(t)) return "calm";
  if (/(excited|thrilled|hype|pumped)/.test(t)) return "excited";
  if (/(stressed|anxious|overwhelmed|worried|panic)/.test(t)) return "stressed";
  if (/(tired|sleepy|exhausted|fatigued|drained)/.test(t)) return "tired";
  return null;
}

async function detectMoodFromText(text: string): Promise<Mood> {
  if (!text || text.length < 12) return null;
  if (!GEMINI_KEY) return fallbackMoodHeuristic(text);

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a mood classifier for a journaling app.
Reply with ONLY ONE WORD from this set:
happy, calm, excited, stressed, tired.

Text:
${text.slice(-800)}`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 4 },
  };

  const parse = (data: any): Mood => {
    // respect blocked / safety signals
    const blocked =
      data?.promptFeedback?.blockReason ||
      data?.candidates?.[0]?.finishReason === "SAFETY";
    if (blocked) return null;

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase?.() || "";
    if (/(^|\b)happy\b/.test(raw)) return "happy";
    if (/(^|\b)calm\b/.test(raw)) return "calm";
    if (/(^|\b)excited\b/.test(raw)) return "excited";
    if (/(^|\b)stressed\b/.test(raw)) return "stressed";
    if (/(^|\b)tired\b/.test(raw)) return "tired";
    return null;
  };

  async function tryFetch(url: string, useUrlKey: boolean, timeoutMs = 5000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(useUrlKey ? `${url}?key=${GEMINI_KEY}` : url, {
        method: "POST",
        mode: "cors",
        headers: useUrlKey
          ? { "Content-Type": "application/json" }
          : { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY! },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        if (GEMINI_DEBUG) console.warn("Gemini non-OK:", res.status, await res.text());
        throw new Error(String(res.status));
      }
      const data = await res.json();
      return parse(data);
    } finally {
      clearTimeout(t);
    }
  }

  try {
    // Try v1 with URL key (browser-friendly), then header; then v1beta variants
    const order: Array<[string, boolean]> = [
      [GEMINI_V1_URL, true],
      [GEMINI_V1_URL, false],
      [GEMINI_V1BETA_URL, true],
      [GEMINI_V1BETA_URL, false],
    ];
    for (const [u, urlKey] of order) {
      try {
        const m = await tryFetch(u, urlKey);
        if (m) return m;
      } catch (e) {
        // continue
        if (GEMINI_DEBUG) console.warn("Gemini try failed:", u, urlKey, e);
      }
    }
  } catch (e) {
    if (GEMINI_DEBUG) console.warn("Gemini detect failed:", e);
  }
  return fallbackMoodHeuristic(text);
}

/* =======================================================
   Journal Editor
======================================================= */
export default function JournalEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<Mood>(null);
  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [suppressLines, setSuppressLines] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // suggestions
  const [imageRecs, setImageRecs] = useState<string[]>([]);
  const [videoRecs, setVideoRecs] = useState<string[]>([]);
  const [textPrompts, setTextPrompts] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  // legacy flags kept (no behavior change)
  const [suggOpen, setSuggOpen] = useState(false);
  const [suggDismissed, setSuggDismissed] = useState(false);

  // sleek dock state
  const [dockOpen, setDockOpen] = useState(false);
  const [dockPulse, setDockPulse] = useState(false);

  // don't override mood after manual change
  const userPinnedMoodRef = useRef(false);

  // Add placeholder CSS for contenteditable once
  useEffect(() => {
    if (!document.getElementById("canvas-editor-placeholder-style")) {
      const style = document.createElement("style");
      style.id = "canvas-editor-placeholder-style";
      style.textContent = `
        .js-editor:empty:before {
          content: attr(data-placeholder);
          color: rgb(113 113 122);
        }
        .js-editor:focus:before { content: ""; }
        .js-editor:empty { min-height: 1em; display: block; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    setSuggOpen(!isMobile); // preserved
    setDockOpen(false);     // dock starts closed on all
  }, []);

  const imgCount = imageRecs.length;
  const vidCount = videoRecs.length;
  const textCount = textPrompts.length;
  const hasSuggestions = imgCount + vidCount + textCount > 0;

  /* -------------- Load / Start -------------- */
  useEffect(() => {
    (async () => {
      if (!id) {
        if (canvasRef.current) {
          canvasRef.current.innerHTML = "";
          canvasRef.current.style.height = `560px`;
          rebind(canvasRef.current);
        }
        setEditingId(null);
        setTitle("");
        setMood(null);
        setTimeout(() => addTextBlock(), 0);

        const txt = extractCanvasPlainText(canvasRef.current);
        requestSuggestionsDebounced(txt);
        requestMoodDebounced(txt);
        return;
      }
      const e = await getEntryById(id);
      setEditingId(String(e._id));
      setTitle(e.title || "");
      setMood(e.mood ?? null);
      if (canvasRef.current) {
        canvasRef.current.innerHTML = e.document?.state?.html || "";
        canvasRef.current.style.height = `${e.document?.state?.height ?? 560}px`;
        rebind(canvasRef.current);
      }
      const txt = extractCanvasPlainText(canvasRef.current);
      requestSuggestionsDebounced(txt);
      requestMoodDebounced(txt);
      requestAnimationFrame(() =>
        topRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---- debounce suggestions on changes ---- */
  const suggDebounceRef = useRef<number | null>(null);
  const requestSuggestionsDebounced = useCallback((text: string) => {
    if (suggDebounceRef.current) window.clearTimeout(suggDebounceRef.current);
    suggDebounceRef.current = window.setTimeout(() => {
      try {
        setAiBusy(true);
        setAiErr(null);
        const { prompts, images, videos } = computeSuggestions(text);
        setTextPrompts(prompts);
        setImageRecs(images);
        setVideoRecs(videos);
      } catch (e: any) {
        setAiErr(e?.message || "Suggestions failed.");
      } finally {
        setAiBusy(false);
      }
    }, 400);
  }, []);

  /* ---- debounce mood detect on changes ---- */
  const moodDebounceRef = useRef<number | null>(null);
  const requestMoodDebounced = useCallback((text: string) => {
    if (moodDebounceRef.current) window.clearTimeout(moodDebounceRef.current);
    moodDebounceRef.current = window.setTimeout(async () => {
      if (userPinnedMoodRef.current) return;
      const m = await detectMoodFromText(text);
      if (m) setMood(m);
    }, 900);
  }, []);

  // Watch canvas typing & structure mutations
  useEffect(() => {
    if (!canvasRef.current) return;
    const onChange = () => {
      const txt = extractCanvasPlainText(canvasRef.current);
      requestSuggestionsDebounced(txt);
      requestMoodDebounced(txt);
    };
    canvasRef.current.addEventListener("input", onChange);
    const mo = new MutationObserver(onChange);
    mo.observe(canvasRef.current, { characterData: true, subtree: true, childList: true });
    return () => {
      canvasRef.current?.removeEventListener("input", onChange);
      mo.disconnect();
    };
  }, [requestSuggestionsDebounced, requestMoodDebounced]);

  // Vibrate & pulse when new suggestions appear
  const prevKeyRef = useRef<string>("");
  useEffect(() => {
    if (aiBusy) return;
    const key = `${imageRecs.slice(0, 3).join("|")}|${videoRecs.slice(0, 1).join("|")}|${textPrompts.slice(0, 2).join("|")}`;
    if (hasSuggestions && prevKeyRef.current && prevKeyRef.current !== key) {
      try {
        (navigator as any)?.vibrate?.([18, 40, 18]);
      } catch { }
      setDockPulse(true);
      window.setTimeout(() => setDockPulse(false), 1200);
    }
    prevKeyRef.current = key;
  }, [aiBusy, imageRecs, videoRecs, textPrompts, hasSuggestions]);

  /* ---------------- SAVE ---------------- */
  const saveEntryNow = useCallback(async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const html = stripRuntimeFromHTML(canvasRef.current);
      const height = measureCanvasHeight(canvasRef.current);
      const document: EntryDoc = {
        type: "journal-canvas",
        version: 1,
        state: { html, height },
      };

      let saved: Entry;
      if (editingId) {
        saved = await updateEntry(editingId, { title, mood, document });
      } else {
        saved = await createEntry({ title, mood, document });
      }

      setSaveBanner("Saved!");
      setTimeout(() => setSaveBanner(null), 1500);
      if (!editingId) navigate(`/journal/${saved._id}`);
    } catch (e) {
      console.error("save failed", e);
      setSaveBanner("Failed to save.");
      setTimeout(() => setSaveBanner(null), 2000);
    } finally {
      setSaving(false);
    }
  }, [editingId, title, mood, navigate]);

  /* ---------------- Paper BG ---------------- */
  const paperBackground = suppressLines
    ? {}
    : ({
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(120,120,120,0.12) 0px, rgba(120,120,120,0.12) 1px, transparent 1px, transparent 28px)",
      backgroundSize: "auto",
      backgroundPosition: "0 24px",
    } as React.CSSProperties);

  /* ---------------- Add elements ---------------- */
  const addTextBlock = useCallback(() => {
    if (!canvasRef.current) return;
    const el = document.createElement("div");
    el.className =
      "js-el js-text absolute bg-card border border-border rounded-xl shadow";
    el.dataset.type = "text";
    el.dataset.id = uid();
    el.style.left = `${80 + Math.floor(Math.random() * 120)}px`;
    el.style.top = `${120 + Math.floor(Math.random() * 120)}px`;
    el.style.width = `420px`;
    el.style.minHeight = `120px`;
    el.style.padding = "12px";

    const editor = document.createElement("div");
    editor.className = "js-editor outline-none whitespace-pre-wrap";
    editor.setAttribute("contenteditable", "true");
    editor.setAttribute("data-placeholder", "Start typing…");

    el.appendChild(editor);
    canvasRef.current.appendChild(el);
    injectRuntime(el);
    rebind(canvasRef.current);

    setTimeout(() => {
      editor.focus();
    }, 0);
  }, []);

  const addImageFromFile = useCallback(async (file: File) => {
    if (!canvasRef.current || !file) return;
    const dataUrl = await fileToDataURL(file);
    addImageBlock(dataUrl);
  }, []);
  const addImageFromUrl = useCallback(async () => {
    const url = window.prompt("Paste image URL");
    if (!url) return;
    addImageBlock(url);
  }, []);
  const addImageBlock = useCallback((src: string) => {
    if (!canvasRef.current) return;
    const wrap = document.createElement("div");
    wrap.className =
      "js-el js-image absolute border border-border rounded-xl overflow-hidden shadow";
    wrap.dataset.type = "image";
    wrap.dataset.id = uid();
    wrap.style.left = `${160 + Math.floor(Math.random() * 140)}px`;
    wrap.style.top = `${200 + Math.floor(Math.random() * 140)}px`;
    wrap.style.width = `320px`;
    wrap.style.height = `220px`;

    const img = document.createElement("img");
    img.src = src;
    img.alt = "image";
    img.className = "js-img w-full h-full object-cover pointer-events-auto";
    img.style.transformOrigin = "center center";
    wrap.dataset.crop = "0";
    wrap.dataset.scale = "1";
    wrap.dataset.tx = "0";
    wrap.dataset.ty = "0";

    wrap.appendChild(img);
    canvasRef.current.appendChild(wrap);
    injectRuntime(wrap);
    rebind(canvasRef.current);
  }, []);

  const addAudioFromFile = useCallback(async (file: File) => {
    if (!canvasRef.current || !file) return;
    const src = await fileToDataURL(file);
    const box = document.createElement("div");
    box.className =
      "js-el js-audio absolute bg-card border border-border rounded-xl p-2 shadow";
    box.dataset.type = "audio";
    box.dataset.id = uid();
    box.style.left = `${120 + Math.floor(Math.random() * 140)}px`;
    box.style.top = `${280 + Math.floor(Math.random() * 140)}px`;
    box.style.width = `380px`;
    box.style.minHeight = `60px`;
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = src;
    audio.className = "w-full";
    box.appendChild(audio);
    canvasRef.current.appendChild(box);
    injectRuntime(box);
    rebind(canvasRef.current);
  }, []);

  const addVideoFromFile = useCallback(async (file: File) => {
    if (!canvasRef.current || !file) return;
    const src = await fileToDataURL(file);
    addVideoBlock(src);
  }, []);
  const addVideoFromUrl = useCallback(async () => {
    const url = window.prompt("Paste video URL");
    if (!url) return;
    addVideoBlock(url);
  }, []);
  const addVideoBlock = useCallback((src: string) => {
    if (!canvasRef.current) return;
    const box = document.createElement("div");
    box.className =
      "js-el js-video absolute bg-black rounded-xl overflow-hidden shadow";
    box.dataset.type = "video";
    box.dataset.id = uid();
    box.style.left = `${140 + Math.floor(Math.random() * 140)}px`;
    box.style.top = `${320 + Math.floor(Math.random() * 140)}px`;
    box.style.width = `420px`;
    box.style.height = `240px`;

    const video = document.createElement("video");
    video.controls = true;
    video.src = src;
    video.className = "w-full h-full object-cover";
    box.appendChild(video);
    canvasRef.current.appendChild(box);
    injectRuntime(box);
    rebind(canvasRef.current);
  }, []);

  /* ---------------- Runtime controls ---------------- */
  function injectRuntime(el: HTMLElement) {
    if (el.querySelector(".js-runtime")) return;

    const grip = document.createElement("div");
    grip.className =
      "js-runtime js-drag-handle absolute -left-2 top-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition";
    grip.textContent = "⋮⋮";
    el.appendChild(grip);

    const res = document.createElement("div");
    res.className =
      "js-runtime js-resize-handle absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-sm opacity-0 group-hover:opacity-100 transition cursor-se-resize";
    el.appendChild(res);

    const ctrls = document.createElement("div");
    ctrls.className =
      "js-runtime js-ctrls absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition pointer-events-auto";

    const del = document.createElement("button");
    del.className = "px-1 py-0.5 text-[11px] rounded bg-black/60 text-white";
    del.textContent = "✕";
    del.title = "Remove";
    del.onclick = (ev) => {
      ev.stopPropagation();
      el.remove();
      if (canvasRef.current) {
        const h = measureCanvasHeight(canvasRef.current);
        canvasRef.current.style.height = `${h}px`;
      }
    };
    ctrls.appendChild(del);

    if (el.dataset.type === "image") {
      const crop = document.createElement("button");
      crop.className = "px-1 py-0.5 text-[11px] rounded bg-black/60 text-white";
      crop.textContent = el.dataset.crop === "1" ? "Crop ✓" : "Crop";
      crop.title = "Toggle crop mode";
      crop.onclick = (ev) => {
        ev.stopPropagation();
        const on = el.dataset.crop === "1";
        el.dataset.crop = on ? "0" : "1";
        crop.textContent = on ? "Crop" : "Crop ✓";
      };
      ctrls.appendChild(crop);
    }

    el.appendChild(ctrls);
    el.classList.add("group", "cursor-default");
  }

  /* ---------------- Drag / Resize / Crop binding ---------------- */
  function rebind(container: HTMLElement) {
    container.style.height = `${measureCanvasHeight(container)}px`;
    container.querySelectorAll<HTMLElement>(".js-el").forEach(injectRuntime);

    let raf: number | null = null;

    // Drag
    let dragging: HTMLElement | null = null;
    let startX = 0,
      startY = 0,
      originLeft = 0,
      originTop = 0,
      dx = 0,
      dy = 0;

    const onElPointerDown = (el: HTMLElement) => (ev: PointerEvent) => {
      const inEditor = (ev.target as HTMLElement).closest(".js-editor");
      const isImage = el.dataset.type === "image";
      const overCtrl = (ev.target as HTMLElement).closest(".js-runtime");
      const overResize = (ev.target as HTMLElement).closest(".js-resize-handle");
      const cropOn = isImage && el.dataset.crop === "1";

      if (overCtrl || overResize) return;
      if (inEditor || (cropOn && !overCtrl && !overResize)) return;

      ev.preventDefault();
      (el as any).setPointerCapture?.(ev.pointerId);
      dragging = el;
      startX = ev.clientX;
      startY = ev.clientY;
      originLeft = parseFloat(el.style.left || "0");
      originTop = parseFloat(el.style.top || "0");
      el.style.zIndex = String(++zCounter);
      if (isImage) setSuppressLines(true);
      document.addEventListener("pointermove", onDocPointerMove);
      document.addEventListener("pointerup", onDocPointerUp, true);
    };

    const onDocPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (raf == null) {
        raf = requestAnimationFrame(() => {
          dragging &&
            (dragging.style.transform = `translate3d(${dx}px, ${dy}px, 0)`);
          raf = null;
        });
      }
    };
    const onDocPointerUp = () => {
      if (!dragging) return;
      dragging.style.transform = "";
      dragging.style.left = `${originLeft + dx}px`;
      dragging.style.top = `${originTop + dy}px`;
      dx = dy = 0;
      if (dragging.dataset.type === "image") setSuppressLines(false);
      (container as HTMLElement).style.height = `${measureCanvasHeight(
        container
      )}px`;
      dragging = null;
      document.removeEventListener("pointermove", onDocPointerMove);
      document.removeEventListener("pointerup", onDocPointerUp, true);
    };

    container.querySelectorAll<HTMLElement>(".js-el").forEach((el) => {
      if ((el as any).__dragBound) return;
      el.addEventListener("pointerdown", onElPointerDown(el) as any);
      (el as any).__dragBound = true;
    });

    // Resize
    let resizing: HTMLElement | null = null;
    let rStartX = 0,
      rStartY = 0,
      rStartW = 0,
      rStartH = 0,
      rDX = 0,
      rDY = 0;

    const onResizeMove = (e: PointerEvent) => {
      if (!resizing) return;
      rDX = e.clientX - rStartX;
      rDY = e.clientY - rStartY;
      if (raf == null) {
        raf = requestAnimationFrame(() => {
          const w = Math.max(120, rStartW + rDX);
          const h = Math.max(80, rStartH + rDY);
          resizing && (resizing.style.transform = `translateZ(0)`);
          resizing && (resizing.style.width = `${w}px`);
          resizing && (resizing.style.height = `${h}px`);
          raf = null;
        });
      }
    };
    const onResizeUp = () => {
      if (!resizing) return;
      resizing.style.transform = "";
      resizing.style.width = `${Math.max(120, rStartW + rDX)}px`;
      resizing.style.height = `${Math.max(80, rStartH + rDY)}px`;
      (container as HTMLElement).style.height = `${measureCanvasHeight(
        container
      )}px`;
      rDX = rDY = 0;
      resizing = null;
      document.removeEventListener("pointermove", onResizeMove);
      document.removeEventListener("pointerup", onResizeUp, true);
    };

    container.querySelectorAll<HTMLElement>(".js-resize-handle").forEach((h) => {
      if ((h as any).__resizeBound) return;
      h.addEventListener("pointerdown", (ev: PointerEvent) => {
        ev.stopPropagation();
        const block = h.closest(".js-el") as HTMLElement | null;
        if (!block) return;
        (h as any).setPointerCapture?.(ev.pointerId);
        resizing = block;
        rStartX = ev.clientX;
        rStartY = ev.clientY;
        rStartW = block.getBoundingClientRect().width;
        rStartH = block.getBoundingClientRect().height;
        block.style.zIndex = String(++zCounter);
        document.addEventListener("pointermove", onResizeMove);
        document.addEventListener("pointerup", onResizeUp, true);
      });
      (h as any).__resizeBound = true;
    });

    // Image crop pan/zoom
    container.querySelectorAll<HTMLElement>(".js-image").forEach((wrap) => {
      const img = wrap.querySelector<HTMLImageElement>(".js-img");
      if (!img) return;

      if (!(wrap as any).__imgBound) {
        wrap.addEventListener("wheel", (ev: WheelEvent) => {
          if (wrap.dataset.crop !== "1") return;
          ev.preventDefault();
          const cur = parseFloat(wrap.dataset.scale || "1");
          const next = Math.min(
            6,
            Math.max(0.2, cur * (ev.deltaY < 0 ? 1.08 : 0.92))
          );
          wrap.dataset.scale = String(next);
          const tx2 = parseFloat(wrap.dataset.tx || "0");
          const ty2 = parseFloat(wrap.dataset.ty || "0");
          img.style.transform = `translate(${tx2}px, ${ty2}px) scale(${next})`;
        });

        let panning = false;
        let pStartX = 0,
          pStartY = 0,
          baseTX = parseFloat(wrap.dataset.tx || "0"),
          baseTY = parseFloat(wrap.dataset.ty || "0");

        wrap.addEventListener("pointerdown", (ev: PointerEvent) => {
          const on = wrap.dataset.crop === "1";
          const onCtrl = (ev.target as HTMLElement).closest(".js-runtime");
          const overResize = (ev.target as HTMLElement).closest(
            ".js-resize-handle"
          );
          if (on && !onCtrl && !overResize) {
            ev.preventDefault();
            ev.stopPropagation();
            panning = true;
            pStartX = ev.clientX;
            pStartY = ev.clientY;
            baseTX = parseFloat(wrap.dataset.tx || "0");
            baseTY = parseFloat(wrap.dataset.ty || "0");
            (wrap as any).setPointerCapture?.(ev.pointerId);

            const move = (e: PointerEvent) => {
              if (!panning) return;
              const dx = e.clientX - pStartX;
              const dy = e.clientY - pStartY;
              const nx = baseTX + dx;
              const ny = baseTY + dy;
              wrap.dataset.tx = String(nx);
              wrap.dataset.ty = String(ny);
              img.style.transform = `translate(${nx}px, ${ny}px) scale(${parseFloat(
                wrap.dataset.scale || "1"
              )})`;
            };
            const up = () => {
              panning = false;
              document.removeEventListener("pointermove", move);
              document.removeEventListener("pointerup", up, true);
            };
            document.addEventListener("pointermove", move);
            document.addEventListener("pointerup", up, true);
          }
        });

        (wrap as any).__imgBound = true;
      }

      const scale = parseFloat(wrap.dataset.scale || "1");
      const tx = parseFloat(wrap.dataset.tx || "0");
      const ty = parseFloat(wrap.dataset.ty || "0");
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    });
  }

  /* ---------------- Render ---------------- */
  return (
    <div
      className={[
        // Added bottom padding; dark colors unchanged
        "min-h-screen pt-16 md:pt-20 pb-28 md:pb-16",
        "bg-background dark:bg-background",
      ].join(" ")}
    >
      {/* Decorative light-mode background (kept out of dark) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-orange-300/50 to-rose-300/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-amber-300/40 to-pink-300/40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50" />
      </div>

      {/* Premium rounded, glassy, orangish navbar (light only) */}
      <div ref={topRef} className="sticky top-0 z-30">
        <div
          className={[
            "container mx-auto h-full px-4 relative",
            // glassy orangish layer *bounded to the same width as the container/canvas*
            "before:absolute before:inset-x-0 before:top-2 before:h-[68px] before:rounded-2xl",
            "before:bg-gradient-to-r before:from-orange-400/60 before:via-amber-300/55 before:to-rose-300/60",
            "before:border before:border-white/30 before:shadow-lg before:backdrop-blur-xl",
            "dark:before:hidden", // match dark-mode look/width
          ].join(" ")}
          style={{ height: 72 }}
        >
          {/* <div className="container mx-auto h-full px-4"> */}
          <div
            className={[
              "relative z-10 grid grid-cols-1 md:grid-cols-12 gap-2 items-center h-full",
              // dark mode: original tokens, subtle border
              "dark:bg-card/80 dark:border dark:border-border dark:rounded-2xl dark:px-3 dark:py-2",
            ].join(" ")}
          >
            {/* Left: Title + Mood */}
            <div className="md:col-span-9 flex items-center gap-2">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 text-sm w-[200px] sm:w-[280px] rounded-full bg-white/70 border-white/40 shadow-inner dark:bg-background dark:border-border"
              />
              <select
                value={mood || ""}
                onChange={(e) => {
                  userPinnedMoodRef.current = true;
                  setMood((e.target.value || null) as Mood);
                }}
                className="h-10 px-3 rounded-full border border-white/40 bg-white/70 text-sm shadow-inner dark:bg-background dark:border-border"
                title="Mood"
              >
                <option value="">mood</option>
                <option value="happy">happy</option>
                <option value="calm">calm</option>
                <option value="excited">excited</option>
                <option value="stressed">stressed</option>
                <option value="tired">tired</option>
              </select>
            </div>

            {/* Right: Add then Save */}
            <div className="md:col-span-3 flex justify-end items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-full border-white/50 bg-white/70 hover:bg-white/80 shadow dark:bg-background dark:border-border"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 z-[9999] rounded-2xl border-white/30 bg-white/80 backdrop-blur-md shadow-xl dark:bg-popover dark:border-border"
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Add to canvas
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={addTextBlock} className="rounded-lg">
                    <Type className="h-4 w-4 mr-2" /> Text block
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => imageInputRef.current?.click()} className="rounded-lg">
                    <ImageIcon className="h-4 w-4 mr-2" /> Image (file)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addImageFromUrl} className="rounded-lg">
                    <LinkIcon className="h-4 w-4 mr-2" /> Image URL
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => audioInputRef.current?.click()} className="rounded-lg">
                    <Music className="h-4 w-4 mr-2" /> Audio (file)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => videoInputRef.current?.click()} className="rounded-lg">
                    <VideoIcon className="h-4 w-4 mr-2" /> Video (file)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addVideoFromUrl} className="rounded-lg">
                    <LinkIcon className="h-4 w-4 mr-2" /> Video URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={saveEntryNow}
                variant="secondary"
                size="sm"
                className="h-10 px-4 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0 shadow-md hover:opacity-95 dark:bg-secondary dark:text-foreground dark:bg-none"
                title="Save"
                aria-label="Save entry"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Save</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add a clear gap below the navbar before the canvas */}
      <div className="h-6 md:h-8" />

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) =>
          e.target.files?.[0] && (await addImageFromFile(e.target.files[0]))
        }
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={async (e) =>
          e.target.files?.[0] && (await addAudioFromFile(e.target.files[0]))
        }
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={async (e) =>
          e.target.files?.[0] && (await addVideoFromFile(e.target.files[0]))
        }
      />

      {/* Main card */}
      <div className="container mx-auto px-4">
        {saveBanner && (
          <div className="mt-1 mb-4 rounded-full bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 px-4 py-2 backdrop-blur dark:bg-emerald-900/10 dark:text-emerald-300 dark:border-emerald-900/30">
            {saveBanner}
          </div>
        )}

        {/* Gradient frame (light only) / plain in dark */}
        <div className="rounded-3xl p-[2px] bg-gradient-to-br from-orange-400/40 via-amber-300/40 to-pink-400/40 shadow-[0_20px_60px_-25px_rgba(255,127,80,0.35)] dark:[background-image:none] dark:shadow-none dark:p-0">
          <div className="rounded-3xl border border-white/40 bg-white/70 backdrop-blur-md dark:bg-card dark:border-border">
            <div
              ref={canvasRef}
              className="relative w-full rounded-2xl border border-white/40 bg-white/70 overflow-auto dark:bg-card dark:border-border"
              style={{ ...paperBackground, minHeight: 560 }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Drag blocks anywhere; resize with the corner square. Images: toggle “Crop” to pan & zoom.
        </p>
      </div>

      {/* ---------- SUGGESTION DOCK (responsive, premium) ---------- */}
      {!suggDismissed && (
        <div className="fixed right-4 bottom-6 z-[180]">
          {/* Pill / chip */}
          <div
            className={[
              "relative flex items-center gap-2 rounded-full border border-white/40",
              "bg-white/70 backdrop-blur-md shadow-lg px-3 py-2 cursor-pointer select-none",
              "dark:bg-card/90 dark:border-border",
              dockPulse ? "ring-2 ring-orange-400/40 dark:ring-primary/40" : "",
            ].join(" ")}
            onClick={() => setDockOpen((o) => !o)}
            aria-label="Toggle suggestions"
            title="Suggestions"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-orange-600 dark:text-primary" />
              {hasSuggestions && (
                <span className="absolute -right-2 -top-2 text-[10px] leading-none bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full px-1.5 py-0.5 dark:bg-primary dark:from-primary dark:to-primary">
                  {imgCount + vidCount + textCount}
                </span>
              )}
            </div>
            <span className="text-xs">
              {aiBusy ? "thinking…" : hasSuggestions ? "Suggestions" : "No suggestions"}
            </span>
            <span
              className={`ml-1 inline-block transition-transform ${dockOpen ? "rotate-180" : ""}`}
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "6px solid currentColor",
              }}
            />
          </div>

          {/* Popover / Bottom sheet */}
          {dockOpen && (
            <div
              className={[
                "absolute bottom-12 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-[420px]",
                "sm:left-auto sm:translate-x-0 sm:right-0 sm:w-[380px]",
                "max-h-[70vh] sm:max-h-[60vh] overflow-y-auto rounded-2xl border border-white/40",
                "bg-white/85 backdrop-blur-xl shadow-2xl p-3 z-[190]",
                "dark:bg-popover dark:border-border dark:shadow-lg",
              ].join(" ")}
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), .5rem)",
              }}
            >
              <button
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/5 text-muted-foreground dark:hover:bg-white/5"
                title="Dismiss"
                onClick={() => setSuggDismissed(true)}
              >
                <X className="w-4 h-4" />
              </button>

              {hasSuggestions ? (
                <>
                  {/* IMAGES */}
                  {imageRecs.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-2">Images</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imageRecs.slice(0, 6).map((src, i) => (
                          <button
                            key={i}
                            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/40 bg-white/50 hover:shadow-md transition dark:border-border dark:bg-card"
                            title="Add image to canvas"
                            onClick={() => addImageBlock(src)}
                          >
                            <img src={src} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TEXT PROMPTS */}
                  {textPrompts.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-2">Prompts</div>
                      <div className="flex flex-wrap gap-1.5 overflow-x-auto">
                        {textPrompts.slice(0, 6).map((t, i) => (
                          <button
                            key={i}
                            className="max-w-full truncate text-xs rounded-full border border-white/40 px-2 py-1 bg-white/60 hover:bg-white/80 backdrop-blur transition dark:bg-card dark:border-border"
                            title={t}
                            onClick={() => {
                              if (!canvasRef.current) return;
                              const editor = canvasRef.current.querySelector<HTMLElement>(".js-editor");
                              if (editor) {
                                editor.focus();
                                document.execCommand(
                                  "insertText",
                                  false,
                                  (editor.innerText ? " " : "") + t
                                );
                              } else {
                                const el = document.createElement("div");
                                el.className =
                                  "js-el js-text absolute bg-card border border-border rounded-xl shadow";
                                el.dataset.type = "text";
                                el.dataset.id = uid();
                                el.style.left = "120px";
                                el.style.top = "120px";
                                el.style.width = "420px";
                                el.style.minHeight = "120px";
                                el.style.padding = "12px";
                                const ed = document.createElement("div");
                                ed.className = "js-editor outline-none whitespace-pre-wrap";
                                ed.setAttribute("contenteditable", "true");
                                ed.setAttribute("data-placeholder", "Start typing…");
                                ed.innerText = t;
                                el.appendChild(ed);
                                canvasRef.current.appendChild(el);
                                injectRuntime(el);
                                rebind(canvasRef.current);
                              }
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VIDEOS */}
                  {videoRecs.length > 0 && (
                    <div className="mb-1">
                      <div className="text-xs font-medium mb-2">Videos</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {videoRecs.slice(0, 2).map((src, i) => (
                          <button
                            key={i}
                            className="relative aspect-video rounded-xl overflow-hidden border border-white/40 bg-white/50 hover:shadow-md transition dark:border-border dark:bg-card"
                            title="Add video to canvas"
                            onClick={() => addVideoBlock(src)}
                          >
                            <video src={src} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiErr && <div className="text-xs text-destructive">{aiErr}</div>}
                </>
              ) : (
                <div className="text-xs text-muted-foreground px-1 py-2">
                  No suggestions yet. Start writing to see ideas.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ---------- /SUGGESTION DOCK ---------- */}
    </div>
  );
}
