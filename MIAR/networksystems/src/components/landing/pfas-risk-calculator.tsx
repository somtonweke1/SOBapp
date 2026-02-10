'use client';

import React, { useState } from 'react';
import { AlertTriangle, Droplet, Shield, ArrowRight, Download, CheckCircle, Building2, Cpu, Sprout } from 'lucide-react';

interface PFASProfile {
  industry: 'water-treatment' | 'food-processing' | 'agriculture' | 'data-centers' | 'manufacturing' | 'municipal';
  waterVolume: number; // Million gallons per day
  pfasLevel: number; // ppt (parts per trillion)
  complianceTarget: 'epa-2024' | 'strict-state' | 'voluntary';
}

interface PFASRiskResult {
  contaminationRisk: {
    level: 'critical' | 'high' | 'moderate' | 'low';
    score: number; // 0-10
    description: string;
  };
  financialExposure: {
    regulatoryFines: { min: number; max: number };
    treatmentCosts: { annual: number };
    liabilityRisk: { min: number; max: number };
    reputationalDamage: { estimated: number };
    total: { min: number; max: number };
  };
  complianceGap: {
    currentLevel: number;
    targetLevel: number;
    exceedanceMultiple: number;
    mustAct: boolean;
  };
  recommendations: string[];
  timelineToCompliance: string;
}

export default function PFASRiskCalculator() {
  const [step, setStep] = useState<'input' | 'results' | 'email'>('input');
  const [profile, setProfile] = useState<Partial<PFASProfile>>({});
  const [result, setResult] = useState<PFASRiskResult | null>(null);
  const [email, setEmail] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePFASRisk = (p: PFASProfile): PFASRiskResult => {
    // Compliance targets (EPA 2024 final rule: 4 ppt for PFOA/PFOS)
    const complianceTargets = {
      'epa-2024': 4, // ppt
      'strict-state': 2, // Vermont, Maine stricter standards
      'voluntary': 10 // Voluntary corporate standards
    };

    const targetLevel = complianceTargets[p.complianceTarget];
    const exceedanceMultiple = p.pfasLevel / targetLevel;
    const mustAct = p.pfasLevel > targetLevel;

    // Risk scoring
    let riskScore = 0;
    if (exceedanceMultiple > 10) riskScore = 10;
    else if (exceedanceMultiple > 5) riskScore = 9;
    else if (exceedanceMultiple > 3) riskScore = 8;
    else if (exceedanceMultiple > 2) riskScore = 7;
    else if (exceedanceMultiple > 1.5) riskScore = 6;
    else if (exceedanceMultiple > 1) riskScore = 5;
    else riskScore = Math.max(1, Math.floor(exceedanceMultiple * 4));

    const riskLevel: 'critical' | 'high' | 'moderate' | 'low' =
      riskScore >= 8 ? 'critical' :
      riskScore >= 6 ? 'high' :
      riskScore >= 4 ? 'moderate' : 'low';

    // Financial exposure calculations
    // Regulatory fines: EPA can fine up to $70K per day per violation
    const daysOfViolation = mustAct ? 180 : 0; // Assume 6 months if not compliant
    const dailyFine = 25000; // Conservative estimate
    const regulatoryFines = {
      min: mustAct ? dailyFine * 90 : 0, // 3 months
      max: mustAct ? dailyFine * daysOfViolation : 0 // 6 months
    };

    // Treatment costs (GAC - Granular Activated Carbon)
    // Industry average: $0.50 - $2.00 per 1000 gallons treated
    const annualGallons = p.waterVolume * 365; // MGD to annual MG
    const treatmentCostPerThousandGallons = mustAct ?
      (exceedanceMultiple > 5 ? 1.8 : exceedanceMultiple > 2 ? 1.2 : 0.8) : 0;
    const annualTreatmentCost = (annualGallons * treatmentCostPerThousandGallons);

    // Liability risk (lawsuits, class actions)
    // Based on industry type and contamination level
    const industryLiabilityMultiplier = {
      'water-treatment': 2.5,
      'food-processing': 3.0, // Higher due to food safety
      'agriculture': 2.8,
      'data-centers': 2.0,
      'manufacturing': 2.2,
      'municipal': 3.5 // Highest due to public health
    };
    const baseLiability = mustAct ? 500000 : 0;
    const liabilityMultiplier = industryLiabilityMultiplier[p.industry];
    const liabilityRisk = {
      min: baseLiability * liabilityMultiplier * (exceedanceMultiple > 3 ? 2 : 1),
      max: baseLiability * liabilityMultiplier * (exceedanceMultiple > 3 ? 5 : 2)
    };

    // Reputational damage (customer loss, brand damage)
    const reputationalDamage = mustAct ?
      annualTreatmentCost * 0.3 * (riskScore / 10) : 0;

    const totalExposure = {
      min: regulatoryFines.min + annualTreatmentCost + liabilityRisk.min + reputationalDamage,
      max: regulatoryFines.max + annualTreatmentCost + liabilityRisk.max + reputationalDamage
    };

    // Recommendations
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('URGENT: Immediate action required. Current PFAS levels pose critical regulatory and liability risk.');
      recommendations.push('Deploy emergency treatment system within 30 days to avoid enforcement action.');
    } else if (riskLevel === 'high') {
      recommendations.push('HIGH PRIORITY: Implement treatment system within 90 days to achieve compliance.');
    }

    if (mustAct) {
      recommendations.push(`Install GAC (Granular Activated Carbon) or IX (Ion Exchange) treatment system - Est. cost: $${(annualTreatmentCost / 1000000).toFixed(1)}M annually.`);
      recommendations.push('Conduct source mapping to identify contamination pathways and prevent future exposure.');
      recommendations.push('Establish monitoring protocol to track treatment effectiveness and maintain compliance.');
    }

    if (p.industry === 'food-processing' || p.industry === 'agriculture') {
      recommendations.push('Map PFAS flow through irrigation → crops → food supply to assess downstream contamination risk.');
    }

    if (p.industry === 'data-centers') {
      recommendations.push('AI infrastructure risk: PFAS-contaminated water can damage cooling systems and cause operational disruption.');
    }

    if (exceedanceMultiple > 5) {
      recommendations.push('Legal counsel recommended: High liability exposure warrants proactive legal strategy.');
    }

    // Timeline to compliance
    const timelineToCompliance =
      riskScore >= 8 ? '30-60 days (Emergency action required)' :
      riskScore >= 6 ? '90-120 days (Urgent implementation needed)' :
      riskScore >= 4 ? '6-9 months (Standard implementation timeline)' :
      'Monitoring recommended (Currently within acceptable limits)';

    return {
      contaminationRisk: {
        level: riskLevel,
        score: riskScore,
        description:
          riskLevel === 'critical' ? 'Immediate enforcement risk. Regulatory action likely within 30 days.' :
          riskLevel === 'high' ? 'Significant non-compliance. Action required within 90 days.' :
          riskLevel === 'moderate' ? 'Approaching limits. Proactive treatment recommended.' :
          'Within acceptable range. Continue monitoring.'
      },
      financialExposure: {
        regulatoryFines,
        treatmentCosts: { annual: annualTreatmentCost },
        liabilityRisk,
        reputationalDamage: { estimated: reputationalDamage },
        total: totalExposure
      },
      complianceGap: {
        currentLevel: p.pfasLevel,
        targetLevel,
        exceedanceMultiple,
        mustAct
      },
      recommendations,
      timelineToCompliance
    };
  };

  const handleCalculate = () => {
    if (!isValidProfile(profile)) {
      alert('Please complete all fields');
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      const riskResult = calculatePFASRisk(profile as PFASProfile);
      setResult(riskResult);
      setStep('results');
      setIsCalculating(false);
    }, 1500);
  };

  const isValidProfile = (p: Partial<PFASProfile>): p is PFASProfile => {
    return !!(p.industry && p.waterVolume && p.pfasLevel && p.complianceTarget);
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'moderate': return 'text-yellow-600';
      default: return 'text-emerald-600';
    }
  };

  if (step === 'results' && result) {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border-2 border-blue-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-light mb-4">
            PFAS Risk Analysis Complete
          </div>
          <h2 className="text-3xl font-extralight text-zinc-900 mb-2">
            Your PFAS Contamination Risk Profile
          </h2>
          <p className="text-lg text-zinc-600 font-light">
            Based on {profile.industry?.replace('-', ' ')} industry standards and EPA 2024 regulations
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-zinc-600 font-light mb-1">Contamination Risk Level</div>
                <div className={`text-4xl font-extralight ${getRiskColor(result.contaminationRisk.level)} uppercase`}>
                  {result.contaminationRisk.level}
                </div>
                <div className="text-sm text-zinc-600 font-light mt-1">
                  Risk Score: {result.contaminationRisk.score}/10
                </div>
              </div>
              <div className={`${
                result.contaminationRisk.level === 'critical' ? 'bg-red-100' :
                result.contaminationRisk.level === 'high' ? 'bg-orange-100' :
                result.contaminationRisk.level === 'moderate' ? 'bg-yellow-100' :
                'bg-emerald-100'
              } p-3 rounded-lg`}>
                <AlertTriangle className={`w-8 h-8 ${getRiskColor(result.contaminationRisk.level)}`} />
              </div>
            </div>
            <p className="text-xs text-zinc-600 font-light">
              {result.contaminationRisk.description}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-zinc-600 font-light mb-1">Total Financial Exposure</div>
                <div className="text-3xl font-extralight text-zinc-900">
                  {formatCurrency(result.financialExposure.total.min)} - {formatCurrency(result.financialExposure.total.max)}
                </div>
                <div className="text-sm text-zinc-600 font-light mt-1">
                  Annual risk estimate
                </div>
              </div>
              <div className="bg-rose-100 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Gap */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200 mb-8">
          <h3 className="text-xl font-light text-zinc-900 mb-4 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            Compliance Gap Analysis
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-zinc-600 font-light mb-1">Current PFAS Level</div>
              <div className="text-2xl font-light text-red-600">{result.complianceGap.currentLevel} ppt</div>
            </div>
            <div>
              <div className="text-sm text-zinc-600 font-light mb-1">EPA Target Level</div>
              <div className="text-2xl font-light text-emerald-600">{result.complianceGap.targetLevel} ppt</div>
            </div>
            <div>
              <div className="text-sm text-zinc-600 font-light mb-1">Exceedance</div>
              <div className="text-2xl font-light text-orange-600">
                {result.complianceGap.exceedanceMultiple.toFixed(1)}x over limit
              </div>
            </div>
          </div>
          {result.complianceGap.mustAct && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-light">
                ⚠️ ACTION REQUIRED: Your facility exceeds EPA compliance limits and must implement treatment.
              </p>
            </div>
          )}
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200 mb-8">
          <h3 className="text-xl font-light text-zinc-900 mb-4">Financial Exposure Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-sm font-light text-zinc-700">Regulatory Fines (if non-compliant)</span>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.financialExposure.regulatoryFines.min)} - {formatCurrency(result.financialExposure.regulatoryFines.max)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-sm font-light text-zinc-700">Annual Treatment Costs</span>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.financialExposure.treatmentCosts.annual)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-sm font-light text-zinc-700">Liability Risk (lawsuits, class actions)</span>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.financialExposure.liabilityRisk.min)} - {formatCurrency(result.financialExposure.liabilityRisk.max)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-light text-zinc-700">Reputational Damage</span>
              <span className="text-sm font-light text-zinc-900">
                {formatCurrency(result.financialExposure.reputationalDamage.estimated)}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-zinc-200 mb-8">
          <h3 className="text-xl font-light text-zinc-900 mb-4">Strategic Recommendations</h3>
          <div className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-700 font-light">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h4 className="text-lg font-light text-zinc-900 mb-3">Timeline to Compliance</h4>
          <p className="text-sm text-zinc-700 font-light">
            <strong>Recommended Action Timeline:</strong> {result.timelineToCompliance}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setStep('email')}
            className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-light text-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download Full PFAS Risk Report (PDF)</span>
          </button>
          <a
            href="/pfas-scanner"
            className="flex-1 border-2 border-blue-600 text-blue-700 px-6 py-4 rounded-lg font-light text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>Run Free Source Mapping Analysis</span>
          </a>
        </div>

        <p className="text-xs text-zinc-500 text-center mt-6">
          This analysis is based on EPA 2024 final PFAS regulations and industry benchmarks.
          Actual exposure depends on specific facility conditions. Schedule a consultation for detailed assessment.
        </p>
      </div>
    );
  }

  if (step === 'email' && result) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border border-blue-200">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-light text-zinc-900 mb-2">Get Your PFAS Risk Report</h3>
          <p className="text-zinc-600 font-light">
            We'll send a detailed PDF report with your complete contamination risk analysis
          </p>
        </div>

        <div className="bg-zinc-50 rounded-xl p-6 mb-6">
          <h4 className="font-light text-zinc-900 mb-3">Your Report Will Include:</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Complete PFAS risk analysis with compliance gap assessment</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Financial exposure breakdown (fines, treatment, liability)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Treatment system recommendations with ROI analysis</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Timeline to compliance and strategic action plan</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700">Source mapping methodology and next steps</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-light text-zinc-700 mb-2">Business Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@facility.com"
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => {
            if (!email || !email.includes('@')) {
              alert('Please enter a valid email address');
              return;
            }
            alert(`Thank you! Your PFAS risk report will be sent to ${email} within 5 minutes.`);
          }}
          className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-light text-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center space-x-2"
        >
          <span>Send My PFAS Risk Report</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-zinc-500 text-center mt-4">
          No spam, ever. Unsubscribe anytime. Your data is never shared.
        </p>
      </div>
    );
  }

  // Input Form
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border border-zinc-200">
      <div className="text-center mb-8">
        <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-light mb-4">
          Free PFAS Risk Assessment - 60 Seconds
        </div>
        <h2 className="text-3xl font-extralight text-zinc-900 mb-2">
          Calculate Your PFAS Contamination Risk
        </h2>
        <p className="text-lg text-zinc-600 font-light">
          Get instant quantified exposure: regulatory fines, treatment costs, liability risk
        </p>
      </div>

      <div className="space-y-6">
        {/* Industry */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">Facility Type</label>
          <select
            value={profile.industry || ''}
            onChange={(e) => setProfile({ ...profile, industry: e.target.value as PFASProfile['industry'] })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select your facility type...</option>
            <option value="water-treatment">Water Treatment Facility</option>
            <option value="food-processing">Food Processing Plant</option>
            <option value="agriculture">Agricultural Operation</option>
            <option value="data-centers">Data Center / AI Infrastructure</option>
            <option value="manufacturing">Manufacturing Facility</option>
            <option value="municipal">Municipal Water System</option>
          </select>
        </div>

        {/* Water Volume */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">
            Daily Water Volume (Million Gallons)
          </label>
          <select
            value={profile.waterVolume || ''}
            onChange={(e) => setProfile({ ...profile, waterVolume: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select water volume...</option>
            <option value="0.1">Less than 0.5 MGD</option>
            <option value="1">0.5 - 2 MGD</option>
            <option value="5">2 - 10 MGD</option>
            <option value="15">10 - 25 MGD</option>
            <option value="40">25 - 50 MGD</option>
            <option value="75">50 - 100 MGD</option>
            <option value="150">100+ MGD</option>
          </select>
        </div>

        {/* PFAS Level */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">
            Current PFAS Concentration (ppt - parts per trillion)
          </label>
          <select
            value={profile.pfasLevel || ''}
            onChange={(e) => setProfile({ ...profile, pfasLevel: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select PFAS level...</option>
            <option value="2">{"< 4 ppt (EPA compliant)"}</option>
            <option value="6">4 - 10 ppt (Moderate concern)</option>
            <option value="15">10 - 20 ppt (Above EPA limit)</option>
            <option value="30">20 - 50 ppt (Significant exceedance)</option>
            <option value="75">50 - 100 ppt (Critical level)</option>
            <option value="150">{"100+ ppt (Emergency action needed)"}</option>
            <option value="999">Unknown (Need testing)</option>
          </select>
        </div>

        {/* Compliance Target */}
        <div>
          <label className="block text-sm font-light text-zinc-700 mb-2">Compliance Standard</label>
          <select
            value={profile.complianceTarget || ''}
            onChange={(e) => setProfile({ ...profile, complianceTarget: e.target.value as PFASProfile['complianceTarget'] })}
            className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select compliance target...</option>
            <option value="epa-2024">EPA 2024 Standard (4 ppt PFOA/PFOS)</option>
            <option value="strict-state">State Standards (Stricter: 2 ppt)</option>
            <option value="voluntary">Voluntary Corporate Standard (10 ppt)</option>
          </select>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={!isValidProfile(profile) || isCalculating}
          className={`w-full py-4 rounded-lg font-light text-lg transition-colors inline-flex items-center justify-center space-x-2 ${
            isValidProfile(profile) && !isCalculating
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isCalculating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calculating PFAS Risk...</span>
            </>
          ) : (
            <>
              <Droplet className="w-5 h-5" />
              <span>Calculate My PFAS Risk</span>
            </>
          )}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          ✓ No credit card required  •  ✓ Instant results  •  ✓ Based on EPA 2024 regulations
        </p>
      </div>
    </div>
  );
}
