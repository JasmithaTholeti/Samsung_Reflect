// src/types.ts
export interface OpaqueDocV1 {
  type: 'journal-canvas';
  version: 1;
  state: any; // full canvas state from frontend
}

export interface EntryDTO {
  _id?: string;
  ownerId: string;
  date: string; // yyyy-mm-dd
  mood?: 'happy' | 'calm' | 'excited' | 'stressed' | 'tired' | null;
  title?: string;
  document: OpaqueDocV1; // entire doc blob
  previewUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
