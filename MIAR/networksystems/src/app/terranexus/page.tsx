import { Metadata } from 'next';
import Link from 'next/link';
import {
  Network,
  TrendingUp,
  Shield,
  Zap,
  Database,
  Users,
  ArrowRight,
  CheckCircle2,
  Target,
  BarChart3,
  Globe,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TerraNexus - Strategic Intelligence for Capital-Intensive Supply Chains | MIAR',
  description:
    'Transform complex, constrained supply chains into competitive advantage with AI-powered simulation, proprietary data, and deep industry expertise.',
};

export default function TerraNexusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by MIAR Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              TerraNexus
            </h1>
            <p className="text-2xl md:text-3xl font-light mb-8 text-emerald-100">
              Strategic Intelligence for Capital-Intensive Supply Chains
            </p>
            <p className="text-xl max-w-3xl mx-auto mb-12 text-emerald-50">
              Transform complex, constrained supply chains into a competitive advantage
              by unifying proprietary data, AI-powered simulation, and deep industry expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/terranexus/demo"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                Request Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/terranexus/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-500/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-50 to-transparent" />
      </section>

      {/* Core Pillars Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            Three Interconnected Pillars
          </h2>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
            Each pillar represents a layer of our defensive moat, creating compounding
            competitive advantage.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-zinc-200 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              Nexus Core™
            </h3>
            <p className="text-sm text-zinc-500 mb-4">The Intelligence Engine</p>
            <p className="text-zinc-600 mb-6">
              The core AI & simulation brain that powers strategic decision-making
              through digital twins, scenario simulation, and prescriptive analytics.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Digital Twin Studio for entire value chains</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Unlimited what-if scenario simulation</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>AI recommendations with quantified NPV impact</span>
              </li>
            </ul>
            <Link
              href="/terranexus/nexus-core"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold mt-6 hover:gap-3 transition-all"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-zinc-200 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              TerraData Network™
            </h3>
            <p className="text-sm text-zinc-500 mb-4">The Data Fabric</p>
            <p className="text-zinc-600 mb-6">
              Proprietary constraint library, market intelligence, and anonymized
              benchmarks that improve with every customer.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Infrastructure, supplier & regulatory constraints</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Real-time market pulse & geopolitical risk</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Industry benchmarks & peer comparisons</span>
              </li>
            </ul>
            <Link
              href="/terranexus/terradata"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold mt-6 hover:gap-3 transition-all"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-zinc-200 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              Nexus Advisory
            </h3>
            <p className="text-sm text-zinc-500 mb-4">The Expertise Layer</p>
            <p className="text-zinc-600 mb-6">
              Human-in-the-loop domain knowledge from former mining executives,
              supply chain experts, and industry veterans.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Dedicated experts for onboarding & modeling</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Quarterly strategic review sessions</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>24/7 rapid response for acute disruptions</span>
              </li>
            </ul>
            <Link
              href="/terranexus/advisory"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold mt-6 hover:gap-3 transition-all"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Modular Product Suite
            </h2>
            <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
              Start with what you need, expand as you grow. Each module delivers
              immediate ROI while building toward comprehensive optimization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Module 1 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-zinc-200">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Module 1</h3>
                  <p className="text-sm text-zinc-500">Mining Focus</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-2">
                Operational Resilience
              </h4>
              <p className="text-zinc-600 text-sm mb-4">
                Minimize downtime and optimize daily throughput
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-zinc-700">
                  • Critical MRO inventory optimization
                </li>
                <li className="text-sm text-zinc-700">
                  • Equipment failure prediction
                </li>
                <li className="text-sm text-zinc-700">
                  • Logistics & stockpile management
                </li>
              </ul>
              <div className="pt-4 border-t border-zinc-200">
                <p className="text-sm font-semibold text-zinc-900 mb-2">Target Results:</p>
                <p className="text-sm text-zinc-600">
                  95%+ uptime, 60% fewer emergency purchases, 25% lower inventory costs
                </p>
              </div>
            </div>

            {/* Module 2 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-zinc-200">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Module 2</h3>
                  <p className="text-sm text-zinc-500">Cross-Industry</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-2">
                Strategic Sourcing
              </h4>
              <p className="text-zinc-600 text-sm mb-4">
                De-risk primary input supply
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-zinc-700">
                  • Supplier risk scoring & optimization
                </li>
                <li className="text-sm text-zinc-700">
                  • Contract analysis & negotiation
                </li>
                <li className="text-sm text-zinc-700">
                  • Geopolitical impact analysis
                </li>
              </ul>
              <div className="pt-4 border-t border-zinc-200">
                <p className="text-sm font-semibold text-zinc-900 mb-2">Target Results:</p>
                <p className="text-sm text-zinc-600">
                  3+ suppliers for critical materials, 8-15% cost savings, 70% fewer disruptions
                </p>
              </div>
            </div>

            {/* Module 3 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-zinc-200">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-8 h-8 text-emerald-600" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Module 3</h3>
                  <p className="text-sm text-zinc-500">Executive Focus</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-2">
                Integrated Business Planning
              </h4>
              <p className="text-zinc-600 text-sm mb-4">
                Align operations with financial performance
              </p>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-zinc-700">
                  • NPV impact analysis
                </li>
                <li className="text-sm text-zinc-700">
                  • Working capital optimization
                </li>
                <li className="text-sm text-zinc-700">
                  • Board-level risk reporting
                </li>
              </ul>
              <div className="pt-4 border-t border-zinc-200">
                <p className="text-sm font-semibold text-zinc-900 mb-2">Target Results:</p>
                <p className="text-sm text-zinc-600">
                  3-7% NPV improvement, $50M+ working capital freed, 100% risk visibility
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/terranexus/modules"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Explore Modules in Detail
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Proven ROI for Capital-Intensive Industries
            </h2>
            <p className="text-xl text-emerald-100">
              Our customers achieve 10:1 to 25:1 return on investment in Year 1
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mining Case */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-8 h-8" />
                <h3 className="text-xl font-bold">Large Copper Producer</h3>
              </div>
              <p className="text-emerald-100 mb-6">
                Tier 1 Mining Company | 5 mines, 2 smelters, global distribution
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-emerald-200 mb-1">Year 1 Results:</p>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>NPV Increase:</span>
                      <span className="font-bold">4.2% ($420M)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Equipment Uptime:</span>
                      <span className="font-bold">87% → 94%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Working Capital:</span>
                      <span className="font-bold">-$125M</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Procurement Savings:</span>
                      <span className="font-bold">$65M</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="flex justify-between items-center text-lg font-bold">
                    <span>ROI:</span>
                    <span className="text-3xl">24:1</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Energy Case */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8" />
                <h3 className="text-xl font-bold">Nuclear Fleet Operator</h3>
              </div>
              <p className="text-emerald-100 mb-6">
                3 plants, 3.2 GW | Complex uranium supply chain
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-emerald-200 mb-1">Year 1 Value:</p>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Disruption Risk:</span>
                      <span className="font-bold">22% → 3%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Emergency Purchases:</span>
                      <span className="font-bold">$30M Saved</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Prevented Outage:</span>
                      <span className="font-bold">$200M Value</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Working Capital:</span>
                      <span className="font-bold">-$45M</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="flex justify-between items-center text-lg font-bold">
                    <span>Total Value:</span>
                    <span className="text-3xl">$275M</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-6">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-xl text-zinc-600 mb-12">
            Join industry leaders who have turned their supply chains into strategic assets
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/terranexus/demo"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Schedule a Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/terranexus/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
          <p className="text-sm text-zinc-500 mt-8">
            <Clock className="inline w-4 h-4 mr-1" />
            Average time to first value: <span className="font-semibold">90 days</span>
          </p>
        </div>
      </section>
    </div>
  );
}
