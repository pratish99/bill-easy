'use client';

import { useState, type ReactNode } from 'react';
import { useBillStore } from '@/store/useBillStore';
import { BillSchema, type BillFormValues } from '@/lib/schemas';
import type { Bill, ScanResult } from '@/types';

interface ScanReviewProps {
  scanResult: ScanResult;
  imagePreviewUrl: string;
  onSave: (bill: BillFormValues) => void | Promise<void>;
  onStartOver: () => void;
  isSaving: boolean;
  saveError: string | null;
}

const EMPTY_PARTY: Bill['from'] = { name: '', address: '', phone: '', email: '', gstin: '' };

const inputClass =
  'w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function PartyFields({
  title,
  party,
  onChange,
}: {
  title: string;
  party: Bill['from'];
  onChange: (field: keyof Bill['from'], value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-semibold uppercase text-gray-400">{title}</p>
      <Field label="Name">
        <input value={party.name} onChange={(e) => onChange('name', e.target.value)} className={inputClass} />
      </Field>
      <Field label="Address">
        <textarea
          value={party.address}
          onChange={(e) => onChange('address', e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>
      <Field label="Phone">
        <input value={party.phone ?? ''} onChange={(e) => onChange('phone', e.target.value)} className={inputClass} />
      </Field>
      <Field label="Email">
        <input value={party.email ?? ''} onChange={(e) => onChange('email', e.target.value)} className={inputClass} />
      </Field>
      <Field label="GSTIN">
        <input value={party.gstin ?? ''} onChange={(e) => onChange('gstin', e.target.value)} className={inputClass} />
      </Field>
    </div>
  );
}

export default function ScanReview({
  scanResult,
  imagePreviewUrl,
  onSave,
  onStartOver,
  isSaving,
  saveError,
}: ScanReviewProps) {
  const currentBill = useBillStore((state) => state.currentBill);
  const updateField = useBillStore((state) => state.updateField);
  const updateLineItem = useBillStore((state) => state.updateLineItem);
  const addLineItem = useBillStore((state) => state.addLineItem);
  const removeLineItem = useBillStore((state) => state.removeLineItem);
  const recomputeTotals = useBillStore((state) => state.recomputeTotals);

  const [formError, setFormError] = useState<string | null>(null);

  const bill = currentBill ?? {};
  const from = bill.from ?? EMPTY_PARTY;
  const to = bill.to ?? EMPTY_PARTY;
  const lineItems = bill.lineItems ?? [];

  const confidencePct = Math.round(scanResult.confidence * 100);
  const confidenceColor =
    confidencePct >= 80 ? 'bg-green-500' : confidencePct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const confidenceLabel =
    confidencePct >= 80 ? 'text-green-700' : confidencePct >= 50 ? 'text-amber-700' : 'text-red-700';

  const updateParty = (side: 'from' | 'to', field: keyof Bill['from'], value: string) => {
    updateField(side, { ...(bill[side] ?? EMPTY_PARTY), [field]: value } as Bill['from']);
  };

  const handleTaxRateChange = (value: number) => {
    updateField('taxRate', value);
    recomputeTotals();
  };

  const handleDiscountChange = (value: number) => {
    updateField('discount', value);
    recomputeTotals();
  };

  const handleSubmit = async () => {
    const parsed = BillSchema.safeParse(bill);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please complete all required fields.');
      return;
    }
    setFormError(null);
    await onSave(parsed.data);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-2 text-sm font-medium text-gray-500">Original image</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePreviewUrl}
          alt="Uploaded bill"
          className="w-full rounded-xl border border-gray-200 object-contain shadow-sm"
        />
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Scan confidence</span>
            <span className={`text-sm font-semibold ${confidenceLabel}`}>{confidencePct}% confidence</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-2 rounded-full ${confidenceColor}`} style={{ width: `${confidencePct}%` }} />
          </div>

          {scanResult.warnings.length > 0 && (
            <ul className="mt-4 space-y-1.5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {scanResult.warnings.map((warning, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden>⚠️</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Review the details below and correct anything that looks off before saving.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Bill number">
            <input
              value={bill.billNumber ?? ''}
              onChange={(e) => updateField('billNumber', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Status">
            <select
              value={bill.status ?? 'draft'}
              onChange={(e) => updateField('status', e.target.value as Bill['status'])}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Issue date">
            <input
              type="date"
              value={bill.issueDate ?? ''}
              onChange={(e) => updateField('issueDate', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={bill.dueDate ?? ''}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PartyFields title="From" party={from} onChange={(field, value) => updateParty('from', field, value)} />
          <PartyFields title="Bill to" party={to} onChange={(field, value) => updateParty('to', field, value)} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Line items</p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit price</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                        className={`${inputClass} w-20`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                        className={`${inputClass} w-24`}
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-600">{item.total.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={lineItems.length <= 1}
                        onClick={() => removeLineItem(item.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addLineItem}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add line item
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
          <Field label="Tax rate (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={bill.taxRate ?? 0}
              onChange={(e) => handleTaxRateChange(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Discount">
            <input
              type="number"
              min={0}
              value={bill.discount ?? 0}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <div className="col-span-2 flex justify-between border-t border-gray-200 pt-3">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-800">{(bill.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium text-gray-800">{(bill.taxAmount ?? 0).toFixed(2)}</span>
          </div>
          <div className="col-span-2 flex justify-between text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>
              {(bill.total ?? 0).toFixed(2)} {bill.currency ?? 'INR'}
            </span>
          </div>
        </div>

        <Field label="Notes">
          <textarea
            value={bill.notes ?? ''}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>

        {(formError || saveError) && <p className="text-sm text-red-600">{formError || saveError}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onStartOver}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Start Over
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSaving ? 'Saving...' : 'Save Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}
