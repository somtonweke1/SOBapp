import { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MapPin,
  DollarSign,
  Shield,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  ConstellationEnergyDemo,
  EnergyIntelligenceService,
} from '@/services/energy-intelligence-service';

export const metadata: Metadata = {
  title: 'Constellation Energy Demo - TerraNexus Energy Intelligence | MIAR',
  description:
    'Live demonstration of TerraNexus Energy Intelligence for Constellation Energy nuclear and gas operations.',
};

export default function ConstellationDemoPage() {
  // Get demo data
  const { materials, constraints, facilities, scenarios } = ConstellationEnergyDemo;
  const quickStats = ConstellationEnergyDemo.getQuickStats();
  const portfolioRisk = EnergyIntelligenceService.calculatePortfolioRisk(facilities, constraints);
  const execSummary = EnergyIntelligenceService.generateExecutiveSummary(
    facilities,
    materials,
    constraints,
    scenarios
  );

  // Calculate nuclear materials status
  const nuclearMaterials = materials.filter((m) => m.category === 'nuclear');
  const gasMaterials = materials.filter((m) => m.category === 'gas');
  const mroMaterials = materials.filter((m) => m.category === 'mro');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-3 text-sm">
                <Zap className="w-4 h-4" />
                <span>TerraNexus Energy Intelligence</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Constellation Energy</h1>
              <p className="text-xl text-blue-100">Live Supply Chain Intelligence Dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200 mb-1">Demo Environment</p>
              <p className="text-2xl font-bold">{facilities.length} Facilities</p>
              <p className="text-sm text-blue-200">{quickStats.totalCapacity.toLocaleString()} MW Total Capacity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="py-8 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-emerald-700" />
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-700 font-medium mb-1">Potential Annual Savings</p>
              <p className="text-3xl font-bold text-emerald-900">
                ${(execSummary.potentialSavings.annual / 1000000).toFixed(0)}M
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {execSummary.potentialSavings.roi.toFixed(0)}:1 ROI in Year 1
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-red-700" />
                <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded">
                  {constraints.filter((c) => c.severity === 'critical').length} CRITICAL
                </span>
              </div>
              <p className="text-sm text-red-700 font-medium mb-1">Risk Exposure</p>
              <p className="text-3xl font-bold text-red-900">
                ${(execSummary.riskMitigation.currentExposure / 1000000).toFixed(0)}M
              </p>
              <p className="text-xs text-red-600 mt-1">
                {constraints.filter((c) => c.severity === 'critical' || c.severity === 'high').length} high-severity
                constraints
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-blue-700" />
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium mb-1">Risk Mitigation Potential</p>
              <p className="text-3xl font-bold text-blue-900">{execSummary.riskMitigation.improvement}%</p>
              <p className="text-xs text-blue-600 mt-1">
                Reduction in supply disruption risk
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-700" />
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium mb-1">Time to Value</p>
              <p className="text-3xl font-bold text-zinc-900">90 days</p>
              <p className="text-xs text-blue-600 mt-1">
                Average first savings verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Map */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Fleet Overview
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities.map((facility) => {
            const impactAnalysis = EnergyIntelligenceService.calculatePlantAvailabilityImpact(
              facility,
              constraints.flatMap((c) => c.affectedMaterials)
            );

            return (
              <div
                key={facility.id}
                className="bg-white rounded-lg shadow-md p-4 border border-zinc-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-sm">{facility.name}</h3>
                    <p className="text-xs text-zinc-500">{facility.location.state}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      impactAnalysis.riskLevel === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : impactAnalysis.riskLevel === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : impactAnalysis.riskLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {impactAnalysis.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Capacity:</span>
                    <span className="font-semibold">{facility.capacity} MW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Status:</span>
                    <span
                      className={`font-semibold ${
                        facility.operationalStatus === 'online'
                          ? 'text-green-600'
                          : facility.operationalStatus === 'refueling'
                            ? 'text-blue-600'
                            : 'text-zinc-600'
                      }`}
                    >
                      {facility.operationalStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Outage Cost:</span>
                    <span className="font-semibold">
                      ${(facility.outageCostPerDay / 1000000).toFixed(1)}M/day
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Material Tracking - Nuclear */}
      <section className="py-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Nuclear Fuel Supply Chain</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {nuclearMaterials.map((material) => {
              const balance = EnergyIntelligenceService.calculateSupplyDemandBalance(material);
              const regulatory = EnergyIntelligenceService.generateRegulatoryStatus(material.id);

              return (
                <div key={material.id} className="bg-white rounded-lg shadow-md p-4 border border-zinc-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 text-sm mb-1">{material.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-zinc-900">
                          ${material.currentPrice.toLocaleString()}
                        </span>
                        <span className="text-xs">/{material.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {material.priceChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        material.priceChange > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {material.priceChange > 0 ? '+' : ''}
                      {material.priceChange.toFixed(1)}%
                    </span>
                    <span className="text-xs text-zinc-500">this month</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-600">Supply/Demand</span>
                      <span
                        className={`text-xs font-bold ${
                          balance.status === 'critical' || balance.status === 'deficit'
                            ? 'text-red-600'
                            : balance.status === 'balanced'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                      >
                        {balance.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mb-2">{balance.forecast}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-200">
                    <div className="flex items-center gap-1 mb-1">
                      {regulatory.status === 'compliant' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      )}
                      <span className="text-xs font-semibold text-zinc-700">NRC Compliant</span>
                    </div>
                    {regulatory.nextDeadline && (
                      <p className="text-xs text-zinc-500">{regulatory.nextDeadline}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Natural Gas Tracking */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Natural Gas Procurement</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {gasMaterials.map((material) => {
            const balance = EnergyIntelligenceService.calculateSupplyDemandBalance(material);

            return (
              <div key={material.id} className="bg-white rounded-lg shadow-md p-6 border border-zinc-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-lg mb-1">{material.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-zinc-900">
                        ${material.currentPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-zinc-500">/{material.unit}</span>
                      <span
                        className={`text-sm font-semibold flex items-center gap-1 ${
                          material.priceChange > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {material.priceChange > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {material.priceChange > 0 ? '+' : ''}
                        {material.priceChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      balance.status === 'deficit'
                        ? 'bg-red-100 text-red-700'
                        : balance.status === 'balanced'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {balance.status.toUpperCase()}
                  </span>
                </div>

                <div className="bg-zinc-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-zinc-900 mb-2">Supply/Demand Balance:</p>
                  <p className="text-sm text-zinc-700">{balance.forecast}</p>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      balance.trend === 'improving'
                        ? 'bg-green-500'
                        : balance.trend === 'deteriorating'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-zinc-600">Trend: {balance.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Critical Constraints */}
      <section className="py-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Critical Supply Chain Constraints
          </h2>
          <div className="space-y-4">
            {constraints
              .filter((c) => c.severity === 'critical' || c.severity === 'high')
              .map((constraint) => (
                <div key={constraint.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            constraint.severity === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {constraint.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500">{constraint.type}</span>
                      </div>
                      <h3 className="font-bold text-zinc-900 text-lg mb-2">{constraint.description}</h3>
                      <p className="text-zinc-700 mb-3">{constraint.impact}</p>
                    </div>
                    {constraint.financialImpact && (
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-1">Financial Impact</p>
                        <p className="text-2xl font-bold text-red-700">
                          ${(constraint.financialImpact / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-900 mb-2">Recommended Mitigation Strategies:</p>
                    <ul className="space-y-2">
                      {constraint.mitigationStrategies.map((strategy, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <p className="text-xs text-zinc-600">
                      <strong>Affected Materials:</strong> {constraint.affectedMaterials.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Scenario Analysis */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Value Delivery Scenarios
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {scenarios.slice(0, 3).map((scenario) => (
            <div key={scenario.id} className="bg-white rounded-lg shadow-md p-6 border border-zinc-200">
              <h3 className="font-bold text-zinc-900 text-lg mb-2">{scenario.title}</h3>
              <p className="text-zinc-700 mb-4">{scenario.description}</p>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-emerald-900 mb-2">Value Proposition:</p>
                <p className="text-sm text-emerald-800">{scenario.valueProposition}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Cost Reduction</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {scenario.quantifiedBenefits.costReduction.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Risk Reduction</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {scenario.quantifiedBenefits.riskReduction}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Availability Improvement</p>
                  <p className="text-2xl font-bold text-blue-700">
                    +{scenario.quantifiedBenefits.availabilityImprovement.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Annual Savings</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ${(scenario.quantifiedBenefits.annualSavings / 1000000).toFixed(0)}M
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                <span className="text-sm text-zinc-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {scenario.implementationTimeline}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transform Constellation's Fuel Supply Chain Into a Strategic Asset
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            This demo shows how TerraNexus Energy Intelligence delivers real-time visibility,
            constraint analysis, and quantified value across your nuclear and gas operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/terranexus/contact?company=constellation"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Schedule Full Presentation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/terranexus/pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-lg font-semibold hover:bg-blue-500/30 transition-colors"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            Typical ROI: 15-25:1 in Year 1 • 90-day time to first value • Proven with Fortune 500 energy companies
          </p>
        </div>
      </section>
    </div>
  );
}
