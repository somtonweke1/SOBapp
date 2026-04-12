'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForensicSearch, { type ShieldMode } from '@/components/search/ForensicSearch';
import VerdictCard from '@/components/results/VerdictCard';
import ForensicMap from '@/components/map/ForensicMap';
import { performForensicScan } from '@/app/actions/forensic-scan';
import type { ForensicReport } from '@/lib/api/forensic-scan';

export default function DashboardClient({ initialMode }: { initialMode: ShieldMode }) {
  const [mode, setMode] = useState<ShieldMode>(initialMode);
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const focusPoint = useMemo(() => {
    if (!hasSearched || !selected?.position) return null;
    return { lat: selected.position.lat, lng: selected.position.lng, zoom: 13.5 };
  }, [hasSearched, selected]);

  const runSearch = async (q: string) => {
    setQuery(q);
    setHasSearched(true);
    setIsLoading(true);
    setReport(null);
    setSelected(null);

    try {
      const nextReport = await performForensicScan(q, mode);
      setReport(nextReport);
      const subject = nextReport.subject;
      if (!subject) return;

      if (mode === 'asset') {
        setSelected({
          type: 'asset_property',
          id: `asset-${nextReport.refId}`,
          address: subject.address,
          position: {
            lat: subject.latitude ?? 39.2904,
            lng: subject.longitude ?? -76.6122,
          },
          lienAmount: undefined,
          remediationCost: nextReport.discrepancy.estimatedRecovery,
          historicalUse: [],
          primarySignal: nextReport.decision.summary,
        });
      } else {
        const currentMonthly = Math.max(nextReport.discrepancy.cityRecordMonthly, 800);
        setSelected({
          type: 'dental_site',
          id: `compliance-${nextReport.refId}`,
          name: subject.owner || 'Subject Facility',
          address: subject.address,
          position: {
            lat: subject.latitude ?? 39.2904,
            lng: subject.longitude ?? -76.6122,
          },
          monthlySpend: currentMonthly,
          estSavingsPct: 30,
          estSavingsMonthly: Math.round(currentMonthly * 0.3),
        });
      }
    } catch {
      setReport(null);
      setSelected(null);
    } finally {
      setIsLoading(false);
    }
  };

  const assetRecords = selected && mode === 'asset' ? [{
    id: selected.id,
    address: selected.address,
    position: selected.position,
    lienAmount: selected.lienAmount,
    remediationCost: selected.remediationCost,
    historicalUse: selected.historicalUse,
  }] : [];

  const complianceSites = selected && mode === 'compliance' ? [{
    id: selected.id,
    name: selected.name,
    address: selected.address,
    position: selected.position,
    monthlySpend: selected.monthlySpend,
  }] : [];

  return (
    <div className="min-h-[60vh]">
      <div
        className={
          hasSearched
            ? 'flex items-start justify-start'
            : 'flex min-h-[60vh] items-center justify-center'
        }
      >
        <ForensicSearch
          mode={mode}
          state={hasSearched ? 'results' : 'idle'}
          initialQuery={query}
          onModeChange={(next) => {
            setMode(next);
            setHasSearched(false);
            setSelected(null);
          }}
          onSubmit={runSearch}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {hasSearched ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <div className="relative h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
              <ForensicMap
                mode={mode}
                focusPoint={focusPoint}
                assetRecords={assetRecords}
                complianceSites={complianceSites}
                onSelectProperty={(p) => setSelected(p)}
              />
            </div>

            <div className="space-y-4">
              <VerdictCard
                mode={mode}
                asset={
                  mode === 'asset'
                    ? {
                        refund: Number(selected?.lienAmount ?? report?.discrepancy?.estimatedRecovery ?? 0),
                        shieldCost: 2500,
                      }
                    : undefined
                }
                compliance={
                  mode === 'compliance'
                    ? {
                        currentMonthly: Number(selected?.monthlySpend ?? report?.discrepancy?.cityRecordMonthly ?? 0),
                        bundledMonthly: Math.round(Number(selected?.monthlySpend ?? report?.discrepancy?.cityRecordMonthly ?? 0) * 0.7),
                      }
                    : undefined
                }
              />
              {isLoading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
                  Running live scan...
                </div>
              ) : null}
              {!isLoading && hasSearched && !selected ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                  Live data is currently unavailable for this query.
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Next Steps</div>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>1. Confirm address + account identifiers.</li>
                  <li>2. Generate evidence packet.</li>
                  <li>3. Execute claim intake.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
