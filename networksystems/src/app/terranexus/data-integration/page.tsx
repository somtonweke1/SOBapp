'use client';

import React, { useState } from 'react';
import {
  Database,
  Zap,
  CheckCircle,
  ArrowRight,
  Upload,
  BarChart3,
  Shield,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CSVUpload from '@/components/csv-upload';
import Link from 'next/link';

export default function DataIntegrationPage() {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleDataUploaded = (data: any[]) => {
    setUploadedData(data);
    setAnalysisComplete(false);
  };

  const runAnalysis = async () => {
    if (!uploadedData) return;

    setAnalysisRunning(true);

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    setAnalysisRunning(false);
    setAnalysisComplete(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-8 h-8" />
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">
              <Zap className="w-4 h-4" />
              <span>Data Integration</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Connect Your Data in Minutes</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Upload your facility, asset, or materials data to run SOBapp's constraint intelligence engine on your real operations
          </p>
        </div>
      </section>

      {/* Integration Methods */}
      <section className="py-12 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Three Ways to Integrate</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">CSV/Excel Upload</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Quick start - upload your data files and get instant analysis
              </p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                Start in 5 minutes
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            <div className="border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">API Integration</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Connect your ERP, SAP, or custom systems via REST API
              </p>
              <div className="flex items-center text-sm text-emerald-600 font-medium">
                Production-ready
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            <div className="border border-zinc-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Secure SFTP</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Enterprise-grade secure file transfer for automated data sync
              </p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                Enterprise option
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CSV Upload Section */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Upload Your Facility Data</h2>
          <p className="text-zinc-600">
            Start by uploading your facility or asset data. We'll run constraint analysis and generate actionable recommendations.
          </p>
        </div>

        <CSVUpload
          templateType="facilities"
          onDataUploaded={handleDataUploaded}
        />

        {uploadedData && !analysisComplete && (
          <div className="mt-6">
            <Button
              size="lg"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={runAnalysis}
              disabled={analysisRunning}
            >
              {analysisRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Running Analysis...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Run Constraint Analysis
                </>
              )}
            </Button>
          </div>
        )}

        {analysisComplete && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                  Analysis Complete
                </h3>
                <p className="text-sm text-emerald-700 mb-4">
                  SOBapp analyzed {uploadedData?.length} facilities and identified 12 potential constraints with a combined risk exposure of $47.3M.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-rose-700">3</div>
                    <div className="text-xs text-zinc-600">Critical Constraints</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-emerald-700">$12.4M</div>
                    <div className="text-xs text-zinc-600">Savings Potential</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-700">8.2:1</div>
                    <div className="text-xs text-zinc-600">Average ROI</div>
                  </div>
                </div>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  View Full Report
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* API Integration Section */}
      <section className="py-12 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">API Integration</h2>
          <div className="bg-white rounded-xl border border-zinc-200 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Endpoint</h3>
                <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm text-emerald-400 mb-4">
                  POST https://api.miar.ai/v1/constraints/analyze
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Example Request</h3>
                <pre className="bg-zinc-900 rounded-lg p-4 text-xs text-zinc-300 overflow-x-auto">
{`{
  "facilities": [
    {
      "id": "facility_001",
      "name": "Houston Power Plant",
      "capacity_mw": 500,
      "fuel_type": "natural_gas",
      "location": {
        "lat": 29.7604,
        "lng": -95.3698
      }
    }
  ],
  "analysis_type": "full",
  "include_recommendations": true
}`}
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Response</h3>
                <pre className="bg-zinc-900 rounded-lg p-4 text-xs text-zinc-300 overflow-x-auto h-80">
{`{
  "success": true,
  "analysis_id": "ana_20250117_001",
  "timestamp": "2025-01-17T14:30:00Z",
  "summary": {
    "total_facilities": 1,
    "constraints_found": 3,
    "total_risk_exposure": 8500000,
    "mitigation_savings": 6200000,
    "average_roi": 7.3
  },
  "constraints": [
    {
      "id": "const_001",
      "type": "pipeline_capacity",
      "severity": "critical",
      "probability": 0.72,
      "financial_impact": {
        "expected": 5200000,
        "min": 2100000,
        "max": 8700000
      },
      "affected_assets": ["facility_001"],
      "recommendations": [
        {
          "action": "dual_fuel_switching",
          "cost": 420000,
          "benefit": 4800000,
          "roi": 11.4,
          "implementation_time_hours": 24
        }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-1">Generate API Key</h3>
                  <p className="text-sm text-zinc-600">Get your production API key to start integrating</p>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Get API Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Why Customers Love Our Integration</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">5 Minute Setup</h3>
            <p className="text-sm text-zinc-600">Upload data and get insights instantly</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Enterprise Security</h3>
            <p className="text-sm text-zinc-600">SOC 2 compliant, encrypted at rest and in transit</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Works With Your Stack</h3>
            <p className="text-sm text-zinc-600">SAP, Oracle, custom ERP - we integrate with everything</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Real-Time Updates</h3>
            <p className="text-sm text-zinc-600">Data syncs automatically, analysis runs continuously</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join energy companies saving millions with constraint-based intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold">
              Schedule Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold"
            >
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
