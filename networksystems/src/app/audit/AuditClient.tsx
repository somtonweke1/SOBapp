'use client';

import { useEffect, useMemo, useReducer, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import HunterSearch from '@/components/forensic/HunterSearch';
import EvidencePacket from '@/components/reports/EvidencePacket';
import { performForensicScan } from '@/app/actions/forensic-scan';
import { getDataSourceStatus } from '@/app/actions/data-source-status';
import type { ForensicMode, ForensicReport } from '@/lib/api/forensic-scan';
import type { DataSourceStatus } from '@/lib/api/data-source-status';
import { SERVICE_OFFERS, formatUsdFromCents } from '@/lib/service-intake';
import DataSourceStatusPill from '@/components/system/DataSourceStatusPill';

type Stage = 'IDLE' | 'SCANNING' | 'RESULT';

type State = {
  stage: Stage;
  mode: ForensicMode;
  queryAddress: string;
  prefillAddress: string;
  logs: string[];
  report: ForensicReport | null;
};

type Action =
  | { type: 'SET_MODE'; mode: ForensicMode }
  | { type: 'SET_PREFILL'; address: string }
  | { type: 'START_SCAN'; address: string; mode: ForensicMode }
  | { type: 'APPEND_LOG'; line: string }
  | { type: 'FINISH_SCAN'; report: ForensicReport }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'SET_PREFILL':
      return { ...state, prefillAddress: action.address };
    case 'START_SCAN':
      return {
        ...state,
        stage: 'SCANNING',
        mode: action.mode,
        queryAddress: action.address,
        prefillAddress: action.address,
        logs: [`[START] ${action.address}`],
        report: null,
      };
    case 'APPEND_LOG':
      return { ...state, logs: [...state.logs, action.line] };
    case 'FINISH_SCAN':
      return {
        ...state,
        stage: 'RESULT',
        report: action.report,
        logs: [...state.logs, ...action.report.logs, '[COMPLETE] Investigation complete.'],
      };
    case 'RESET':
      return {
        ...state,
        stage: 'IDLE',
        queryAddress: '',
        logs: [],
        report: null,
      };
    default:
      return state;
  }
}

function mapUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address || 'Baltimore MD')}&output=embed`;
}

function LiveConsole({ logs }: { logs: string[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-gray-600">Live Console</h2>
      <div className="mt-4 max-h-[420px] overflow-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-emerald-300">
        {logs.map((line, index) => (
          <p key={`${line}-${index}`} className="leading-6">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}

function ResultView({ report, onReset }: { report: ForensicReport; onReset: () => void }) {
  const address = report.subject?.address || report.queryAddress;
  const memoHref = `/free-scan?address=${encodeURIComponent(address)}&mode=${report.mode}`;
  const verdictTone =
    report.decision.outcome === 'proceed'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : report.decision.outcome === 'manual_review_required'
        ? 'text-amber-800 bg-amber-50 border-amber-200'
        : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="no-print rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <h2 className="px-3 pt-2 text-sm font-bold uppercase tracking-[0.08em] text-gray-600">Map Context</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
          <iframe title="Property Context Map" src={mapUrl(address)} className="h-[420px] w-full" loading="lazy" />
        </div>
      </div>

      <div className="no-print rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${verdictTone}`}>
          {report.decision.outcome.replace(/_/g, ' ')}
        </div>
        <h2 className="mt-4 text-sm font-bold uppercase tracking-[0.08em] text-gray-600">Evidence Preview</h2>
        <p className="mt-3 text-sm text-gray-700">{report.decision.summary}</p>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Treat this scan as the proof layer. The paid deliverable is the decision memo tied to this address, with a
          clear call, evidence links, and the next diligence move for the people who have to sign.
        </p>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <dt className="text-gray-600">Address</dt>
            <dd className="text-right font-medium">{address}</dd>
          </div>
          {report.subject?.owner ? (
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <dt className="text-gray-600">Owner</dt>
              <dd className="text-right font-medium">{report.subject.owner}</dd>
            </div>
          ) : null}
          {report.subject?.zoning ? (
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <dt className="text-gray-600">Zoning</dt>
              <dd className="text-right font-medium">{report.subject.zoning}</dd>
            </div>
          ) : null}
          {report.subject?.landUse ? (
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <dt className="text-gray-600">Land Use</dt>
              <dd className="text-right font-medium">{report.subject.landUse}</dd>
            </div>
          ) : null}
          {report.subject?.taxRecordLabel ? (
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
              <dt className="text-gray-600">Assessment</dt>
              <dd className="text-right font-medium">{report.subject.taxRecordLabel}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={memoHref}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-black"
          >
            Purchase 24-Hour Memo
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-emerald-700"
          >
            Print Preview Packet
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            New Scan
          </button>
          <a
            href={`/risk-memo?address=${encodeURIComponent(address)}&mode=${report.mode}`}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Open Memo Draft
          </a>
        </div>
      </div>

      <div className="lg:col-span-2">
        <EvidencePacket report={report} />
      </div>
    </section>
  );
}

function normalizeMode(value: string | null): ForensicMode {
  return value === 'compliance' ? 'compliance' : 'asset';
}

export default function AuditClient({ initialMode = 'asset' }: { initialMode?: ForensicMode }) {
  const primaryOffer = SERVICE_OFFERS.diagnostic_memo;
  const [state, dispatch] = useReducer(reducer, {
    stage: 'IDLE',
    mode: initialMode,
    queryAddress: '',
    prefillAddress: '',
    logs: [],
    report: null,
  } satisfies State);
  const [isPending, startTransition] = useTransition();
  const runTokenRef = useRef(0);
  const autoRunGuardRef = useRef<string | null>(null);
  const searchParams = useSearchParams();
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus | null>(null);

  const scanSteps = useMemo(() => {
    if (state.mode === 'asset') {
      return [
        'Connecting to Socrata...',
        'Pulling Baltimore real property records...',
        'Checking tax sale list dataset...',
        'Running zoning/usage mismatch algorithm...',
      ];
    }
    return [
      'Connecting to Socrata...',
      'Resolving owner profile from property record...',
      'Parsing EPA Registry...',
      'Running dental/clinic ghost algorithm...',
    ];
  }, [state.mode]);

  const runScan = (address: string, mode: ForensicMode) => {
    const trimmed = address.trim();
    if (!trimmed) return;

    runTokenRef.current += 1;
    const token = runTokenRef.current;

    dispatch({ type: 'START_SCAN', address: trimmed, mode });

    let i = 0;
    const timer = setInterval(() => {
      if (runTokenRef.current !== token) return;
      if (i >= scanSteps.length) return;
      dispatch({ type: 'APPEND_LOG', line: `[SCAN] ${scanSteps[i]}` });
      i += 1;
    }, 500);

    startTransition(async () => {
      try {
        const report = await performForensicScan(trimmed, mode);
        clearInterval(timer);
        if (runTokenRef.current !== token) return;
        dispatch({ type: 'FINISH_SCAN', report });
      } catch (error) {
        clearInterval(timer);
        if (runTokenRef.current !== token) return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        dispatch({ type: 'APPEND_LOG', line: `[ERROR] ${message}` });
        const fallback: ForensicReport = {
          status: 'error',
          mode,
          refId: 'MANUAL-REVIEW',
          runAt: new Date().toISOString(),
          queryAddress: trimmed,
          subject: null,
          sources: {},
          datasets: {
            permits: {
              source: {
                label: 'Baltimore City Building Permits',
                url: 'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/MapServer/3',
              },
              status: 'unavailable',
              note: message,
              records: [],
            },
            codeViolations: {
              source: {
                label: 'Baltimore City FTA Citation - $1,000',
                url: 'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/dmxPermitsCodeEnforcement/MapServer/11',
              },
              status: 'unavailable',
              note: message,
              records: [],
            },
            vacantBuildingNotices: {
              source: {
                label: 'Baltimore City Vacant Building Notice - Open',
                url: 'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/1',
              },
              status: 'unavailable',
              note: message,
              records: [],
            },
          },
          queriedSources: [],
          decision: {
            outcome: 'manual_review_required',
            summary: 'Insufficient data returned for this address. Manual review required.',
            rationale: [message],
            computedFrom: [],
            drivers: [],
          },
          discrepancy: {
            code: 'REMOVED_UNVERIFIED_SIGNAL',
            label: 'Unverified discrepancy signal removed',
            details: 'Legacy discrepancy and recovery estimates were removed because they were not backed by a verified public source.',
            cityRecordMonthly: 0,
            actualUsageMonthly: 0,
            estimatedRecovery: 0,
            actualUsageLabel: 'Not Available',
          },
          lien: null,
          epa: null,
          logs: ['[ERROR] Manual Investigation Required'],
        };
        dispatch({ type: 'FINISH_SCAN', report: fallback });
      }
    });
  };

  useEffect(() => {
    const modeParam = normalizeMode(searchParams.get('mode'));
    const addressParam = (searchParams.get('address') || '').trim();
    const autoRun = searchParams.get('autoRun') === 'true';

    dispatch({ type: 'SET_MODE', mode: modeParam });

    if (!addressParam) return;

    dispatch({ type: 'SET_PREFILL', address: addressParam });

    if (!autoRun) return;

    const key = `${modeParam}:${addressParam}`;
    if (autoRunGuardRef.current === key) return;
    autoRunGuardRef.current = key;

    runScan(addressParam, modeParam);
  }, [searchParams]);

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
    <main className="min-h-screen bg-gray-50 font-inter text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="no-print mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">StoneBridge client diagnostic</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Free scan on the front end. Paid decision memo behind it.</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                This surface should help a real buyer decide whether StoneBridge is worth paying. The scan previews
                evidence; the monetized product is a {formatUsdFromCents(primaryOffer.amountCents)} memo delivered
                within {primaryOffer.turnaround}, with a clear action call and next diligence steps.
              </p>
            </div>
            <DataSourceStatusPill status={dataSourceStatus} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Who pays</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">Developers, lenders, operators, and buyers facing live acquisition or vendor-signature pressure.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">What they buy</p>
              <p className="mt-2 text-sm leading-6 text-gray-800">Proceed / Caution / Escalate memo with source-backed rationale, not a generic dashboard screenshot.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">What follows</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">Retained diligence, monitoring, and packet work when the preview reveals real deal fragility.</p>
            </div>
          </div>
        </header>

        {state.stage === 'IDLE' ? (
          <HunterSearch
            initialMode={state.mode}
            initialAddress={state.prefillAddress}
            isPending={isPending}
            onModeChange={(mode) => dispatch({ type: 'SET_MODE', mode })}
            onSubmit={(payload) => runScan(payload.address, payload.mode)}
          />
        ) : null}

        {state.stage === 'SCANNING' ? <LiveConsole logs={state.logs} /> : null}

        {state.stage === 'RESULT' && state.report ? (
          <ResultView
            report={state.report}
            onReset={() => {
              runTokenRef.current += 1;
              dispatch({ type: 'RESET' });
            }}
          />
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
