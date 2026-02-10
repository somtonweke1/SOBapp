'use client';

import React from 'react';
import {
  ArrowRight,
  Droplet,
  Shield,
  Package,
  Waves,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function UnifiedMIARLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                <span className="text-white font-extralight text-xl tracking-wide">M</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-extralight tracking-tight text-zinc-900">MIAR</span>
                <p className="text-xs font-light text-zinc-500">Compliance Intelligence Engine</p>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link
                href="/pfas-scanner"
                className="hidden md:block text-sm font-light text-zinc-700 hover:text-emerald-600 transition-colors"
              >
                PFAS Scanner
              </Link>
              <Link
                href="/entity-list-scanner"
                className="hidden md:block text-sm font-light text-zinc-700 hover:text-emerald-600 transition-colors"
              >
                BIS Scanner
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-light">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-32 px-6 bg-gradient-to-br from-blue-50/50 to-emerald-50/50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-light mb-6">
            <Droplet className="w-4 h-4" />
            PFAS Flow Intelligence Platform
          </div>
          <h1 className="text-6xl md:text-7xl font-extralight tracking-tight text-zinc-900 mb-8">
            Track PFAS Contamination
            <span className="block text-5xl md:text-6xl font-extralight mt-4 bg-gradient-to-r from-blue-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent pb-2">
              From Water to Food to People
            </span>
          </h1>

          <p className="text-xl font-light text-zinc-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            The primary human PFAS exposure isn't from drinking water—it's from food. We model contamination flow through
            water systems, agricultural irrigation, and food supply chains to predict and prevent population-level exposure.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/pfas-flow-intelligence">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                Explore Flow Intelligence
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pfas-scanner">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-zinc-300 hover:border-blue-600 hover:text-blue-700">
                Run Free Analysis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extralight tracking-tight text-zinc-900 mb-4">
              Three Critical Applications
            </h2>
            <p className="text-xl font-light text-zinc-600">
              One intelligence platform. Water utilities, food supply chains, and critical infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Water Utilities */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4">
                <Droplet className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Municipal Water Safety</h3>
              <p className="text-zinc-600 font-light leading-relaxed mb-4">
                EPA PFAS compliance for 6,000+ water systems. Predict breakthrough, estimate treatment costs.
              </p>
              <div className="text-sm text-zinc-500">Water utilities • Environmental consultants</div>
            </Card>

            {/* Food Supply Chain */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-emerald-200">
              <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Food Supply Chain Risk</h3>
              <p className="text-zinc-600 font-light leading-relaxed mb-4">
                Track PFAS from irrigation water through crops and food processing. Protect brand reputation.
              </p>
              <div className="text-sm text-zinc-500">Agribusiness • Food processors • Commodity traders</div>
            </Card>

            {/* Data Centers */}
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-purple-50 rounded-xl w-fit mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">AI Infrastructure Protection</h3>
              <p className="text-zinc-600 font-light leading-relaxed mb-4">
                Guarantee ultra-pure cooling water for data centers. PFAS threatens AI infrastructure.
              </p>
              <div className="text-sm text-zinc-500">Hyperscalers • Colocation • Semiconductors</div>
            </Card>
          </div>

          {/* Feature PFAS Scanner */}
          <div className="max-w-4xl mx-auto">
            <Link href="/pfas-scanner">
              <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer group bg-gradient-to-br from-blue-50 to-white border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Droplet className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    LIVE
                  </div>
                </div>
                <h3 className="text-2xl font-light text-zinc-900 mb-3">
                  PFAS Compliance
                </h3>
                <p className="text-zinc-600 font-light leading-relaxed mb-4">
                  EPA compliance analysis for water treatment systems. GAC capacity estimation,
                  breakthrough prediction, risk scoring.
                </p>
                <div className="text-blue-600 font-light group-hover:underline inline-flex items-center">
                  Launch Scanner <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* BIS */}
            <Link href="/entity-list-scanner">
              <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <Shield className="w-8 h-8 text-rose-600" />
                  </div>
                  <div className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">
                    LIVE
                  </div>
                </div>
                <h3 className="text-2xl font-light text-zinc-900 mb-3">
                  BIS Export Controls
                </h3>
                <p className="text-zinc-600 font-light leading-relaxed mb-4">
                  Automated entity list screening with ownership structure mapping.
                  Flags compliance risks across supplier networks.
                </p>
                <div className="text-rose-600 font-light group-hover:underline inline-flex items-center">
                  Launch Scanner <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </Card>
            </Link>

            {/* Materials Provenance */}
            <Card className="p-8 opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-zinc-100 rounded-xl">
                  <Package className="w-8 h-8 text-zinc-600" />
                </div>
                <div className="px-3 py-1 bg-zinc-200 text-zinc-700 text-xs font-medium rounded-full">
                  COMING SOON
                </div>
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-3">
                Materials Provenance
              </h3>
              <p className="text-zinc-600 font-light leading-relaxed">
                Critical minerals tracking from mine to final product. Conflict-free sourcing,
                ESG compliance verification.
              </p>
            </Card>

            {/* Water Infrastructure */}
            <Card className="p-8 opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-zinc-100 rounded-xl">
                  <Waves className="w-8 h-8 text-zinc-600" />
                </div>
                <div className="px-3 py-1 bg-zinc-200 text-zinc-700 text-xs font-medium rounded-full">
                  COMING SOON
                </div>
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-3">
                Water Infrastructure
              </h3>
              <p className="text-zinc-600 font-light leading-relaxed">
                Full EPA/state water quality compliance beyond PFAS. SDWA, CWA,
                NPDES permit tracking with real-time alerts.
              </p>
            </Card>
          </div>

          {/* Supply Chain - Full Width */}
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="p-8 opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-zinc-100 rounded-xl">
                  <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <div className="px-3 py-1 bg-zinc-200 text-zinc-700 text-xs font-medium rounded-full">
                  COMING SOON
                </div>
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-3">
                Supply Chain Transparency Reporting
              </h3>
              <p className="text-zinc-600 font-light leading-relaxed">
                Auto-generate Scope 3 emissions, CSRD disclosures, California SB-253 reports.
                Ingest supplier data, calculate carbon footprint, produce audit-ready documentation.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* The Architecture */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extralight tracking-tight text-zinc-900 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6 text-left">
            <Card className="p-6 border-l-4 border-blue-500">
              <h3 className="font-light text-zinc-900 mb-2">1. Ingest</h3>
              <p className="text-sm text-zinc-600 font-light leading-relaxed">
                Material certificates, SDS sheets, supplier declarations, lab reports
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-emerald-500">
              <h3 className="font-light text-zinc-900 mb-2">2. Graph</h3>
              <p className="text-sm text-zinc-600 font-light leading-relaxed">
                Build dependency tree: chemicals → components → assemblies → products
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-amber-500">
              <h3 className="font-light text-zinc-900 mb-2">3. Evaluate</h3>
              <p className="text-sm text-zinc-600 font-light leading-relaxed">
                Rules engine applies PFAS, BIS, TSCA, REACH regulations across graph
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-rose-500">
              <h3 className="font-light text-zinc-900 mb-2">4. Verify</h3>
              <p className="text-sm text-zinc-600 font-light leading-relaxed">
                Auto-flag non-compliance, suggest alternatives, generate audit reports
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extralight tracking-tight text-zinc-900 mb-6">
            Why Now
          </h2>
          <p className="text-xl font-light text-zinc-600 mb-12 max-w-2xl mx-auto">
            Regulations are accelerating faster than manufacturing ERP systems can adapt.
            Manual compliance is no longer tenable.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-extralight text-rose-600 mb-2">$25k/day</div>
              <p className="text-sm text-zinc-600 font-light">EPA violation fines</p>
            </div>
            <div>
              <div className="text-3xl font-extralight text-amber-600 mb-2">3-6 months</div>
              <p className="text-sm text-zinc-600 font-light">Product release delays</p>
            </div>
            <div>
              <div className="text-3xl font-extralight text-blue-600 mb-2">Weekly</div>
              <p className="text-sm text-zinc-600 font-light">BIS entity list updates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-zinc-500 font-light">
          <p>MIAR - Compliance Intelligence Engine</p>
        </div>
      </footer>
    </div>
  );
}
