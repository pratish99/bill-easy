import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Bill, BillTemplate, LineItem, ScanResult } from '@/types';

const emptyLineItem = (): LineItem => ({
  id: uuidv4(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
});

type BillStore = {
  currentBill: Partial<Bill> | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  setBill: (bill: Partial<Bill>) => void;
  updateField: <K extends keyof Bill>(field: K, value: Bill[K]) => void;
  addLineItem: () => void;
  updateLineItem: <K extends keyof LineItem>(id: string, field: K, value: LineItem[K]) => void;
  removeLineItem: (id: string) => void;
  recomputeTotals: () => void;
  resetBill: () => void;
  loadFromTemplate: (template: BillTemplate) => void;
  loadFromScan: (scanResult: ScanResult) => void;
};

export const useBillStore = create<BillStore>((set, get) => ({
  currentBill: null,
  isDirty: false,
  isLoading: false,
  error: null,

  setBill: (bill) => set({ currentBill: bill, isDirty: false, error: null }),

  updateField: (field, value) =>
    set((state) => ({
      currentBill: { ...state.currentBill, [field]: value },
      isDirty: true,
    })),

  addLineItem: () => {
    set((state) => ({
      currentBill: {
        ...state.currentBill,
        lineItems: [...(state.currentBill?.lineItems ?? []), emptyLineItem()],
      },
      isDirty: true,
    }));
    get().recomputeTotals();
  },

  updateLineItem: (id, field, value) => {
    set((state) => ({
      currentBill: {
        ...state.currentBill,
        lineItems: (state.currentBill?.lineItems ?? []).map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }),
      },
      isDirty: true,
    }));
    get().recomputeTotals();
  },

  removeLineItem: (id) => {
    set((state) => ({
      currentBill: {
        ...state.currentBill,
        lineItems: (state.currentBill?.lineItems ?? []).filter((item) => item.id !== id),
      },
      isDirty: true,
    }));
    get().recomputeTotals();
  },

  recomputeTotals: () =>
    set((state) => {
      const lineItems = state.currentBill?.lineItems ?? [];
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const taxRate = state.currentBill?.taxRate ?? 0;
      const discount = state.currentBill?.discount ?? 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount - discount;
      return {
        currentBill: { ...state.currentBill, subtotal, taxAmount, total },
      };
    }),

  resetBill: () => set({ currentBill: null, isDirty: false, isLoading: false, error: null }),

  loadFromTemplate: (template) => {
    set((state) => ({
      currentBill: {
        ...state.currentBill,
        from: template.from,
        taxRate: template.taxRate,
        currency: template.currency,
        notes: template.notes,
        templateId: template._id,
      },
      isDirty: true,
    }));
    get().recomputeTotals();
  },

  loadFromScan: (scanResult) => {
    set((state) => ({
      currentBill: { ...state.currentBill, ...scanResult.extractedBill },
      isDirty: true,
    }));
    get().recomputeTotals();
  },
}));
