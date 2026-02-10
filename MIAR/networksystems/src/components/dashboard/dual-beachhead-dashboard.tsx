'use client';

import React from 'react';
import { AlertTriangle, Shield, FileText, ArrowRight, CheckCircle, Globe } from 'lucide-react';
import { Icon3D, PlantIcon3D } from '@/components/ui/icon-3d';
import Link from 'next/link';

export default function DualBeachheadDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extralight text-zinc-900 mb-3 tracking-tight">
            Supply Chain Risk Intelligence
          </h1>
          <p className="text-lg font-light text-zinc-600">
            Monitor compliance exposure and critical minerals risks across your supply chain
          </p>
        </div>

        {/* Two Threat Areas */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Threat 1: Compliance */}
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200/50 p-8 group hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-6">
              <Icon3D variant="custom" size="sm" color="rose">
                <AlertTriangle className="w-5 h-5 text-white" />
              </Icon3D>
              <div>
                <div className="text-xs font-light text-rose-600 uppercase tracking-wider mb-1">THREAT 1: COMPLIANCE</div>
                <h2 className="text-2xl font-light text-zinc-900">Entity List Exposure</h2>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-4xl font-extralight text-zinc-900">0</div>
                <div className="text-sm font-light text-zinc-500">suppliers scanned</div>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{width: '0%'}}></div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Automatic ownership tree mapping</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Real-time BIS entity list cross-reference</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Alternative supplier recommendations</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/entity-list-scanner" className="w-full">
                <button className="w-full bg-rose-600 text-white px-6 py-3 rounded-lg font-light hover:bg-rose-700 transition-colors">
                  Upload Supplier List
                </button>
              </Link>
              <Link href="/entity-list-report" className="w-full">
                <button className="w-full bg-zinc-100 text-zinc-900 px-6 py-3 rounded-lg font-light hover:bg-zinc-200 transition-colors">
                  View Sample Report
                </button>
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-200">
              <div className="text-xs font-light text-zinc-500 mb-2">Last Scan</div>
              <div className="text-sm font-light text-zinc-700">No scans yet - upload your first supplier list</div>
            </div>
          </div>

          {/* Threat 2: Critical Minerals */}
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200/50 p-8 group hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-6">
              <PlantIcon3D size="sm" color="blue" />
              <div>
                <div className="text-xs font-light text-blue-600 uppercase tracking-wider mb-1">THREAT 2: SOURCING</div>
                <h2 className="text-2xl font-light text-zinc-900">Critical Minerals Risk</h2>
              </div>
            </div>

            {/* Live Risk Scores */}
            <div className="space-y-4 mb-6">
              {[
                { mineral: 'Cobalt', risk: 7.2, color: 'rose', trend: 'up' },
                { mineral: 'Lithium', risk: 5.8, color: 'amber', trend: 'stable' },
                { mineral: 'Copper', risk: 6.1, color: 'orange', trend: 'up' },
                { mineral: 'Rare Earths', risk: 8.5, color: 'rose', trend: 'up' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-sm font-light text-zinc-700 w-24">{item.mineral}</div>
                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.color === 'rose' ? 'bg-rose-500' :
                          item.color === 'amber' ? 'bg-amber-500' :
                          item.color === 'orange' ? 'bg-orange-500' :
                          'bg-rose-500'
                        }`}
                        style={{width: `${(item.risk / 10) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-zinc-900 w-12 text-right">{item.risk}/10</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Real-time geopolitical monitoring</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>3-6 month early warnings</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-light text-zinc-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Alternative source mapping</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/supply-chain-risk" className="w-full">
                <button className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-light hover:bg-emerald-700 transition-colors">
                  View Risk Dashboard
                </button>
              </Link>
              <Link href="/risk-report" className="w-full">
                <button className="w-full bg-zinc-100 text-zinc-900 px-6 py-3 rounded-lg font-light hover:bg-zinc-200 transition-colors">
                  View Sample Risk Report
                </button>
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-200">
              <div className="text-xs font-light text-zinc-500 mb-2">Latest Alert</div>
              <div className="text-sm font-light text-zinc-700">DRC cobalt corridor - 15% increased risk (infrastructure delays)</div>
            </div>
          </div>
        </div>

        {/* Recent Activity / Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="bg-white rounded-xl shadow-md border border-zinc-200/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-zinc-600" />
              <h3 className="text-lg font-light text-zinc-900">Recent Reports</h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-light text-zinc-500">No reports yet</div>
              <Link href="/entity-list-scanner" className="text-sm text-emerald-600 hover:text-emerald-700 font-light inline-flex items-center gap-1">
                Run your first compliance scan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Alerts & Warnings */}
          <div className="bg-white rounded-xl shadow-md border border-zinc-200/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-light text-zinc-900">Active Alerts</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-900 mb-1">BIS Entity List Updated</div>
                  <div className="text-xs font-light text-amber-700">47 new entities added - scan your suppliers</div>
                </div>
              </div>
              <Link href="/entity-list-scanner" className="text-sm text-emerald-600 hover:text-emerald-700 font-light inline-flex items-center gap-1">
                Check your exposure
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Intelligence Briefings */}
          <div className="bg-white rounded-xl shadow-md border border-zinc-200/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-light text-zinc-900">Weekly Briefing</h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-light text-zinc-700 mb-2">
                Stay ahead of supply chain disruptions with curated intelligence
              </div>
              <Link href="/weekly-briefing-sample" className="text-sm text-emerald-600 hover:text-emerald-700 font-light inline-flex items-center gap-1">
                View sample briefing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 p-8">
          <h2 className="text-2xl font-light text-zinc-900 mb-4">Getting Started</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-zinc-900 mb-2">1. Check Compliance Exposure</h3>
              <p className="text-sm font-light text-zinc-600 mb-3">
                Upload your supplier list to identify hidden entity list relationships before shipments get blocked
              </p>
              <Link href="/entity-list-scanner">
                <button className="bg-rose-600 text-white px-4 py-2 rounded-lg font-light hover:bg-rose-700 transition-colors text-sm">
                  Upload Supplier List
                </button>
              </Link>
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-900 mb-2">2. Monitor Critical Minerals</h3>
              <p className="text-sm font-light text-zinc-600 mb-3">
                Track real-time risk scores for lithium, cobalt, copper, and rare earth supply chains
              </p>
              <Link href="/supply-chain-risk">
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-light hover:bg-emerald-700 transition-colors text-sm">
                  View Risk Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
