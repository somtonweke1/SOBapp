'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Calculator, BarChart3 } from 'lucide-react';
import { SOB_FORENSICS } from '@/lib/forensics';

interface DSCRResult {
  ratio: string;
  ratioValue: number;
  status: 'FUNDABLE' | 'MARGINAL' | 'REJECTED';
  noi: number;
  maxLoanPossible: number;
  monthlyPaymentCapacity: number;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
  metrics: {
    grossRent: number;
    vacancyLoss: number;
    effectiveGrossIncome: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    debtService: number;
    dscr: number;
  };
}

export default function DSCRStressTest() {
  const [grossRent, setGrossRent] = useState('');
  const [expenses, setExpenses] = useState('');
  const [debtService, setDebtService] = useState('');
  const [vacancyRate, setVacancyRate] = useState('0.10');
  const [operatingExpenseRatio, setOperatingExpenseRatio] = useState('0.50');
  const [result, setResult] = useState<DSCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vacancyRateValue = Number(vacancyRate);
  const vacancyRatePercent = Number.isFinite(vacancyRateValue) ? vacancyRateValue * 100 : 0;
  const rentValue = Number(grossRent);
  const debtServiceValue = Number(debtService);
  const quickDscr = useMemo(() => {
    if (!Number.isFinite(rentValue) || !Number.isFinite(debtServiceValue) || debtServiceValue === 0) {
      return null;
    }
    const quick = SOB_FORENSICS.stressTestDSCR(rentValue, debtServiceValue);
    return {
      ...quick,
      noi: rentValue * 0.9,
    };
  }, [rentValue, debtServiceValue]);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/forensics/dscr-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal: {
            grossRent: parseFloat(grossRent),
            expenses: expenses ? parseFloat(expenses) : 0,
            debtService: parseFloat(debtService),
            vacancyRate: vacancyRate ? parseFloat(vacancyRate) : undefined,
            operatingExpenseRatio: operatingExpenseRatio ? parseFloat(operatingExpenseRatio) : undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Failed to calculate DSCR');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FUNDABLE':
        return 'text-emerald-400 bg-emerald-950 border-emerald-800';
      case 'MARGINAL':
        return 'text-amber-400 bg-amber-950 border-amber-800';
      case 'REJECTED':
        return 'text-red-400 bg-red-950 border-red-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FUNDABLE':
        return <CheckCircle className="h-8 w-8 text-emerald-400" />;
      case 'MARGINAL':
        return <AlertTriangle className="h-8 w-8 text-amber-400" />;
      case 'REJECTED':
        return <XCircle className="h-8 w-8 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BarChart3 className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-200">DSCR Stress Test</h3>
            <p className="text-sm text-blue-300 mt-1">
              Analyze real estate deals for fundability. DSCR (Debt Service Coverage Ratio) measures a property's
              ability to cover debt payments. Most lenders require DSCR ≥ 1.25.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Deal Input</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Gross Monthly Rent ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={grossRent}
              onChange={(e) => setGrossRent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Monthly Operating Expenses ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2000 (or leave blank to use ratio)"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank to calculate from Operating Expense Ratio
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Monthly Debt Service ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={debtService}
              onChange={(e) => setDebtService(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 3000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Vacancy Rate <span className="text-slate-400 font-normal">(Default: 10%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={vacancyRate}
              onChange={(e) => setVacancyRate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.10"
            />
            <p className="text-xs text-slate-500 mt-1">Enter as decimal (0.10 = 10%)</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Operating Expense Ratio <span className="text-slate-400 font-normal">(Default: 50%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={operatingExpenseRatio}
              onChange={(e) => setOperatingExpenseRatio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used if expenses not provided. Enter as decimal (0.50 = 50%)
            </p>
          </div>
        </div>

        {quickDscr && (
          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Lender Floor Benchmark</p>
            <div className="mt-2 grid gap-2">
              <p>NOI (90%): ${quickDscr.noi.toFixed(2)}</p>
              <p>DSCR: {quickDscr.ratio}</p>
              <p className={quickDscr.isFundable ? 'text-emerald-400' : 'text-amber-400'}>
                Status: {quickDscr.isFundable ? 'Fundable' : 'Below 1.25 Floor'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={loading || !grossRent || !debtService}
          className="mt-6 w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              <span>Calculate DSCR</span>
            </>
          )}
        </button>
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
          <div className={`bg-slate-950 rounded-lg shadow-sm border-2 p-6 ${getStatusColor(result.status)}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">DSCR Analysis</h3>
                <p className="text-sm opacity-80">
                  Status: <span className="font-semibold">{result.status}</span> | Risk:{' '}
                  <span className="font-semibold capitalize">{result.riskLevel}</span>
                </p>
              </div>
              {getStatusIcon(result.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs opacity-70 mb-1">DSCR Ratio</div>
                <div className="text-2xl font-bold">{result.ratio}</div>
                <div className="text-xs opacity-70">
                  {result.ratioValue >= 1.25 ? 'Meets requirement' : 'Below 1.25 threshold'}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Net Operating Income</div>
                <div className="text-lg font-semibold">${result.noi.toLocaleString()}</div>
                <div className="text-xs opacity-70">Monthly</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Max Loan Capacity</div>
                <div className="text-lg font-semibold">${result.maxLoanPossible.toLocaleString()}</div>
                <div className="text-xs opacity-70">Estimated</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Payment Capacity</div>
                <div className="text-lg font-semibold">${result.monthlyPaymentCapacity.toLocaleString()}</div>
                <div className="text-xs opacity-70">At 1.25 DSCR</div>
              </div>
            </div>
          </div>

          {/* Metrics Breakdown */}
          <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Financial Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-md">
                <span className="font-medium text-slate-300">Gross Monthly Rent</span>
                <span className="text-lg font-semibold text-slate-100">
                  ${result.metrics.grossRent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-md">
                <span className="font-medium text-slate-300">Vacancy Loss ({vacancyRatePercent}%)</span>
                <span className="text-lg font-semibold text-red-400">
                  -${result.metrics.vacancyLoss.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-md border border-slate-800">
                <span className="font-medium text-blue-200">Effective Gross Income</span>
                <span className="text-lg font-semibold text-blue-200">
                  ${result.metrics.effectiveGrossIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-md">
                <span className="font-medium text-slate-300">Operating Expenses</span>
                <span className="text-lg font-semibold text-red-400">
                  -${result.metrics.operatingExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-950 rounded-md border-2 border-emerald-800">
                <span className="font-medium text-green-900">Net Operating Income (NOI)</span>
                <span className="text-xl font-bold text-green-900">
                  ${result.metrics.netOperatingIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-md">
                <span className="font-medium text-slate-300">Debt Service</span>
                <span className="text-lg font-semibold text-slate-100">
                  ${result.metrics.debtService.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md border-2 border-purple-200">
                <span className="font-medium text-purple-900">DSCR Ratio</span>
                <span className="text-2xl font-bold text-purple-900">{result.metrics.dscr.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Recommendation</span>
            </h3>
            <p className="text-slate-300 whitespace-pre-line">{result.recommendation}</p>
          </div>
        </div>
      )}

      {/* Usage Info */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-100 mb-2">How DSCR Works</h4>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>
            <strong>DSCR = NOI / Debt Service</strong> (Net Operating Income divided by monthly debt payment)
          </li>
          <li>
            <strong>FUNDABLE:</strong> DSCR ≥ 1.25 (meets most lender requirements)
          </li>
          <li>
            <strong>MARGINAL:</strong> DSCR 1.10 - 1.24 (may require negotiation or alternative lenders)
          </li>
          <li>
            <strong>REJECTED:</strong> DSCR &lt; 1.10 (deal needs restructuring)
          </li>
          <li>NOI = Effective Gross Income - Operating Expenses</li>
          <li>Effective Gross Income = Gross Rent - Vacancy Loss</li>
        </ul>
      </div>
    </div>
  );
}
