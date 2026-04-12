'use client';

import { Suspense, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { OutreachStatus } from '@prisma/client';
import EvidencePacket from '@/components/reports/EvidencePacket';
import { generateBulkPacketsAction } from '@/app/actions/bulk-audit';
import {
  getTargetStatusesAction,
  markPacketGeneratedBatchAction,
  updateTargetStatusAction,
} from '@/app/actions/target-status';
import type { BulkAuditResult } from '@/lib/api/bulk-audit';

function parseAddresses(param: string | null): string[] {
  if (!param) return [];
  return param
    .split('||')
    .map((value) => decodeURIComponent(value).trim())
    .filter(Boolean);
}

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

function BulkAuditPrintPageInner() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<BulkAuditResult | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, OutreachStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();

  const addresses = useMemo(() => parseAddresses(searchParams.get('addresses')), [searchParams]);
  const zipCode = (searchParams.get('zip') || '').trim();

  useEffect(() => {
    if (addresses.length === 0) {
      setError('No addresses were provided for bulk packet generation.');
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const data = await generateBulkPacketsAction(addresses);
        setResult(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(`Bulk generation failed: ${message}`);
      }
    });
  }, [addresses]);

  useEffect(() => {
    if (!result) return;

    const successfulAddresses = result.successful.map((report) => report.subject?.address || report.queryAddress);

    startStatusTransition(async () => {
      if (zipCode) {
        await markPacketGeneratedBatchAction(successfulAddresses, zipCode);
      }

      const statuses = await getTargetStatusesAction(successfulAddresses, zipCode || undefined);
      const next: Record<string, OutreachStatus> = {};
      successfulAddresses.forEach((address) => {
        const key = normalizeAddressKey(address);
        next[key] = statuses[key]?.status || 'PACKET_GENERATED';
      });
      setStatusMap(next);
    });
  }, [result, zipCode]);

  useEffect(() => {
    if (!result || hasPrinted) return;
    const timer = setTimeout(() => {
      window.print();
      setHasPrinted(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [result, hasPrinted]);

  const updateStatus = (address: string, status: OutreachStatus) => {
    const key = normalizeAddressKey(address);
    setStatusMap((prev) => ({ ...prev, [key]: status }));

    startStatusTransition(async () => {
      if (!zipCode) return;
      await updateTargetStatusAction({ address, zipCode, status });
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 font-inter text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="no-print mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Bulk Evidence Packets</h1>
              <p className="mt-1 text-sm text-gray-600">Batch forensic run and print-ready packet assembly.</p>
            </div>
            <Link
              href="/recon"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Back to Recon
            </Link>
          </div>
        </header>

        {isPending ? (
          <section className="no-print rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Generating bulk evidence packets...</p>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <p className="font-semibold">{error}</p>
          </section>
        ) : null}

        {result ? (
          <>
            <section className="no-print mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">Run Summary</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                  Requested: <span className="font-semibold">{result.summary.requested}</span>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Printable: <span className="font-semibold">{result.summary.printed}</span>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Skipped: <span className="font-semibold">{result.summary.skipped}</span>
                </div>
              </div>
            </section>

            {result.successful.map((report) => {
              const address = report.subject?.address || report.queryAddress;
              const key = normalizeAddressKey(address);
              const currentStatus = statusMap[key] || 'PACKET_GENERATED';

              return (
                <section key={report.refId} className="packet-page mb-6">
                  <div className="no-print mb-2 flex justify-end">
                    <select
                      value={currentStatus}
                      onChange={(e) => updateStatus(address, e.target.value as OutreachStatus)}
                      disabled={isStatusPending}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <EvidencePacket report={report} />
                </section>
              );
            })}

            {result.skipped.length > 0 ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                <h3 className="font-bold uppercase tracking-wider">Skipped Targets</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {result.skipped.map((entry) => (
                    <li key={`${entry.address}-${entry.reason}`}>
                      {entry.address}: {entry.reason}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .packet-page {
            break-after: page;
            page-break-after: always;
          }

          .packet-page:last-of-type {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
    </main>
  );
}

export default function BulkAuditPrintPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <BulkAuditPrintPageInner />
    </Suspense>
  );
}
