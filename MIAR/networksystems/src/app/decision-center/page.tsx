'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Shield,
  Target,
  RefreshCw,
  Bell,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: {
    metric: string;
    oldValue: number;
    newValue: number;
    percentChange: number;
  };
  estimatedImpact: {
    financial: number;
    operational: string;
  };
  requiresAction: boolean;
}

interface DecisionOption {
  id: string;
  rank: number;
  title: string;
  description: string;
  upfrontCost: number;
  expectedBenefit: number;
  netValue: number;
  roi: number;
  timeToImplement: number;
  confidence: number;
  riskReduction: number;
}

interface DecisionFrame {
  id: string;
  situation: string;
  problem: string;
  stakes: string;
  urgency: 'immediate' | 'urgent' | 'important' | 'monitor';
  expiresAt: Date;
  options: DecisionOption[];
  recommendedOption: string;
}

export default function DecisionCenterPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [decisions, setDecisions] = useState<DecisionFrame[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/alerts');
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data.activeAlerts.items || []);
        setDecisions(result.data.pendingDecisions.items || []);
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });

      const result = await response.json();
      if (result.success) {
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to trigger check:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveDecision = async (decisionId: string, optionId: string) => {
    setApproving(true);
    try {
      const response = await fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          decisionId,
          optionId,
          approvedBy: 'Executive User' // In production, use actual user identity
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchAlerts();
        setSelectedDecision(null);
      }
    } catch (error) {
      console.error('Failed to approve decision:', error);
    } finally {
      setApproving(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'rose';
      case 'urgent': return 'orange';
      case 'important': return 'amber';
      default: return 'blue';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'rose';
      case 'high': return 'orange';
      case 'medium': return 'amber';
      default: return 'blue';
    }
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-lg font-light text-zinc-600">Loading Decision Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Hero - Swiss Minimal Style */}
      <section className="bg-white/60 backdrop-blur-md border-b border-zinc-200/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/?access=platform"
              className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors text-sm font-light"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-4">
                <h1 className="text-4xl font-extralight text-zinc-900 tracking-tight">Decision Center</h1>
              </div>
              <p className="text-xl font-light text-zinc-600">
                Real-time constraint monitoring and automated decision generation
              </p>
            </div>
            <Button
              onClick={triggerCheck}
              disabled={loading}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-light px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Now
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Summary Cards - Glassmorphism */}
      {summary && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Active Alerts */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-rose-50/50 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  {summary.totalAlerts > 0 && (
                    <div className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {summary.totalAlerts}
                    </div>
                  )}
                </div>
                <p className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Active Alerts</p>
                <p className="text-3xl font-extralight text-rose-600 mb-2">{summary.totalAlerts}</p>
                <p className="text-xs font-light text-zinc-500">Requiring immediate attention</p>
              </Card>

              {/* Total Exposure */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50/50 rounded-xl">
                    <DollarSign className="w-6 h-6 text-amber-600" />
                  </div>
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Total Exposure</p>
                <p className="text-3xl font-extralight text-amber-600 mb-2">
                  ${(summary.totalExposure / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs font-light text-zinc-500">Across all active constraints</p>
              </Card>

              {/* Decisions Pending */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50/50 rounded-xl">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  {summary.decisionsRequired > 0 && (
                    <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                  )}
                </div>
                <p className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">Decisions Pending</p>
                <p className="text-3xl font-extralight text-blue-600 mb-2">{summary.decisionsRequired}</p>
                <p className="text-xs font-light text-zinc-500">
                  {summary.immediateActions} require immediate action
                </p>
              </Card>

              {/* System Status */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50/50 rounded-xl">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-2">System Status</p>
                <p className="text-3xl font-extralight text-emerald-600 mb-2">Active</p>
                <p className="text-xs font-light text-zinc-500">All monitoring sources online</p>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Pending Decisions */}
      {decisions.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-emerald-600 animate-pulse" />
              <h2 className="text-2xl font-extralight text-zinc-900">Decisions Required</h2>
            </div>
            <span className="text-sm font-light text-zinc-600">
              {decisions.filter(d => d.urgency === 'immediate' || d.urgency === 'urgent').length} urgent
            </span>
          </div>

          <div className="space-y-6">
            {decisions.map((decision) => {
              const urgencyColor = getUrgencyColor(decision.urgency);
              const isExpanded = selectedDecision === decision.id;
              const timeRemaining = new Date(decision.expiresAt).getTime() - Date.now();
              const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));

              return (
                <Card
                  key={decision.id}
                  className={`p-6 bg-white/80 backdrop-blur-sm border-l-4 rounded-2xl shadow-lg ${
                    decision.urgency === 'immediate'
                      ? 'border-rose-500'
                      : decision.urgency === 'urgent'
                        ? 'border-orange-500'
                        : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-medium bg-${urgencyColor}-100 text-${urgencyColor}-700 uppercase tracking-wide`}>
                          {decision.urgency}
                        </span>
                        <span className="text-sm font-light text-zinc-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {hoursRemaining}h remaining
                        </span>
                      </div>
                      <h3 className="text-xl font-light text-zinc-900 mb-2">{decision.situation}</h3>
                      <p className="text-sm font-light text-zinc-700 mb-3">{decision.problem}</p>
                      <p className="text-sm font-medium text-zinc-900">{decision.stakes}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDecision(isExpanded ? null : decision.id)}
                      className="rounded-xl border-zinc-300 font-light hover:bg-zinc-50"
                    >
                      {isExpanded ? 'Collapse' : 'Review Options'}
                      <ChevronRight className={`ml-2 w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-zinc-200/50">
                      <h4 className="text-sm font-light text-zinc-900 uppercase tracking-wide mb-4">
                        Decision Options (Ranked by NPV)
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {decision.options.map((option) => {
                          const isRecommended = option.id === decision.recommendedOption;

                          return (
                            <div
                              key={option.id}
                              className={`p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-200 ${
                                isRecommended
                                  ? 'border-emerald-300 bg-emerald-50/50 shadow-md'
                                  : 'border-zinc-200/50 bg-white/80 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-light text-zinc-600">
                                      Option {option.rank}
                                    </span>
                                    {isRecommended && (
                                      <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg uppercase tracking-wide">
                                        RECOMMENDED
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-medium text-zinc-900 text-lg">{option.title}</h5>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-1">Cost</div>
                                  <div className="text-xl font-extralight text-rose-600">
                                    ${(option.upfrontCost / 1000000).toFixed(1)}M
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-1">Benefit</div>
                                  <div className="text-xl font-extralight text-emerald-600">
                                    ${(option.expectedBenefit / 1000000).toFixed(1)}M
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-1">Net Value</div>
                                  <div className={`text-xl font-extralight ${
                                    option.netValue > 0 ? 'text-emerald-600' : 'text-rose-600'
                                  }`}>
                                    ${(option.netValue / 1000000).toFixed(1)}M
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-light text-zinc-600 uppercase tracking-wide mb-1">ROI</div>
                                  <div className="text-xl font-extralight text-blue-600">
                                    {option.roi.toFixed(1)}:1
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4 p-3 bg-zinc-50/50 rounded-xl">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-light text-zinc-600">Implementation Time:</span>
                                  <span className="font-medium text-zinc-900">
                                    {option.timeToImplement}h
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-light text-zinc-600">Risk Reduction:</span>
                                  <span className="font-medium text-zinc-900">
                                    {(option.riskReduction * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-light text-zinc-600">Confidence:</span>
                                  <span className="font-medium text-zinc-900">
                                    {(option.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>

                              {option.id !== 'option_do_nothing' && (
                                <Button
                                  className={`w-full rounded-xl font-light transition-all duration-200 ${
                                    isRecommended
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                  }`}
                                  onClick={() => approveDecision(decision.id, option.id)}
                                  disabled={approving}
                                >
                                  {approving ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsUp className="w-4 h-4 mr-2" />
                                      Approve Option {option.rank}
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-extralight text-zinc-900">Active Constraint Alerts</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {alerts.slice(0, 6).map((alert) => {
                const severityColor = getSeverityColor(alert.severity);

                return (
                  <Card key={alert.id} className="p-5 bg-white/80 backdrop-blur-sm border-l-4 border-amber-500 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-${severityColor}-100 text-${severityColor}-700 uppercase tracking-wide`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs font-light text-zinc-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-zinc-900 mb-1">
                          {alert.details.metric} changed {alert.details.percentChange.toFixed(1)}%
                        </p>
                        <p className="text-xs font-light text-zinc-600 mb-2">
                          From {alert.details.oldValue.toLocaleString()} to {alert.details.newValue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-extralight text-rose-600">
                          ${(alert.estimatedImpact.financial / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs font-light text-zinc-500">Impact</div>
                      </div>
                    </div>
                    <p className="text-xs font-light text-zinc-600">{alert.estimatedImpact.operational}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {decisions.length === 0 && alerts.length === 0 && (
        <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200/50 p-12 shadow-xl">
            <div className="p-4 bg-emerald-50 rounded-2xl inline-block mb-4">
              <CheckCircle className="w-16 h-16 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-extralight text-zinc-900 mb-2">All Clear</h3>
            <p className="font-light text-zinc-600 mb-6">
              No active constraint alerts or pending decisions at this time.
            </p>
            <Button onClick={triggerCheck} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-light px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Manual Check
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
