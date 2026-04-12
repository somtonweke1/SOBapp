import PortfolioUploadForm from './PortfolioUploadForm';

export const dynamic = 'force-dynamic';

export default function PortfolioUploadPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-16 text-zinc-700">
      <div className="mx-auto max-w-4xl">
        <PortfolioUploadForm />
      </div>
    </main>
  );
}
