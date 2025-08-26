import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import { ImageModel } from '../models/ImageModel.js';
import { ObjectModel } from '../models/ObjectModel.js';
import { VectorModel } from '../models/VectorModel.js';
import { imageProcessingQueue } from '../services/jobQueue.js';
import { vectorService } from '../services/vectorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config.js';

const router = Router();

// Ensure directories exist
const uploadsDir = config.uploadDir;
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const cropsDir = path.join(uploadsDir, 'crops');

[uploadsDir, thumbnailsDir, cropsDir].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]+/gi, '-');
    cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2)}_${base}${ext}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Upload image and queue for processing
router.post('/upload', upload.single('image'), asyncHandler(async (req, res) => {
  const { id: ownerId } = (req as any).user;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    // Get image dimensions
    const metadata = await sharp(file.path).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Create image document
    const imageDoc = await ImageModel.create({
      ownerId,
      originalUrl: `/uploads/${file.filename}`,
      width,
      height,
      processingStatus: 'queued'
    });

    // Queue for processing
    await imageProcessingQueue.add('process-image', {
      imageId: imageDoc._id.toString(),
      imagePath: file.path,
      ownerId
    });

    res.status(201).json({
      imageId: imageDoc._id,
      uploadUrl: imageDoc.originalUrl,
      status: 'queued',
      width,
      height
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}));

// Get image by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id: ownerId } = (req as any).user;
  const imageId = req.params.id;

  const image = await ImageModel.findOne({ _id: imageId, ownerId })
    .populate('objects');

  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.json(image);
}));

// List images with pagination
router.get('/', asyncHandler(async (req, res) => {
  const { id: ownerId } = (req as any).user;
  const { limit = '20', skip = '0', status } = req.query as any;

  const query: any = { ownerId };
  if (status) {
    query.processingStatus = status;
  }

  const images = await ImageModel.find(query)
    .sort({ createdAt: -1 })
    .skip(parseInt(skip, 10))
    .limit(Math.min(parseInt(limit, 10), 100))
    .populate('objects');

  res.json(images);
}));

// Delete image and cleanup
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id: ownerId } = (req as any).user;
  const imageId = req.params.id;

  const image = await ImageModel.findOne({ _id: imageId, ownerId });
  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  try {
    // Delete from vector database
    await vectorService.deleteByImageId(imageId);

    // Delete vector documents
    await VectorModel.deleteMany({ imageId });

    // Delete object documents
    await ObjectModel.deleteMany({ imageId });

    // Delete image document
    await ImageModel.deleteOne({ _id: imageId });

    // Delete files (best effort)
    try {
      if (image.originalUrl) {
        const originalPath = path.join(process.cwd(), image.originalUrl);
        await fs.promises.unlink(originalPath);
      }
      if (image.thumbnailUrl) {
        const thumbnailPath = path.join(process.cwd(), image.thumbnailUrl);
        await fs.promises.unlink(thumbnailPath);
      }
    } catch (fileError) {
      console.warn('Failed to delete files:', fileError);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
}));

export default router;
