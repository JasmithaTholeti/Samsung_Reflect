import { Router } from 'express';
import { JournalEntry } from '../models/JournalEntry.js';
import { asyncHandler } from '../utils/asyncHandler.js';


const router = Router();


router.get('/mood', asyncHandler(async (req, res) => {
const { id } = (req as any).user;
const agg = await JournalEntry.aggregate([
{ $match: { ownerId: id } },
{ $group: { _id: '$mood', count: { $sum: 1 } } },
{ $project: { _id: 0, mood: '$_id', count: 1 } },
]);
res.json(agg);
}));


export default router;