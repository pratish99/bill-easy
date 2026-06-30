import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be 0 or greater'),
  total: z.number().min(0),
});

const PartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstin: z.string().optional(),
});

export const BillSchema = z.object({
  billNumber: z.string().min(1, 'Bill number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled']),
  from: PartySchema,
  to: PartySchema,
  lineItems: z.array(LineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().min(1).default('INR'),
  templateId: z.string().optional(),
});

export const BillTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  from: PartySchema,
  taxRate: z.number().min(0).max(100),
  currency: z.string().min(1).default('INR'),
  notes: z.string().optional(),
});

export type LineItemFormValues = z.infer<typeof LineItemSchema>;
export type BillFormValues = z.infer<typeof BillSchema>;
export type BillTemplateFormValues = z.infer<typeof BillTemplateSchema>;
