import mongoose, { Schema, Model, Document } from 'mongoose';
import { BillTemplate } from '@/types';

export interface TemplateDocument extends Omit<BillTemplate, '_id'>, Document {}

const PartySchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    gstin: { type: String },
  },
  { _id: false }
);

const TemplateSchema = new Schema<TemplateDocument>(
  {
    name: { type: String, required: true },
    from: { type: PartySchema, required: true },
    taxRate: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    notes: { type: String },
  },
  { timestamps: true }
);

const TemplateModel =
  (mongoose.models.Template as Model<TemplateDocument>) ||
  mongoose.model<TemplateDocument>('Template', TemplateSchema);

export default TemplateModel;
