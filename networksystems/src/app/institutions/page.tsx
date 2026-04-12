import Link from 'next/link';

export const dynamic = 'force-dynamic';

const buyerTypes = [
  'CDFIs screening acquisition and rehab pipelines',
  'Nonprofit developers managing multiple Baltimore assets',
  'Lenders underwriting Baltimore acquisition and construction risk',
  'City agencies running portfolio assessments before grant or subsidy deployment',
  'Community banks evaluating structural exposure across local deal flow',
];

const valueProps = [
  'Portfolio-level structural risk screening before capital is deployed',
  'Synthesizes fragmented public infrastructure, property, utility, and procurement signals into one underwriting view',
  'Flags issues that are easy to miss when public systems are reviewed one at a time',
  'Supports early-stage risk management before approval, closing, or grant commitment',
];

export default function InstitutionsPage() {
  return (
    <main className="min-h-screen bg-[#0d1f2d] px-6 py-16 text-[#f5f1ea]">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-10 border-b border-[#c49a3c]/20 pb-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c49a3c]">Institutional Screening</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-tight">
              Portfolio-level structural risk screening before capital is deployed.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#8a9baa]">
              StoneBridge is built for institutional buyers evaluating Baltimore assets across acquisition, rehab,
              underwriting review, and portfolio assessment. The goal is not a marketing memo for one borrower. The
              goal is earlier risk visibility before a loan is approved, before a grant is released, and before a
              portfolio absorbs hidden structural exposure.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#c49a3c]/20 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c49a3c]">Institution Types</p>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#f5f1ea]">
              {buyerTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </header>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          {valueProps.map((item) => (
            <article key={item} className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <p className="text-sm leading-7 text-[#f5f1ea]">{item}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c49a3c]">Why Institutions Use This</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f1ea]">
              Underwriting blind spots usually live between systems.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#8a9baa]">
              Baltimore asset risk is rarely visible in a single place. Title, utility pressure, property distress,
              infrastructure friction, and public-sector adjacency often sit in separate systems and get reviewed in
              fragments. StoneBridge collapses that fragmentation into an early-stage screening layer for risk management
              teams and portfolio decision-makers.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#8a9baa]">
              This is designed to support internal review before loan committee, before acquisition close, and before
              subsidy or grant capital is committed to a portfolio that has not been screened structurally.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#c49a3c]/20 bg-[#11293c] p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c49a3c]">Example Buyer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f1ea]">
              Community banks are the wedge account.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#8a9baa]">
              A community bank such as Harbor Bank of Maryland can use StoneBridge as a pre-commitment screening layer
              across multiple Baltimore deals, not just one borrower engagement. That creates repeat institutional
              volume, stronger underwriting consistency, and a cleaner risk management process across local deal flow.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-[#c49a3c]/20 bg-[#11293c] p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[#c49a3c]">CTA</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f1ea]">
            Submit a Baltimore portfolio for screening.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8a9baa]">
            If you are reviewing multiple acquisitions, rehabs, or underwriting files, submit the properties and timing.
            StoneBridge will route the request into the institutional intake workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/portfolio-intake"
              className="inline-flex items-center rounded-xl bg-[#c49a3c] px-5 py-3 text-sm font-semibold text-[#0d1f2d]"
            >
              Start Portfolio Intake
            </Link>
            <Link
              href="/truth/maryland-procurement"
              className="inline-flex items-center rounded-xl border border-[#c49a3c]/40 px-5 py-3 text-sm font-semibold text-[#f5f1ea]"
            >
              Review Evidence Standard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
