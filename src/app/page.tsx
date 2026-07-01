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

function formatCurrency(amount: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(dateStr: string) {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function QuickActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
    >
      <span className="text-base font-semibold text-gray-900">{title}</span>
      <span className="text-sm text-gray-500">{description}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let billsThisMonth = 0;
    let outstandingAmount = 0;
    let paidAmount = 0;
    let draftCount = 0;

    for (const bill of bills) {
      const issueDate = new Date(bill.issueDate);
      if (!Number.isNaN(issueDate.getTime()) && issueDate.getMonth() === month && issueDate.getFullYear() === year) {
        billsThisMonth += 1;
      }
      if (bill.status === 'sent') outstandingAmount += bill.total;
      if (bill.status === 'paid') paidAmount += bill.total;
      if (bill.status === 'draft') draftCount += 1;
    }

    return { billsThisMonth, outstandingAmount, paidAmount, draftCount };
  }, [bills]);

  const recentBills = useMemo(() => {
    return [...bills]
      .sort((a, b) => new Date(b.createdAt ?? b.issueDate).getTime() - new Date(a.createdAt ?? a.issueDate).getTime())
      .slice(0, 5);
  }, [bills]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your billing activity</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16">
          <span
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="Loading dashboard"
          />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchBills}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Bills this month" value={stats.billsThisMonth} />
            <StatCard label="Outstanding" value={formatCurrency(stats.outstandingAmount)} />
            <StatCard label="Paid" value={formatCurrency(stats.paidAmount)} />
            <StatCard label="Drafts" value={stats.draftCount} />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
              <Link href="/bills" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View all
              </Link>
            </div>

            {recentBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                <p className="text-sm text-gray-500">No bills yet.</p>
                <Link
                  href="/bills/new"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Create your first bill
                </Link>
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
                    {recentBills.map((bill) => (
                      <tr key={bill._id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{bill.billNumber}</td>
                        <td className="px-4 py-3 text-gray-700">{bill.to.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{formatCurrency(bill.total, bill.currency)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[bill.status]}`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(bill.issueDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/bills/${bill._id}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickActionCard title="New Bill" description="Create a bill from scratch" href="/bills/new" />
          <QuickActionCard
            title="Scan Handwritten Bill"
            description="Turn a photo into a bill in seconds"
            href="/scan"
          />
          <QuickActionCard title="Manage Templates" description="Reuse saved billing details" href="/templates" />
        </div>
      </section>
    </div>
  );
}
