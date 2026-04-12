'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/internal-ops/dashboard', label: 'Risk Feed' },
  { href: '/dashboard/patterns', label: 'Pattern Library' },
  { href: '/dashboard/portfolio', label: 'Portfolio Intakes' },
  { href: '/dashboard/portfolio-uploads', label: 'Portfolio Uploads' },
  { href: '/dashboard/pilot', label: 'Pilot Programs' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/pricing', label: 'Pricing' },
  { href: '/internal-ops/fix-sprint', label: 'Fix Sprint' },
  { href: '/internal-ops/emergency-validator', label: 'Emergency Validator' },
  { href: '/internal-ops/dossier-builder', label: 'Dossier Builder' },
  { href: '/internal-ops/hooks', label: 'Outreach Hooks' },
  { href: '/internal-ops/vendors', label: 'Entity Intelligence' },
  { href: '/internal-ops/memo', label: 'Evidence Vault' },
];

export default function InternalOpsNavigation() {
  const pathname = usePathname() || '';

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-6 px-6 py-4">
        <div>
          <h1 className="text-xl font-extralight tracking-wide text-zinc-900">STONEBRIDGE</h1>
          <p className="text-xs font-light uppercase tracking-[0.2em] text-zinc-500">Oversight Engine v2.0</p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-zinc-200/50 bg-white/60 p-1 backdrop-blur-sm shadow-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-light transition-colors ${
                  isActive ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-white hover:text-zinc-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
