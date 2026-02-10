'use client';

import React from 'react';
import { ShieldCheck, Activity, TrendingUp } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white/95 border-r border-zinc-200/50 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="/" className="flex items-center px-4 py-2 text-zinc-700 rounded-lg hover:bg-zinc-50">
              <Activity className="h-4 w-4 mr-3 text-emerald-600" />
              Audit Engine
            </a>
          </li>
          <li>
            <a href="/deal-shield" className="flex items-center px-4 py-2 text-zinc-700 rounded-lg hover:bg-zinc-50">
              <ShieldCheck className="h-4 w-4 mr-3 text-emerald-600" />
              Deal Shield
            </a>
          </li>
          <li>
            <a href="/portfolio-stress-test" className="flex items-center px-4 py-2 text-zinc-700 rounded-lg hover:bg-zinc-50">
              <TrendingUp className="h-4 w-4 mr-3 text-blue-500" />
              Portfolio Stress-Test
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
