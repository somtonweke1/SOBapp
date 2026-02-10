'use client';

import { useMemo, useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info, TrendingUp, RotateCcw } from 'lucide-react';
import { SOB_FORENSICS } from '@/lib/forensics';

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

type DPWAuditorProps = {
  onAuditComplete?: (payload: {
    input: {
      meterReadCurrent: number;
      meterReadLast: number;
      totalBill: number;
      serviceCharge?: number;
      sewerCharge?: number;
    };
    result: AuditResult;
  }) => void;
};

export default function DPWAuditor({ onAuditComplete }: DPWAuditorProps) {
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
  const meterCurrentValue = Number(meterReadCurrent);
  const meterLastValue = Number(meterReadLast);
  const totalBillValue = Number(totalBill);
  const quickAudit = useMemo(() => {
    if (!Number.isFinite(meterCurrentValue) || !Number.isFinite(meterLastValue) || !Number.isFinite(totalBillValue)) {
      return null;
    }
    const actualCCF = meterCurrentValue - meterLastValue;
    if (!Number.isFinite(actualCCF) || actualCCF <= 0) {
      return null;
    }
    const actualGallons = actualCCF * 748;
    const audit = SOB_FORENSICS.auditWaterBill(actualGallons, totalBillValue);
    const expectedMax = (actualCCF * 17.64) + 41.43;
    return {
      ...audit,
      actualCCF,
      expectedMax,
    };
  }, [meterCurrentValue, meterLastValue, totalBillValue]);

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
        if (onAuditComplete) {
          onAuditComplete({
            input: {
              meterReadCurrent: parseFloat(meterReadCurrent),
              meterReadLast: parseFloat(meterReadLast),
              totalBill: parseFloat(totalBill),
              serviceCharge: serviceCharge ? parseFloat(serviceCharge) : undefined,
              sewerCharge: sewerCharge ? parseFloat(sewerCharge) : undefined,
            },
            result: data.result as AuditResult,
          });
        }
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
        return 'text-red-400 bg-red-950 border-red-800';
      case 'high':
        return 'text-orange-400 bg-orange-950 border-orange-800';
      case 'medium':
        return 'text-amber-400 bg-amber-950 border-amber-800';
      default:
        return 'text-emerald-400 bg-emerald-950 border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-200">DPW Water Bill Auditor</h3>
            <p className="text-sm text-blue-300 mt-1">
              Detect Baltimore City water billing discrepancies and overcharges. Uses official Baltimore City tiered
              water rates to verify your bill accuracy. <strong>Inversion Analysis</strong> reverse-calculates what usage
              would justify a bill amount - exposing absurd billing.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveMode('audit')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeMode === 'audit'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calculator className="h-4 w-4 inline mr-2" />
            Standard Audit
          </button>
          <button
            onClick={() => setActiveMode('inversion')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeMode === 'inversion'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Inversion Analysis
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Water Bill Input</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Current Meter Reading (CCF)
            </label>
            <input
              type="number"
              step="0.01"
              value={meterReadCurrent}
              onChange={(e) => setMeterReadCurrent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 125.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Previous Meter Reading (CCF)
            </label>
            <input
              type="number"
              step="0.01"
              value={meterReadLast}
              onChange={(e) => setMeterReadLast(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 100.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Total Bill Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={totalBill}
              onChange={(e) => setTotalBill(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Service Charge ($) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10.00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Sewer Charge Multiplier <span className="text-slate-400 font-normal">(Default: 1.0 = 100%)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={sewerCharge}
              onChange={(e) => setSewerCharge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.0"
            />
            <p className="text-xs text-slate-500 mt-1">
              Baltimore City typically charges 100% of water cost for sewer (1.0)
            </p>
          </div>
        </div>

        {quickAudit && (
          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">CCF Benchmark</p>
            <div className="mt-2 grid gap-2">
              <p>Computed CCF: {quickAudit.actualCCF.toFixed(2)}</p>
              <p>Expected Max: ${quickAudit.expectedMax.toFixed(2)}</p>
              <p className={quickAudit.isValid ? 'text-emerald-400' : 'text-amber-400'}>
                Status: {quickAudit.isValid ? 'Within Expected Range' : 'Over Benchmark'}
              </p>
              <p className="text-slate-400">Discrepancy: ${quickAudit.discrepancy.toFixed(2)}</p>
            </div>
          </div>
        )}

        {activeMode === 'audit' ? (
          <button
            onClick={handleAudit}
            disabled={loading || !meterReadCurrent || !meterReadLast || !totalBill}
            className="mt-6 w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
            className="mt-6 w-full md:w-auto px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
        <div className="bg-red-950 border border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className={`bg-slate-950 rounded-lg shadow-sm border-2 p-6 ${getSeverityColor(result.severity)}`}>
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
                <div className={`text-lg font-semibold ${parseFloat(result.discrepancyAmount) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  ${result.discrepancyAmount}
                </div>
                <div className="text-xs opacity-70">{result.errorPercentage.toFixed(1)}% error</div>
              </div>
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Tier Breakdown</h3>
            <div className="space-y-2">
              {result.tierBreakdown.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-900 rounded-md">
                  <div>
                    <div className="font-medium text-slate-100">{tier.tier}</div>
                    <div className="text-sm text-slate-400">{tier.gallons.toLocaleString()} gallons</div>
                  </div>
                  <div className="text-lg font-semibold text-slate-100">${tier.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Recommendation</span>
            </h3>
            <p className="text-slate-300 whitespace-pre-line">{result.recommendation}</p>
          </div>
        </div>
      )}

      {/* Inversion Results */}
      {inversionResult && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className={`bg-slate-950 rounded-lg shadow-sm border-2 p-6 ${
            inversionResult.isAbsurd
              ? 'border-red-800 bg-red-950'
              : 'border-emerald-800 bg-emerald-950'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Inversion Analysis Results</h3>
                <p className="text-sm opacity-80">
                  {inversionResult.isAbsurd ? '🚨 Absurd Billing Detected' : 'Usage appears reasonable'}
                </p>
              </div>
              {inversionResult.isAbsurd ? (
                <AlertTriangle className="h-8 w-8 text-red-400" />
              ) : (
                <CheckCircle className="h-8 w-8 text-emerald-400" />
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
                <div className={`text-lg font-semibold ${inversionResult.isAbsurd ? 'text-red-400' : 'text-emerald-400'}`}>
                  {inversionResult.isAbsurd ? 'ABSURD' : 'REASONABLE'}
                </div>
              </div>
            </div>
          </div>

          {/* Absurdity Explanation */}
          {inversionResult.isAbsurd && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">🚨 Billing Error Detected</h3>
              <p className="text-red-800 whitespace-pre-line mb-4">{inversionResult.absurdityReason}</p>
              <div className="bg-slate-950 rounded-md p-4 border border-red-800">
                <p className="text-sm text-red-700 font-medium">{inversionResult.recommendation}</p>
              </div>
            </div>
          )}

          {/* Tier Breakdown */}
          <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Usage Tier Breakdown</h3>
            <div className="space-y-2">
              {inversionResult.tierBreakdown.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-900 rounded-md">
                  <div>
                    <div className="font-medium text-slate-100">{tier.tier}</div>
                    <div className="text-sm text-slate-400">{tier.gallons.toLocaleString()} gallons</div>
                  </div>
                  <div className="text-lg font-semibold text-slate-100">${tier.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Recommendation</span>
            </h3>
            <p className="text-slate-300 whitespace-pre-line">{inversionResult.recommendation}</p>
          </div>
        </div>
      )}

      {/* Usage Info */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-100 mb-2">How It Works</h4>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
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
