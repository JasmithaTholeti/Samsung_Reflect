// after mongoose.connect(...)
import { JournalEntry } from "./models/JournalEntry.js";

(async () => {
  try {
    await JournalEntry.collection.dropIndex("ownerId_1_date_1");
  } catch (e: any) {
    // ignore if it doesn't exist
    if (e?.code !== 27 /*IndexNotFound*/ && e?.codeName !== "IndexNotFound") {
      console.error("dropIndex failed:", e);
    }
  }
  // re-create as NON-unique
  try {
    await JournalEntry.collection.createIndex({ ownerId: 1, date: 1 });
  } catch (e) {
    console.error("createIndex failed:", e);
  }
})();
