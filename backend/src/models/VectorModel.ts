import mongoose, { Schema, Document } from 'mongoose';

export interface IVector extends Document {
  _id: string;
  imageId: string;
  objectId?: string;
  vector: number[];
  dims: number;
  modelName: string;
  metadata: {
    label?: string;
    bbox?: number[];
    score?: number;
    scene?: string;
    class?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VectorSchema = new Schema({
  imageId: { type: Schema.Types.ObjectId, ref: 'Image', required: true },
  objectId: { type: Schema.Types.ObjectId, ref: 'Object' },
  vector: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length > 0;
      },
      message: 'Vector must not be empty'
    }
  },
  dims: { type: Number, required: true },
  modelName: { type: String, required: true, default: 'clip' },
  metadata: {
    label: { type: String },
    bbox: [Number],
    score: { type: Number },
    scene: { type: String },
    class: { type: String }
  }
}, { timestamps: true });

// Indexes
VectorSchema.index({ imageId: 1 });
VectorSchema.index({ objectId: 1 });
VectorSchema.index({ modelName: 1 });
VectorSchema.index({ 'metadata.class': 1 });
VectorSchema.index({ 'metadata.scene': 1 });

export const VectorModel = mongoose.model<IVector>('Vector', VectorSchema);
