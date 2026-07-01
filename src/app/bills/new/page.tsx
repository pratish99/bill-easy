'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BillForm from '@/components/bill/BillForm';
import { useBillStore } from '@/store/useBillStore';
import type { BillFormValues } from '@/lib/schemas';

function NewBillPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const loadFromTemplate = useBillStore((state) => state.loadFromTemplate);
  const resetBill = useBillStore((state) => state.resetBill);

  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    resetBill();

    if (!templateId) return;

    let cancelled = false;
    (async () => {
      setIsLoadingTemplate(true);
      setTemplateError(null);
      try {
        const res = await fetch(`/api/templates/${templateId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load this template.');
        if (!cancelled) loadFromTemplate(data);
      } catch (err) {
        if (!cancelled) setTemplateError(err instanceof Error ? err.message : 'Failed to load this template.');
      } finally {
        if (!cancelled) setIsLoadingTemplate(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveBill = async (bill: BillFormValues) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save the bill.');
      resetBill();
      router.push(`/bills/${data._id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save the bill.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">New Bill</h1>

      {isLoadingTemplate ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-20">
          <span
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="Loading template"
          />
          <p className="text-sm text-gray-500">Loading template...</p>
        </div>
      ) : (
        <>
          {templateError && <p className="mb-4 text-sm text-red-600">{templateError}</p>}
          <BillForm onSubmit={handleSaveBill}>
            {saveError && <p className="mb-3 text-sm text-red-600">{saveError}</p>}
            <div className="flex justify-end gap-3">
              <Link
                href="/bills"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSaving ? 'Saving...' : 'Save Bill'}
              </button>
            </div>
          </BillForm>
        </>
      )}
    </div>
  );
}

export default function NewBillPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <span
              className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
              role="status"
              aria-label="Loading"
            />
          </div>
        </div>
      }
    >
      <NewBillPageInner />
    </Suspense>
  );
}
