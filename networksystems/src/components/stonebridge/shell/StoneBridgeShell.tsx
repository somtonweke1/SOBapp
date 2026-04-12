'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export type ModeKey = 'asset' | 'compliance' | 'recon';

function RadarIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function ModeToggle({ active }: { active?: ModeKey }) {
  const activeBorder = active === 'compliance' ? 'border-indigo-600' : 'border-emerald-600';

  return (
    <nav className="hidden items-center gap-8 md:flex">
      <Link
        href="/recon"
        className={`inline-flex items-center gap-2 border-b-2 py-5 text-sm font-medium transition-colors ${
          active === 'recon' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        <RadarIcon className="h-4 w-4" />
        Recon / Radar
      </Link>
      <Link
        href="/audit?mode=asset"
        className={`border-b-2 py-5 text-sm font-medium transition-colors ${
          active === 'asset' ? `${activeBorder} text-gray-900` : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        Asset Shield (Landlord)
      </Link>
      <Link
        href="/audit?mode=compliance"
        className={`border-b-2 py-5 text-sm font-medium transition-colors ${
          active === 'compliance' ? `${activeBorder} text-gray-900` : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        Compliance Shield (Tenant)
      </Link>
    </nav>
  );
}

export default function StoneBridgeShell({
  activeMode,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  children,
  aside,
}: {
  activeMode?: ModeKey;
  title?: string;
  subtitle?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const badgeColor = activeMode === 'compliance' ? 'bg-indigo-600' : 'bg-emerald-600';
  const activeBorder = activeMode === 'compliance' ? 'border-indigo-600' : 'border-emerald-600';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-md ${badgeColor}`} />
            <span className="font-bold tracking-tight text-gray-900">StoneBridge</span>
          </Link>

          <ModeToggle active={activeMode} />

          <div className="flex items-center gap-3">
            <Link
              href={activeMode === 'compliance' ? '/audit?mode=compliance' : '/audit?mode=asset'}
              className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:inline-flex"
            >
              New Scan
            </Link>
            {secondaryAction}
            {primaryAction}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${badgeColor} text-xs font-medium text-white`}
              title={activeMode === 'compliance' ? 'Compliance Shield' : activeMode === 'recon' ? 'Recon Radar' : 'Asset Shield'}
            >
              SB
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
            <div className={`mt-4 h-px w-full ${activeBorder}`} />
          </div>
        )}

        {aside ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">{children}</div>
            <aside className="lg:col-span-4">{aside}</aside>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
