'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { OutreachStatus } from '@prisma/client';
import { scanSector } from '@/app/actions/recon-scan';
import { getDataSourceStatus } from '@/app/actions/data-source-status';
import {
  exportTargetStatusCsvAction,
  getTargetStatusesAction,
  markPacketGeneratedBatchAction,
  updateTargetStatusAction,
} from '@/app/actions/target-status';
import type { ReconTarget } from '@/lib/api/recon-scan';
import type { DataSourceStatus } from '@/lib/api/data-source-status';
import DataSourceStatusPill from '@/components/system/DataSourceStatusPill';

function normalizeAddressKey(address: string) {
  return address
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STATUS_OPTIONS: OutreachStatus[] = ['NEW', 'PACKET_GENERATED', 'MAILED', 'FOLLOW_UP', 'CLOSED'];

function statusLabel(status: OutreachStatus) {
  return status.toLowerCase().replace('_', ' ');
}

export default function ReconPage() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('21201');
  const [results, setResults] = useState<ReconTarget[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, OutreachStatus>>({});
  const [isPending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus | null>(null);

  const selectedCount = selected.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const fetchStatuses = async (addresses: string[], zip: string) => {
    const records = await getTargetStatusesAction(addresses, zip);
    const next: Record<string, OutreachStatus> = {};
    addresses.forEach((address) => {
      const key = normalizeAddressKey(address);
      next[key] = records[key]?.status || 'NEW';
    });
    setStatusMap(next);
  };

  const toggleSelected = (address: string) => {
    setSelected((prev) => (prev.includes(address) ? prev.filter((a) => a !== address) : [...prev, address]));
  };

  const onScan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setHasScanned(true);

    const zip = zipCode.trim();
    if (!/^\d{5}$/.test(zip)) {
      setResults([]);
      setSelected([]);
      setStatusMap({});
      setError('Enter a valid 5-digit ZIP code.');
      return;
    }

    startTransition(async () => {
      try {
        const data = await scanSector(zip);
        setResults(data);
        setSelected([]);
        await fetchStatuses(data.map((r) => r.address), zip);
        if (data.length === 0) {
          setError('No anomalies found in this ZIP. Try 21202 or 21230.');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setResults([]);
        setSelected([]);
        setStatusMap({});
        setError(`Recon failed. Manual retry required. ${message}`);
      }
    });
  };

  const onGenerateBulk = () => {
    if (selectedCount === 0) return;
    const payload = selected.map((address) => encodeURIComponent(address)).join('||');
    const zip = encodeURIComponent(zipCode.trim());

    startStatusTransition(async () => {
      await markPacketGeneratedBatchAction(selected, zipCode.trim());
      router.push(`/audit/bulk?addresses=${payload}&zip=${zip}`);
    });
  };

  const onUpdateStatus = (address: string, status: OutreachStatus) => {
    const key = normalizeAddressKey(address);
    setStatusMap((prev) => ({ ...prev, [key]: status }));

    startStatusTransition(async () => {
      try {
        await updateTargetStatusAction({
          address,
          zipCode: zipCode.trim(),
          status,
        });
      } catch {
        // no-op: keep optimistic UI
      }
    });
  };

  const onExportCsv = () => {
    startStatusTransition(async () => {
      try {
        const csv = await exportTargetStatusCsvAction(zipCode.trim());
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `target-status-${zipCode.trim() || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    });
  };

  useEffect(() => {
    let active = true;

    getDataSourceStatus()
      .then((status) => {
        if (!active) return;
        setDataSourceStatus(status);
      })
      .catch(() => {
        if (!active) return;
        setDataSourceStatus({
          state: 'disconnected',
          tier: 0,
          provider: 'NONE',
          source: 'Maryland State Portal',
          message: 'Unable to load connection status.',
          checkedAt: new Date().toISOString(),
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 font-inter text-gray-900 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">StoneBridge Recon</p>
              <h1 className="mt-2 text-2xl font-bold">Sector Reconnaissance.</h1>
              <p className="mt-2 text-sm text-gray-600">Scan for Commercial/Industrial parcels with low assessed value and high mismatch probability.</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <DataSourceStatusPill status={dataSourceStatus} />
              <button
                type="button"
                onClick={onExportCsv}
                disabled={statusPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              >
                Export Status CSV
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={onScan} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label htmlFor="zip" className="mb-2 block text-sm font-semibold text-gray-900">
                Target Sector (Zip)
              </label>
              <input
                id="zip"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-lg text-gray-900 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                placeholder="21201"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Scanning...' : 'Initiate Scan'}
            </button>
          </form>

          {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-gray-600">Suspect Cards</h2>
            {hasScanned ? <p className="text-xs text-gray-500">{results.length} targets found</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((target) => {
              const key = normalizeAddressKey(target.address);
              const isChecked = selectedSet.has(target.address);
              const currentStatus = statusMap[key] || 'NEW';

              return (
                <article
                  key={`${target.address}-${target.owner}`}
                  className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm transition hover:border-gray-400"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</p>
                      <h3 className="mt-1 text-base font-bold text-gray-900">{target.address}</h3>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelected(target.address)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Select
                    </label>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Owner</dt>
                      <dd className="text-right font-medium text-gray-900">{target.owner}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Zoning</dt>
                      <dd className="text-right font-medium text-gray-900">{target.landUse}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Value</dt>
                      <dd className="text-right font-semibold text-gray-900">{target.assessedValueLabel}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      high_mismatch_prob
                    </span>
                    <select
                      value={currentStatus}
                      onChange={(e) => onUpdateStatus(target.address, e.target.value as OutreachStatus)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/audit?address=${encodeURIComponent(target.address)}&autoRun=true&mode=asset`}
                      className="rounded-lg border border-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Target
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {hasScanned && !isPending && results.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No suspect cards in this sector. Try ZIP `21202` or `21230`.
            </div>
          ) : null}
        </section>
      </div>

      {selectedCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-gray-800">Selected: {selectedCount} Targets</p>
            <button
              type="button"
              onClick={onGenerateBulk}
              disabled={statusPending}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              Generate Bulk Evidence Packets
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
