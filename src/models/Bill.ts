import mongoose, { Schema, Model, Document } from 'mongoose';
import { Bill, BillStatus } from '@/types';

export interface BillDocument extends Omit<Bill, '_id'>, Document {}

interface BillModel extends Model<BillDocument> {
  generateBillNumber(): Promise<string>;
}

const LineItemSchema = new Schema(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

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

const BillSchema = new Schema<BillDocument, BillModel>(
  {
    billNumber: { type: String, required: true, unique: true },
    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled'] satisfies BillStatus[],
      default: 'draft',
    },
    from: { type: PartySchema, required: true },
    to: { type: PartySchema, required: true },
    lineItems: { type: [LineItemSchema], default: [] },
    notes: { type: String },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    templateId: { type: String },
  },
  { timestamps: true }
);

BillSchema.index({ billNumber: 1 }, { unique: true });
BillSchema.index({ status: 1 });
BillSchema.index({ createdAt: -1 });

BillSchema.pre('save', async function () {
  const subtotal = this.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * this.taxRate) / 100;
  const total = subtotal + taxAmount - this.discount;

  this.subtotal = Math.round(subtotal * 100) / 100;
  this.taxAmount = Math.round(taxAmount * 100) / 100;
  this.total = Math.round(total * 100) / 100;

  this.lineItems.forEach((item) => {
    item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
  });
});

BillSchema.statics.generateBillNumber = async function (): Promise<string> {
  const now = new Date();
  const yyyymm =
    now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');

  const prefix = `INV-${yyyymm}-`;

  const last = await this.findOne(
    { billNumber: { $regex: `^${prefix}` } },
    { billNumber: 1 },
    { sort: { billNumber: -1 } }
  ).lean();

  let seq = 1;
  if (last) {
    const parts = (last as { billNumber: string }).billNumber.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

const BillModel =
  (mongoose.models.Bill as BillModel) ||
  mongoose.model<BillDocument, BillModel>('Bill', BillSchema);

export default BillModel;
