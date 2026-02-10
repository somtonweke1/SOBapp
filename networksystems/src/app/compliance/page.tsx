'use client';

import React from 'react';
import { PublicNav } from '@/components/navigation/public-nav';
import {
  AlertTriangle,
  Shield,
  FileSearch,
  Network,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-white/95 backdrop-blur-md py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-full text-sm font-light mb-6">
              <AlertTriangle className="w-4 h-4" />
              BIS Entity List Expanded - Are You Compliant?
            </div>

            <h1 className="text-5xl font-extralight tracking-tight text-zinc-900 mb-6">
              BIS Entity List Compliance Scanner
              <span className="block text-rose-600 font-light mt-2">Prevent Shipment Blocks Before They Happen</span>
            </h1>

            <p className="text-xl font-light text-zinc-600 mb-10 leading-relaxed">
              The Bureau of Industry and Security now tracks affiliates and ownership structures.
              One listed entity can affect dozens of your suppliers through parent companies, joint ventures, and minority stakes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/entity-list-scanner"
                className="px-8 py-4 bg-emerald-600 text-white text-lg font-light rounded-lg hover:bg-emerald-700 transition-colors shadow-xl hover:shadow-2xl inline-flex items-center justify-center gap-2"
              >
                <FileSearch className="w-5 h-5" />
                Run Free Compliance Check
              </Link>

              <Link
                href="/entity-list-report"
                className="px-8 py-4 bg-white text-zinc-900 text-lg font-light rounded-lg hover:bg-zinc-50 transition-colors border-2 border-zinc-200 inline-flex items-center justify-center gap-2"
              >
                View Sample Report
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight text-zinc-900 mb-4 tracking-tight">
              The Problem: Hidden Compliance Exposure
            </h2>
            <p className="text-lg text-zinc-600 font-light max-w-2xl mx-auto">
              Manual compliance checks don't scale when one listed entity can affect dozens of suppliers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-zinc-200/50">
              <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center mb-4">
                <Network className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Complex Ownership Trees</h3>
              <p className="text-zinc-600 font-light">
                Your supplier might be clean, but their parent company, sister companies, or joint venture partners could be listed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-zinc-200/50">
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">Frequent Updates</h3>
              <p className="text-zinc-600 font-light">
                BIS updates the entity list monthly. A supplier that was compliant last quarter might be flagged today.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-zinc-200/50">
              <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-3">High Financial Risk</h3>
              <p className="text-zinc-600 font-light">
                Blocked shipments = revenue loss + project delays. Average exposure: $12M+ for medium manufacturers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight text-zinc-900 mb-4 tracking-tight">
              How Our Compliance Scanner Works
            </h2>
            <p className="text-lg text-zinc-600 font-light max-w-2xl mx-auto">
              Automated ownership mapping + real-time entity list cross-reference
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Supplier List',
                desc: 'CSV, Excel, or PDF of your current suppliers',
                icon: FileSearch
              },
              {
                step: '2',
                title: 'Map Ownership Trees',
                desc: 'We trace parent companies, subsidiaries, and affiliates',
                icon: Network
              },
              {
                step: '3',
                title: 'Cross-Reference BIS List',
                desc: 'Real-time check against latest entity list updates',
                icon: Shield
              },
              {
                step: '4',
                title: 'Get Detailed Report',
                desc: '48-hour turnaround with alternative supplier recommendations',
                icon: CheckCircle
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-sm font-light text-emerald-600 mb-2">Step {item.step}</div>
                <h3 className="text-lg font-light text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-sm font-light text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight text-zinc-900 mb-4 tracking-tight">
              What You Get
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-zinc-200/50">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                'Comprehensive ownership tree mapping',
                'Real-time BIS entity list cross-reference',
                'Risk scoring for each supplier (1-10 scale)',
                'Alternative compliant supplier recommendations',
                'Estimated financial exposure calculation',
                'Priority action items (immediate vs. monitor)',
                'Monthly monitoring updates (subscription)',
                '48-hour turnaround for initial report'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="font-light text-zinc-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extralight text-white mb-6 tracking-tight">
            Ready to Check Your Compliance?
          </h2>
          <p className="text-xl font-light text-emerald-50 mb-8">
            Free for the first 10 companies. 48-hour turnaround.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/entity-list-scanner"
              className="px-8 py-4 bg-white text-emerald-600 text-lg font-light rounded-lg hover:bg-zinc-50 transition-colors shadow-xl hover:shadow-2xl inline-flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Free Compliance Check
            </Link>

            <Link
              href="/#contact"
              className="px-8 py-4 bg-transparent text-white text-lg font-light rounded-lg hover:bg-emerald-800 transition-colors border-2 border-white inline-flex items-center justify-center gap-2"
            >
              Book Demo Call
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-Link to Critical Minerals */}
      <section className="py-12 px-6 bg-zinc-100/50 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-md border border-zinc-200/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light text-zinc-900 mb-2">
                  Also Struggling with Critical Minerals Sourcing?
                </h3>
                <p className="text-zinc-600 font-light mb-4">
                  Beyond compliance, we help manufacturers navigate lithium, cobalt, and rare earth supply chain risks.
                </p>
                <Link
                  href="/supply-chain-risk"
                  className="text-emerald-600 font-light hover:text-emerald-700 inline-flex items-center gap-2"
                >
                  Explore Critical Minerals Risk Intelligence
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
