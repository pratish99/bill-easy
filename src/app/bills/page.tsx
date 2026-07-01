'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Bill, BillStatus } from '@/types';

type BillRecord = Bill & { _id: string };

const STATUS_STYLES: Record<BillStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS: Array<{ value: BillStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatAmount(bill: BillRecord) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: bill.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(bill.total);
  } catch {
    return `${bill.currency ?? ''} ${bill.total.toFixed(2)}`.trim();
  }
}

function formatDate(dateStr: string) {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load bills.');
      setBills(data as BillRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bills.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchBills();
    })();
  }, [fetchBills]);

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bills.filter((bill) => {
      const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
      const matchesQuery =
        query === '' ||
        bill.billNumber.toLowerCase().includes(query) ||
        bill.to.name.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [bills, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bill? This cannot be undone.')) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete bill.');
      setBills((prev) => prev.filter((bill) => bill._id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete bill.');
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Bills</h1>
        <div className="flex gap-3">
          <Link
            href="/scan"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Scan Handwritten Bill
          </Link>
          <Link
            href="/bills/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            New Bill
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by bill number or customer"
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BillStatus | 'all')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-20">
          <span
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="Loading bills"
          />
          <p className="text-sm text-gray-500">Loading bills...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-20">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchBills}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <p className="text-base font-medium text-gray-700">No bills yet</p>
          <p className="text-sm text-gray-400">Create your first bill to get started.</p>
          <div className="mt-2 flex gap-3">
            <Link
              href="/bills/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              New Bill
            </Link>
            <Link
              href="/scan"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Scan Handwritten Bill
            </Link>
          </div>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No bills match your search.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Bill #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBills.map((bill) => (
                <tr key={bill._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{bill.billNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{bill.to.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{formatAmount(bill)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[bill.status]}`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(bill.issueDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 text-xs font-medium whitespace-nowrap">
                      <Link href={`/bills/${bill._id}`} className="text-indigo-600 hover:text-indigo-800">
                        View
                      </Link>
                      <Link href={`/bills/${bill._id}?edit=true`} className="text-indigo-600 hover:text-indigo-800">
                        Edit
                      </Link>
                      <a href={`/api/bills/${bill._id}/pdf`} className="text-indigo-600 hover:text-indigo-800">
                        Download PDF
                      </a>
                      <button
                        type="button"
                        disabled={deletingId === bill._id}
                        onClick={() => handleDelete(bill._id)}
                        className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        {deletingId === bill._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
