'use client';

import Link from 'next/link';
import { Activity, ShieldCheck, TrendingUp } from 'lucide-react';

export function PublicNav() {
  return (
    <nav className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-400 transition-all group-hover:scale-105">
              <span className="text-white font-semibold text-lg tracking-wide">S</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-semibold tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors">SOBapp</span>
              <p className="text-xs font-light text-slate-400 group-hover:text-blue-400 transition-colors">Baltimore Real Estate Forensics</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 text-sm font-light text-slate-200 hover:text-blue-400 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Audit Engine
            </Link>

            <Link
              href="/deal-shield"
              className="hidden md:flex items-center gap-2 text-sm font-light text-slate-200 hover:text-blue-400 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Deal Shield
            </Link>

            <Link
              href="/portfolio-stress-test"
              className="hidden md:flex items-center gap-2 text-sm font-light text-slate-200 hover:text-blue-400 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Portfolio Stress-Test
            </Link>

            {/* Book Demo CTA */}
            <Link
              href="mailto:somton@jhu.edu"
              className="px-4 py-2 bg-blue-500 text-white text-sm font-light rounded-lg hover:bg-blue-400 transition-colors shadow-md hover:shadow-lg"
            >
              Book Demo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
