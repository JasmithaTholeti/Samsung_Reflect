import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from './config.js';
import { connectDB } from './db.js';
import { mockAuth } from './middleware/auth.js';
import entriesRouter from './routes/entries.js';
import mediaRouter from './routes/media.js';
import insightsRouter from './routes/insights.js';


await connectDB();


const app = express();
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(mockAuth);


// static files for uploaded media
app.use('/uploads', express.static(path.resolve(config.uploadDir)));


app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/entries', entriesRouter);
app.use('/api/media', mediaRouter);
app.use('/api/insights', insightsRouter);


// error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
console.error(err);
res.status(400).json({ error: err?.message || 'Unknown error' });
});

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


app.listen(config.port, () => console.log(`🚀 API on :${config.port}`));