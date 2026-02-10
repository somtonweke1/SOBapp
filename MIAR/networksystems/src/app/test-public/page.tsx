export default function TestPublicPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Public Access Test</h1>
        <p className="text-zinc-600">This page should be accessible to everyone without authentication.</p>
        <p className="text-zinc-500 mt-4">If you can see this, public access is working!</p>
      </div>
    </div>
  );
}