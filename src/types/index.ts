export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // computed: quantity * unitPrice
};

export type BillStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export type Bill = {
  _id?: string;
  billNumber: string;
  issueDate: string; // ISO date string
  dueDate: string;
  status: BillStatus;
  from: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  to: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  lineItems: LineItem[];
  notes?: string;
  subtotal: number;
  taxRate: number; // percentage e.g. 18 for 18%
  taxAmount: number;
  discount: number; // flat amount
  total: number;
  currency: string; // default: 'INR'
  templateId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BillTemplate = {
  _id?: string;
  name: string;
  from: Bill['from'];
  taxRate: number;
  currency: string;
  notes?: string;
  createdAt?: string;
};

export type ScanResult = {
  success: boolean;
  confidence: number; // 0-1 from Claude
  extractedBill: Partial<Bill>;
  rawText: string; // raw OCR output from Claude
  warnings: string[]; // any fields Claude was unsure about
};
