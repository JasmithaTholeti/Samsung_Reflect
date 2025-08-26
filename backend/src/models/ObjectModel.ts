import mongoose, { Schema, Document } from 'mongoose';

export interface IObject extends Document {
  _id: string;
  imageId: string;
  ownerId: string;
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  cropUrl: string;
  embeddingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ObjectSchema = new Schema({
  imageId: { type: Schema.Types.ObjectId, ref: 'Image', required: true },
  ownerId: { type: String, required: true, index: true },
  class: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 1 },
  bbox: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 4;
      },
      message: 'bbox must have exactly 4 numbers [x, y, w, h]'
    }
  },
  cropUrl: { type: String, required: true },
  embeddingId: { type: Schema.Types.ObjectId, ref: 'Vector' }
}, { timestamps: true });

// Indexes
ObjectSchema.index({ imageId: 1 });
ObjectSchema.index({ ownerId: 1, class: 1 });
ObjectSchema.index({ ownerId: 1, createdAt: -1 });

export const ObjectModel = mongoose.model<IObject>('Object', ObjectSchema);
