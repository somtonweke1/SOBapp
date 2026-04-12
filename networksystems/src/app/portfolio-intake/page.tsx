import PortfolioIntakeForm from './PortfolioIntakeForm';

export const dynamic = 'force-dynamic';

export default function PortfolioIntakePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-16 text-zinc-700">
      <div className="mx-auto max-w-5xl">
        <PortfolioIntakeForm />
      </div>
    </main>
  );
}
