'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { useBillStore } from '@/store/useBillStore';
import { BillSchema, BillTemplateSchema, type BillFormValues } from '@/lib/schemas';
import type { Bill, BillTemplate } from '@/types';
import BillLineItems from './BillLineItems';

const BillFormSchema = BillSchema.superRefine((data, ctx) => {
  const issueParsed = Date.parse(data.issueDate);
  const dueParsed = Date.parse(data.dueDate);

  if (Number.isNaN(issueParsed)) {
    ctx.addIssue({ code: 'custom', path: ['issueDate'], message: 'Enter a valid issue date' });
  }
  if (Number.isNaN(dueParsed)) {
    ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Enter a valid due date' });
  } else if (!Number.isNaN(issueParsed) && dueParsed < issueParsed) {
    ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date must be on or after the issue date' });
  }
});

const EMPTY_PARTY: Bill['from'] = { name: '', address: '', phone: '', email: '', gstin: '' };

const inputClass =
  'w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function generateDraftBillNumber() {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${yyyymm}-${suffix}`;
}

function createDefaultBill(): Partial<Bill> {
  const today = new Date();
  const due = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    billNumber: generateDraftBillNumber(),
    issueDate: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    status: 'draft',
    currency: 'INR',
    from: { ...EMPTY_PARTY },
    to: { ...EMPTY_PARTY },
    lineItems: [{ id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 }],
    notes: '',
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
  };
}

function Field({
  label,
  error,
  inline,
  children,
}: {
  label: string;
  error?: string;
  inline?: boolean;
  children: ReactNode;
}) {
  if (inline) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">{label}</span>
          {children}
        </div>
        {error && <p className="mt-1 text-right text-xs text-red-600">{error}</p>}
      </div>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function PartySection({
  title,
  party,
  onChange,
  errors,
}: {
  title: string;
  party: Bill['from'];
  onChange: (field: keyof Bill['from'], value: string) => void;
  errors?: FieldErrors<BillFormValues>['from'];
}) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <Field label="Name" error={errors?.name?.message}>
        <input value={party.name} onChange={(e) => onChange('name', e.target.value)} className={inputClass} />
      </Field>
      <Field label="Address" error={errors?.address?.message}>
        <textarea
          value={party.address}
          onChange={(e) => onChange('address', e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input value={party.phone ?? ''} onChange={(e) => onChange('phone', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email" error={errors?.email?.message}>
          <input value={party.email ?? ''} onChange={(e) => onChange('email', e.target.value)} className={inputClass} />
        </Field>
      </div>
      <Field label="GSTIN">
        <input value={party.gstin ?? ''} onChange={(e) => onChange('gstin', e.target.value)} className={inputClass} />
      </Field>
    </div>
  );
}

interface BillFormProps {
  onSubmit?: (bill: BillFormValues) => void | Promise<void>;
  children?: ReactNode;
}

export default function BillForm({ onSubmit, children }: BillFormProps) {
  const currentBill = useBillStore((state) => state.currentBill);
  const setBill = useBillStore((state) => state.setBill);
  const updateField = useBillStore((state) => state.updateField);
  const recomputeTotals = useBillStore((state) => state.recomputeTotals);
  const loadFromTemplate = useBillStore((state) => state.loadFromTemplate);

  const [defaultBill] = useState(() => createDefaultBill());

  useEffect(() => {
    if (!currentBill) setBill(defaultBill);
  }, [currentBill, setBill, defaultBill]);

  const bill = currentBill ?? defaultBill;

  const {
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(BillFormSchema),
    values: bill as BillFormValues,
    mode: 'onChange',
  });

  const [templates, setTemplates] = useState<BillTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (!cancelled && res.ok) setTemplates(data);
      } catch {
        // template list is a convenience — ignore fetch failures
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t._id === templateId);
    if (template) loadFromTemplate(template);
  };

  const handleSaveTemplate = async () => {
    const parsed = BillTemplateSchema.safeParse({
      name: templateName,
      from: bill.from ?? EMPTY_PARTY,
      taxRate: bill.taxRate ?? 0,
      currency: bill.currency ?? 'INR',
      notes: bill.notes,
    });
    if (!parsed.success) {
      setTemplateError(parsed.error.issues[0]?.message ?? 'Could not save this template.');
      return;
    }

    setTemplateSaving(true);
    setTemplateError(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template.');
      setTemplates((prev) => [data, ...prev]);
      setShowSaveTemplate(false);
      setTemplateName('');
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : 'Failed to save template.');
    } finally {
      setTemplateSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit?.(data))}
      className="space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <label htmlFor="template-select" className="text-sm font-medium text-gray-600">
            Load from template
          </label>
          <select
            id="template-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleLoadTemplate(e.target.value);
              e.target.value = '';
            }}
            className={`${inputClass} w-56`}
          >
            <option value="">{templatesLoading ? 'Loading templates...' : '— Select a template —'}</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {showSaveTemplate ? (
            <>
              <input
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className={`${inputClass} w-48`}
              />
              <button
                type="button"
                disabled={templateSaving}
                onClick={handleSaveTemplate}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {templateSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateError(null);
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowSaveTemplate(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Save as template
            </button>
          )}
        </div>
      </div>
      {templateError && <p className="text-xs text-red-600">{templateError}</p>}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Bill Info</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Bill Number" error={errors.billNumber?.message}>
            <input
              value={bill.billNumber ?? ''}
              onChange={(e) => updateField('billNumber', e.target.value)}
              placeholder="Auto-generated"
              className={inputClass}
            />
          </Field>
          <Field label="Status" error={errors.status?.message}>
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
          <Field label="Issue Date" error={errors.issueDate?.message}>
            <input
              type="date"
              value={bill.issueDate ?? ''}
              onChange={(e) => updateField('issueDate', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Due Date" error={errors.dueDate?.message}>
            <input
              type="date"
              value={bill.dueDate ?? ''}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Currency" error={errors.currency?.message}>
            <input
              value={bill.currency ?? ''}
              onChange={(e) => updateField('currency', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <PartySection
          title="From"
          party={bill.from ?? EMPTY_PARTY}
          onChange={(field, value) => updateParty('from', field, value)}
          errors={errors.from}
        />
        <PartySection
          title="To"
          party={bill.to ?? EMPTY_PARTY}
          onChange={(field, value) => updateParty('to', field, value)}
          errors={errors.to}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Line Items</h2>
        <BillLineItems errors={errors.lineItems} />
      </section>

      <section className="flex justify-end">
        <div className="w-full max-w-sm space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-800">{(bill.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <Field label="Tax Rate (%)" error={errors.taxRate?.message} inline>
            <input
              type="number"
              min={0}
              max={100}
              value={bill.taxRate ?? 0}
              onChange={(e) => handleTaxRateChange(Number(e.target.value))}
              className={`${inputClass} w-24 text-right`}
            />
          </Field>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Tax Amount</span>
            <span className="font-medium text-gray-800">{(bill.taxAmount ?? 0).toFixed(2)}</span>
          </div>
          <Field label="Discount" error={errors.discount?.message} inline>
            <input
              type="number"
              min={0}
              value={bill.discount ?? 0}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
              className={`${inputClass} w-24 text-right`}
            />
          </Field>
          <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
            <span>TOTAL</span>
            <span>
              {(bill.total ?? 0).toFixed(2)} {bill.currency ?? 'INR'}
            </span>
          </div>
        </div>
      </section>

      <Field label="Notes" error={errors.notes?.message}>
        <textarea
          value={bill.notes ?? ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>

      {children}
    </form>
  );
}
