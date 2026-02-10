'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Calculator } from 'lucide-react';
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
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'MARGINAL':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'REJECTED':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FUNDABLE':
        return <CheckCircle className="h-8 w-8 text-emerald-600" />;
      case 'MARGINAL':
        return <AlertTriangle className="h-8 w-8 text-amber-600" />;
      case 'REJECTED':
        return <XCircle className="h-8 w-8 text-rose-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">DSCR Stress Test</h3>
          <p className="text-sm text-blue-700 mt-1">
            Analyze real estate deals for fundability. DSCR (Debt Service Coverage Ratio) measures a property's
            ability to cover debt payments. Most lenders require DSCR ≥ 1.25.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white/95 rounded-lg shadow-sm border border-zinc-200/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Deal Input</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">
              Gross Monthly Rent ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={grossRent}
              onChange={(e) => setGrossRent(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white/95 text-zinc-900 placeholder:text-zinc-500 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">
              Monthly Operating Expenses ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white/95 text-zinc-900 placeholder:text-zinc-500 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 2000 (or leave blank to use ratio)"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Leave blank to calculate from Operating Expense Ratio
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">
              Monthly Debt Service ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={debtService}
              onChange={(e) => setDebtService(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white/95 text-zinc-900 placeholder:text-zinc-500 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 3000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">
              Vacancy Rate <span className="text-zinc-600 font-normal">(Default: 10%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={vacancyRate}
              onChange={(e) => setVacancyRate(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white/95 text-zinc-900 placeholder:text-zinc-500 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.10"
            />
            <p className="text-xs text-zinc-500 mt-1">Enter as decimal (0.10 = 10%)</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-600 mb-1">
              Operating Expense Ratio <span className="text-zinc-600 font-normal">(Default: 50%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={operatingExpenseRatio}
              onChange={(e) => setOperatingExpenseRatio(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white/95 text-zinc-900 placeholder:text-zinc-500 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Used if expenses not provided. Enter as decimal (0.50 = 50%)
            </p>
          </div>
        </div>

        {quickDscr && (
          <div className="mt-6 rounded-lg border border-zinc-200/50 bg-white/80 p-4 text-sm text-zinc-600">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Lender Floor Benchmark</p>
            <div className="mt-2 grid gap-2">
              <p>NOI (90%): ${quickDscr.noi.toFixed(2)}</p>
              <p>DSCR: {quickDscr.ratio}</p>
              <p className={quickDscr.isFundable ? 'text-emerald-600' : 'text-amber-600'}>
                Status: {quickDscr.isFundable ? 'Fundable' : 'Below 1.25 Floor'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={loading || !grossRent || !debtService}
          className="mt-6 w-full md:w-auto px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <span className="text-sm font-medium text-rose-700">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className={`bg-white/95 rounded-lg shadow-sm border-2 p-6 ${getStatusColor(result.status)}`}>
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
          <div className="bg-white/95 rounded-lg shadow-sm border border-zinc-200/50 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Financial Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-md">
                <span className="font-medium text-zinc-600">Gross Monthly Rent</span>
                <span className="text-lg font-semibold text-zinc-900">
                  ${result.metrics.grossRent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-md">
                <span className="font-medium text-zinc-600">Vacancy Loss ({vacancyRatePercent}%)</span>
                <span className="text-lg font-semibold text-rose-600">
                  -${result.metrics.vacancyLoss.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-md border border-zinc-200/50">
                <span className="font-medium text-blue-200">Effective Gross Income</span>
                <span className="text-lg font-semibold text-blue-200">
                  ${result.metrics.effectiveGrossIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-md">
                <span className="font-medium text-zinc-600">Operating Expenses</span>
                <span className="text-lg font-semibold text-rose-600">
                  -${result.metrics.operatingExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-950 rounded-md border-2 border-emerald-800">
                <span className="font-medium text-green-900">Net Operating Income (NOI)</span>
                <span className="text-xl font-bold text-green-900">
                  ${result.metrics.netOperatingIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-md">
                <span className="font-medium text-zinc-600">Debt Service</span>
                <span className="text-lg font-semibold text-zinc-900">
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
          <div className="bg-white/95 rounded-lg shadow-sm border border-zinc-200/50 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Recommendation</span>
            </h3>
            <p className="text-zinc-600 whitespace-pre-line">{result.recommendation}</p>
          </div>
        </div>
      )}

      {/* Usage Info */}
      <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-lg p-4 border border-zinc-200/50">
        <h4 className="text-sm font-semibold text-zinc-900 mb-2">How DSCR Works</h4>
        <ul className="text-sm text-zinc-600 space-y-1 list-disc list-inside">
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
