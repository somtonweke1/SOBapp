'use client';

import { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info, TrendingUp, RotateCcw } from 'lucide-react';

interface AuditResult {
  isError: boolean;
  discrepancyAmount: string;
  actualGallons: number;
  actualCCF: number;
  expectedBill: number;
  actualBill: number;
  tierBreakdown: Array<{ tier: string; gallons: number; cost: number }>;
  errorPercentage: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface InversionResult {
  inferredUsageGallons: number;
  inferredUsageCCF: number;
  isAbsurd: boolean;
  absurdityReason: string;
  tierBreakdown: Array<{ tier: string; gallons: number; cost: number }>;
  comparison: {
    typical2Bedroom: number;
    typical3Bedroom: number;
    inferredVsTypical: number;
  };
  recommendation: string;
}

export default function DPWAuditor() {
  const [activeMode, setActiveMode] = useState<'audit' | 'inversion'>('audit');
  const [meterReadCurrent, setMeterReadCurrent] = useState('');
  const [meterReadLast, setMeterReadLast] = useState('');
  const [totalBill, setTotalBill] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [sewerCharge, setSewerCharge] = useState('1.0');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [inversionResult, setInversionResult] = useState<InversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/forensics/dpw-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterReadCurrent: parseFloat(meterReadCurrent),
          meterReadLast: parseFloat(meterReadLast),
          totalBill: parseFloat(totalBill),
          serviceCharge: serviceCharge ? parseFloat(serviceCharge) : undefined,
          sewerCharge: sewerCharge ? parseFloat(sewerCharge) : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Failed to audit water bill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInversion = async () => {
    setLoading(true);
    setError(null);
    setInversionResult(null);

    try {
      const response = await fetch('/api/forensics/dpw-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inversion: {
            totalBill: parseFloat(totalBill),
            serviceCharge: serviceCharge ? parseFloat(serviceCharge) : undefined,
            sewerCharge: sewerCharge ? parseFloat(sewerCharge) : undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setInversionResult(data.inversion);
      } else {
        setError(data.error || 'Failed to perform inversion analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">DPW Water Bill Auditor</h3>
            <p className="text-sm text-blue-700 mt-1">
              Detect Baltimore City water billing discrepancies and overcharges. Uses official Baltimore City tiered
              water rates to verify your bill accuracy. <strong>Inversion Analysis</strong> reverse-calculates what usage
              would justify a bill amount - exposing absurd billing.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveMode('audit')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeMode === 'audit'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calculator className="h-4 w-4 inline mr-2" />
            Standard Audit
          </button>
          <button
            onClick={() => setActiveMode('inversion')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeMode === 'inversion'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Inversion Analysis
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Water Bill Input</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Meter Reading (CCF)
            </label>
            <input
              type="number"
              step="0.01"
              value={meterReadCurrent}
              onChange={(e) => setMeterReadCurrent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 125.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Previous Meter Reading (CCF)
            </label>
            <input
              type="number"
              step="0.01"
              value={meterReadLast}
              onChange={(e) => setMeterReadLast(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 100.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Total Bill Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={totalBill}
              onChange={(e) => setTotalBill(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service Charge ($) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10.00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sewer Charge Multiplier <span className="text-slate-400 font-normal">(Default: 1.0 = 100%)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={sewerCharge}
              onChange={(e) => setSewerCharge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.0"
            />
            <p className="text-xs text-slate-500 mt-1">
              Baltimore City typically charges 100% of water cost for sewer (1.0)
            </p>
          </div>
        </div>

        {activeMode === 'audit' ? (
          <button
            onClick={handleAudit}
            disabled={loading || !meterReadCurrent || !meterReadLast || !totalBill}
            className="mt-6 w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                <span>Audit Water Bill</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleInversion}
            disabled={loading || !totalBill}
            className="mt-6 w-full md:w-auto px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Invert Bill (What Usage Justifies This?)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${getSeverityColor(result.severity)}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Audit Results</h3>
                <p className="text-sm opacity-80">
                  Severity: <span className="font-semibold capitalize">{result.severity}</span>
                </p>
              </div>
              {result.isError ? (
                <AlertTriangle className="h-8 w-8" />
              ) : (
                <CheckCircle className="h-8 w-8" />
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs opacity-70 mb-1">Actual Usage</div>
                <div className="text-lg font-semibold">{result.actualCCF} CCF</div>
                <div className="text-xs opacity-70">{result.actualGallons.toLocaleString()} gallons</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Expected Bill</div>
                <div className="text-lg font-semibold">${result.expectedBill.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Actual Bill</div>
                <div className="text-lg font-semibold">${result.actualBill.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Discrepancy</div>
                <div className={`text-lg font-semibold ${parseFloat(result.discrepancyAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${result.discrepancyAmount}
                </div>
                <div className="text-xs opacity-70">{result.errorPercentage.toFixed(1)}% error</div>
              </div>
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tier Breakdown</h3>
            <div className="space-y-2">
              {result.tierBreakdown.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <div>
                    <div className="font-medium text-slate-900">{tier.tier}</div>
                    <div className="text-sm text-slate-600">{tier.gallons.toLocaleString()} gallons</div>
                  </div>
                  <div className="text-lg font-semibold text-slate-900">${tier.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Recommendation</span>
            </h3>
            <p className="text-slate-700 whitespace-pre-line">{result.recommendation}</p>
          </div>
        </div>
      )}

      {/* Inversion Results */}
      {inversionResult && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
            inversionResult.isAbsurd
              ? 'border-red-200 bg-red-50'
              : 'border-green-200 bg-green-50'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Inversion Analysis Results</h3>
                <p className="text-sm opacity-80">
                  {inversionResult.isAbsurd ? '🚨 Absurd Billing Detected' : 'Usage appears reasonable'}
                </p>
              </div>
              {inversionResult.isAbsurd ? (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs opacity-70 mb-1">Inferred Usage</div>
                <div className="text-lg font-semibold">{inversionResult.inferredUsageGallons.toLocaleString()} gal</div>
                <div className="text-xs opacity-70">{inversionResult.inferredUsageCCF} CCF</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">vs. Typical 2BR</div>
                <div className="text-lg font-semibold">
                  {inversionResult.comparison.inferredVsTypical.toFixed(1)}x
                </div>
                <div className="text-xs opacity-70">
                  {inversionResult.comparison.typical2Bedroom.toLocaleString()} gal typical
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">vs. Typical 3BR</div>
                <div className="text-lg font-semibold">
                  {(inversionResult.inferredUsageGallons / inversionResult.comparison.typical3Bedroom).toFixed(1)}x
                </div>
                <div className="text-xs opacity-70">
                  {inversionResult.comparison.typical3Bedroom.toLocaleString()} gal typical
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Status</div>
                <div className={`text-lg font-semibold ${inversionResult.isAbsurd ? 'text-red-600' : 'text-green-600'}`}>
                  {inversionResult.isAbsurd ? 'ABSURD' : 'REASONABLE'}
                </div>
              </div>
            </div>
          </div>

          {/* Absurdity Explanation */}
          {inversionResult.isAbsurd && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">🚨 Billing Error Detected</h3>
              <p className="text-red-800 whitespace-pre-line mb-4">{inversionResult.absurdityReason}</p>
              <div className="bg-white rounded-md p-4 border border-red-200">
                <p className="text-sm text-red-700 font-medium">{inversionResult.recommendation}</p>
              </div>
            </div>
          )}

          {/* Tier Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Usage Tier Breakdown</h3>
            <div className="space-y-2">
              {inversionResult.tierBreakdown.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <div>
                    <div className="font-medium text-slate-900">{tier.tier}</div>
                    <div className="text-sm text-slate-600">{tier.gallons.toLocaleString()} gallons</div>
                  </div>
                  <div className="text-lg font-semibold text-slate-900">${tier.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Recommendation</span>
            </h3>
            <p className="text-slate-700 whitespace-pre-line">{inversionResult.recommendation}</p>
          </div>
        </div>
      )}

      {/* Usage Info */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">How It Works</h4>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          {activeMode === 'audit' ? (
            <>
              <li>Enter your current and previous meter readings in CCF (hundred cubic feet)</li>
              <li>Enter your total bill amount</li>
              <li>The auditor calculates expected bill using Baltimore City tiered water rates</li>
              <li>Flags discrepancies greater than 10% of total bill</li>
              <li>Provides tier breakdown and recommendations for disputes</li>
            </>
          ) : (
            <>
              <li><strong>Inversion Analysis</strong> reverse-calculates what usage would justify a bill amount</li>
              <li>Enter only the bill amount (no meter readings needed)</li>
              <li>Shows inferred usage and compares to typical residential consumption</li>
              <li>Flags absurd billing (e.g., "To justify $900, you'd need 50,000 gallons")</li>
              <li>Perfect for exposing billing errors when you don't have meter readings</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

