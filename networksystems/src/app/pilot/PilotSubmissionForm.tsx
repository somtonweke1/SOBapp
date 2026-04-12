'use client';

import { useState } from 'react';
import { pilotDealTypes, pilotTimelines } from '@/lib/pilot';

type PilotSubmissionFormProps = {
  token: string;
  initialInstitutionName: string;
};

export default function PilotSubmissionForm({
  token,
  initialInstitutionName,
}: PilotSubmissionFormProps) {
  const [institutionName, setInstitutionName] = useState(initialInstitutionName);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [dealType, setDealType] = useState<(typeof pilotDealTypes)[number]>('Acquisition');
  const [timeline, setTimeline] = useState<(typeof pilotTimelines)[number]>('Under contract');
  const [determinationGoal, setDeterminationGoal] = useState('');
  const [outputUse, setOutputUse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ referenceNumber: string; expectedDelivery: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/pilot/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          institution_name: institutionName,
          submitter_name: submitterName,
          submitter_email: submitterEmail,
          property_address: propertyAddress,
          deal_type: dealType,
          timeline,
          determination_goal: determinationGoal,
          output_use: outputUse,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to submit pilot deal');
      }

      setSuccess({
        referenceNumber: payload.referenceNumber,
        expectedDelivery: payload.expectedDelivery,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to submit pilot deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="rounded-[2rem] border border-zinc-200/70 bg-white/95 p-10 shadow-xl shadow-zinc-900/5">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Pilot Submission Received</p>
        <h1 className="mt-3 text-4xl font-extralight tracking-tight text-zinc-950">Your property is in the queue.</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          StoneBridge captured the submission and routed it into the pilot workflow.
        </p>
        <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Reference Number</p>
          <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{success.referenceNumber}</p>
          <p className="mt-4 text-sm text-zinc-600">Expected delivery: {success.expectedDelivery}</p>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-zinc-200/70 bg-white/95 p-10 shadow-xl shadow-zinc-900/5"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-700">Institution name</label>
          <input
            value={institutionName}
            onChange={(event) => setInstitutionName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Submitter name</label>
          <input
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Submitter email</label>
          <input
            type="email"
            value={submitterEmail}
            onChange={(event) => setSubmitterEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Deal type</label>
          <select
            value={dealType}
            onChange={(event) => setDealType(event.target.value as (typeof pilotDealTypes)[number])}
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          >
            {pilotDealTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-zinc-700">Property address</label>
        <input
          value={propertyAddress}
          onChange={(event) => setPropertyAddress(event.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          placeholder="25 W Fayette St, Baltimore, MD 21201"
          required
        />
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-zinc-700">Timeline</label>
        <select
          value={timeline}
          onChange={(event) => setTimeline(event.target.value as (typeof pilotTimelines)[number])}
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        >
          {pilotTimelines.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-zinc-700">What are you trying to determine?</label>
        <textarea
          value={determinationGoal}
          onChange={(event) => setDeterminationGoal(event.target.value)}
          className="mt-2 min-h-[120px] w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          required
        />
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-zinc-700">How would you use this output?</label>
        <textarea
          value={outputUse}
          onChange={(event) => setOutputUse(event.target.value)}
          className="mt-2 min-h-[120px] w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          required
        />
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 inline-flex items-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Pilot Deal'}
      </button>
    </form>
  );
}
