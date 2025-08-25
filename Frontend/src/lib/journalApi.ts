// src/lib/journalApi.ts
export type EntryDoc = { type: "journal-canvas"; version: 1; state: { html: string; height: number } };
export type Mood = "happy" | "calm" | "excited" | "stressed" | "tired" | null;
export type Entry = {
  _id?: string;
  date?: string;
  title?: string;
  mood?: Mood;
  document: EntryDoc;
  createdAt?: string;
  updatedAt?: string;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEV_USER = "demo-user";
const baseHeaders = { "X-User-Id": DEV_USER, "Cache-Control": "no-store" } as const;
const jsonHeaders = { "Content-Type": "application/json", "X-User-Id": DEV_USER, "Cache-Control": "no-store" } as const;

const bust = () => `t=${Date.now()}`;

export async function listEntries(): Promise<Entry[]> {
  const r = await fetch(`${API}/api/entries?${bust()}`, { headers: baseHeaders, cache: "no-store" });
  if (!r.ok) throw new Error("Failed to fetch entries");
  return r.json();
}
export async function getEntryById(id: string): Promise<Entry> {
  const r = await fetch(`${API}/api/entries/${id}?${bust()}`, { headers: baseHeaders, cache: "no-store" });
  if (!r.ok) throw new Error("Failed to fetch entry");
  return r.json();
}
export async function createEntry(entry: Omit<Entry, "_id" | "createdAt" | "updatedAt" | "date">): Promise<Entry> {
  const r = await fetch(`${API}/api/entries?${bust()}`, {
    method: "POST",
    headers: jsonHeaders,
    cache: "no-store",
    body: JSON.stringify(entry),
  });
  if (!r.ok) throw new Error("Failed to create entry");
  return r.json();
}
export async function updateEntry(id: string, updates: Partial<Pick<Entry, "title" | "mood" | "document">>): Promise<Entry> {
  const r = await fetch(`${API}/api/entries/${id}?${bust()}`, {
    method: "PATCH",
    headers: jsonHeaders,
    cache: "no-store",
    body: JSON.stringify(updates),
  });
  if (!r.ok) throw new Error("Failed to update entry");
  return r.json();
}
