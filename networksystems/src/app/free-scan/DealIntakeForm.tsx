'use client';

import { useState, useTransition } from 'react';
import { SERVICE_OFFERS, formatUsdFromCents } from '@/lib/service-intake';

type DealIntakeFormProps = {
  previewAgency: string;
  initialAssetAddress?: string;
  initialGoals?: string;
};

const primaryOffer = SERVICE_OFFERS.diagnostic_memo;

export default function DealIntakeForm({
  previewAgency,
  initialAssetAddress = '',
  initialGoals = '',
}: DealIntakeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    contactName: '',
    company: '',
    email: '',
    phone: '',
    assetAddress: initialAssetAddress,
    assetType: '',
    timeline: '',
    goals: initialGoals,
  });

  const onChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError(null);
    if (manualMessage) setManualMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setManualMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/service-intake/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offerId: primaryOffer.id,
            previewAgency,
            ...form,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Unable to start checkout.');
          return;
        }

        if (result.mode === 'stripe' && result.url) {
          window.location.href = result.url;
          return;
        }

        setManualMessage(
          `Intake ${result.intakeId} was captured. Stripe is not configured on this deployment, so follow up manually to collect payment and schedule the memo.`
        );
      } catch (submitError) {
        setError('Unable to submit intake right now.');
      }
    });
  };

  return (
    <section className="rounded-3xl border border-zinc-200/60 bg-white/95 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Paid Service Intake</p>
          <h2 className="mt-3 text-3xl font-extralight tracking-tight text-zinc-950">
            Purchase the 24-hour deal risk memo
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            This is the client-facing product: you submit the asset, timeline, and pressure points; StoneBridge
            returns a decision-grade memo with evidence, risk framing, and the next diligence move.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">Offer</p>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-light tracking-tight text-zinc-950">
                {formatUsdFromCents(primaryOffer.amountCents)}
              </div>
              <div className="pb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">one-time</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-700">{primaryOffer.summary}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              <li>Proceed / Caution / Escalate call tied to the asset</li>
              <li>Public-evidence links and risk drivers</li>
              <li>Questions for lender, seller, GC, or internal IC</li>
              <li>Delivered within {primaryOffer.turnaround} or handled manually</li>
            </ul>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-zinc-700">
              Contact Name
              <input
                required
                value={form.contactName}
                onChange={(event) => onChange('contactName', event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
                placeholder="Decision-maker"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              Company
              <input
                required
                value={form.company}
                onChange={(event) => onChange('company', event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
                placeholder="Sponsor / developer / operator"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-zinc-700">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => onChange('email', event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
                placeholder="you@company.com"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              Phone
              <input
                value={form.phone}
                onChange={(event) => onChange('phone', event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
            <label className="block text-sm text-zinc-700">
              Asset Address
              <input
                required
                value={form.assetAddress}
                onChange={(event) => onChange('assetAddress', event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
                placeholder="123 Example St, Baltimore, MD"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              Asset Type
              <input
                value={form.assetType}
                onChange={(event) => onChange('assetType', event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
                placeholder="Multifamily / mixed-use"
              />
            </label>
          </div>

          <label className="block text-sm text-zinc-700">
            Decision Timeline
            <input
              value={form.timeline}
              onChange={(event) => onChange('timeline', event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
              placeholder="LOI this week, close in 21 days, lender committee on Tuesday"
            />
          </label>

          <label className="block text-sm text-zinc-700">
            What do you need diagnosed?
            <textarea
              required
              rows={6}
              value={form.goals}
              onChange={(event) => onChange('goals', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-emerald-400"
              placeholder="Describe the asset, the decision, and what could kill the deal."
            />
          </label>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Preview context: the public scan above is currently anchored to <span className="font-medium text-zinc-900">{previewAgency}</span>.
            The paid memo is scoped to the asset and decision described in this intake, not just the preview agency.
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {manualMessage ? <p className="text-sm font-medium text-emerald-700">{manualMessage}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {isPending ? 'Preparing checkout...' : `Purchase ${formatUsdFromCents(primaryOffer.amountCents)} memo`}
          </button>
        </form>
      </div>
    </section>
  );
}
