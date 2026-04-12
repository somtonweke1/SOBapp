'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ForensicMap from '@/components/map/ForensicMap';
import PropertyDetailCard from '@/components/map/PropertyDetailCard';

type Shield = 'asset' | 'compliance' | 'ops';
type Mode = 'asset' | 'compliance';

function money(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('asset');
  const [activeShield, setActiveShield] = useState<Shield>('asset');

  const [dpwReduction, setDpwReduction] = useState<string>('18000');
  const [wasteBundlingSavings, setWasteBundlingSavings] = useState<string>('6500');
  const [annualVendorSpend, setAnnualVendorSpend] = useState<string>('250000');
  const [environmentalShieldCost, setEnvironmentalShieldCost] = useState<string>('12500');
  const [activeAuditItemId, setActiveAuditItemId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  useEffect(() => {
    const rawMode = searchParams.get('shield') ?? searchParams.get('mode');
    const nextMode: Mode = rawMode === 'compliance' ? 'compliance' : 'asset';
    setMode(nextMode);
    setSelectedProperty(null);

    // `shield` is now reserved for the global mode (asset|compliance).
    // Use `tab` for the internal 3-shield module switcher (asset|compliance|ops).
    const tabParam = searchParams.get('tab');
    if (tabParam === 'asset' || tabParam === 'compliance' || tabParam === 'ops') {
      setActiveShield(tabParam);
    } else {
      // Back-compat: if someone deep-links `?shield=ops`, treat it as Ops tab under Asset mode.
      const legacyShield = searchParams.get('shield');
      if (legacyShield === 'ops') setActiveShield('ops');
      else setActiveShield(nextMode === 'compliance' ? 'compliance' : 'asset');
    }
    const finding = searchParams.get('finding');
    setActiveAuditItemId(finding);
  }, [searchParams]);

  const recoveryTicker = useMemo(() => {
    return [
      'Recovered $1.24M across Baltimore',
      '58 active DPW recovery claims',
      'Average overcharge: $3,210',
      'Next CSSD hearing window in 12 days',
      'DPW audit queue steady at 128',
    ];
  }, []);

  const ledgerEntries = useMemo(() => {
    return [
      {
        id: 'SB-2026-4182',
        property: '1507 Laurens St',
        owner: 'L. Johnson',
        recovered: 8420,
        status: 'unpaid' as const,
        account: 'DPW-77102',
      },
      {
        id: 'SB-2026-4875',
        property: '2121 N Broadway',
        owner: 'Northwood LLC',
        recovered: 12650,
        status: 'processing' as const,
        account: 'DPW-88410',
      },
      {
        id: 'SB-2026-5029',
        property: '801 W Fayette St',
        owner: 'Fayette Holdings',
        recovered: 19400,
        status: 'settled' as const,
        account: 'DPW-66319',
      },
    ];
  }, []);

  const handleDownloadInvoice = async (entry: typeof ledgerEntries[number]) => {
    const response = await fetch('/api/generate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: entry.owner,
        propertyAddress: entry.property,
        dpwAccountNumber: entry.account,
        grossDisputedAmount: entry.recovered * 1.35,
        recoveredAmount: entry.recovered,
        evidenceUrl: `${window.location.origin}/dashboard?case=${entry.id}`,
      }),
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recovery-invoice-${entry.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const foundMoney = useMemo(() => {
    const dpw = Number(dpwReduction);
    const waste = Number(wasteBundlingSavings);
    return (Number.isFinite(dpw) ? dpw : 0) + (Number.isFinite(waste) ? waste : 0);
  }, [dpwReduction, wasteBundlingSavings]);

  const successFee = useMemo(() => foundMoney * 0.3, [foundMoney]);

  const netEquityCalc = useMemo(() => {
    const refund = foundMoney;
    const cost = Number(environmentalShieldCost);
    const safeCost = Number.isFinite(cost) ? cost : 0;
    return { refund, cost: safeCost, net: refund - safeCost };
  }, [foundMoney, environmentalShieldCost]);

  const invoiceAudit = useMemo(() => {
    return [
      { id: 'waste-surcharge-overlap', title: 'Waste Management Surcharge Overlap', recoverable: 1240 },
      { id: 'dpw-estimated-consumption-error', title: 'DPW Estimated Consumption Error', recoverable: 3100 },
      { id: 'vendor-late-fee-penalty-abatement', title: 'Vendor Late-Fee Penalty Abatement', recoverable: 850 },
    ] as const;
  }, []);

  const opsCalc = useMemo(() => {
    const spend = Number(annualVendorSpend);
    const safeSpend = Number.isFinite(spend) ? spend : 0;
    const projectedLeakage = safeSpend * 0.085;
    const stoneBridgeFee = projectedLeakage * 0.3;
    return { projectedLeakage, stoneBridgeFee };
  }, [annualVendorSpend]);

  const setShieldAndRoute = (shield: Shield) => {
    const params = new URLSearchParams(searchParams.toString());
    // Keep global mode stable. Ops lives under Asset mode.
    if (shield === 'ops') params.set('shield', 'asset');
    params.set('tab', shield);
    if (shield !== 'ops') {
      params.delete('finding');
    }
    router.replace(`/dashboard?${params.toString()}#shields`);
    setActiveShield(shield);
  };

  const selectAuditFinding = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('shield', 'asset');
    params.set('tab', 'ops');
    if (id) params.set('finding', id);
    else params.delete('finding');
    router.replace(`/dashboard?${params.toString()}#shields`);
    setActiveShield('ops');
    setActiveAuditItemId(id);
  };

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/60 px-4 py-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4 text-xs font-light uppercase tracking-[0.3em] text-zinc-500">
          <span>Live Signals</span>
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
        </div>
        <div className="mt-3 overflow-hidden">
          <div className="sob-ticker flex w-[200%] gap-8 text-sm font-light text-zinc-600">
            {[...recoveryTicker, ...recoveryTicker].map((item, index) => (
              <span key={`${item}-${index}`} className="whitespace-nowrap">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="relative h-[520px] border-b border-gray-200 lg:col-span-2 lg:border-b-0 lg:border-r">
            <ForensicMap mode={mode} onSelectProperty={setSelectedProperty} />
          </div>
          <div className="bg-gray-50 p-6">
            {selectedProperty ? (
              <PropertyDetailCard property={selectedProperty} mode={mode} />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {mode === 'asset' ? 'Asset Shield' : 'Compliance Shield'}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Select a marker</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {mode === 'asset'
                    ? 'Click a lien or historical-use marker to open the Liability Card and execute.'
                    : 'Click a clinic (or the cluster) to quantify bundling savings and execute.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={mode === 'asset' ? '/audit' : '/compliance-shield'}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${
                      mode === 'asset' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {mode === 'asset' ? 'Run DPW Audit' : 'Open Compliance Shield'}
                  </Link>
                  <Link
                    href="/dashboard#shields"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Open Shield Modules
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {mode === 'asset' ? (
        <>
          <section className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-light uppercase tracking-[0.4em] text-zinc-500">Asset Shield</p>
                <h2 className="mt-3 text-2xl font-extralight tracking-tight text-zinc-900">
                  Found Money pays for Risk Protection
                </h2>
                <p className="mt-2 text-sm font-light text-zinc-600">
                  Identify billing ghosts and leakage to increase NOI, then use recovered capital to fund environmental defense and clean documentation.
                </p>
              </div>
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-light text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Run DPW Audit
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Hero Metric</p>
                <div className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">$1.24M</div>
                <div className="mt-1 text-sm font-light text-zinc-600">Net Capital Recovered (Baltimore)</div>
              </div>
              <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Infrastructure Forensic</p>
                <div className="mt-2 text-sm font-light text-zinc-700">Identify billing ghosts & water leaks to increase NOI.</div>
                <Link
                  href="/audit"
                  className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
                >
                  Open Audit
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Pitch Calculator</p>
                <div className="mt-2 text-xs font-light text-zinc-600">(Projected Water Bill Refund) - (Environmental Shield Cost) = Net Equity</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-light text-zinc-600">
                    Projected Refund ($)
                    <input
                      value={String(netEquityCalc.refund)}
                      readOnly
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-light text-zinc-900"
                    />
                  </label>
                  <label className="text-xs font-light text-zinc-600">
                    Shield Cost ($)
                    <input
                      value={environmentalShieldCost}
                      onChange={(e) => setEnvironmentalShieldCost(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-light text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>
                </div>
                <div className="mt-3 text-sm font-light text-zinc-600">
                  Net Equity:{' '}
                  <span className={netEquityCalc.net >= 0 ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
                    ${money(netEquityCalc.net)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section id="shields" className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-light uppercase tracking-[0.4em] text-zinc-500">Forensic Shields</p>
            <h2 className="mt-3 text-2xl font-extralight tracking-tight text-zinc-900">Asset / Compliance / Ops</h2>
            <p className="mt-2 text-sm font-light text-zinc-600">
              Three paths to the same outcome: evidence, leverage, recovery.
            </p>
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-light text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Start Forensic Audit
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShieldAndRoute('asset')}
            className={`rounded-full border px-4 py-2 text-sm font-light transition-colors ${
              activeShield === 'asset'
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-zinc-200/50 bg-white/60 text-zinc-600 backdrop-blur-sm hover:bg-white/80 hover:text-zinc-900'
            }`}
          >
            Asset Shield
          </button>
          <button
            type="button"
            onClick={() => setShieldAndRoute('compliance')}
            className={`rounded-full border px-4 py-2 text-sm font-light transition-colors ${
              activeShield === 'compliance'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-zinc-200/50 bg-white/60 text-zinc-600 backdrop-blur-sm hover:bg-white/80 hover:text-zinc-900'
            }`}
          >
            Compliance Shield
          </button>
          <button
            type="button"
            onClick={() => setShieldAndRoute('ops')}
            className={`rounded-full border px-4 py-2 text-sm font-light transition-colors ${
              activeShield === 'ops'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : 'border-zinc-200/50 bg-white/60 text-zinc-600 backdrop-blur-sm hover:bg-white/80 hover:text-zinc-900'
            }`}
          >
            Ops Shield
          </button>
        </div>

        {/* Command Center map moved to the top of the page (dual-mode: Asset vs Compliance). */}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeShield}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
            >
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">
                {activeShield === 'asset' ? 'Asset Shield' : activeShield === 'compliance' ? 'Compliance Shield' : 'Ops Shield'}
              </p>

              {activeShield === 'asset' && (
                <div className="mt-3 text-base font-light text-zinc-600">
                  <p className="text-lg font-extralight tracking-tight text-zinc-900">Asset Shielding / Lien Abatement</p>
                  <p className="mt-2">We assemble evidence, draft abatement artifacts, and apply leverage to recover capital.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="/abatement"
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-light text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      Open Abatement Suite
                    </Link>
                    <Link
                      href="/claims?zip=21201"
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light text-zinc-700 shadow-sm transition-colors hover:bg-white"
                    >
                      View Claims Intake
                    </Link>
                  </div>
                </div>
              )}

              {activeShield === 'compliance' && (
                <div className="mt-3 text-base font-light text-zinc-600">
                  <p className="text-lg font-extralight tracking-tight text-zinc-900">Compliance Bridge / Environmental Risk</p>
                  <p className="mt-2">We surface exposure and build an audit-ready trail for faster dispute resolution.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="/compliance-shield"
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-light text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Open Compliance Shield
                    </Link>
                    <Link
                      href="/compliance-shield/report"
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light text-zinc-700 shadow-sm transition-colors hover:bg-white"
                    >
                      Generate Risk Report
                    </Link>
                  </div>
                </div>
              )}

              {activeShield === 'ops' && (
                <div className="mt-3 text-base font-light text-zinc-600">
                  <p className="text-lg font-extralight tracking-tight text-zinc-900">Ops Shield: Capital Extraction / Vendor Bleed</p>
                  <p className="mt-2">We quantify penalties and recoverable leakage across invoices and service schedules.</p>

                  <div className="mt-5 rounded-xl border border-zinc-200/50 bg-zinc-50 p-4">
                    <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Invoice Audit</p>
                    <div className="mt-3 space-y-2">
                      {invoiceAudit.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectAuditFinding(item.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm font-light transition-colors ${
                            activeAuditItemId === item.id
                              ? 'bg-amber-50 text-zinc-900 ring-1 ring-amber-200'
                              : 'text-zinc-700 hover:bg-white'
                          }`}
                        >
                          <span>{item.title}</span>
                          <span className="font-medium text-zinc-900">Recoverable: ${money(item.recoverable)}</span>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence initial={false}>
                      {activeAuditItemId && (
                        <motion.div
                          key={activeAuditItemId}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/60 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="text-sm font-light text-zinc-700">
                              <div className="text-xs font-light uppercase tracking-[0.3em] text-amber-700">Finding Detail</div>
                              <div className="mt-2 font-medium text-zinc-900">
                                {invoiceAudit.find((i) => i.id === activeAuditItemId)?.title}
                              </div>
                              <div className="mt-2 text-zinc-600">
                                Simulated workflow: assemble invoice evidence, compare against service schedule, and draft an abatement packet.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => selectAuditFinding(null)}
                              className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-[10px] font-light uppercase tracking-[0.3em] text-amber-800 shadow-sm transition-colors hover:bg-white"
                            >
                              Close
                            </button>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={`/ops/audit-report?zip=21201&finding=${activeAuditItemId}`}
                              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-light text-white shadow-sm transition-colors hover:bg-amber-700"
                            >
                              Generate Ops Audit Report
                            </Link>
                            <Link
                              href={`/ops/proposal?zip=21201&finding=${activeAuditItemId}`}
                              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light text-zinc-700 shadow-sm transition-colors hover:bg-white"
                            >
                              Open Recovery Proposal
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="/ops/proposal?zip=21201"
                      className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-light text-white shadow-sm transition-colors hover:bg-amber-700"
                    >
                      Open Ops Shield Proposal
                    </Link>
                    <Link
                      href="/ops/audit-report?zip=21201"
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light text-zinc-700 shadow-sm transition-colors hover:bg-white"
                    >
                      Generate Audit Report
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            {activeShield !== 'ops' ? (
              <>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Found Money Calculator</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-light text-zinc-700">
                    DPW Reduction ($)
                    <input
                      value={dpwReduction}
                      onChange={(e) => setDpwReduction(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-base font-light text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="text-sm font-light text-zinc-700">
                    Waste Bundling Savings ($)
                    <input
                      value={wasteBundlingSavings}
                      onChange={(e) => setWasteBundlingSavings(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-base font-light text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>
                </div>
                <div className="mt-4 rounded-lg border border-zinc-200/50 bg-zinc-50 p-4">
                  <div className="text-xs font-light text-zinc-600">
                    (DPW_Reduction + Waste_Bundling_Savings) * 0.30 = Estimated Fee
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
                    <div className="text-sm font-light text-zinc-600">
                      Total Value: <span className="font-medium text-zinc-900">${money(foundMoney)}</span>
                    </div>
                    <div className="text-sm font-light text-zinc-600">
                      Your Fee (30%): <span className="font-medium text-zinc-900">${money(successFee)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Bleed Calculator</p>
                <div className="mt-4">
                  <label className="text-sm font-light text-zinc-700">
                    Annual Vendor Spend
                    <input
                      value={annualVendorSpend}
                      onChange={(e) => setAnnualVendorSpend(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-4 py-3 text-base font-light text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </label>
                </div>
                <div className="mt-4 rounded-lg border border-zinc-200/50 bg-zinc-50 p-4">
                  <div className="text-xs font-light text-zinc-600">Projected Leakage = Spend * 0.085</div>
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
                    <div className="text-sm font-light text-zinc-600">
                      Total Recovery: <span className="font-medium text-zinc-900">${money(opsCalc.projectedLeakage)}</span>
                    </div>
                    <div className="text-sm font-light text-zinc-600">
                      <span className="font-medium text-zinc-900">Stone Bridge 30% Fee</span>:{' '}
                      <span className="text-base font-semibold text-rose-600">${money(opsCalc.stoneBridgeFee)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Case Progress</p>
            <h3 className="mt-2 text-xl font-extralight tracking-tight text-zinc-900">
              Audit → Discrepancy → Abatement → Response
            </h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Audit Submitted', state: 'complete' as const },
                { label: 'Discrepancy Detected', state: 'complete' as const },
                { label: 'Abatement Drafted', state: 'active' as const },
                { label: 'DPW Response', state: 'pending' as const },
              ].map((step) => (
                <div key={step.label} className="rounded-2xl border border-zinc-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light text-zinc-900">{step.label}</span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${
                        step.state === 'complete'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : step.state === 'active'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                      }`}
                    >
                      {step.state}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 w-full rounded-full bg-zinc-100">
                    <div
                      className={`h-3 rounded-full ${
                        step.state === 'complete'
                          ? 'bg-emerald-600'
                          : step.state === 'active'
                            ? 'bg-amber-500'
                            : 'bg-zinc-300'
                      }`}
                      style={{ width: step.state === 'complete' ? '100%' : step.state === 'active' ? '62%' : '18%' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">DPW Intelligence Snapshot</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'Audits Pending Review', value: '14', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { label: 'Discrepancy Volume (30d)', value: '$92,400', tone: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { label: 'Average CCF Overrun', value: '22.1%', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
                ].map((metric) => (
                  <div key={metric.label} className={`rounded-xl border p-4 text-center ${metric.tone}`}>
                    <div className="text-2xl font-extralight tracking-tight">{metric.value}</div>
                    <div className="mt-1 text-xs font-light text-zinc-600">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Ledger</p>
                <h3 className="mt-2 text-xl font-extralight tracking-tight text-zinc-900">Closed Outcomes</h3>
              </div>
              <span className="text-xs font-light text-zinc-500">Collections</span>
            </div>
            <div className="mt-5 space-y-3 text-sm font-light text-zinc-600">
              {ledgerEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-zinc-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">{entry.id}</p>
                      <p className="mt-1 text-base font-medium text-zinc-900">{entry.property}</p>
                      <p className="text-xs text-zinc-500">Owner: {entry.owner}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Recovered</p>
                      <p className="mt-1 font-medium text-zinc-900">${money(entry.recovered)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${
                        entry.status === 'unpaid'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : entry.status === 'processing'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {entry.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(entry)}
                      className="rounded-lg border border-zinc-300 bg-white/60 px-3 py-2 text-[10px] font-light uppercase tracking-[0.3em] text-zinc-600 shadow-sm backdrop-blur-sm transition-colors hover:border-zinc-400 hover:text-zinc-900"
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
        </>
      ) : (
        <section className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-light uppercase tracking-[0.4em] text-zinc-500">Compliance Shield</p>
              <h2 className="mt-3 text-2xl font-extralight tracking-tight text-zinc-900">Compliance Status: Certified</h2>
              <p className="mt-2 text-sm font-light text-zinc-600">
                We build the audit trail: manifests, certificates of destruction, and site-ready documentation. The product is proof.
              </p>
            </div>
            <Link
              href="/compliance-shield/report"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-light text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Generate Risk Packet
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Digital Badge</p>
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="text-xs font-light uppercase tracking-[0.4em] text-emerald-700">SOB-Certified</div>
                <div className="mt-2 text-lg font-extralight tracking-tight text-emerald-900">EPA / OSHA Ready</div>
                <div className="mt-1 text-sm font-light text-emerald-800/80">Audit trail on file</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Waste Stream Bundling</p>
              <p className="mt-3 text-sm font-light text-zinc-600">
                Bundle pickups across 10 clinics to reduce stops and cost, then keep the spread as the managed service fee.
              </p>
              <div className="mt-4 rounded-xl border border-zinc-200/50 bg-white/80 p-4">
                <div className="flex items-baseline justify-between text-sm font-light">
                  <span className="text-zinc-600">Unbundled cost (est.)</span>
                  <span className="font-medium text-zinc-900">$1,900/mo</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between text-sm font-light">
                  <span className="text-zinc-600">Bundled route cost</span>
                  <span className="font-medium text-emerald-700">$1,250/mo</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Site-Ready Packet</p>
              <p className="mt-3 text-sm font-light text-zinc-600">
                PDF-ready evidence packet: manifests, CODs, and a simple narrative for regulators, landlords, and lenders.
              </p>
              <Link
                href="/compliance-shield"
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
              >
                Open Compliance Shield
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
