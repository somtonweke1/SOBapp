'use client';

import { useState } from 'react';

type PilotSubmissionRow = {
  id: string;
  referenceNumber: string;
  institutionName: string;
  submitterName: string;
  submitterEmail: string;
  propertyAddress: string;
  dealType: string;
  timeline: string;
  status: 'new' | 'delivered';
  createdAtLabel: string;
  engagementId: string;
};

type PilotEngagementRow = {
  id: string;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  pilotStatus: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  dealTarget: number;
  dealsSubmitted: number;
  dealsDelivered: number;
  feedbackCollected: boolean;
  notes: string;
};

export default function PilotDashboardClient({
  initialEngagements,
  initialSubmissions,
}: {
  initialEngagements: PilotEngagementRow[];
  initialSubmissions: PilotSubmissionRow[];
}) {
  const [engagements, setEngagements] = useState(initialEngagements);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);
  const [savingEngagementId, setSavingEngagementId] = useState<string | null>(null);

  const markDelivered = async (submissionId: string) => {
    setSavingSubmissionId(submissionId);
    try {
      const response = await fetch(`/api/pilot/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (!response.ok) throw new Error('Failed to mark delivered');

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === submissionId ? { ...submission, status: 'delivered' } : submission
        )
      );

      const submission = submissions.find((item) => item.id === submissionId);
      if (submission) {
        setEngagements((current) =>
          current.map((engagement) =>
            engagement.id === submission.engagementId
              ? { ...engagement, dealsDelivered: engagement.dealsDelivered + 1 }
              : engagement
          )
        );
      }
    } finally {
      setSavingSubmissionId(null);
    }
  };

  const saveFeedback = async (engagementId: string, notes: string) => {
    setSavingEngagementId(engagementId);
    try {
      const response = await fetch(`/api/pilot/engagements/${engagementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          feedbackCollected: Boolean(notes.trim()),
        }),
      });

      if (!response.ok) throw new Error('Failed to save feedback');

      setEngagements((current) =>
        current.map((engagement) =>
          engagement.id === engagementId
            ? { ...engagement, notes, feedbackCollected: Boolean(notes.trim()) }
            : engagement
        )
      );
    } finally {
      setSavingEngagementId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Institutional Ops</p>
          <h1 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Pilot Programs</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {engagements.map((engagement) => (
            <div key={engagement.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-zinc-900">{engagement.institutionName}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {engagement.contactName} · {engagement.contactEmail}
                  </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                  {engagement.pilotStatus}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Target</p>
                  <p className="mt-1 font-medium text-zinc-900">{engagement.dealTarget}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Submitted</p>
                  <p className="mt-1 font-medium text-zinc-900">{engagement.dealsSubmitted}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Delivered</p>
                  <p className="mt-1 font-medium text-zinc-900">{engagement.dealsDelivered}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs uppercase tracking-[0.14em] text-zinc-500">Feedback / Notes</label>
                <textarea
                  defaultValue={engagement.notes}
                  onBlur={(event) => saveFeedback(engagement.id, event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Feedback collected: {engagement.feedbackCollected ? 'Yes' : 'No'}
                  {savingEngagementId === engagement.id ? ' · Saving…' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pilot Submissions</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Submitter</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Deal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white text-sm text-zinc-700">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900">{submission.referenceNumber}</td>
                  <td className="px-4 py-3">{submission.institutionName}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{submission.submitterName}</div>
                    <a href={`mailto:${submission.submitterEmail}`} className="text-zinc-600 underline decoration-zinc-300 underline-offset-2">
                      {submission.submitterEmail}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{submission.propertyAddress}</div>
                    <div className="text-xs text-zinc-500">{submission.createdAtLabel}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{submission.dealType}</div>
                    <div className="text-xs text-zinc-500">{submission.timeline}</div>
                  </td>
                  <td className="px-4 py-3">{submission.status === 'delivered' ? 'Delivered' : 'New'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={submission.status === 'delivered' || savingSubmissionId === submission.id}
                      onClick={() => markDelivered(submission.id)}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 disabled:opacity-50"
                    >
                      {submission.status === 'delivered' ? 'Delivered' : savingSubmissionId === submission.id ? 'Saving…' : 'Mark as delivered'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
