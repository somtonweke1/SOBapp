'use client';

import React from 'react';
import { PublicNav } from '@/components/navigation/public-nav';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Shield, Users, DollarSign, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EntityListReportPage() {
  const reportData = {
    client: 'TechFlow Electronics Inc.',
    analysisDate: 'January 22, 2025',
    supplierCount: 47,
    exposureLevel: 'MEDIUM-HIGH',
    overallRisk: 6.8,
    flaggedSuppliers: 8,
    criticalSuppliers: 3,
    estimatedExposure: '$12.4M'
  };

  const flaggedSuppliers = [
    {
      name: 'Shenzhen Advanced Components Ltd.',
      category: 'Electronic Components',
      riskLevel: 'CRITICAL',
      riskScore: 9.2,
      reason: 'Parent company (Tianyu Technology Group) listed on BIS entity list as of Jan 15, 2025',
      annualSpend: '$2.8M',
      alternatives: 2,
      action: 'IMMEDIATE REPLACEMENT REQUIRED'
    },
    {
      name: 'Beijing Semiconductor Manufacturing',
      category: 'Semiconductors',
      riskLevel: 'CRITICAL',
      riskScore: 8.9,
      reason: '45% ownership by listed entity. BIS expanded coverage includes affiliate relationships.',
      annualSpend: '$4.2M',
      alternatives: 3,
      action: 'DIVERSIFY WITHIN 60 DAYS'
    },
    {
      name: 'Guangdong Materials Co.',
      category: 'Raw Materials',
      riskLevel: 'CRITICAL',
      riskScore: 8.5,
      reason: 'Subsidiary of listed conglomerate. Ownership structure flagged under new BIS rules.',
      annualSpend: '$1.8M',
      alternatives: 4,
      action: 'SECONDARY SOURCE REQUIRED'
    },
    {
      name: 'Suzhou Electronics Assembly',
      category: 'PCB Assembly',
      riskLevel: 'HIGH',
      riskScore: 7.3,
      reason: 'Joint venture with 30% stake from listed entity. Requires compliance review.',
      annualSpend: '$980K',
      alternatives: 2,
      action: 'MONITOR QUARTERLY'
    },
    {
      name: 'Dongguan Precision Parts',
      category: 'Mechanical Components',
      riskLevel: 'HIGH',
      riskScore: 6.8,
      reason: 'Geographic proximity to listed operations. Supply chain overlap detected.',
      annualSpend: '$640K',
      alternatives: 5,
      action: 'ESTABLISH BACKUP SUPPLIER'
    }
  ];

  const alternativeSources = [
    {
      original: 'Shenzhen Advanced Components Ltd.',
      alternatives: [
        { name: 'Taiwan Semiconductor Components', location: 'Taiwan', costDelta: '+8%', leadTime: '6 weeks', certification: 'ISO 9001, ITAR' },
        { name: 'Samsung Electronics Vietnam', location: 'Vietnam', costDelta: '+12%', leadTime: '4 weeks', certification: 'ISO 9001' }
      ]
    },
    {
      original: 'Beijing Semiconductor Manufacturing',
      alternatives: [
        { name: 'TSMC (Arizona Fab)', location: 'USA', costDelta: '+22%', leadTime: '8 weeks', certification: 'ISO 9001, ITAR, CMMC' },
        { name: 'Samsung Austin Semiconductor', location: 'USA', costDelta: '+18%', leadTime: '6 weeks', certification: 'ISO 9001, ITAR' },
        { name: 'SK Hynix (Indiana)', location: 'USA', costDelta: '+20%', leadTime: '7 weeks', certification: 'ISO 9001' }
      ]
    }
  ];

  const costScenarios = [
    {
      scenario: 'Baseline (Current State)',
      assumptions: 'No changes, continue with flagged suppliers',
      totalCost: '$8.6M',
      complianceRisk: 'HIGH',
      businessImpact: 'Shipment delays possible'
    },
    {
      scenario: 'Partial Mitigation',
      assumptions: 'Replace 3 critical suppliers, monitor 5 high-risk',
      totalCost: '$9.8M',
      complianceRisk: 'MEDIUM',
      businessImpact: 'Reduced delay risk'
    },
    {
      scenario: 'Full Compliance',
      assumptions: 'Replace all 8 flagged suppliers with alternatives',
      totalCost: '$10.4M',
      complianceRisk: 'LOW',
      businessImpact: 'Business continuity secured'
    },
    {
      scenario: 'Supply Chain Disruption',
      assumptions: 'Shipments blocked, emergency sourcing required',
      totalCost: '$21.0M',
      complianceRisk: 'CRITICAL',
      businessImpact: '6-month delay, revenue impact'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <PublicNav />
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="bg-zinc-900 text-white px-4 py-2 text-sm font-light tracking-wide rounded inline-block mb-3">
                MIAR
              </div>
              <h1 className="text-2xl font-extralight text-zinc-900">BIS Entity List Compliance Report</h1>
              <p className="text-sm text-zinc-500 font-light mt-1">
                {reportData.client} • {reportData.analysisDate}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Overall Risk</div>
              <div className="text-3xl font-extralight text-amber-600">{reportData.overallRisk}</div>
              <div className="text-xs text-amber-500 font-light">{reportData.exposureLevel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Executive Summary */}
        <Card className="p-8 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-zinc-900 mb-2">Executive Summary</h2>
              <p className="text-sm text-zinc-700 font-light leading-relaxed mb-4">
                Analysis of {reportData.supplierCount} suppliers identified <span className="font-medium text-rose-600">{reportData.flaggedSuppliers} suppliers with BIS entity list exposure</span>,
                including {reportData.criticalSuppliers} requiring immediate action. Estimated financial exposure: {reportData.estimatedExposure}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 bg-white/60 rounded-lg p-6">
            <div className="text-center">
              <div className="text-2xl font-light text-zinc-900">{reportData.supplierCount}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Suppliers Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-rose-600">{reportData.flaggedSuppliers}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Flagged for Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-rose-600">{reportData.criticalSuppliers}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Critical Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-rose-600">{reportData.estimatedExposure}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Annual Exposure</div>
            </div>
          </div>
        </Card>

        {/* Value of Information Analysis */}
        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-zinc-900 mb-2">Decision Impact Analysis</h2>
              <p className="text-sm text-zinc-700 font-light leading-relaxed">
                This intelligence enables better decision-making under uncertainty. The Expected Value of Perfect Information (EVPI)
                quantifies the maximum value of knowing compliance status before making sourcing decisions.
              </p>
            </div>
          </div>

          <div className="bg-white/60 rounded-xl p-6 space-y-6">
            {/* Decision Context */}
            <div className="border-l-4 border-emerald-500 pl-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-1">Your Decision</div>
              <div className="text-base font-light text-zinc-900">
                Continue sourcing from existing suppliers vs. Replace flagged suppliers
              </div>
              <div className="text-sm text-zinc-600 font-light mt-2">
                Annual contracts: $12.4M • Critical suppliers: 3 • Alternatives available: 9
              </div>
            </div>

            {/* Expected Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-rose-50/50 rounded-lg p-5">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">Without This Intelligence</div>
                <div className="text-2xl font-light text-rose-600 mb-1">-$8.6M</div>
                <div className="text-xs text-zinc-600 font-light">
                  Expected loss from undetected compliance violations, shipment blocks, emergency sourcing
                </div>
                <div className="mt-3 text-xs text-zinc-500 font-light">
                  • 65% probability of disruption<br/>
                  • $21M worst-case exposure<br/>
                  • 6-month recovery timeline
                </div>
              </div>

              <div className="bg-emerald-50/50 rounded-lg p-5">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">With This Intelligence</div>
                <div className="text-2xl font-light text-emerald-600 mb-1">+$1.2M</div>
                <div className="text-xs text-zinc-600 font-light">
                  Expected value from informed supplier transitions, compliance assurance, business continuity
                </div>
                <div className="mt-3 text-xs text-zinc-500 font-light">
                  • Proactive supplier replacement<br/>
                  • 15% cost premium vs. disruption<br/>
                  • Zero compliance violations
                </div>
              </div>
            </div>

            {/* EVPI Calculation */}
            <div className="border-t border-zinc-200 pt-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">EVPI (This Report)</div>
                  <div className="text-3xl font-extralight text-emerald-600">$9.8M</div>
                  <div className="text-xs text-zinc-600 font-light mt-1">Maximum value of compliance certainty</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">Intelligence Cost</div>
                  <div className="text-3xl font-extralight text-zinc-900">$85K</div>
                  <div className="text-xs text-zinc-600 font-light mt-1">Annual subscription + analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">Net Benefit</div>
                  <div className="text-3xl font-extralight text-emerald-600">$9.72M</div>
                  <div className="text-xs text-zinc-600 font-light mt-1">115x ROI per decision cycle</div>
                </div>
              </div>
            </div>

            {/* Information Quality */}
            <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <div className="text-sm font-medium text-zinc-900">Information Quality Assurance</div>
              </div>
              <div className="text-xs text-zinc-700 font-light leading-relaxed">
                Our compliance intelligence provides <span className="font-medium">market research-grade quality control</span> for supply chain decisions.
                Real-time BIS entity list monitoring, ownership structure analysis, and alternative supplier sourcing reduce
                decision uncertainty from 65% to under 5%, enabling confident strategic sourcing choices.
              </div>
            </div>
          </div>
        </Card>

        {/* Flagged Suppliers */}
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 mb-6">Suppliers with Entity List Exposure</h2>
          <div className="space-y-4">
            {flaggedSuppliers.map((supplier, idx) => (
              <Card key={idx} className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-light text-zinc-900">{supplier.name}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wide ${
                        supplier.riskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {supplier.riskLevel}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500 font-light">{supplier.category}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-extralight ${
                      supplier.riskLevel === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {supplier.riskScore}
                    </div>
                    <div className="text-xs font-light text-zinc-500">Risk Score</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 mt-1 flex-shrink-0 ${
                        supplier.riskLevel === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                      }`} />
                      <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-1">Reason for Flag</div>
                        <p className="text-sm font-light text-zinc-700">{supplier.reason}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-zinc-200">
                      <span className="text-zinc-500 font-light">Annual Spend</span>
                      <span className="font-medium text-zinc-900">{supplier.annualSpend}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-zinc-50 rounded-lg p-4">
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-2">Recommended Action</div>
                      <p className="text-sm font-medium text-zinc-900 mb-2">{supplier.action}</p>
                      <p className="text-xs text-zinc-600 font-light">
                        {supplier.alternatives} compliant alternative{supplier.alternatives > 1 ? 's' : ''} identified
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Alternative Sources */}
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 mb-6">Alternative Supplier Recommendations</h2>
          <div className="space-y-6">
            {alternativeSources.map((item, idx) => (
              <Card key={idx} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span className="font-medium text-zinc-900">{item.original}</span>
                  </div>
                  <div className="text-sm text-rose-600 font-light">Replace with compliant alternatives:</div>
                </div>

                <div className="space-y-3">
                  {item.alternatives.map((alt, altIdx) => (
                    <div key={altIdx} className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium text-zinc-900">{alt.name}</span>
                        </div>
                        <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-light">
                          COMPLIANT
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-zinc-500 font-light">Location</div>
                          <div className="font-medium text-zinc-900">{alt.location}</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 font-light">Cost Delta</div>
                          <div className="font-medium text-amber-600">{alt.costDelta}</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 font-light">Lead Time</div>
                          <div className="font-medium text-zinc-900">{alt.leadTime}</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 font-light">Certifications</div>
                          <div className="font-medium text-zinc-900 text-xs">{alt.certification}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cost Scenarios */}
        <div>
          <h2 className="text-2xl font-extralight text-zinc-900 mb-6">Cost Impact Scenarios</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {costScenarios.map((scenario, idx) => (
              <Card key={idx} className={`p-6 ${
                scenario.scenario.includes('Disruption')
                  ? 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200'
                  : scenario.scenario.includes('Full Compliance')
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
                  : 'bg-white'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-light text-zinc-900 mb-1">{scenario.scenario}</h3>
                    <p className="text-sm text-zinc-600 font-light">{scenario.assumptions}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-light ${
                      scenario.scenario.includes('Disruption') ? 'text-rose-600' : 'text-zinc-900'
                    }`}>
                      {scenario.totalCost}
                    </div>
                    <div className="text-xs text-zinc-500 font-light">Total Cost</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/50">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-1">Compliance Risk</div>
                    <div className={`font-medium ${
                      scenario.complianceRisk === 'CRITICAL' ? 'text-rose-600' :
                      scenario.complianceRisk === 'HIGH' ? 'text-amber-600' :
                      scenario.complianceRisk === 'MEDIUM' ? 'text-amber-500' :
                      'text-emerald-600'
                    }`}>
                      {scenario.complianceRisk}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-1">Business Impact</div>
                    <div className="text-sm font-light text-zinc-700">{scenario.businessImpact}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <h2 className="text-2xl font-light text-zinc-900 mb-6">Strategic Recommendations</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded text-sm font-medium">
                Priority 1
              </div>
              <div>
                <h3 className="font-medium text-zinc-900 mb-2">Immediate Replacement of Critical Suppliers</h3>
                <p className="text-sm text-zinc-700 font-light mb-3">
                  Replace Shenzhen Advanced Components, Beijing Semiconductor, and Guangdong Materials within 60 days.
                  Use Taiwan and US-based alternatives to eliminate entity list exposure.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm bg-white rounded-lg p-4">
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Investment Required</div>
                    <div className="font-medium text-zinc-900">$1.8M</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Risk Reduction</div>
                    <div className="font-medium text-emerald-600">-3.5 points</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Timeline</div>
                    <div className="font-medium text-zinc-900">60 days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-sm font-medium">
                Priority 2
              </div>
              <div>
                <h3 className="font-medium text-zinc-900 mb-2">Establish Secondary Sources for High-Risk Suppliers</h3>
                <p className="text-sm text-zinc-700 font-light mb-3">
                  For Suzhou Electronics and Dongguan Precision, maintain current relationship but establish qualified backup suppliers.
                  Dual-source strategy reduces dependency.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm bg-white rounded-lg p-4">
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Investment Required</div>
                    <div className="font-medium text-zinc-900">$420K</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Risk Reduction</div>
                    <div className="font-medium text-emerald-600">-1.2 points</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Timeline</div>
                    <div className="font-medium text-zinc-900">90 days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">
                Priority 3
              </div>
              <div>
                <h3 className="font-medium text-zinc-900 mb-2">Implement Continuous Monitoring System</h3>
                <p className="text-sm text-zinc-700 font-light mb-3">
                  Entity list changes weekly. Deploy automated monitoring to track all supplier ownership structures
                  and receive real-time alerts on new listings.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm bg-white rounded-lg p-4">
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Annual Cost</div>
                    <div className="font-medium text-zinc-900">$25K-$100K</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Risk Reduction</div>
                    <div className="font-medium text-emerald-600">Ongoing protection</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">ROI</div>
                    <div className="font-medium text-emerald-600">500x (vs. disruption)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm font-medium">
                Priority 4
              </div>
              <div>
                <h3 className="font-medium text-zinc-900 mb-2">Geographic Diversification Strategy</h3>
                <p className="text-sm text-zinc-700 font-light mb-3">
                  Long-term, reduce China exposure from 68% to under 30%. Build relationships with Southeast Asian,
                  North American, and European suppliers.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm bg-white rounded-lg p-4">
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Investment Required</div>
                    <div className="font-medium text-zinc-900">$3.2M</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Risk Reduction</div>
                    <div className="font-medium text-emerald-600">-4.8 points</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-light">Timeline</div>
                    <div className="font-medium text-zinc-900">18-24 months</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ROI Analysis */}
        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-zinc-900 mb-2">Return on Investment Analysis</h2>
              <p className="text-sm text-zinc-700 font-light mb-6">
                Implementing all four recommendations requires <span className="font-medium">$5.4M investment</span> but
                reduces compliance risk from 6.8 to 2.0. More importantly, it virtually eliminates the $12.4M supply disruption scenario.
              </p>
              <div className="grid grid-cols-3 gap-6 bg-white rounded-lg p-6">
                <div className="text-center">
                  <div className="text-3xl font-light text-zinc-900 mb-2">$5.4M</div>
                  <div className="text-sm text-zinc-600 font-light">Total Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-rose-600 mb-2">$12.4M</div>
                  <div className="text-sm text-zinc-600 font-light">Avoided Exposure</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-emerald-600 mb-2">2.3x</div>
                  <div className="text-sm text-zinc-600 font-light">ROI Multiple</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-extralight mb-4">Ready to Implement These Recommendations?</h2>
            <p className="text-zinc-300 font-light mb-6 max-w-2xl mx-auto">
              Our full platform provides continuous entity list monitoring, real-time alerts, and ongoing supplier risk analysis.
              Never miss an entity list update again.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/entity-list-scanner">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
                  Get Your Free Compliance Check
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="mailto:somton@jhu.edu?subject=Entity List Continuous Monitoring">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Schedule Demo
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
