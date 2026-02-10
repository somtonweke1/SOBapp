'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type AuditSnapshot = {
  input?: {
    meterReadCurrent?: number;
    meterReadLast?: number;
    totalBill?: number;
    serviceCharge?: number;
    sewerCharge?: number;
  };
  result?: {
    discrepancyAmount?: string;
    actualCCF?: number;
    actualGallons?: number;
    expectedBill?: number;
    actualBill?: number;
    recommendation?: string;
  };
  timestamp?: string;
};

export default function AbatementPage() {
  const [ownerName, setOwnerName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const [meterReadCurrent, setMeterReadCurrent] = useState('');
  const [meterReadLast, setMeterReadLast] = useState('');
  const [totalBill, setTotalBill] = useState('');
  const [expectedMax, setExpectedMax] = useState('');
  const [discrepancy, setDiscrepancy] = useState('');
  const [letter, setLetter] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sobapp:lastAudit');
    if (!stored) return;
    try {
      const parsed: AuditSnapshot = JSON.parse(stored);
      if (parsed.timestamp) {
        setAuditDate(new Date(parsed.timestamp).toLocaleDateString());
      }
      if (parsed.input?.meterReadCurrent) {
        setMeterReadCurrent(parsed.input.meterReadCurrent.toString());
      }
      if (parsed.input?.meterReadLast) {
        setMeterReadLast(parsed.input.meterReadLast.toString());
      }
      if (parsed.input?.totalBill) {
        setTotalBill(parsed.input.totalBill.toFixed(2));
      }
      if (parsed.result?.expectedBill) {
        setExpectedMax(parsed.result.expectedBill.toFixed(2));
      }
      if (parsed.result?.discrepancyAmount) {
        setDiscrepancy(parsed.result.discrepancyAmount);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const generatedLetter = useMemo(() => {
    if (!ownerName || !propertyAddress || !totalBill) return '';
    return `NOTICE OF DISPUTE - DPW WATER BILL\n\n` +
      `Date: ${auditDate || '[Insert Date]'}\n` +
      `To: Baltimore City Department of Public Works\n` +
      `Re: Disputed Water Bill for ${propertyAddress}\n\n` +
      `I, ${ownerName}, am submitting a formal dispute for the DPW water bill associated with the property listed above.\n` +
      `Account Number: ${accountNumber || '[Insert Account #]'}\n` +
      `Meter Readings: ${meterReadLast || '[Last]'} CCF to ${meterReadCurrent || '[Current]'} CCF\n` +
      `Total Billed Amount: $${totalBill}\n` +
      `${expectedMax ? `Expected Maximum (CCF @ $17.64 + baseline): $${expectedMax}\n` : ''}` +
      `${discrepancy ? `Estimated Overcharge / Discrepancy: $${discrepancy}\n` : ''}` +
      `\nBased on SOBapp forensic audit calculations, the bill appears to exceed the expected maximum for recorded usage.\n` +
      `Please investigate and issue a corrected statement or written justification for the variance.\n\n` +
      `Requested Action:\n` +
      `1. Recalculate the bill using verified meter readings.\n` +
      `2. Provide a written explanation for any additional charges.\n` +
      `3. Apply credits or abatement if overcharges are confirmed.\n\n` +
      `Sincerely,\n` +
      `${ownerName}\n` +
      `${propertyAddress}\n`;
  }, [ownerName, propertyAddress, accountNumber, auditDate, meterReadCurrent, meterReadLast, totalBill, expectedMax, discrepancy]);

  const handleGenerate = () => {
    setLetter(generatedLetter);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="border-b border-slate-800 pb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SOBapp Abatement</p>
          <h1 className="mt-4 text-4xl font-semibold">Notice of Dispute Generator</h1>
          <p className="mt-3 text-slate-300">
            Draft a DPW dispute letter using the latest audit snapshot.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/audit"
              className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Back to Audit
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-emerald-500/40 px-5 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400"
            >
              DSCR Stress Test
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-6">
          <div className="rounded-2xl border border-slate-800 bg-black/60 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400">Owner Name</label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Property Address</label>
                <input
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="123 N Charles St, Baltimore, MD"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Account Number</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="DPW-000000"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Audit Date</label>
                <input
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="MM/DD/YYYY"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Meter Read (Last)</label>
                <input
                  value={meterReadLast}
                  onChange={(e) => setMeterReadLast(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="120.0"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Meter Read (Current)</label>
                <input
                  value={meterReadCurrent}
                  onChange={(e) => setMeterReadCurrent(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="135.5"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Total Bill</label>
                <input
                  value={totalBill}
                  onChange={(e) => setTotalBill(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Expected Max</label>
                <input
                  value={expectedMax}
                  onChange={(e) => setExpectedMax(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="115.40"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Discrepancy</label>
                <input
                  value={discrepancy}
                  onChange={(e) => setDiscrepancy(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="34.60"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Generate Letter
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Draft Letter</p>
            <textarea
              value={letter}
              readOnly
              className="mt-4 h-96 w-full rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200"
              placeholder="Your abatement letter will appear here."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
