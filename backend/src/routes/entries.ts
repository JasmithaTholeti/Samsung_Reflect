import { Router } from 'express';
import { z } from 'zod';
import { JournalEntry } from '../models/JournalEntry.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const MoodEnum = z.enum(['happy', 'calm', 'excited', 'stressed', 'tired']);

const OpaqueDocSchema = z.object({
    type: z.literal('journal-canvas'),
    version: z.literal(1),
    // store HTML snapshot (or allow anything by using z.any())
    state: z.object({ html: z.string() }).passthrough(),
});

const CreateSchema = z.object({
    // ➜ optional now; server will fill if missing
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    title: z.string().optional(),
    mood: MoodEnum.nullable().optional(),
    document: OpaqueDocSchema,
    previewUrl: z.string().url().nullable().optional(),
});

const UpdateSchema = z.object({
    title: z.string().optional(),
    mood: MoodEnum.nullable().optional(),
    document: OpaqueDocSchema.optional(),
    previewUrl: z.string().url().nullable().optional(),
});

// CREATE (always new)
router.post('/', asyncHandler(async (req, res) => {
    const { id: ownerId } = (req as any).user;
    const body = CreateSchema.parse(req.body);

    const date = body.date ?? new Date().toISOString().slice(0, 10); // yyyy-mm-dd

    const doc = await JournalEntry.create({ ...body, date, ownerId });
    res.status(201).json(doc);
}));

// LIST (optional date range + pagination)
router.get('/', asyncHandler(async (req, res) => {
    const { id: ownerId } = (req as any).user;
    const { from, to, limit = '100', skip = '0' } = req.query as any;

    const q: any = { ownerId };
    if (from || to) {
        q.date = {};
        if (from) q.date.$gte = from;
        if (to) q.date.$lte = to;
    }

    const docs = await JournalEntry.find(q)
        .sort({ createdAt: -1 })
        .skip(parseInt(skip, 10))
        .limit(Math.min(parseInt(limit, 10), 500));

    res.json(docs);
}));

// ⚠️ Put this BEFORE '/:id' so it doesn't get shadowed
router.get('/by-date/:date', asyncHandler(async (req, res) => {
    const { id: ownerId } = (req as any).user;
    const docs = await JournalEntry.find({ ownerId, date: req.params.date })
        .sort({ createdAt: -1 });
    res.json(docs);
}));

// READ by id
router.get('/:id', asyncHandler(async (req, res) => {
    const { id: ownerId } = (req as any).user;
    const doc = await JournalEntry.findOne({ _id: req.params.id, ownerId });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
}));

// UPDATE by id
router.patch('/:id', asyncHandler(async (req, res) => {
    const { id: ownerId } = (req as any).user;
    const updates = UpdateSchema.parse(req.body);
    const doc = await JournalEntry.findOneAndUpdate(
        { _id: req.params.id, ownerId },
        { $set: updates },
        { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
}));

// DELETE by id
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id: ownerId } = (req as any).user;
    await JournalEntry.deleteOne({ _id: req.params.id, ownerId });
    res.json({ ok: true });
}));

export default router;
