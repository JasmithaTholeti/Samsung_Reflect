import mongoose, { Schema } from 'mongoose';

const JournalEntrySchema = new Schema({
  ownerId: { type: String, index: true, required: true },
  date:    { type: String, index: true, required: true }, // non-unique
  title:   { type: String, default: '' },
  // ✅ don't include null in enum; null is allowed because it's not required
  mood:    { type: String, enum: ['happy','calm','excited','stressed','tired'], default: null },
  document:{ type: Schema.Types.Mixed, required: true },   // whole doc JSON (html/state)
  previewUrl: { type: String, default: null },
}, { timestamps: true });

// ❌ remove unique index (if previously set)
// JournalEntrySchema.index({ ownerId: 1, date: 1 }, { unique: true });

// ✅ keep useful indexes
JournalEntrySchema.index({ ownerId: 1, date: 1 });
JournalEntrySchema.index({ ownerId: 1, createdAt: -1 }); // optional but good for listing

export const JournalEntry = mongoose.model('JournalEntry', JournalEntrySchema);
