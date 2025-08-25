import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';


const router = Router();


fs.mkdirSync(config.uploadDir, { recursive: true });


const storage = multer.diskStorage({
destination: (_req, _file, cb) => cb(null, config.uploadDir),
filename: (_req, file, cb) => {
const ext = path.extname(file.originalname);
const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]+/gi, '-');
cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}${ext}`);
}
});


const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB


router.post('/', upload.single('file'), (req, res) => {
const file = req.file!;
const publicUrl = `/uploads/${file.filename}`;
res.json({
url: publicUrl,
originalName: file.originalname,
size: file.size,
mimeType: file.mimetype,
});
});


export default router;