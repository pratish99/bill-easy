'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ImageUploader from '@/components/scan/ImageUploader';
import ScanReview from '@/components/scan/ScanReview';
import { useBillStore } from '@/store/useBillStore';
import type { Bill, ScanResult } from '@/types';
import type { BillFormValues } from '@/lib/schemas';

type Step = 'upload' | 'processing' | 'review';

const DEFAULT_BILL: Partial<Bill> = {
  status: 'draft',
  currency: 'INR',
  discount: 0,
  taxRate: 0,
  lineItems: [],
};

export default function ScanPage() {
  const router = useRouter();
  const loadFromScan = useBillStore((state) => state.loadFromScan);
  const resetBill = useBillStore((state) => state.resetBill);

  const [step, setStep] = useState<Step>('upload');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (file: File) => {
      setScanError(null);
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setStep('processing');

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/scan', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(data.error || 'Could not read that image. Try a clearer photo.');
        }

        const result = data as ScanResult;
        const normalizedLineItems = (result.extractedBill.lineItems ?? []).map((item) => ({
          ...item,
          id: item.id || uuidv4(),
          total: item.total ?? item.quantity * item.unitPrice,
        }));

        loadFromScan({
          ...result,
          extractedBill: {
            ...DEFAULT_BILL,
            ...result.extractedBill,
            lineItems: normalizedLineItems,
          },
        });

        setScanResult(result);
        setStep('review');
      } catch (err) {
        setScanError(err instanceof Error ? err.message : 'Something went wrong while scanning.');
        setStep('upload');
      }
    },
    [loadFromScan]
  );

  const handleStartOver = useCallback(() => {
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    resetBill();
    setScanResult(null);
    setScanError(null);
    setSaveError(null);
    setStep('upload');
  }, [resetBill]);

  const handleSaveBill = useCallback(
    async (bill: BillFormValues) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const res = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save the bill.');
        }
        resetBill();
        router.push(`/bills/${data._id}`);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save the bill.');
      } finally {
        setIsSaving(false);
      }
    },
    [resetBill, router]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Scan a handwritten bill</h1>
        <p className="mt-1 text-sm text-gray-500">
          Snap a photo or upload an image — we&apos;ll read it and let you double-check everything before saving.
        </p>
      </div>

      {step === 'upload' && <ImageUploader onScan={handleScan} error={scanError} />}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white py-24 shadow-sm">
          <span
            className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="Scanning"
          />
          <p className="text-base font-medium text-gray-700">Reading your handwritten bill...</p>
          <p className="text-sm text-gray-400">This usually takes a few seconds.</p>
        </div>
      )}

      {step === 'review' && scanResult && imagePreviewUrl && (
        <ScanReview
          scanResult={scanResult}
          imagePreviewUrl={imagePreviewUrl}
          onSave={handleSaveBill}
          onStartOver={handleStartOver}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}
    </div>
  );
}
