'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Shield, ArrowRight, Download, CheckCircle } from 'lucide-react';
import {
  calculateEVPI,
  formatCurrency,
  getRiskScoreColor,
  getRiskScoreLabel,
  type UserProfile,
  type EVPIResult
} from '@/lib/evpi-calculator';

interface InstantValueCalculatorProps {
  onComplete?: (result: EVPIResult, profile: UserProfile) => void;
  onEmailCapture?: (email: string, result: EVPIResult) => void;
}

export default function InstantValueCalculator({
  onComplete,
  onEmailCapture
}: InstantValueCalculatorProps) {
  const [step, setStep] = useState<'input' | 'results' | 'email'>('input');
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    materials: []
  });
  const [result, setResult] = useState<EVPIResult | null>(null);
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCalculate = () => {
    if (!isValidProfile(profile)) {
      alert('Please complete all fields');
      return;
    }

    setIsGenerating(true);

    // Simulate calculation delay for perceived value (but keep it under 3 seconds)
    setTimeout(() => {
      const evpiResult = calculateEVPI(profile as UserProfile);
      setResult(evpiResult);
      setStep('results');
      setIsGenerating(false);

      if (onComplete) {
        onComplete(evpiResult, profile as UserProfile);
      }
    }, 1500);
  };

  const handleDownloadReport = () => {
    setStep('email');
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (onEmailCapture && result) {
      onEmailCapture(email, result);
    }

    // In production: Generate PDF and email to user
    alert(`Thank you! Your executive summary will be sent to ${email} within 5 minutes.`);
  };

  const isValidProfile = (p: Partial<UserProfile>): p is UserProfile => {
    return !!(
      p.industry &&
      p.annualBudget &&
      p.materials &&
      p.materials.length > 0 &&
      p.supplyChainStructure
    );
  };

  if (step === 'email' && result) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border border-emerald-200">
        <div className="text-center mb-6">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-light text-zinc-900 mb-2">Get Your Executive Summary</h3>
          <p className="text-zinc-600 font-light">
            We'll send a detailed 2-page PDF report with your complete risk analysis
          </p>
        </div>

        <div className="bg-zinc-50 rounded-xl p-6 mb-6">
          <h4 className="font-light text-zinc-900 mb-3">Your Report Will Include:</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Complete risk exposure breakdown by category</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Quantified cost avoidance opportunities</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Personalized strategic recommendations</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">ROI projection for MIAR platform</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Industry peer benchmarking data</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-light text-zinc-700 mb-2">Business Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleEmailSubmit}
          className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg font-light text-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center space-x-2"
        >
          <span>Send My Executive Summary</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-zinc-500 text-center mt-4">
          No spam, ever. Unsubscribe anytime. Your data is never shared.
        </p>
      </div>
    );
  }

  if (step === 'results' && result) {
    return (
      <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border-2 border-emerald-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-light mb-4">
            ⚡ Instant Analysis Complete
          </div>
          <h2 className="text-3xl font-extralight text-zinc-900 mb-2">
            Your Supply Chain Risk Profile
          </h2>
          <p className="text-lg text-zinc-600 font-light">
            Generated in 60 seconds - Based on {profile.industry} industry benchmarks
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Risk Score */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-zinc-600 font-light mb-1">Overall Risk Score</div>
                <div className={`text-4xl font-extralight ${getRiskScoreColor(result.riskScore)}`}>
                  {result.riskScore}/10
                </div>
                <div className={`text-sm font-light mt-1 ${getRiskScoreColor(result.riskScore)}`}>
                  {getRiskScoreLabel(result.riskScore)}
                </div>
              </div>
              <div className="bg-rose-100 p-3 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  result.riskScore >= 7.5 ? 'bg-red-600' :
                  result.riskScore >= 6.0 ? 'bg-orange-600' :
                  result.riskScore >= 4.5 ? 'bg-yellow-600' :
                  'bg-emerald-600'
                }`}
                style={{ width: `${(result.riskScore / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-3 font-light">
              Based on: {profile.materials?.join(', ')} supply chain analysis
            </p>
          </div>

          {/* Total Exposure */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-zinc-600 font-light mb-1">Quantified Risk Exposure</div>
                <div className="text-3xl font-extralight text-zinc-900">
                  {formatCurrency(result.riskExposure.total.min, true)} - {formatCurrency(result.riskExposure.total.max, true)}
                </div>
                <div className="text-sm text-zinc-600 font-light mt-1">
                  Annual exposure estimate
                </div>
              </div>
              <div className="bg-rose-100 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-light">
              90% confidence interval - detailed breakdown below
            </p>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200 mb-8">
          <h3 className="text-xl font-light text-zinc-900 mb-4">Risk Exposure Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-light text-zinc-700">BIS Compliance Risk</span>
              </div>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.riskExposure.breakdown.compliance.min, true)} - {formatCurrency(result.riskExposure.breakdown.compliance.max, true)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-light text-zinc-700">Geopolitical Risk</span>
              </div>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.riskExposure.breakdown.geopolitical.min, true)} - {formatCurrency(result.riskExposure.breakdown.geopolitical.max, true)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-light text-zinc-700">Price Volatility Risk</span>
              </div>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.riskExposure.breakdown.priceVolatility.min, true)} - {formatCurrency(result.riskExposure.breakdown.priceVolatility.max, true)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-light text-zinc-700">Supply Disruption Risk</span>
              </div>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.riskExposure.breakdown.disruption.min, true)} - {formatCurrency(result.riskExposure.breakdown.disruption.max, true)}
              </span>
            </div>
          </div>
        </div>

        {/* Opportunity Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-6 border border-emerald-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-emerald-700 font-light mb-1">Annual Cost Avoidance</div>
                <div className="text-4xl font-extralight text-emerald-900">
                  {formatCurrency(result.costAvoidanceOpportunity, true)}
                </div>
                <div className="text-sm text-emerald-700 font-light mt-1">
                  With optimized supply chain
                </div>
              </div>
              <div className="bg-emerald-200 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-emerald-700" />
              </div>
            </div>
            <p className="text-xs text-emerald-700 font-light">
              Through: Alternative sourcing, contract optimization, risk hedging
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-blue-700 font-light mb-1">ROI with MIAR</div>
                <div className="text-4xl font-extralight text-blue-900">
                  {result.estimatedROI}:1
                </div>
                <div className="text-sm text-blue-700 font-light mt-1">
                  Return on investment
                </div>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-700" />
              </div>
            </div>
            <p className="text-xs text-blue-700 font-light">
              Investment: ~$150K/year | Value delivered: {formatCurrency(result.costAvoidanceOpportunity, true)}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200 mb-8">
          <h3 className="text-xl font-light text-zinc-900 mb-4">Strategic Recommendations</h3>
          <div className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-700 font-light">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EVPI Explanation */}
        <div className="bg-zinc-50 rounded-xl p-6 mb-8">
          <h4 className="text-lg font-light text-zinc-900 mb-3">What is EVPI (Expected Value of Perfect Information)?</h4>
          <p className="text-sm text-zinc-600 font-light mb-3">
            EVPI represents the maximum economic value of eliminating uncertainty in your supply chain decisions.
            Our calculation shows that perfect information about your {profile.materials?.join(', ')} supply chain
            is worth <strong>{formatCurrency(result.evpiValue, true)}</strong> annually.
          </p>
          <p className="text-sm text-zinc-600 font-light">
            MIAR's intelligence platform reduces this uncertainty by ~70%, delivering approximately{' '}
            <strong>{formatCurrency(result.costAvoidanceOpportunity, true)}</strong> in annual value through
            optimized decision-making.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleDownloadReport}
            className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-lg font-light text-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download Full Executive Summary (PDF)</span>
          </button>
          <button
            onClick={() => window.location.href = '/entity-list-scanner'}
            className="flex-1 border-2 border-emerald-600 text-emerald-700 px-6 py-4 rounded-lg font-light text-lg hover:bg-emerald-50 transition-colors inline-flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>Run Free BIS Compliance Scan</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500 text-center mt-6">
          This analysis is based on industry benchmarks and research data. Actual exposure depends on your specific
          supplier relationships and contracts. Schedule a strategic briefing for customized analysis.
        </p>
      </div>
    );
  }

  // Input Form
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border border-zinc-200">
      <div className="text-center mb-8">
        <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-light mb-4">
          ⚡ Free Risk Assessment - 60 Seconds
        </div>
        <h2 className="text-3xl font-extralight text-zinc-900 mb-2">
          Calculate Your Supply Chain Risk
        </h2>
        <p className="text-lg text-zinc-600 font-light">
          Get instant quantified exposure across compliance, geopolitical, and market risks
        </p>
      </div>

      <div className="space-y-6">
        {/* Industry */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">Industry Sector</label>
          <select
            value={profile.industry || ''}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value as UserProfile['industry'] })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select your industry...</option>
            <option value="energy">Energy & Utilities</option>
            <option value="mining">Mining & Resources</option>
            <option value="defense">Defense & Aerospace</option>
            <option value="automotive">Automotive & EV</option>
            <option value="electronics">Electronics & Hardware</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">
            Annual Procurement Budget (Critical Materials)
          </label>
          <select
            value={profile.annualBudget || ''}
            onChange={(e) => setProfile({ ...profile, annualBudget: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select budget range...</option>
            <option value="5000000">$5M - $10M</option>
            <option value="15000000">$10M - $25M</option>
            <option value="37500000">$25M - $50M</option>
            <option value="75000000">$50M - $100M</option>
            <option value="150000000">$100M - $250M</option>
            <option value="375000000">$250M - $500M</option>
            <option value="750000000">$500M+</option>
          </select>
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">
            Primary Critical Materials (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['lithium', 'cobalt', 'copper', 'rare-earths', 'mixed'] as const).map((material) => (
              <label key={material} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.materials?.includes(material)}
                  onChange={(e) => {
                    const materials = profile.materials || [];
                    if (e.target.checked) {
                      setProfile({ ...profile, materials: [...materials, material] });
                    } else {
                      setProfile({ ...profile, materials: materials.filter(m => m !== material) });
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-700 font-light capitalize">
                  {material === 'rare-earths' ? 'Rare Earths' : material}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Supply Chain Structure */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">Supply Chain Structure</label>
          <select
            value={profile.supplyChainStructure || ''}
            onChange={(e) => setProfile({ ...profile, supplyChainStructure: e.target.value as UserProfile['supplyChainStructure'] })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select structure...</option>
            <option value="single-source">Single Source (1-2 primary suppliers)</option>
            <option value="regional">Regional (suppliers in 1-2 regions)</option>
            <option value="diversified">Diversified (multiple regions, backup options)</option>
            <option value="complex">Complex (many suppliers, global footprint)</option>
          </select>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={!isValidProfile(profile) || isGenerating}
          className={`w-full py-4 rounded-lg font-light text-lg transition-colors inline-flex items-center justify-center space-x-2 ${
            isValidProfile(profile) && !isGenerating
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calculating Risk Profile...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>Calculate My Risk Exposure</span>
            </>
          )}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          ✓ No credit card required  •  ✓ Instant results  •  ✓ Based on peer-reviewed methodology
        </p>
      </div>
    </div>
  );
}
