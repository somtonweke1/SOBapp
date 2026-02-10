'use client';

import React, { useState } from 'react';
import { PublicNav } from '@/components/navigation/public-nav';
import {
  AlertTriangle,
  Upload,
  Shield,
  CheckCircle,
  ArrowRight,
  FileText,
  Users,
  Zap,
  Lock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function EntityListScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !email || !companyName) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);
      formData.append('companyName', companyName);

      const response = await fetch('/api/entity-list-scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Scan failed');
      }

      setScanResult(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during scanning');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-full text-sm font-light mb-6">
              <AlertTriangle className="w-4 h-4" />
              BIS Entity List Expanded - Are Your Suppliers Affected?
            </div>

            <h1 className="text-5xl font-extralight tracking-tight text-slate-100 mb-6">
              Check Your Supply Chain for BIS Entity List Exposure
              <span className="block text-rose-600 font-light mt-2">Before Your Shipments Get Blocked</span>
            </h1>

            <p className="text-xl font-light text-slate-400 mb-8 leading-relaxed">
              The BIS entity list now covers affiliates and ownership structures. We automatically map your supplier
              relationships and flag compliance risks in <span className="font-medium text-slate-100">48 hours</span>.
            </p>

            <div className="flex items-center justify-center gap-4">
              <a href="#scanner">
                <Button size="lg" className="text-lg px-8 py-6 bg-rose-600 hover:bg-rose-700">
                  Get Free Compliance Check
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Link href="/entity-list-report">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  View Sample Report
                </Button>
              </Link>
            </div>

            <p className="text-sm font-light text-slate-500 mt-4">
              ✓ Free for first 10 companies  •  ✓ 48-hour turnaround  •  ✓ No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight tracking-tight text-slate-100 mb-4">
              The BIS Entity List Just Got More Complex
            </h2>
            <p className="text-lg font-light text-slate-400 max-w-3xl mx-auto">
              New rules mean affiliates and ownership structures now trigger compliance requirements.
              Manual checks are impossible at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-rose-50 rounded-xl w-fit mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-light text-slate-100 mb-3">Expanded Coverage</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                Entity list now includes parent companies, subsidiaries, and affiliates. One listing can affect dozens of suppliers.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-amber-950 rounded-xl w-fit mb-4">
                <Lock className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-light text-slate-100 mb-3">Hidden Relationships</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                Ownership structures are complex. A supplier might be compliant on paper but owned by a listed entity.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-slate-900 rounded-xl w-fit mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-light text-slate-100 mb-3">Real Financial Risk</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                Blocked shipments, project delays, revenue loss. One missed entity list check can cost millions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Scanner Section */}
      <section id="scanner" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight tracking-tight text-slate-100 mb-4">
              Free Compliance Check - First 10 Companies
            </h2>
            <p className="text-lg font-light text-slate-400">
              Upload your supplier list, we'll map ownership structures and flag entity list exposure in 48 hours
            </p>
          </div>

          {!submitted ? (
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Supplier List (CSV, Excel, or PDF)
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-950'
                        : 'border-zinc-300 hover:border-zinc-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-950 rounded-lg inline-block">
                          <FileText className="w-8 h-8 text-emerald-300" />
                        </div>
                        <p className="font-medium text-slate-100">{file.name}</p>
                        <p className="text-sm text-slate-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="text-sm text-rose-600 hover:underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-900 rounded-lg inline-block">
                          <Upload className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-light text-slate-300 mb-2">
                            Drag and drop your supplier list here, or
                          </p>
                          <label className="cursor-pointer text-emerald-300 hover:underline font-medium">
                            browse files
                            <input
                              type="file"
                              className="hidden"
                              accept=".csv,.xlsx,.xls,.pdf"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        <p className="text-sm text-slate-500">
                          Supports CSV, Excel, PDF • Max 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-light text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Inc."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-light"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-light text-slate-300 mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-light"
                  />
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
                  className="w-full text-lg py-6"
                  disabled={!file || !email || !companyName || loading}
                >
                  {loading ? 'Scanning...' : 'Get Free Compliance Report (Instant)'}
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>

                <p className="text-xs text-slate-500 font-light text-center">
                  By submitting, you agree to receive the compliance report and relevant supply chain risk updates.
                  We never share your data with third parties.
                </p>
              </form>
            </Card>
          ) : (
            <Card className={`p-12 ${
              scanResult?.summary?.overallRiskLevel === 'critical' || scanResult?.summary?.overallRiskLevel === 'high'
                ? 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200'
                : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-800'
            }`}>
              <div className="text-center">
                <div className="p-4 bg-slate-950 rounded-full inline-block mb-6">
                  {scanResult?.summary?.criticalSuppliers > 0 ? (
                    <AlertTriangle className="w-16 h-16 text-rose-600" />
                  ) : (
                    <CheckCircle className="w-16 h-16 text-emerald-300" />
                  )}
                </div>
                <h3 className="text-2xl font-light text-slate-100 mb-4">
                  Compliance Scan Complete!
                </h3>
                <p className="text-slate-300 font-light mb-6 max-w-2xl mx-auto leading-relaxed">
                  We've analyzed <span className="font-medium">{scanResult?.summary?.totalSuppliers || 0} suppliers</span> from your list.
                  {scanResult?.summary?.criticalSuppliers > 0 && (
                    <span className="block mt-2 text-rose-700 font-medium">
                      ⚠️ {scanResult.summary.criticalSuppliers} critical-risk supplier{scanResult.summary.criticalSuppliers > 1 ? 's' : ''} identified!
                    </span>
                  )}
                </p>

                <div className="grid md:grid-cols-4 gap-6 mt-8 mb-8">
                  <div className="bg-slate-950 rounded-lg p-4">
                    <div className="text-2xl font-light text-slate-100 mb-2">{scanResult?.summary?.totalSuppliers || 0}</div>
                    <p className="text-sm text-slate-400 font-light">Suppliers Scanned</p>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-4">
                    <div className={`text-2xl font-light mb-2 ${
                      (scanResult?.summary?.criticalSuppliers || 0) > 0 ? 'text-rose-600' : 'text-emerald-300'
                    }`}>
                      {scanResult?.summary?.criticalSuppliers || 0}
                    </div>
                    <p className="text-sm text-slate-400 font-light">Critical Risk</p>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-4">
                    <div className={`text-2xl font-light mb-2 ${
                      (scanResult?.summary?.highRiskSuppliers || 0) > 0 ? 'text-amber-300' : 'text-slate-100'
                    }`}>
                      {scanResult?.summary?.highRiskSuppliers || 0}
                    </div>
                    <p className="text-sm text-slate-400 font-light">High Risk</p>
                  </div>
                  <div className="bg-slate-950 rounded-lg p-4">
                    <div className="text-2xl font-light text-slate-100 mb-2">
                      {scanResult?.summary?.overallRiskScore?.toFixed(1) || '0.0'}/10
                    </div>
                    <p className="text-sm text-slate-400 font-light">Overall Risk</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-lg p-6 mb-6">
                  <p className="text-slate-300 font-light">
                    A detailed HTML report has been generated. Check your email at <span className="font-medium">{email}</span> for the full analysis including:
                  </p>
                  <ul className="text-sm text-slate-400 mt-4 space-y-2 text-left max-w-md mx-auto">
                    <li>• Detailed risk breakdown for each supplier</li>
                    <li>• Alternative compliant suppliers</li>
                    <li>• Strategic recommendations</li>
                    <li>• Estimated financial exposure: <span className="font-medium text-rose-600">{scanResult?.summary?.estimatedExposure}</span></li>
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {scanResult?.scanId && (
                    <a
                      href={`/api/entity-list-scan?scanId=${scanResult.scanId}&format=html`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="lg" className="text-lg px-8 py-6">
                        View Full Report
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setSubmitted(false);
                      setFile(null);
                      setEmail('');
                      setCompanyName('');
                      setScanResult(null);
                    }}
                  >
                    Scan Another List
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight tracking-tight text-slate-100 mb-4">
              What's Included in Your Free Report
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-slate-100 mb-2">Entity List Exposure Analysis</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Complete mapping of which suppliers (or their affiliates) appear on the BIS entity list.
                    Includes ownership tree visualization.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-950 rounded-xl">
                  <Shield className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-slate-100 mb-2">Risk Score by Supplier</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Each supplier gets a compliance risk score (1-10) based on ownership structure,
                    geographic location, and industry sector.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-900 rounded-xl">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-slate-100 mb-2">Alternative Source Recommendations</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    For high-risk suppliers, we identify compliant alternatives with comparable capabilities
                    and pricing.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-950 rounded-xl">
                  <Zap className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-slate-100 mb-2">Action Plan with Timeline</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Prioritized list of actions to take, from immediate supplier changes to long-term
                    diversification strategies.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
            <div className="text-center">
              <h2 className="text-2xl font-extralight mb-6">
                Built by Johns Hopkins Supply Chain Intelligence Lab
              </h2>
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="text-3xl font-extralight mb-2">127</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-light">
                    Baltimore Property Operations Tracked
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extralight mb-2">15+</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-light">
                    Network Algorithms
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extralight mb-2">5+ Years</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-light">
                    Research Experience
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extralight mb-2">Real-Time</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-light">
                    Entity List Updates
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Upgrade CTA */}
      <section className="py-16 bg-slate-950/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 bg-gradient-to-br from-blue-50 to-blue-100/50 border-slate-800">
            <div className="text-center">
              <h2 className="text-3xl font-extralight tracking-tight text-slate-100 mb-4">
                Need Continuous Monitoring?
              </h2>
              <p className="text-lg font-light text-slate-300 mb-8 max-w-2xl mx-auto">
                The free compliance check is a one-time snapshot. For continuous entity list monitoring
                with real-time alerts, explore our full platform.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="text-left bg-slate-950 rounded-lg p-6">
                  <h3 className="font-medium text-slate-100 mb-3">Included in Full Platform:</h3>
                  <ul className="space-y-2 text-sm text-slate-400 font-light">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      Real-time entity list monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      Automatic supplier risk alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      Ownership structure mapping
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      Critical minerals risk tracking
                    </li>
                  </ul>
                </div>
                <div className="text-left bg-slate-950 rounded-lg p-6">
                  <h3 className="font-medium text-slate-100 mb-3">Pricing:</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-light">One-time Deep Dive</span>
                      <span className="font-medium text-slate-100">$5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-light">Professional (Annual)</span>
                      <span className="font-medium text-slate-100">$25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-light">Enterprise (Annual)</span>
                      <span className="font-medium text-slate-100">$100,000</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Link href="/supply-chain-risk">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Explore Full Platform
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="mailto:somton@jhu.edu?subject=Entity List Compliance - Full Platform">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                    Schedule Demo
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Cross-Link to Critical Minerals */}
      <section className="py-12 px-6 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-950 rounded-xl p-8 shadow-md border border-slate-800/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light text-slate-100 mb-2">
                  Also Struggling with Critical Minerals Sourcing?
                </h3>
                <p className="text-slate-400 font-light mb-4">
                  Beyond compliance, we help manufacturers navigate lithium, cobalt, and rare earth supply chain risks.
                </p>
                <Link
                  href="/critical-minerals"
                  className="text-emerald-300 font-light hover:text-emerald-300 inline-flex items-center gap-2"
                >
                  Explore Critical Minerals Risk Intelligence
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-12 border-t border-slate-800">
        <p className="text-sm text-slate-500 font-light mb-2">
          SOBapp - Supply Chain Risk Intelligence
        </p>
      </div>
    </div>
  );
}
