'use client';

import { useState } from 'react';
import { Shield, Droplet, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import DPWAuditor from '@/components/deal-shield/DPWAuditor';
import DSCRStressTest from '@/components/deal-shield/DSCRStressTest';

export default function DealShieldPage() {
  const [activeTab, setActiveTab] = useState<'dpw' | 'dscr'>('dpw');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Deal-Shield & DPW Auditor</h1>
                <p className="text-sm text-slate-600">Baltimore Real Estate Forensics Platform</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Powered by MIAR Network Intelligence</div>
              <div className="text-xs text-slate-400">Mining Intelligence Platform</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dpw')}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'dpw'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <Droplet className="h-5 w-5" />
              <span>DPW Water Bill Auditor</span>
            </button>
            <button
              onClick={() => setActiveTab('dscr')}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'dscr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <TrendingUp className="h-5 w-5" />
              <span>DSCR Stress Test</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dpw' && <DPWAuditor />}
        {activeTab === 'dscr' && <DSCRStressTest />}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-slate-500">
            <p>Deal-Shield Dashboard - Baltimore Deal Analysis & DPW Forensics</p>
            <p className="mt-1 text-xs text-slate-400">
              Built on MIAR Network Intelligence Engine | Detect overcharges, stress test deals, optimize investments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

