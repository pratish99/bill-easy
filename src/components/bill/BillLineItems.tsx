'use client';

import type { FieldErrors } from 'react-hook-form';
import { useBillStore } from '@/store/useBillStore';
import type { BillFormValues } from '@/lib/schemas';

const inputClass =
  'w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

interface BillLineItemsProps {
  errors?: FieldErrors<BillFormValues>['lineItems'];
}

export default function BillLineItems({ errors }: BillLineItemsProps) {
  const lineItems = useBillStore((state) => state.currentBill?.lineItems ?? []);
  const updateLineItem = useBillStore((state) => state.updateLineItem);
  const addLineItem = useBillStore((state) => state.addLineItem);
  const removeLineItem = useBillStore((state) => state.removeLineItem);

  const arrayError = errors && 'message' in errors ? errors.message : undefined;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit Price</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item, index) => {
              const rowError = errors?.[index];
              return (
                <tr key={item.id} className="align-top">
                  <td className="px-3 py-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className={inputClass}
                    />
                    {rowError?.description?.message && (
                      <p className="mt-1 text-xs text-red-600">{rowError.description.message}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      className={`${inputClass} w-20`}
                    />
                    {rowError?.quantity?.message && (
                      <p className="mt-1 text-xs text-red-600">{rowError.quantity.message}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                      className={`${inputClass} w-28`}
                    />
                    {rowError?.unitPrice?.message && (
                      <p className="mt-1 text-xs text-red-600">{rowError.unitPrice.message}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 pt-4 font-medium text-gray-700">{item.total.toFixed(2)}</td>
                  <td className="px-3 py-2 pt-4 text-right">
                    <button
                      type="button"
                      disabled={lineItems.length <= 1}
                      onClick={() => removeLineItem(item.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {arrayError && <p className="mt-1 text-xs text-red-600">{arrayError}</p>}
      <button
        type="button"
        onClick={addLineItem}
        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        + Add Line Item
      </button>
    </div>
  );
}
