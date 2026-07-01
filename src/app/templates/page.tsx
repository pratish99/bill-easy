'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BillTemplateSchema } from '@/lib/schemas';
import type { Bill, BillTemplate } from '@/types';

type TemplateRecord = BillTemplate & { _id: string };

const EMPTY_PARTY: Bill['from'] = { name: '', address: '', phone: '', email: '', gstin: '' };

const inputClass =
  'w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

type CreateForm = {
  name: string;
  from: Bill['from'];
  taxRate: number;
  currency: string;
};

const EMPTY_CREATE_FORM: CreateForm = {
  name: '',
  from: { ...EMPTY_PARTY },
  taxRate: 0,
  currency: 'INR',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load templates.');
      setTemplates(data as TemplateRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchTemplates();
    })();
  }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete template.');
      setTemplates((prev) => prev.filter((template) => template._id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete template.');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateModal = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const updateCreateField = (field: 'name' | 'currency' | 'taxRate', value: string | number) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCreateFromField = (field: keyof Bill['from'], value: string) => {
    setCreateForm((prev) => ({ ...prev, from: { ...prev.from, [field]: value } }));
  };

  const handleCreateTemplate = async () => {
    const parsed = BillTemplateSchema.safeParse(createForm);
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? 'Please complete all required fields.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create template.');
      setTemplates((prev) => [data, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create template.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Create Template
        </button>
      </div>

      {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-20">
          <span
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="Loading templates"
          />
          <p className="text-sm text-gray-500">Loading templates...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-20">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchTemplates}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <p className="text-base font-medium text-gray-700">No templates yet</p>
          <p className="text-sm text-gray-400">Create a template to speed up billing for repeat customers.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template._id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-base font-semibold text-gray-900">{template.name}</p>
                <p className="text-sm text-gray-500">{template.from.name || '—'}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{template.taxRate}% tax</span>
                <span>{template.currency}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <Link
                  href={`/bills/new?templateId=${template._id}`}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Use Template
                </Link>
                <button
                  type="button"
                  disabled={deletingId === template._id}
                  onClick={() => handleDelete(template._id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  {deletingId === template._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Template</h2>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Template Name</span>
                <input
                  value={createForm.name}
                  onChange={(e) => updateCreateField('name', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">From: Name</span>
                <input
                  value={createForm.from.name}
                  onChange={(e) => updateCreateFromField('name', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">From: Address</span>
                <textarea
                  value={createForm.from.address}
                  onChange={(e) => updateCreateFromField('address', e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">Phone</span>
                  <input
                    value={createForm.from.phone ?? ''}
                    onChange={(e) => updateCreateFromField('phone', e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">Email</span>
                  <input
                    value={createForm.from.email ?? ''}
                    onChange={(e) => updateCreateFromField('email', e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">GSTIN</span>
                <input
                  value={createForm.from.gstin ?? ''}
                  onChange={(e) => updateCreateFromField('gstin', e.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">Tax Rate (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={createForm.taxRate}
                    onChange={(e) => updateCreateField('taxRate', Number(e.target.value))}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-500">Currency</span>
                  <input
                    value={createForm.currency}
                    onChange={(e) => updateCreateField('currency', e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={isCreating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isCreating ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
