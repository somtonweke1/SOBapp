'use client';

import { useState, useTransition } from 'react';
import { dealTypeOptions, turnaroundOptions } from '@/lib/portfolio-intake';

const MAX_PROPERTIES = 10;

export default function PortfolioIntakeForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [form, setForm] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    dealType: dealTypeOptions[0],
    turnaround: turnaroundOptions[1],
    notes: '',
    propertyAddresses: ['', ''],
  });

  const updateAddress = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.propertyAddresses];
      next[index] = value;
      return { ...current, propertyAddresses: next };
    });
    if (error) setError(null);
  };

  const addAddress = () => {
    setForm((current) =>
      current.propertyAddresses.length >= MAX_PROPERTIES
        ? current
        : { ...current, propertyAddresses: [...current.propertyAddresses, ''] }
    );
  };

  const removeAddress = (index: number) => {
    setForm((current) => {
      if (current.propertyAddresses.length === 1) {
        return { ...current, propertyAddresses: [''] };
      }

      return {
        ...current,
        propertyAddresses: current.propertyAddresses.filter((_, currentIndex) => currentIndex !== index),
      };
    });
    if (error) setError(null);
  };

  const updateField = (field: keyof Omit<typeof form, 'propertyAddresses'>, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError(null);
  };

  const resetForm = () => {
    setForm({
      institutionName: '',
      contactName: '',
      email: '',
      dealType: dealTypeOptions[0],
      turnaround: turnaroundOptions[1],
      notes: '',
      propertyAddresses: ['', ''],
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/portfolio-intake', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          setReferenceNumber(null);
          setError(result.error || 'Unable to submit institutional intake.');
          return;
        }

        setReferenceNumber(result.referenceNumber);
        resetForm();
      } catch {
        setReferenceNumber(null);
        setError('Unable to submit institutional intake.');
      }
    });
  };

  return (
    <div className="rounded-[2rem] border border-zinc-200/70 bg-white/95 p-8 shadow-xl shadow-zinc-900/5 md:p-10">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Institutional Intake</p>
        <h1 className="mt-3 text-4xl font-extralight tracking-tight text-zinc-950">
          Submit a Baltimore portfolio screening request
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          Use this intake for underwriting review, portfolio assessment, acquisition screening, or rehab pipeline
          triage across multiple Baltimore assets.
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
              placeholder="Portfolio manager or underwriter"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-zinc-700">
            Contact Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
              placeholder="name@institution.org"
            />
          </label>
          <label className="block text-sm text-zinc-700">
            Deal Type
            <select
              value={form.dealType}
              onChange={(event) => updateField('dealType', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
            >
              {dealTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Properties</p>
              <p className="mt-2 text-sm text-zinc-600">Add up to 10 Baltimore properties for screening.</p>
            </div>
            <button
              type="button"
              onClick={addAddress}
              disabled={form.propertyAddresses.length >= MAX_PROPERTIES}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50"
            >
              Add Property
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {form.propertyAddresses.map((address, index) => (
              <div key={`${index}-${form.propertyAddresses.length}`} className="flex items-start gap-3">
                <input
                  required={index === 0}
                  value={address}
                  onChange={(event) => updateAddress(index, event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
                  placeholder={`Property ${index + 1} address`}
                />
                <button
                  type="button"
                  onClick={() => removeAddress(index)}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-zinc-700">
            Requested Turnaround
            <select
              value={form.turnaround}
              onChange={(event) => updateField('turnaround', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
            >
              {turnaroundOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Use Case</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Best for lenders, CDFIs, agencies, and nonprofit acquisition teams reviewing multiple properties under one
              capital decision.
            </p>
          </div>
        </div>

        <label className="block text-sm text-zinc-700">
          Notes
          <textarea
            rows={6}
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-400"
            placeholder="Loan committee timing, underwriting context, grant decision date, or portfolio concerns."
          />
        </label>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        {referenceNumber ? (
          <p className="text-sm font-medium text-emerald-700">
            Request received. Reference number: {referenceNumber}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
        >
          {isPending ? 'Submitting intake...' : 'Submit Portfolio Screening Request'}
        </button>
      </form>
    </div>
  );
}
