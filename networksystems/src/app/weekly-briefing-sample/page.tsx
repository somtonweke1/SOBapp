'use client';

import React from 'react';
import { PublicNav} from '@/components/navigation/public-nav';
import { AlertTriangle, TrendingUp, TrendingDown, MapPin, DollarSign, Zap, Shield, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WeeklyBriefingSample() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <PublicNav />
      {/* Email Header */}
      <div className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="bg-blue-500 text-white px-4 py-2 text-sm font-semibold tracking-wide rounded inline-block mb-3">
                SOBapp
              </div>
              <h1 className="text-2xl font-semibold text-slate-100">Weekly Baltimore Property Distress Briefing</h1>
              <p className="text-sm text-slate-400 font-light mt-1">Week of January 22, 2025 • Delivered to 2,847 Baltimore property operators</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-light">Overall Distress</div>
              <div className="text-3xl font-semibold text-amber-400">6.8</div>
              <div className="text-xs text-amber-300 font-light">↑ +0.3 from last week</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Executive Summary */}
        <Card className="p-8 bg-black/60 border-slate-800">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-slate-900 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Critical Alert: DPW Water Billing Anomaly</h2>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                Billing spikes across South Baltimore show 15% elevated exposure vs baseline.
                Estimated portfolio exposure: <span className="font-medium text-amber-300">$2.3M across affected blocks</span>.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center bg-slate-900/60 rounded-lg p-4">
            <div>
              <div className="text-lg font-light text-slate-100">18-25 days</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-light">Correction Window</div>
            </div>
            <div>
              <div className="text-lg font-light text-amber-300">HIGH</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-light">Distress Level</div>
            </div>
            <div>
              <div className="text-lg font-light text-slate-100">Feb 8-12</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-light">Resolution Target</div>
            </div>
          </div>
        </Card>

        {/* Risk Score Updates */}
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 mb-6">This Week's Risk Score Changes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-light text-zinc-900">Cobalt</h3>
                  <div className="flex items-center gap-2 text-sm font-light text-zinc-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    Primary: DRC (70% global supply)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extralight text-rose-600">7.8</div>
                  <div className="flex items-center gap-1 text-xs text-rose-500 font-light">
                    <TrendingUp className="w-3 h-3" />
                    +0.6
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200/50">
                <p className="text-sm font-light text-zinc-700">
                  Rail terminal congestion + political tensions in Katanga province. Recommend diversification to Zambian routes.
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-light text-zinc-900">Lithium</h3>
                  <div className="flex items-center gap-2 text-sm font-light text-zinc-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    Primary: Chile/Australia
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extralight text-amber-600">6.1</div>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-light">
                    <TrendingDown className="w-3 h-3" />
                    -0.3
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200/50">
                <p className="text-sm font-light text-zinc-700">
                  Chilean water restrictions eased. Australian production capacity increased 8%. Pricing stabilizing at $22,400/tonne.
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-light text-zinc-900">Copper</h3>
                  <div className="flex items-center gap-2 text-sm font-light text-zinc-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    Primary: Zambia/Chile
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extralight text-amber-600">6.3</div>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-light">
                    <TrendingUp className="w-3 h-3" />
                    +0.2
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200/50">
                <p className="text-sm font-light text-zinc-700">
                  Energy costs in Zambian operations increased 12%. Monitor Q1 production reports for volume impacts.
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-light text-zinc-900">Rare Earths</h3>
                  <div className="flex items-center gap-2 text-sm font-light text-zinc-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    Primary: China (60% processing)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extralight text-rose-600">8.2</div>
                  <div className="flex items-center gap-1 text-xs text-rose-500 font-light">
                    <TrendingUp className="w-3 h-3" />
                    +0.1
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200/50">
                <p className="text-sm font-light text-zinc-700">
                  Export control discussions ongoing. Recommend securing 90-day buffer inventory for defense applications.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Market Intelligence */}
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 mb-6">Price & Market Movements</h2>
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-light text-zinc-900">Commodities</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span className="text-sm font-light text-zinc-700">Lithium Carbonate</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-900">$22,400/t</div>
                      <div className="text-xs text-emerald-600">+2.1%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span className="text-sm font-light text-zinc-700">Cobalt Metal</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-900">$29,850/t</div>
                      <div className="text-xs text-rose-600">-1.3%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span className="text-sm font-light text-zinc-700">Copper Cathode</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-900">$8,975/t</div>
                      <div className="text-xs text-emerald-600">+0.8%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span className="text-sm font-light text-zinc-700">NdPr Oxide (REE)</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-900">$68,200/t</div>
                      <div className="text-xs text-rose-600">-0.5%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-light text-zinc-900">Key Developments</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200/50">
                    <div className="text-xs text-blue-600 uppercase tracking-wider font-light mb-1">Infrastructure</div>
                    <p className="text-sm font-light text-zinc-700">New Mozambique port capacity opening Q2 2025 - 18% cost reduction for East African ops</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/50">
                    <div className="text-xs text-emerald-600 uppercase tracking-wider font-light mb-1">Supply</div>
                    <p className="text-sm font-light text-zinc-700">Australian lithium mine expansion adds 40,000 tpa capacity by Q3 2025</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/50">
                    <div className="text-xs text-amber-600 uppercase tracking-wider font-light mb-1">Policy</div>
                    <p className="text-sm font-light text-zinc-700">EU Critical Raw Materials Act implementation timeline confirmed - May impact sourcing requirements</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Strategic Recommendations */}
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 mb-6">This Week's Strategic Actions</h2>
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">Priority 1: Diversify Cobalt Sourcing</h3>
                  <p className="text-sm text-zinc-600 font-light mb-4">
                    Current DRC bottleneck creates unacceptable risk for Q2 battery production. Initiate conversations with Zambian suppliers via Durban routes.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Timeline</div>
                      <div className="font-medium text-zinc-900">Immediate</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Cost Impact</div>
                      <div className="font-medium text-emerald-600">+$180/t (acceptable)</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Risk Reduction</div>
                      <div className="font-medium text-emerald-600">-2.5 risk score</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">Priority 2: Lock Lithium Pricing Window</h3>
                  <p className="text-sm text-zinc-600 font-light mb-4">
                    Current market stabilization creates favorable 72-hour contracting window. Consider hedging 6-month requirements at $22,400/t.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Timeline</div>
                      <div className="font-medium text-zinc-900">48-72 hours</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Potential Savings</div>
                      <div className="font-medium text-blue-600">$1.2M (if prices rise)</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Confidence</div>
                      <div className="font-medium text-blue-600">73% upward trend</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">Priority 3: Increase REE Buffer Inventory</h3>
                  <p className="text-sm text-zinc-600 font-light mb-4">
                    Chinese export control discussions warrant caution. Recommend increasing buffer from 30 to 90 days for defense-critical applications.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Timeline</div>
                      <div className="font-medium text-zinc-900">30 days</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Additional Cost</div>
                      <div className="font-medium text-amber-600">$850K inventory</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-light">Risk Mitigation</div>
                      <div className="font-medium text-emerald-600">High value</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Value of Weekly Intelligence */}
        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-zinc-900 mb-2">Value of Continuous Market Intelligence</h2>
              <p className="text-sm text-zinc-700 font-light leading-relaxed">
                Weekly briefings enable <span className="font-medium">sequential decision optimization</span> - each update refines procurement strategy as market conditions evolve.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* This Week's Decision Impact */}
            <div className="bg-white rounded-xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">This Week's Alert Value</div>
              <div className="text-2xl font-light text-emerald-600 mb-1">$12-18M</div>
              <div className="text-xs text-zinc-600 font-light mb-3">
                Avoided cost from early DRC cobalt disruption warning
              </div>
              <div className="space-y-1 text-xs text-zinc-500 font-light">
                <div>• 18-25 day lead time to adjust</div>
                <div>• Alternative routing identified</div>
                <div>• Emergency premium avoided</div>
              </div>
            </div>

            {/* Cumulative Annual Value */}
            <div className="bg-white rounded-xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">Cumulative EVSI (Annual)</div>
              <div className="text-2xl font-light text-emerald-600 mb-1">$85-120M</div>
              <div className="text-xs text-zinc-600 font-light mb-3">
                Expected value from 52 weekly intelligence cycles
              </div>
              <div className="space-y-1 text-xs text-zinc-500 font-light">
                <div>• ~$1.6-2.3M avg per briefing</div>
                <div>• 8-12 high-impact alerts/year</div>
                <div>• Proactive vs. reactive sourcing</div>
              </div>
            </div>

            {/* Subscription Economics */}
            <div className="bg-white rounded-xl p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">Intelligence Cost</div>
              <div className="text-2xl font-light text-zinc-900 mb-1">$36K/year</div>
              <div className="text-xs text-zinc-600 font-light mb-3">
                Weekly briefing + quarterly deep-dives
              </div>
              <div className="space-y-1 text-xs text-zinc-500 font-light">
                <div>• Net benefit: $85-120M - $36K</div>
                <div>• ROI: 2,360x - 3,330x</div>
                <div>• Per-decision basis: 115x avg ROI</div>
              </div>
            </div>
          </div>

          {/* Information Quality Note */}
          <div className="mt-6 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <div className="text-sm font-medium text-zinc-900">Forecasting Quality: Market Research-Grade</div>
            </div>
            <div className="text-xs text-zinc-700 font-light leading-relaxed">
              Our intelligence reduces procurement uncertainty through continuous monitoring of 147 critical supply routes,
              real-time geopolitical analysis, and predictive disruption modeling. <span className="font-medium">Sequential decision value</span>: Each
              weekly update allows dynamic contract adjustments, inventory rebalancing, and supplier diversification before
              disruptions impact operations.
            </div>
          </div>
        </Card>

        {/* Footer CTA */}
        <Card className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-extralight mb-4">Need Deeper Analysis for Your Specific Projects?</h2>
            <p className="text-zinc-300 font-light mb-6 max-w-2xl mx-auto">
              Get a comprehensive custom risk assessment tailored to your critical mineral supply chains, including alternative sourcing recommendations and cost impact scenarios.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/risk-report">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
                  View Sample Report
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="mailto:somton@jhu.edu?subject=Custom Risk Assessment Request">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Request Custom Assessment
                </Button>
              </a>
            </div>
            <p className="text-sm text-zinc-400 font-light mt-6">
              $5,000 per assessment • 2-week delivery • Trusted by Fortune 500 energy companies
            </p>
          </div>
        </Card>

        {/* Email Footer */}
        <div className="text-center pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-400 font-light mb-4">
            You're receiving this briefing because you subscribed at{' '}
            <Link href="/supply-chain-risk" className="text-emerald-400 hover:underline">
              networksystems.vercel.app/supply-chain-risk
            </Link>
          </p>
          <p className="text-xs text-slate-500 font-light">
            SOBapp - Baltimore Infrastructure Forensics<br />
            Baltimore Property Intelligence Lab<br />
            Baltimore, MD 21218
          </p>
        </div>
      </div>
    </div>
  );
}
