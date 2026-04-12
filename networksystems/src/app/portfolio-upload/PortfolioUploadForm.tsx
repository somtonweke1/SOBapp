'use client';

import { useState, useTransition } from 'react';
import { portfolioDealContextOptions } from '@/lib/portfolio-upload';

export default function PortfolioUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    referenceNumber: string;
    addressCount: number;
    expectedDelivery: string;
  } | null>(null);
  const [form, setForm] = useState({
    institutionName: '',
    contactName: '',
    contactEmail: '',
    dealContext: portfolioDealContextOptions[0],
    file: null as File | null,
  });

  const updateField = (field: keyof typeof form, value: string | File | null) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError(null);
  };

  const reset = () => {
    setForm({
      institutionName: '',
      contactName: '',
      contactEmail: '',
      dealContext: portfolioDealContextOptions[0],
      file: null,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setConfirmation(null);

    if (!form.file) {
      setError('CSV file is required.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = new FormData();
        payload.set('institutionName', form.institutionName);
        payload.set('contactName', form.contactName);
        payload.set('contactEmail', form.contactEmail);
        payload.set('dealContext', form.dealContext);
        if (!form.file) {
          throw new Error('CSV file is required.');
        }
        payload.set('file', form.file);

        const response = await fetch('/api/portfolio-upload', {
          method: 'POST',
          body: payload,
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          setError(result.error || 'Unable to upload portfolio.');
          return;
        }

        setConfirmation({
          referenceNumber: result.referenceNumber,
          addressCount: result.addressCount,
          expectedDelivery: result.expectedDelivery,
        });
        reset();
      } catch {
        setError('Unable to upload portfolio.');
      }
    });
  };

  return (
    <div className="rounded-[2rem] border border-zinc-200/70 bg-white/95 p-8 shadow-xl shadow-zinc-900/5 md:p-10">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Enterprise Workflow</p>
        <h1 className="mt-3 text-4xl font-extralight tracking-tight text-zinc-950">Portfolio Risk Screening</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          Upload a list of Baltimore properties. Receive a consolidated risk report within 24 hours.
        </p>
      </div>

      <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-zinc-700">
            Institution Name
            <input
              required
              value={form.institutionName}
              onChange={(event) => updateField('institutionName', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
              placeholder="Harbor Bank of Maryland"
            />
          </label>
          <label className="block text-sm text-zinc-700">
            Contact Name
            <input
              required
              value={form.contactName}
              onChange={(event) => updateField('contactName', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
              placeholder="Portfolio manager or analyst"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-zinc-700">
            Contact Email
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(event) => updateField('contactEmail', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
              placeholder="name@institution.org"
            />
          </label>
          <label className="block text-sm text-zinc-700">
            Deal Context
            <select
              value={form.dealContext}
              onChange={(event) => updateField('dealContext', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
            >
              {portfolioDealContextOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm text-zinc-700">
          CSV Upload
          <input
            required
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => updateField('file', event.target.files?.[0] || null)}
            className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900"
          />
          <p className="mt-2 text-xs leading-5 text-zinc-500">One address per row. Maximum 200 addresses per upload.</p>
        </label>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        {confirmation ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-zinc-700">
            <p className="font-medium text-emerald-700">Portfolio upload received.</p>
            <p className="mt-2">Reference number: {confirmation.referenceNumber}</p>
            <p>Address count confirmed: {confirmation.addressCount}</p>
            <p>Expected delivery: {confirmation.expectedDelivery}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
        >
          {isPending ? 'Uploading portfolio...' : 'Upload Portfolio'}
        </button>
      </form>
    </div>
  );
}
