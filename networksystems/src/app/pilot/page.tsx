import { prisma } from '@/lib/prisma';
import PilotSubmissionForm from './PilotSubmissionForm';

export const dynamic = 'force-dynamic';

export default async function PilotPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const tokenValue = searchParams?.token?.trim() || '';
  const token = tokenValue
    ? await prisma.pilotAccessToken.findUnique({
        where: { token: tokenValue },
      })
    : null;

  const initialInstitutionName = token?.institution_name || '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-16 text-zinc-700">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-[2rem] border border-zinc-200/70 bg-zinc-950 px-8 py-10 text-white shadow-xl shadow-zinc-900/10">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-300">StoneBridge Pilot Program</p>
          <h1 className="mt-3 text-4xl font-extralight tracking-tight">Submit a Baltimore property for risk screening.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            Results delivered within 24 hours. Use this page to route a live Baltimore property into the StoneBridge
            pilot workflow.
          </p>
        </div>

        <PilotSubmissionForm token={tokenValue} initialInstitutionName={initialInstitutionName} />
      </div>
    </main>
  );
}
