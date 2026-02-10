import React from 'react';

export default function SOBDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 border-b border-slate-700 pb-6 text-center md:text-left">
        <h1 className="text-5xl font-black tracking-tighter text-blue-500">SOB<span className="text-white">app</span></h1>
        <p className="text-slate-400 mt-2 text-lg italic">Baltimore Real Estate Forensics & Infrastructure Audit</p>
      </header>

      <main className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Module 1: Water Audit */}
        <section className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl hover:border-blue-500 transition-all">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-3 text-3xl">💧</span> DPW Water Bill Audit
          </h2>
          <p className="text-sm text-slate-400 mb-6 font-mono uppercaseracking-widest">Target: $17.64 CCF Logic</p>
          <div className="space-y-4">
            <input type="number" placeholder="Total Gallons" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Total Bill Amount ($)" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-lg transition-all transform hover:scale-105">
              RUN FORENSIC AUDIT
            </button>
          </div>
        </section>

        {/* Module 2: DSCR Stress Test */}
        <section className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl hover:border-green-500 transition-all">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-3 text-3xl">📈</span> DSCR Stress-Test         </h2>
          <p className="text-sm text-slate-400 mb-6 font-mono uppercase tracking-widest">Lender Floor: 1.25</p>
          <div className="space-y-4">
            <input type="number" placeholder="Monthly Rent" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="number" placeholder="Monthly Debt (PITI)" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-lg transition-all transform hover:scale-105">
              VALIDATE DEAL FLOW
            </button>
          </div>
        </section>

        {/* 3D Engine Status */}
        <section className="md:col-span-2 bg-black h-48 rounded-2xl border border-blue-900/30 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse group-hover:bg-blue-500/10 transition-all"></div>
          <div className="z-10 text-center">
            <p className="text-blue-400 font-mono text-sm uppercase tracking-widest mb-2">MIAR 3D Network Engine</p>
            <p className="text-slate-500 text-xs">MAPPING BALTIMORE PROPERTY DISTRESS... [ONLINE]</p>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-slate-600 text-[10px] text-center uppercase tracking-widest border-t border-slate-800 pt-8">
        <p>© 2026 SOBapp & MIAR Infrastructure. All Rights Reserved. Baltimore, MD.</p>
      </footer>
    </div>
  );
}
