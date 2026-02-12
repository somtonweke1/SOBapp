'use client';

import Link from 'next/link';
import { Activity, ShieldCheck, TrendingUp } from 'lucide-react';

export function PublicNav() {
  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-emerald-400/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-all group-hover:scale-105 border border-emerald-400/30">
              <span className="text-emerald-100 font-semibold text-lg tracking-wide">S</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-semibold tracking-tight text-emerald-100 group-hover:text-emerald-300 transition-colors">SOBapp</span>
              <p className="text-xs font-light text-emerald-200/70 group-hover:text-emerald-300 transition-colors">Baltimore Forensics</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/audit"
              className="hidden md:flex items-center gap-2 text-sm font-light text-emerald-200/80 hover:text-emerald-300 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Audit Engine
            </Link>

            <Link
              href="/deal-shield"
              className="hidden md:flex items-center gap-2 text-sm font-light text-emerald-200/80 hover:text-emerald-300 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Deal Shield
            </Link>

            <Link
              href="/portfolio-stress-test"
              className="hidden md:flex items-center gap-2 text-sm font-light text-emerald-200/80 hover:text-emerald-300 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Portfolio Stress-Test
            </Link>

            {/* Book Demo CTA */}
            <Link
              href="/claims"
              className="px-4 py-2 border border-emerald-400/50 bg-emerald-500/10 text-emerald-100 text-sm font-light rounded-lg hover:bg-emerald-500/20 transition-colors shadow-md hover:shadow-lg"
            >
              Start Free Forensic Audit
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
