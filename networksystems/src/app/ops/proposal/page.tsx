import VendorBleedChart from '@/components/ops/vendor-bleed-chart';
import { fetchHighBleedVendors } from '@/lib/data-sources';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function OpsProposalPage({
  searchParams,
}: {
  searchParams?: {
    draftId?: string;
    generatedAt?: string;
    key?: string;
    address?: string;
    owner?: string;
    caseId?: string;
    lienTotal?: string;
    lastSalePrice?: string;
  };
}) {
  const bleedVendors = await fetchHighBleedVendors();
  const totalPenalty = bleedVendors.reduce((sum, vendor) => sum + vendor.penaltyTotal, 0);
  const draftId = searchParams?.draftId;
  const generatedAt = searchParams?.generatedAt;
  const accessKey = process.env.OPS_ACCESS_KEY;
  const providedKey = searchParams?.key;
  const targetAddress = searchParams?.address;
  const targetOwner = searchParams?.owner;
  const targetCaseId = searchParams?.caseId;
  const targetLienTotal = searchParams?.lienTotal ? Number(searchParams.lienTotal) : null;
  const targetSalePrice = searchParams?.lastSalePrice ? Number(searchParams.lastSalePrice) : null;

  if (accessKey && providedKey !== accessKey) {
    return (
      <div className="min-h-screen bg-white text-slate-900 px-6 py-12">
        <div className="mx-auto max-w-xl border border-slate-200 bg-white p-10 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Restricted Access</p>
          <h1 className="mt-4 text-2xl font-serif font-semibold text-slate-900">
            Access Key Required
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This audit is gated. Provide a valid access key to view the report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 py-12">
      <div className="mx-auto max-w-4xl border border-slate-200 bg-white p-10 shadow-2xl">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Restricted: Operational Audit</p>
          <h1 className="mt-4 text-3xl font-serif font-semibold text-slate-900">
            OPERATIONAL DEADLOCK REPORT
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Institutional audit of late-fee and interest leakage in Baltimore procurement payments.
          </p>
          {(draftId || generatedAt) && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
              <p><strong>Draft ID:</strong> {draftId || 'AUTO-GEN'}</p>
              <p><strong>Generated:</strong> {generatedAt || 'NOW'}</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Bleed</p>
            <p className="mt-3 text-lg font-serif text-slate-900">
              Analysis of Open Checkbook data identifies {formatCurrency(totalPenalty)} in avoidable
              late fees and statutory 9% interest paid to target vendors in FY24.
            </p>
          </div>

          {targetAddress && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Targeted Strike Profile</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p><strong>Address:</strong> {targetAddress}</p>
                {targetOwner && <p><strong>Target Entity:</strong> {targetOwner}</p>}
                {targetCaseId && <p><strong>311 Case:</strong> {targetCaseId}</p>}
                {targetLienTotal !== null && (
                  <p><strong>Lien Exposure:</strong> {formatCurrency(targetLienTotal)}</p>
                )}
                {targetSalePrice !== null && (
                  <p><strong>Last Sale Price:</strong> {formatCurrency(targetSalePrice)}</p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Financial Evidence</p>
            <div className="mt-4">
              <VendorBleedChart data={bleedVendors} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Friction</p>
              <p className="mt-3 text-sm text-slate-700">
                Existing procurement cycles lag behind utility billing windows by 14 days, triggering
                late fees and statutory interest accrual under Maryland payment rules.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">The Abatement</p>
              <p className="mt-3 text-sm text-slate-700">
                SOBapp Deployment: Automated middleware to sync billing cycles, reconcile invoices,
                and eliminate penalty exposure.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Service Agreement</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <p><strong>Objective:</strong> Eliminate logistical lag and clerical interest fees.</p>
              <p><strong>Deliverable:</strong> Custom SOBapp middleware script.</p>
              <p><strong>Cost:</strong> $50,000 (Fixed Fee).</p>
              <p><strong>Projected ROI:</strong> 400% in Year 1.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 text-slate-500">
              <svg viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg" role="img">
                <rect x="0" y="0" width="220" height="60" fill="none" />
                <path d="M16 44V20l18 12 18-12v24" fill="none" stroke="#0f172a" strokeWidth="3" />
                <path d="M6 20h48" stroke="#0f172a" strokeWidth="3" />
                <circle cx="40" cy="14" r="4" fill="#0f172a" />
                <text x="70" y="28" fontSize="16" fontFamily="Times New Roman, serif" fill="#0f172a" letterSpacing="1.4">
                  HARBOR BANK
                </text>
                <text x="70" y="46" fontSize="10" fontFamily="Times New Roman, serif" fill="#64748b" letterSpacing="1.8">
                  INSTITUTIONAL CLEARINGHOUSE
                </text>
              </svg>
            </div>
            <span>Restricted distribution. For institutional review only.</span>
          </div>
          <span>SOBapp Forensic Shield</span>
        </div>
      </div>
      <a
        href={`/api/pdf/generate${accessKey ? `?key=${encodeURIComponent(accessKey)}` : ''}${
          targetAddress
            ? `${accessKey ? '&' : '?'}address=${encodeURIComponent(targetAddress)}${targetOwner ? `&owner=${encodeURIComponent(targetOwner)}` : ''}${targetCaseId ? `&caseId=${encodeURIComponent(targetCaseId)}` : ''}${targetLienTotal !== null ? `&lienTotal=${encodeURIComponent(targetLienTotal)}` : ''}${targetSalePrice !== null ? `&lastSalePrice=${encodeURIComponent(targetSalePrice)}` : ''}`
            : ''
        }`}
        className="fixed bottom-6 right-6 rounded-full border border-slate-900 bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg"
      >
        Lock & Download Audit
      </a>
    </div>
  );
}
