'use client';

import { Fragment, useMemo, useState } from 'react';

type PortfolioStatus = 'new' | 'in_review' | 'delivered';

type PortfolioIntakeRow = {
  id: string;
  referenceNumber: string;
  institutionName: string;
  contactName: string;
  email: string;
  propertyAddresses: string[];
  turnaround: string;
  notes: string;
  status: PortfolioStatus;
  confirmationEmailStatus: 'sent' | 'not_configured';
  timestampLabel: string;
  fullTimestampLabel: string;
};

const statusOptions: Array<{ value: PortfolioStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'delivered', label: 'Delivered' },
];

function statusPillClasses(status: PortfolioStatus) {
  switch (status) {
    case 'delivered':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'in_review':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-700';
  }
}

export default function PortfolioIntakesTable({ initialRows }: { initialRows: PortfolioIntakeRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const emptyState = useMemo(() => rows.length === 0, [rows.length]);

  const updateStatus = async (id: string, nextStatus: PortfolioStatus) => {
    const previousRows = rows;

    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, status: nextStatus } : row))
    );
    setSavingId(id);

    try {
      const response = await fetch(`/api/portfolio-intake/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist status');
      }
    } catch (error) {
      setRows(previousRows);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Institutional Ops</p>
          <h2 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Portfolio Intakes</h2>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Requests</p>
          <p className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">{rows.length}</p>
        </div>
      </div>

      {emptyState ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
          No portfolio intake submissions yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Addresses</th>
                <th className="px-4 py-3 font-medium">Turnaround</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((row) => {
                const isExpanded = expandedRowId === row.id;
                const isSaving = savingId === row.id;

                return (
                  <Fragment key={row.id}>
                    <tr
                      className="cursor-pointer transition-colors hover:bg-zinc-50/60"
                      onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-zinc-900">{row.referenceNumber}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.institutionName}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="font-medium text-zinc-900">{row.contactName}</div>
                        <a
                          href={`mailto:${row.email}`}
                          className="text-zinc-600 underline decoration-zinc-300 underline-offset-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.propertyAddresses.length}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.turnaround}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.timestampLabel}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusPillClasses(row.status)}`}
                          >
                            {statusOptions.find((option) => option.value === row.status)?.label}
                          </span>
                          <select
                            value={row.status}
                            disabled={isSaving}
                            onChange={(event) => updateStatus(row.id, event.target.value as PortfolioStatus)}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={7} className="px-4 py-5">
                          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                            <div className="rounded-xl border border-zinc-200 bg-white p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Property Addresses</p>
                              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                                {row.propertyAddresses.map((address) => (
                                  <div key={address} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                                    {address}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Notes</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
                                  {row.notes || 'No notes provided.'}
                                </p>
                              </div>
                              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Submission Detail</p>
                                <div className="mt-3 space-y-2 text-sm text-zinc-700">
                                  <p>
                                    <span className="font-medium text-zinc-900">Full timestamp:</span> {row.fullTimestampLabel}
                                  </p>
                                  <p>
                                    <span className="font-medium text-zinc-900">Confirmation email:</span>{' '}
                                    {row.confirmationEmailStatus === 'sent' ? 'sent' : 'not configured'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
