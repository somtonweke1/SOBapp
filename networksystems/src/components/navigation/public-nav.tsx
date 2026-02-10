'use client';

import Link from 'next/link';
import { Droplet, Zap } from 'lucide-react';

export function PublicNav() {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-all group-hover:scale-105">
              <span className="text-white font-extralight text-xl tracking-wide">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-extralight tracking-tight text-zinc-900 group-hover:text-blue-600 transition-colors">MIAR</span>
              <p className="text-xs font-light text-zinc-500 group-hover:text-blue-600 transition-colors">PFAS Intelligence Platform</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/pfas-flow-intelligence"
              className="hidden md:flex items-center gap-2 text-sm font-light text-zinc-700 hover:text-blue-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Flow Intelligence
            </Link>

            <Link
              href="/pfas-scanner"
              className="hidden md:flex items-center gap-2 text-sm font-light text-zinc-700 hover:text-blue-600 transition-colors"
            >
              <Droplet className="w-4 h-4" />
              Compliance Scanner
            </Link>

            {/* Book Demo CTA */}
            <Link
              href="mailto:somton@jhu.edu"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-light rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Book Demo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
