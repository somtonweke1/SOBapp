'use client';

import React, { useState } from 'react';
import { PublicNav } from '@/components/navigation/public-nav';
import {
  AlertTriangle,
  Droplet,
  Shield,
  CheckCircle,
  ArrowRight,
  Beaker,
  TrendingUp,
  Factory,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function PFASScannerPage() {
  const [formData, setFormData] = useState({
    facilityName: '',
    email: '',
    flowRate: '',
    bedVolume: '',
    ebct: '',
    pfasConcentration: '',
    pfoa: '',
    pfos: '',
    pfna: '',
    pfhxs: '',
    toc: '',
    sulfate: '',
    pH: '',
    temperature: '',
    alkalinity: '',
    systemType: 'gac'
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const totalPFAS = parseFloat(formData.pfoa || '0') +
                        parseFloat(formData.pfos || '0') +
                        parseFloat(formData.pfna || '0') +
                        parseFloat(formData.pfhxs || '0');

      const requestBody = {
        facilityName: formData.facilityName,
        email: formData.email,
        flowRate: parseFloat(formData.flowRate),
        bedVolume: parseFloat(formData.bedVolume),
        ebct: parseFloat(formData.ebct),
        pfasConcentration: totalPFAS,
        pfasProfile: {
          PFOA: parseFloat(formData.pfoa || '0'),
          PFOS: parseFloat(formData.pfos || '0'),
          PFNA: parseFloat(formData.pfna || '0'),
          PFHxS: parseFloat(formData.pfhxs || '0')
        },
        toc: parseFloat(formData.toc),
        sulfate: parseFloat(formData.sulfate),
        waterChemistry: {
          pH: parseFloat(formData.pH),
          temperature: parseFloat(formData.temperature),
          alkalinity: parseFloat(formData.alkalinity)
        },
        systemType: formData.systemType
      };

      const response = await fetch('/api/pfas-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Scan failed');
      }

      setScanResult(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-light mb-6">
              <Droplet className="w-4 h-4" />
              EPA PFAS Limits Now in Effect - Is Your System Compliant?
            </div>

            <h1 className="text-5xl font-extralight tracking-tight text-zinc-900 mb-6">
              PFAS Compliance Analysis for Water Treatment Systems
              <span className="block text-blue-600 font-light mt-2">EPA-Validated Risk Assessment in Minutes</span>
            </h1>

            <p className="text-xl font-light text-zinc-600 mb-8 leading-relaxed">
              New EPA limits for PFOA/PFOS (4 ng/L) are stricter than ever. Get instant GAC capacity estimates,
              breakthrough predictions, and compliance risk scores using <span className="font-medium text-zinc-900">validated models</span>.
            </p>

            <div className="flex items-center justify-center gap-4">
              <a href="#scanner">
                <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                  Get Free PFAS Analysis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>

            <p className="text-sm font-light text-zinc-500 mt-4">
              ✓ Free for first 10 facilities  •  ✓ Instant results  •  ✓ No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Platform Banner */}
      <section className="py-8 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-light mb-1">Part of the PFAS Flow Intelligence Platform</p>
              <h3 className="text-white text-xl font-light">
                This scanner is one module of our comprehensive PFAS contamination tracking system
              </h3>
            </div>
            <Link href="/pfas-flow-intelligence">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 backdrop-blur-sm">
                Explore Full Platform
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight tracking-tight text-zinc-900 mb-4">
              The New PFAS Challenge
            </h2>
            <p className="text-lg font-light text-zinc-600 max-w-3xl mx-auto">
              EPA's updated MCLs make PFAS one of the most expensive compliance issues in water treatment history.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4">
                <Droplet className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Stricter Limits</h3>
              <p className="text-zinc-600 font-light leading-relaxed">
                PFOA and PFOS now limited to 4 ng/L (down from 70 ng/L). Most GAC systems need recalibration.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-amber-50 rounded-xl w-fit mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Complex Chemistry</h3>
              <p className="text-zinc-600 font-light leading-relaxed">
                TOC, sulfate, and multi-compound competition affect GAC performance in ways spreadsheets can't model.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-rose-50 rounded-xl w-fit mb-4">
                <TrendingUp className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Real Financial Risk</h3>
              <p className="text-zinc-600 font-light leading-relaxed">
                EPA violations carry fines up to $25,000/day. Accurate capacity predictions save millions in replacement costs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Scanner Section */}
      <section id="scanner" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight tracking-tight text-zinc-900 mb-4">
              Free PFAS Compliance Analysis - First 10 Facilities
            </h2>
            <p className="text-lg font-light text-zinc-600">
              Enter your water treatment system data and get instant risk assessment with EPA compliance status
            </p>
          </div>

          {!submitted ? (
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Facility Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-zinc-900 border-b pb-2">Facility Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Facility Name *
                      </label>
                      <input
                        type="text"
                        name="facilityName"
                        required
                        value={formData.facilityName}
                        onChange={handleInputChange}
                        placeholder="City Water Treatment Plant"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="operator@facility.com"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                  </div>
                </div>

                {/* System Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-zinc-900 border-b pb-2">System Configuration</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Flow Rate (gpm) *
                      </label>
                      <input
                        type="number"
                        name="flowRate"
                        required
                        step="0.1"
                        value={formData.flowRate}
                        onChange={handleInputChange}
                        placeholder="100"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Bed Volume (gallons) *
                      </label>
                      <input
                        type="number"
                        name="bedVolume"
                        required
                        step="0.1"
                        value={formData.bedVolume}
                        onChange={handleInputChange}
                        placeholder="1000"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        EBCT (minutes) *
                      </label>
                      <input
                        type="number"
                        name="ebct"
                        required
                        step="0.1"
                        value={formData.ebct}
                        onChange={handleInputChange}
                        placeholder="10"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-light text-zinc-700 mb-2">
                      System Type *
                    </label>
                    <select
                      name="systemType"
                      required
                      value={formData.systemType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                    >
                      <option value="gac">Granular Activated Carbon (GAC)</option>
                      <option value="ix">Ion Exchange (IX)</option>
                      <option value="membrane">Membrane Filtration</option>
                    </select>
                  </div>
                </div>

                {/* PFAS Concentrations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-zinc-900 border-b pb-2">PFAS Concentrations (ng/L)</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        PFOA *
                      </label>
                      <input
                        type="number"
                        name="pfoa"
                        required
                        step="0.1"
                        value={formData.pfoa}
                        onChange={handleInputChange}
                        placeholder="15.0"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        PFOS *
                      </label>
                      <input
                        type="number"
                        name="pfos"
                        required
                        step="0.1"
                        value={formData.pfos}
                        onChange={handleInputChange}
                        placeholder="20.0"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        PFNA
                      </label>
                      <input
                        type="number"
                        name="pfna"
                        step="0.1"
                        value={formData.pfna}
                        onChange={handleInputChange}
                        placeholder="8.0"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        PFHxS
                      </label>
                      <input
                        type="number"
                        name="pfhxs"
                        step="0.1"
                        value={formData.pfhxs}
                        onChange={handleInputChange}
                        placeholder="7.0"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                  </div>
                </div>

                {/* Water Chemistry */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-zinc-900 border-b pb-2">Water Chemistry</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        TOC (mg/L) *
                      </label>
                      <input
                        type="number"
                        name="toc"
                        required
                        step="0.1"
                        value={formData.toc}
                        onChange={handleInputChange}
                        placeholder="2.5"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Sulfate (mg/L) *
                      </label>
                      <input
                        type="number"
                        name="sulfate"
                        required
                        step="0.1"
                        value={formData.sulfate}
                        onChange={handleInputChange}
                        placeholder="50"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        pH *
                      </label>
                      <input
                        type="number"
                        name="pH"
                        required
                        step="0.1"
                        min="0"
                        max="14"
                        value={formData.pH}
                        onChange={handleInputChange}
                        placeholder="7.2"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Temperature (°C) *
                      </label>
                      <input
                        type="number"
                        name="temperature"
                        required
                        step="0.1"
                        value={formData.temperature}
                        onChange={handleInputChange}
                        placeholder="20"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light text-zinc-700 mb-2">
                        Alkalinity (mg/L as CaCO₃) *
                      </label>
                      <input
                        type="number"
                        name="alkalinity"
                        required
                        step="0.1"
                        value={formData.alkalinity}
                        onChange={handleInputChange}
                        placeholder="100"
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-light"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Get Free PFAS Compliance Report (Instant)'}
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>

                <p className="text-xs text-zinc-500 font-light text-center">
                  By submitting, you agree to receive the compliance report and relevant water treatment updates.
                  We never share your data with third parties.
                </p>
              </form>
            </Card>
          ) : (
            <Card className={`p-12 ${
              scanResult?.report?.riskAssessment?.overallRiskLevel === 'critical' || scanResult?.report?.riskAssessment?.overallRiskLevel === 'high'
                ? 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200'
                : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
            }`}>
              <div className="text-center">
                <div className="p-4 bg-white rounded-full inline-block mb-6">
                  {scanResult?.report?.riskAssessment?.complianceStatus === 'non-compliant' ? (
                    <AlertTriangle className="w-16 h-16 text-rose-600" />
                  ) : (
                    <CheckCircle className="w-16 h-16 text-emerald-600" />
                  )}
                </div>
                <h3 className="text-2xl font-light text-zinc-900 mb-4">
                  PFAS Compliance Analysis Complete!
                </h3>
                <p className="text-zinc-700 font-light mb-6 max-w-2xl mx-auto leading-relaxed">
                  Analysis complete for <span className="font-medium">{scanResult?.facilityName}</span>.
                  {scanResult?.report?.riskAssessment?.complianceStatus === 'non-compliant' && (
                    <span className="block mt-2 text-rose-700 font-medium">
                      ⚠️ EPA compliance issues detected!
                    </span>
                  )}
                </p>

                <div className="grid md:grid-cols-4 gap-6 mt-8 mb-8">
                  <div className="bg-white rounded-lg p-4">
                    <div className={`text-2xl font-light mb-2 ${
                      scanResult?.report?.riskAssessment?.overallRiskScore > 7 ? 'text-rose-600' :
                      scanResult?.report?.riskAssessment?.overallRiskScore > 4 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {scanResult?.report?.riskAssessment?.overallRiskScore?.toFixed(1)}/10
                    </div>
                    <p className="text-sm text-zinc-600 font-light">Risk Score</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-light text-zinc-900 mb-2">
                      {scanResult?.report?.capacityAnalysis?.projectedLifespanMonths?.toFixed(0)} mo
                    </div>
                    <p className="text-sm text-zinc-600 font-light">GAC Lifespan</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-light text-zinc-900 mb-2">
                      {scanResult?.report?.capacityAnalysis?.removalEfficiency?.toFixed(0)}%
                    </div>
                    <p className="text-sm text-zinc-600 font-light">Removal Efficiency</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className={`text-2xl font-light mb-2 ${
                      scanResult?.report?.riskAssessment?.complianceStatus === 'compliant' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {scanResult?.report?.riskAssessment?.complianceStatus === 'compliant' ? '✓' : '✗'}
                    </div>
                    <p className="text-sm text-zinc-600 font-light">EPA Compliant</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 mb-6 text-left">
                  <h4 className="font-medium text-zinc-900 mb-3">Key Findings:</h4>
                  <ul className="text-sm text-zinc-600 space-y-2">
                    {scanResult?.report?.riskAssessment?.recommendations?.slice(0, 4).map((rec: string, idx: number) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        facilityName: '',
                        email: '',
                        flowRate: '',
                        bedVolume: '',
                        ebct: '',
                        pfasConcentration: '',
                        pfoa: '',
                        pfos: '',
                        pfna: '',
                        pfhxs: '',
                        toc: '',
                        sulfate: '',
                        pH: '',
                        temperature: '',
                        alkalinity: '',
                        systemType: 'gac'
                      });
                      setScanResult(null);
                    }}
                  >
                    Analyze Another System
                  </Button>
                </div>

                <p className="text-sm text-zinc-600 font-light mt-6">
                  Detailed report sent to {scanResult?.email}
                </p>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight tracking-tight text-zinc-900 mb-4">
              What's Included in Your Free Report
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Beaker className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">GAC Capacity Estimation</h3>
                  <p className="text-sm text-zinc-600 font-light leading-relaxed">
                    Freundlich isotherm model with TOC/sulfate competition adjustments.
                    Get accurate bed lifespan predictions.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">Breakthrough Prediction</h3>
                  <p className="text-sm text-zinc-600 font-light leading-relaxed">
                    Thomas model breakthrough curves showing when each PFAS compound will exceed EPA limits.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 rounded-xl">
                  <Shield className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">EPA Compliance Risk Score</h3>
                  <p className="text-sm text-zinc-600 font-light leading-relaxed">
                    0-10 risk score comparing your PFAS levels against EPA MCLs (PFOA/PFOS: 4 ng/L).
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-zinc-900 mb-2">Economic Analysis</h3>
                  <p className="text-sm text-zinc-600 font-light leading-relaxed">
                    Treatment cost per million gallons, GAC replacement timing, and estimated EPA fine exposure.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-12 px-6 bg-zinc-100/50 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* PFAS Flow Intelligence */}
          <div className="bg-white rounded-xl p-8 shadow-md border border-blue-200/50 border-2">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light text-zinc-900 mb-2">
                  Ready to See the Full Picture?
                </h3>
                <p className="text-zinc-600 font-light mb-4">
                  This scanner analyzes your water treatment system. The PFAS Flow Intelligence Platform tracks contamination
                  through the entire chain—from water sources to agricultural irrigation, food processing, and population exposure.
                  Model the complete pathway to predict and prevent PFAS exposure at scale.
                </p>
                <Link
                  href="/pfas-flow-intelligence"
                  className="text-blue-600 font-light hover:text-blue-700 inline-flex items-center gap-2"
                >
                  Explore PFAS Flow Intelligence Platform
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-12 border-t border-zinc-200">
        <p className="text-sm text-zinc-500 font-light mb-2">
          MIAR - Compliance Intelligence Engine
        </p>
      </div>
    </div>
  );
}
