import Link from 'next/link';

const navItems = [
  { href: '/public-risk/dashboard', label: 'Risk Feed' },
  { href: '/public-risk/vendors', label: 'Entity Intelligence' },
  { href: '/public-risk/memo', label: 'Evidence Vault' },
];

export default function PublicRiskNavigation() {
  return (
    <nav className="w-64 shrink-0 border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-xl font-black tracking-tight text-white">STONEBRIDGE</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">OVERSIGHT ENGINE v2.0</p>
      </div>

      <div className="flex flex-col gap-2 px-4 py-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Platform</div>
        {navItems.map((item) => {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 border-l border-transparent px-3 py-2 text-sm text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-slate-500" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
