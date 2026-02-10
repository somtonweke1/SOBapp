'use client';

import React from 'react';
import { ShieldCheck, Activity, TrendingUp } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="/" className="flex items-center px-4 py-2 text-slate-200 rounded-lg hover:bg-slate-900">
              <Activity className="h-4 w-4 mr-3 text-blue-400" />
              Audit Engine
            </a>
          </li>
          <li>
            <a href="/deal-shield" className="flex items-center px-4 py-2 text-slate-200 rounded-lg hover:bg-slate-900">
              <ShieldCheck className="h-4 w-4 mr-3 text-emerald-400" />
              Deal Shield
            </a>
          </li>
          <li>
            <a href="/portfolio-stress-test" className="flex items-center px-4 py-2 text-slate-200 rounded-lg hover:bg-slate-900">
              <TrendingUp className="h-4 w-4 mr-3 text-blue-400" />
              Portfolio Stress-Test
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
