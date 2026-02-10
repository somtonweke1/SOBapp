import { Metadata } from 'next';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  Star,
  Building2,
  Factory,
  Crown,
  Zap,
  Shield,
  Users,
  Headphones,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SOBapp Infrastructure Pricing - Choose Your Plan | SOBapp',
  description:
    'Flexible pricing tiers for capital-intensive supply chains. From single-site operations to enterprise-wide strategic partnerships.',
};

export default function SOBappInfrastructurePricingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Pricing That Scales With Your Success
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Start with what you need, expand as you grow. All tiers deliver immediate
              ROI while building toward comprehensive optimization.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8 -mt-32 relative z-10">
          {/* Explorer Tier */}
          <div className="bg-slate-950 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Factory className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Nexus Explorer</h3>
                  <p className="text-sm text-slate-500">For Single-Site Operators</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-100">$75,000</span>
                  <span className="text-slate-500">/year per site</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Annual subscription • Up to 25 users
                </p>
              </div>

              <div className="mb-8">
                <p className="text-slate-300 font-medium mb-4">Core Offering:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      <strong>Module 1</strong> (Operational Resilience)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Basic TerraData Access (regional constraints)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Standard Support (email, 48hr response)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Self-service training materials
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Quarterly performance reports
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Onboarding included
                    </span>
                  </li>
                </ul>
              </div>

              <Link
                href="/terranexus/contact?tier=explorer"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-sm font-semibold text-slate-100 mb-2">Ideal For:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Single mine operations</li>
                  <li>• Production facilities</li>
                  <li>• Regional distribution centers</li>
                  <li>• Companies testing the platform</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Enterprise Tier - Featured */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-2xl border-2 border-emerald-400 overflow-hidden transform lg:scale-105 relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-emerald-200 px-4 py-1 text-sm font-bold rounded-bl-lg">
              MOST POPULAR
            </div>
            <div className="p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-950/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Nexus Enterprise</h3>
                  <p className="text-sm text-emerald-100">For Multi-Site Corporations</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$500,000</span>
                  <span className="text-emerald-100">/year base</span>
                </div>
                <p className="text-sm text-emerald-100 mt-2">
                  + 1-2% of verified savings over $1M • Unlimited users
                </p>
              </div>

              <div className="mb-8">
                <p className="font-medium mb-4">Everything in Explorer, plus:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      <strong>All Modules</strong> (Operational, Sourcing, Planning)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Full TerraData Network Access (global)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      5 Strategic Review Sessions per year
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      API Integrations (ERP, MES, WMS)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Dedicated Customer Success Manager
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Priority Support (24/7, &lt;4hr response)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Custom reporting and dashboards
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Multi-year discounts available
                    </span>
                  </li>
                </ul>
              </div>

              <Link
                href="/terranexus/contact?tier=enterprise"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-slate-950 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-950 transition-colors"
              >
                Contact Sales
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm font-semibold mb-2">Ideal For:</p>
                <ul className="text-sm text-emerald-100 space-y-1">
                  <li>• Baltimore Property majors (BHP, Rio, Glencore)</li>
                  <li>• Energy companies (nuclear, renewables)</li>
                  <li>• Multi-site manufacturing</li>
                  <li>• Global supply chains</li>
                </ul>
              </div>

              <div className="mt-6 bg-slate-950/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">Example ROI:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Base Fee:</span>
                    <span className="font-semibold">$500,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Savings (verified):</span>
                    <span className="font-semibold">$18M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Value Share (1.5%):</span>
                    <span className="font-semibold">$270,000</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/20">
                    <span>Total Cost:</span>
                    <span className="font-bold">$770,000</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-yellow-400 font-bold">ROI:</span>
                    <span className="text-2xl font-bold text-yellow-400">23:1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elite Tier */}
          <div className="bg-slate-950 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Nexus Elite</h3>
                  <p className="text-sm text-slate-500">Strategic Partnership</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-100">Custom</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  $2-5M annually • Multi-year contracts
                </p>
              </div>

              <div className="mb-8">
                <p className="text-slate-300 font-medium mb-4">Everything in Enterprise, plus:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      <strong>Dedicated Rapid Response Team</strong> (24/7)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Co-development of new features
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Custom Constraint Library Builds
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      White-glove onboarding (executive level)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Monthly Strategic Review Sessions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Industry leadership program participation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Exclusive network insights
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Joint business planning
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Shared IP on custom developments
                    </span>
                  </li>
                </ul>
              </div>

              <Link
                href="/terranexus/contact?tier=elite"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-emerald-700 transition-colors"
              >
                Schedule Discussion
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-sm font-semibold text-slate-100 mb-2">Ideal For:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Industry leaders setting standards</li>
                  <li>• Unique, complex requirements</li>
                  <li>• Strategic transformation initiatives</li>
                  <li>• Building competitive advantage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-8 text-center">
          Detailed Feature Comparison
        </h2>
        <div className="bg-slate-950 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-100">
                    Explorer
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-300 bg-emerald-950">
                    Enterprise
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-100">
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Operational Resilience Module</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center bg-emerald-950/30">
                    <Check className="w-5 h-5 text-emerald-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Strategic Sourcing Module</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center bg-emerald-950/30">
                    <Check className="w-5 h-5 text-emerald-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Business Planning Module</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center bg-emerald-950/30">
                    <Check className="w-5 h-5 text-emerald-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">TerraData Network Access</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">Regional</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 font-semibold bg-emerald-950/30">Global</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 font-semibold">Global + Custom</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Strategic Review Sessions</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 bg-emerald-950/30">5/year</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 font-semibold">Monthly</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Support Response Time</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">48 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 bg-emerald-950/30">&lt;4 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 font-semibold">&lt;2 hours</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Rapid Response Team</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-slate-500 bg-emerald-950/30">—</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">API Integrations</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center bg-emerald-950/30">
                    <Check className="w-5 h-5 text-emerald-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">Feature Co-development</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-slate-500 bg-emerald-950/30">—</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-blue-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-300">User Limit</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">Up to 25</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 font-semibold bg-emerald-950/30">Unlimited</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-100 font-semibold">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-12 text-center">
            Why SOBapp Infrastructure Delivers Superior ROI
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-950 rounded-xl shadow-md p-8">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">
                Value-Based Pricing
              </h3>
              <p className="text-slate-400">
                Enterprise tier aligns our success with yours. Pay more only when you
                save more. Typical ROI: 15:1 to 25:1 in Year 1.
              </p>
            </div>

            <div className="bg-slate-950 rounded-xl shadow-md p-8">
              <div className="w-12 h-12 bg-emerald-950 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">
                Proven Methodology
              </h3>
              <p className="text-slate-400">
                Our constraint-based approach has delivered $300M+ in verified savings
                across Baltimore property, energy, and industrial sectors.
              </p>
            </div>

            <div className="bg-slate-950 rounded-xl shadow-md p-8">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">
                Fast Time-to-Value
              </h3>
              <p className="text-slate-400">
                Average 90 days to first quantified savings. Our onboarding process
                gets you operational fast with immediate quick wins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-12 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <details className="group bg-slate-950 rounded-xl shadow-md p-6">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-100">
              <span>How is the value-based fee calculated for Enterprise tier?</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-4 text-slate-400">
              We track all recommended actions from the platform. When you implement them,
              we jointly verify the savings achieved. The value share (1-2%) applies only
              to verified savings over $1M annually. For example: if you save $20M, you pay
              $500K base + $285K value share = $785K total for $20M in value (25:1 ROI).
            </p>
          </details>

          <details className="group bg-slate-950 rounded-xl shadow-md p-6">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-100">
              <span>Can I upgrade from Explorer to Enterprise later?</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-4 text-slate-400">
              Absolutely! Most customers start with Explorer to prove value on a single site,
              then expand to Enterprise for company-wide deployment. We provide seamless
              migration and credit your Explorer fees toward Enterprise if you upgrade within
              12 months.
            </p>
          </details>

          <details className="group bg-slate-950 rounded-xl shadow-md p-6">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-100">
              <span>What's included in onboarding?</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-4 text-slate-400">
              All tiers include: (1) Discovery workshops to map your supply chain, (2) Digital
              twin modeling by our experts, (3) Integration with your existing systems, (4)
              User training for your team, and (5) Initial scenario library creation. Typical
              onboarding takes 4-6 weeks.
            </p>
          </details>

          <details className="group bg-slate-950 rounded-xl shadow-md p-6">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-100">
              <span>Do you offer pilot programs or POCs?</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-4 text-slate-400">
              Yes! For qualified prospects, we offer 90-day pilots at 50% discount. This allows
              you to validate ROI on a single site or specific use case before committing to
              full deployment. Contact us to discuss pilot eligibility.
            </p>
          </details>

          <details className="group bg-slate-950 rounded-xl shadow-md p-6">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-100">
              <span>What makes SOBapp Infrastructure different from traditional SCM software?</span>
              <ArrowRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-4 text-slate-400">
              Three key differences: (1) <strong>Constraint-focused</strong>: We model the
              physical, regulatory, and market constraints that matter in capital-intensive
              industries, not just demand forecasting. (2) <strong>Financial impact</strong>:
              Every recommendation shows NPV impact, not just efficiency metrics. (3)
              <strong>Expert services</strong>: Former Baltimore property/energy executives guide your
              implementation, not just software support.
            </p>
          </details>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 to-emerald-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Schedule a demo to see how SOBapp Infrastructure can transform your supply chain into a
            strategic asset.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/terranexus/demo"
              className="inline-flex items-center justify-center px-8 py-4 bg-slate-950 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-950 transition-colors"
            >
              Schedule Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/terranexus/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-9500/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-lg font-semibold hover:bg-emerald-9500/30 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
