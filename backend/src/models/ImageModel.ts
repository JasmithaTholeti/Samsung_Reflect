import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  _id: string;
  ownerId: string;
  originalUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  scene?: {
    primary: string;
    labels: Array<{ label: string; score: number }>;
  };
  objects: string[]; // ObjectIds
  processingStatus: 'queued' | 'detected' | 'cropped' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  originalUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  scene: {
    primary: { type: String },
    labels: [{
      label: { type: String },
      score: { type: Number }
    }]
  },
  objects: [{ type: Schema.Types.ObjectId, ref: 'Object' }],
  processingStatus: { 
    type: String, 
    enum: ['queued', 'detected', 'cropped', 'completed', 'failed'],
    default: 'queued'
  },
  error: { type: String }
}, { timestamps: true });

// Indexes
ImageSchema.index({ ownerId: 1, createdAt: -1 });
ImageSchema.index({ processingStatus: 1 });

export const ImageModel = mongoose.model<IImage>('Image', ImageSchema);
