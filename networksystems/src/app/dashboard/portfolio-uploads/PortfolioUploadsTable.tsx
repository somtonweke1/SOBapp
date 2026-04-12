'use client';

import { Fragment, useMemo, useState } from 'react';
import type { PortfolioUploadStatus } from '@/lib/portfolio-upload';

type PortfolioUploadRow = {
  id: string;
  referenceNumber: string;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  addresses: string[];
  addressCount: number;
  dealContext: string;
  status: PortfolioUploadStatus;
  submittedLabel: string;
  fullSubmittedLabel: string;
  reportUrl: string;
  hasReport: boolean;
};

const statusOptions: Array<{ value: PortfolioUploadStatus; label: string }> = [
  { value: 'received', label: 'Received' },
  { value: 'processing', label: 'Processing' },
  { value: 'delivered', label: 'Delivered' },
];

function statusPillClasses(status: PortfolioUploadStatus) {
  switch (status) {
    case 'delivered':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'processing':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-700';
  }
}

export default function PortfolioUploadsTable({ initialRows }: { initialRows: PortfolioUploadRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const emptyState = useMemo(() => rows.length === 0, [rows.length]);

  const updateStatus = async (id: string, nextStatus: PortfolioUploadStatus) => {
    const previousRows = rows;

    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)));
    setSavingId(id);

    try {
      const response = await fetch(`/api/portfolio-upload/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist status');
      }
    } catch {
      setRows(previousRows);
    } finally {
      setSavingId(null);
    }
  };

  const runBulkScan = async (id: string) => {
    setRunningId(id);

    try {
      const response = await fetch(`/api/portfolio-upload/${id}/run`, {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to run bulk scan');
      }

      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                status: 'delivered',
                hasReport: true,
              }
            : row
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Enterprise Ops</p>
          <h2 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Portfolio Uploads</h2>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Uploads</p>
          <p className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">{rows.length}</p>
        </div>
      </div>

      {emptyState ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
          No portfolio uploads yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Addresses</th>
                <th className="px-4 py-3 font-medium">Context</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((row) => {
                const isExpanded = expandedRowId === row.id;
                const isSaving = savingId === row.id;
                const isRunning = runningId === row.id;

                return (
                  <Fragment key={row.id}>
                    <tr className="cursor-pointer transition-colors hover:bg-zinc-50/60" onClick={() => setExpandedRowId(isExpanded ? null : row.id)}>
                      <td className="px-4 py-4 text-sm font-medium text-zinc-900">{row.referenceNumber}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="font-medium text-zinc-900">{row.institutionName}</div>
                        <a
                          href={`mailto:${row.contactEmail}`}
                          className="text-zinc-600 underline decoration-zinc-300 underline-offset-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {row.contactName} · {row.contactEmail}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.addressCount}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.dealContext}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{row.submittedLabel}</td>
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusPillClasses(row.status)}`}>
                            {statusOptions.find((option) => option.value === row.status)?.label}
                          </span>
                          <select
                            value={row.status}
                            disabled={isSaving}
                            onChange={(event) => updateStatus(row.id, event.target.value as PortfolioUploadStatus)}
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
                      <td className="px-4 py-4 text-sm text-zinc-700">
                        <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => runBulkScan(row.id)}
                            disabled={isRunning}
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 disabled:opacity-50"
                          >
                            {isRunning ? 'Running...' : 'Run Bulk Scan'}
                          </button>
                          {row.hasReport ? (
                            <a
                              href={row.reportUrl}
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                            >
                              Open Report
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={7} className="px-4 py-5">
                          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                            <div className="rounded-xl border border-zinc-200 bg-white p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Submitted Addresses</p>
                              <div className="mt-3 max-h-80 space-y-2 overflow-auto text-sm text-zinc-700">
                                {row.addresses.map((address) => (
                                  <div key={address} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                                    {address}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-zinc-200 bg-white p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Submission Detail</p>
                              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                                <p>
                                  <span className="font-medium text-zinc-900">Submitted:</span> {row.fullSubmittedLabel}
                                </p>
                                <p>
                                  <span className="font-medium text-zinc-900">Report URL:</span> {row.hasReport ? row.reportUrl : 'Pending bulk scan'}
                                </p>
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
