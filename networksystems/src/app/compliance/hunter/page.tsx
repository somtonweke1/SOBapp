'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';
import { checkCompliance, type ComplianceCheckResult } from '@/app/actions/compliance-check';

type UiState = 'idle' | 'scanning' | 'record_found' | 'no_record_found' | 'error';

function money(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function ComplianceHunterPage() {
  const [isPending, startTransition] = useTransition();
  const [ui, setUi] = useState<UiState>('idle');
  const [name, setName] = useState('Towson Smile Care');
  const [zip, setZip] = useState('21204');
  const [doctorLastName, setDoctorLastName] = useState('Smith');
  const [neighborName, setNeighborName] = useState('Baltimore Dental Group');
  const [location, setLocation] = useState('Towson, MD');
  const [result, setResult] = useState<ComplianceCheckResult | null>(null);

  const risk = useMemo(() => {
    // Keep this conservative and non-threatening. The point is predictable cost vs uncertain exposure.
    const shieldMonthly = 450;
    const estimatedExposureMonthly = 300_000; // UI-only heuristic for demo framing
    const roi = Math.max(1, Math.round(estimatedExposureMonthly / shieldMonthly));
    return { shieldMonthly, estimatedExposureMonthly, roi };
  }, []);

  const outreach = useMemo(() => {
    const who = doctorLastName?.trim() ? `Dr. ${doctorLastName.trim()}` : 'Doctor';
    const practice = name.trim() || 'your practice';
    const neighbor = neighborName.trim() || 'a nearby practice';
    const where = location.trim() || 'this corridor';

    const headline =
      result?.status === 'no_record_found'
        ? `I could not locate an EPA ECHO facility record for ${practice} in ${zip}.`
        : `I located an EPA ECHO record for ${practice} in ${zip}.`;

    return [
      `${who}, quick note.`,
      ``,
      `I'm running a compliance record check for practices in ${where}. ${headline}`,
      `This is not proof of a compliance issue; it usually means the record is indexed differently or the program doesn't apply. Still, it's worth verifying your manifests and documentation so you're covered.`,
      ``,
      `I'm doing a bundled pickup run on Thursday for this area (including ${neighbor}). If you'd like, I can review your current setup and help you get fully documented.`,
      ``,
      `Reply "yes" and I'll send the 2-minute intake + $${risk.shieldMonthly}/mo Shield options.`,
    ].join('\n');
  }, [doctorLastName, location, name, neighborName, result?.status, risk.shieldMonthly, zip]);

  const run = () => {
    const n = name.trim();
    const z = zip.trim();
    if (!n || !z) return;

    setUi('scanning');
    setResult(null);
    startTransition(async () => {
      const res = await checkCompliance(n, z);
      setResult(res);
      setUi(res.status);
    });
  };

  return (
    <StoneBridgeShell
      activeMode="compliance"
      title="Compliance Hunter"
      subtitle="Find negative space in public records. Verify EPA ECHO footprints by practice name + zip. If the record is missing, treat it as a lead for manual verification."
      primaryAction={null}
      secondaryAction={
        <Link
          href="/compliance-shield"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back
        </Link>
      }
      aside={
        <ProcessPanel
          steps={[
            'Find: input practice name + zip.',
            'Verify: check EPA ECHO record footprint.',
            'Leverage: package the compliance offer.',
            'Close: copy outreach note and send intake.',
          ]}
          bullets={[
            'Absence of a record is not proof of non-compliance.',
            'Use this to prioritize manual verification.',
            'Keep outreach factual and helpful.',
          ]}
          ctas={[
            { href: '/compliance-shield/report', label: 'Generate Evidence Packet', tone: 'secondary' },
            { href: '/compliance-shield', label: 'Open Compliance Shield', tone: 'primary' },
          ]}
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ghost Scanner</div>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">Practice + zip</h2>
            <p className="mt-2 text-sm text-gray-600">
              Server-side lookup against EPA ECHO. This avoids browser CORS limits.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="sm:col-span-2">
                <div className="text-sm font-medium text-gray-900">Practice Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Towson Smile Care"
                />
              </label>
              <label>
                <div className="text-sm font-medium text-gray-900">Zip Code</div>
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="21204"
                  inputMode="numeric"
                />
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              Status logic: if a matching ECHO record is returned, mark as “record found”. If not, mark as “no record found” and prioritize manual verification.
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={run}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                disabled={isPending}
              >
                {isPending ? 'Scanning…' : 'Run Ghost Check'}
              </button>
              {ui !== 'idle' ? (
                <span className="text-sm font-medium text-gray-700">
                  Current status:{' '}
                  <span className={ui === 'no_record_found' ? 'text-rose-600' : ui === 'record_found' ? 'text-emerald-600' : 'text-gray-700'}>
                    {ui}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {result ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verification</div>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {result.status === 'record_found' ? 'EPA ECHO Record Found' : result.status === 'no_record_found' ? 'No Matching Record Returned' : 'Lookup Error'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{result.note}</p>
                </div>
                <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                  Confidence: {Math.round((result.confidence ?? 0) * 100)}%
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Facility</div>
                  <div className="mt-2 text-sm font-medium text-gray-900">
                    {result.status === 'record_found' ? result.record.facName : 'EPA ID: MISSING'}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {result.status === 'record_found' ? `Registry ID: ${result.record.registryId}` : 'Last Inspection: UNKNOWN'}
                  </div>
                </div>

                <div className={`rounded-xl border p-4 ${result.status === 'no_record_found' ? 'border-rose-200 bg-rose-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Risk Assessment</div>
                  <div className="mt-2 text-sm text-gray-800">
                    {result.status === 'no_record_found' ? (
                      <>
                        <div className="font-semibold text-rose-700">UNREGISTERED RECORD FOOTPRINT (VERIFY)</div>
                        <div className="mt-1 text-xs text-rose-700">Est. liability (demo heuristic): ${money(risk.estimatedExposureMonthly)}/mo</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-emerald-700">RECORD FOOTPRINT PRESENT</div>
                        <div className="mt-1 text-xs text-gray-600">Continue with manifests + chain-of-custody review.</div>
                      </>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-700">
                    Shield option: <span className="font-semibold">${money(risk.shieldMonthly)}/mo</span>. Predictable coverage beats uncertainty.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Close Module</div>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">Generated outreach note</h2>
            <p className="mt-2 text-sm text-gray-600">Factual, helpful, and easy to send from your phone.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <div className="text-sm font-medium text-gray-900">Doctor Last Name</div>
                <input
                  value={doctorLastName}
                  onChange={(e) => setDoctorLastName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Smith"
                />
              </label>
              <label>
                <div className="text-sm font-medium text-gray-900">Neighbor Name (optional)</div>
                <input
                  value={neighborName}
                  onChange={(e) => setNeighborName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Baltimore Dental Group"
                />
              </label>
              <label className="sm:col-span-2">
                <div className="text-sm font-medium text-gray-900">Location Context</div>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Towson, MD"
                />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Script Draft</div>
              <pre className="mt-3 whitespace-pre-wrap font-forensic text-[12px] leading-5 text-gray-900">
                {outreach}
              </pre>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(outreach);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black"
                disabled={ui === 'idle'}
                title={ui === 'idle' ? 'Run a scan first' : 'Copy'}
              >
                Copy Script to Clipboard
              </button>
              <Link
                href="/compliance-shield"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Send Contract ($450/mo)
              </Link>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Note: absence in ECHO is not proof of a violation. Use this tool to prioritize verification and documentation.
            </div>
          </div>
        </div>
      </div>
    </StoneBridgeShell>
  );
}

