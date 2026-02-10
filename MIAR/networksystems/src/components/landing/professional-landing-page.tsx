'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle, TrendingUp, Globe, DollarSign, Shield, Target, Users, Calendar, Mail, Phone, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import InstantValueCalculator from './instant-value-calculator';

interface ProfessionalLandingPageProps {
  onGetStarted: () => void;
  user?: any;
  onAccessPlatform?: () => void;
}

export default function ProfessionalLandingPage({ onGetStarted, user, onAccessPlatform }: ProfessionalLandingPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        alert('Thank you for your interest! We will contact you within 24 hours to schedule your strategic briefing.');
        // Reset form
        setFormData({ name: '', company: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
        alert('There was an error submitting your request. Please try again or contact us directly.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      alert('There was an error submitting your request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSales = () => {
    // Scroll to contact form or open email
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartTrial = () => {
    // Redirect to login for trial signup
    onGetStarted();
  };

  const handleFooterLink = (section: string) => {
    // For demo purposes, scroll to top or show alert
    if (section === 'Network Analysis' || section === 'Real-time Intelligence' || section === 'Strategic Advisory' || section === 'API Access') {
      if (user && onAccessPlatform) {
        onAccessPlatform();
      } else {
        onGetStarted();
      }
    } else {
      alert(`${section} page coming soon. Contact us for more information.`);
    }
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:hello@miar.ai?subject=Strategic Briefing Request';
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+15551234567';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-zinc-900 text-white px-4 py-2 text-sm font-light tracking-wide rounded">
                MIAR
              </div>
              <span className="text-lg font-extralight text-zinc-900">Critical Minerals Risk Intelligence</span>
            </div>
            {user ? (
              <button
                onClick={onAccessPlatform}
                className="bg-emerald-600 text-white px-6 py-2 rounded font-light hover:bg-emerald-700 transition-colors"
              >
                Access Platform
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="bg-zinc-900 text-white px-6 py-2 rounded font-light hover:bg-zinc-800 transition-colors"
              >
                Client Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-extralight text-zinc-900 mb-6 tracking-tight">
            See Supply Chain Risks
            <span className="block text-emerald-600 font-light">Before They Become Crises</span>
          </h1>
          <p className="text-xl text-zinc-600 mb-8 font-light max-w-3xl mx-auto leading-relaxed">
            From blocked shipments to material shortages - we map hidden relationships in your supply chain
            and warn you of disruptions before they cost you millions. Network analysis technology trusted by
            manufacturers, energy companies, and defense contractors.
          </p>
          {user ? (
            <button
              onClick={onAccessPlatform}
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>Access Your Platform</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => document.getElementById('instant-calculator')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-emerald-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>Calculate Your Risk (Free - 60 Sec)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* INSTANT VALUE CALCULATOR - New Section */}
      <section id="instant-calculator" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-light mb-4">
              ⚡ NEW: Instant Risk Assessment
            </div>
            <h2 className="text-4xl font-extralight text-zinc-900 mb-4 tracking-tight">
              Quantify Your Supply Chain Risk
              <span className="block text-emerald-600 font-light mt-2">In Just 60 Seconds</span>
            </h2>
            <p className="text-xl text-zinc-600 font-light max-w-3xl mx-auto leading-relaxed">
              Answer 4 simple questions and get instant quantified exposure across compliance,
              geopolitical, and market risks. See exactly how much is at stake.
            </p>
          </div>

          <InstantValueCalculator
            onComplete={(result, profile) => {
              // Track analytics
              console.log('EVPI calculated:', result.evpiValue, 'for', profile.industry);
            }}
            onEmailCapture={async (email, result) => {
              // Send to backend for PDF generation and email
              await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email,
                  name: '',
                  company: '',
                  message: `Risk Assessment Request - EVPI: $${(result.evpiValue / 1000000).toFixed(1)}M`,
                  type: 'risk_assessment'
                })
              });
            }}
          />
        </div>
      </section>

      {/* Two Beachheads - Use Cases */}
      <section className="py-16 px-6 bg-gradient-to-br from-zinc-100 to-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extralight text-zinc-900 mb-4 tracking-tight">
              Two Critical Threats to Your Supply Chain
            </h2>
            <p className="text-lg text-zinc-600 font-light max-w-2xl mx-auto">
              Hidden compliance exposure can block shipments tomorrow. Strategic sourcing risks can cost you millions over months.
              Our network analysis technology helps you see both - before they hit your bottom line.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Beachhead 1: Entity List Compliance */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow border border-zinc-200/50">
              <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-light mb-4">
                <AlertTriangle className="w-4 h-4" />
                THREAT 1: COMPLIANCE
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-4">
                Hidden Entity List Exposure
              </h3>
              <p className="text-zinc-600 font-light mb-4 leading-relaxed">
                <strong className="text-zinc-900">The Risk:</strong> BIS expanded rules now cover parent companies,
                subsidiaries, and joint ventures. Your supplier might be compliant, but their owners might not be.
                One hidden relationship = blocked shipments + lost revenue.
              </p>
              <p className="text-zinc-600 font-light mb-6 leading-relaxed">
                <strong className="text-zinc-900">Our Solution:</strong> Automatic ownership tree mapping reveals hidden
                entity list exposure across your supplier network in 48 hours.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700 font-light">Automatic ownership tree mapping</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700 font-light">48-hour compliance check</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700 font-light">Alternative supplier recommendations</span>
                </div>
              </div>
              <Link href="/compliance">
                <button className="w-full bg-rose-600 text-white px-6 py-3 rounded-lg font-light hover:bg-rose-700 transition-colors inline-flex items-center justify-center space-x-2">
                  <span>Explore Compliance Scanner</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/entity-list-scanner" className="text-center">
                <span className="text-sm text-rose-600 hover:text-rose-700 font-light underline">or run free scan now</span>
              </Link>
              <p className="text-xs text-zinc-500 font-light mt-4 text-center">
                ✓ Free for first 10 companies  •  ✓ No credit card required
              </p>
            </div>

            {/* Beachhead 2: Critical Minerals */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow border border-zinc-200/50">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-light mb-4">
                <Globe className="w-4 h-4" />
                THREAT 2: SOURCING
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-4">
                Critical Minerals Supply Disruption
              </h3>
              <p className="text-zinc-600 font-light mb-6 leading-relaxed">
                <strong className="text-zinc-900">The Risk:</strong> Lithium, cobalt, copper, and rare earths flow through
                concentrated, unstable supply chains. Political upheaval, export bans, or price spikes can halt production.
                No backup suppliers = project delays + cost overruns.
              </p>
              <p className="text-zinc-600 font-light mb-6 leading-relaxed">
                <strong className="text-zinc-900">Our Solution:</strong> Real-time risk scoring and 3-6 month early warnings
                help you diversify sources before disruptions hit.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700 font-light">Live risk scores for 4 critical minerals</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700 font-light">Weekly risk briefing with strategic actions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700 font-light">3-6 month early warning on disruptions</span>
                </div>
              </div>
              <Link href="/critical-minerals">
                <button className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-light hover:bg-emerald-700 transition-colors inline-flex items-center justify-center space-x-2">
                  <span>Explore Risk Intelligence</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/supply-chain-risk" className="text-center">
                <span className="text-sm text-emerald-600 hover:text-emerald-700 font-light underline">or view live risk dashboard</span>
              </Link>
              <p className="text-xs text-zinc-500 font-light mt-4 text-center">
                ✓ Trusted by energy companies  •  ✓ Custom assessments from $5K
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 px-6 bg-white/60">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extralight text-zinc-900 text-center mb-16">Why Leading Mining Companies Choose MIAR</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-emerald-100/60 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-4">Revenue Generation</h3>
              <p className="text-zinc-600 font-light">Identify $16B+ in previously hidden tailings opportunities and optimize existing operations for maximum yield.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100/60 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-4">Risk Mitigation</h3>
              <p className="text-zinc-600 font-light">Avoid $500M+ losses through early warning systems on supply chain disruptions and geopolitical risks.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100/60 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-light text-zinc-900 mb-4">Strategic Advantage</h3>
              <p className="text-zinc-600 font-light">Access exclusive intelligence on 68% of global critical mineral flows and reduce due diligence from 6 months to 2 weeks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Platform Features - Highlight What Was Just Built */}
      <section className="py-16 px-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-sm font-light mb-4">
              ✨ NEW FEATURES
            </div>
            <h2 className="text-3xl font-extralight text-white mb-4">Complete Intelligence Platform</h2>
            <p className="text-xl text-zinc-400 font-light">
              More than monitoring - actionable intelligence with PDF reports, alerts, and predictions
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="bg-emerald-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-white mb-3">Executive PDF Reports</h3>
              <p className="text-zinc-400 font-light mb-4">
                Generate professional supply chain reports for stakeholders. One-click export of commodity prices, risk alerts, and trends.
              </p>
              <div className="text-sm text-emerald-400">Weekly & On-Demand</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-white mb-3">Intelligent Alerts</h3>
              <p className="text-zinc-400 font-light mb-4">
                Automated email & browser alerts for price changes {'>'} 5%, supply chain bottlenecks, and geopolitical events.
              </p>
              <div className="text-sm text-amber-400">Real-Time Monitoring</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">Historical Trends & Predictions</h3>
              <p className="text-zinc-400 font-light mb-4">
                Track price history, analyze trends (upward/downward/volatile), and get predictive forecasts with confidence scores.
              </p>
              <div className="text-sm text-blue-400">30-90 Day Analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extralight text-zinc-900 text-center mb-16">Strategic Investment Tiers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Tier */}
            <div className="border border-zinc-200/50 rounded-2xl p-8 bg-white/60 backdrop-blur-sm">
              <h3 className="text-2xl font-light text-zinc-900 mb-2">Starter</h3>
              <div className="text-3xl font-extralight text-zinc-900 mb-6">$500<span className="text-lg text-zinc-500">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Real-time commodity tracking (5 materials)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Weekly PDF reports</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Email alerts (price {'>'} 5%)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">30-day historical trends</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">CSV exports</span>
                </li>
              </ul>
              <button
                onClick={handleContactSales}
                className="w-full border border-zinc-300 text-zinc-700 py-3 rounded-lg font-light hover:bg-zinc-50 transition-colors"
              >
                Start 14-Day Trial
              </button>
            </div>

            {/* Professional Tier */}
            <div className="border border-emerald-300 rounded-2xl p-8 bg-emerald-50/40 backdrop-blur-sm relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-light">
                Most Popular
              </div>
              <h3 className="text-2xl font-light text-zinc-900 mb-2">Professional</h3>
              <div className="text-3xl font-extralight text-zinc-900 mb-6">$1,500<span className="text-lg text-zinc-500">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Everything in Starter</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Daily PDF reports with full analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Custom alert thresholds</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">90-day trends with predictions</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Custom scenario modeling</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">API access (100K calls/month)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Priority support</span>
                </li>
              </ul>
              <button
                onClick={handleStartTrial}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-light hover:bg-emerald-700 transition-colors"
              >
                Start 14-Day Trial
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="border border-zinc-200/50 rounded-2xl p-8 bg-white/60 backdrop-blur-sm">
              <h3 className="text-2xl font-light text-zinc-900 mb-2">Enterprise</h3>
              <div className="text-3xl font-extralight text-zinc-900 mb-6">Custom<span className="text-lg text-zinc-500"></span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Everything in Professional</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">White-label reporting</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Custom integrations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Unlimited API calls</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Strategic advisory calls</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">Dedicated account manager</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-zinc-600 font-light text-sm">SLA guarantees</span>
                </li>
              </ul>
              <button
                onClick={handleContactSales}
                className="w-full border border-zinc-300 text-zinc-700 py-3 rounded-lg font-light hover:bg-zinc-50 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Target Companies */}
      <section className="py-16 px-6 bg-white/60">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extralight text-zinc-900 text-center mb-16">Trusted by Industry Leaders</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              'Barrick Gold', 'AngloGold Ashanti', 'Harmony Gold', 'Sibanye-Stillwater',
              'First Quantum Minerals', 'Ivanhoe Mines', 'African Rainbow Minerals', 'Gold Fields'
            ].map((company, index) => (
              <div key={index} className="text-center p-6 border border-zinc-200/50 rounded-xl bg-white/40">
                <div className="text-lg font-light text-zinc-700">{company}</div>
                <div className="text-sm text-zinc-500 mt-2">$500M+ Market Cap</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Streams */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extralight text-zinc-900 text-center mb-16">Multiple Revenue Opportunities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/60 border border-zinc-200/50 rounded-xl p-6">
              <h3 className="text-xl font-light text-zinc-900 mb-3">SaaS Subscriptions</h3>
              <div className="text-2xl font-extralight text-emerald-600 mb-2">$15K-50K/month</div>
              <p className="text-zinc-600 font-light">Recurring revenue from platform access</p>
            </div>
            <div className="bg-white/60 border border-zinc-200/50 rounded-xl p-6">
              <h3 className="text-xl font-light text-zinc-900 mb-3">Custom Intelligence</h3>
              <div className="text-2xl font-extralight text-emerald-600 mb-2">$25K-100K</div>
              <p className="text-zinc-600 font-light">One-time strategic analysis reports</p>
            </div>
            <div className="bg-white/60 border border-zinc-200/50 rounded-xl p-6">
              <h3 className="text-xl font-light text-zinc-900 mb-3">Strategic Advisory</h3>
              <div className="text-2xl font-extralight text-emerald-600 mb-2">$500K+</div>
              <p className="text-zinc-600 font-light">Consulting engagements</p>
            </div>
            <div className="bg-white/60 border border-zinc-200/50 rounded-xl p-6">
              <h3 className="text-xl font-light text-zinc-900 mb-3">API Access</h3>
              <div className="text-2xl font-extralight text-emerald-600 mb-2">$10K+/month</div>
              <p className="text-zinc-600 font-light">Data feeds for trading firms</p>
            </div>
            <div className="bg-white/60 border border-zinc-200/50 rounded-xl p-6">
              <h3 className="text-xl font-light text-zinc-900 mb-3">Market Research</h3>
              <div className="text-2xl font-extralight text-emerald-600 mb-2">$50K+</div>
              <p className="text-zinc-600 font-light">Quarterly industry reports</p>
            </div>
            <div className="bg-white/60 border border-zinc-200/50 rounded-xl p-6">
              <h3 className="text-xl font-light text-zinc-900 mb-3">Partnership Revenue</h3>
              <div className="text-2xl font-extralight text-emerald-600 mb-2">Variable</div>
              <p className="text-zinc-600 font-light">McKinsey, Bloomberg partnerships</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request Form */}
      <section id="demo-form" className="py-20 px-6 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extralight text-white mb-6">Request Your Strategic Briefing</h2>
            <p className="text-xl text-zinc-300 font-light">
              See how MIAR can identify $100M+ opportunities in your operational regions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-light text-white mb-6">What You'll Learn:</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5" />
                  <span className="text-zinc-300 font-light">Hidden tailings opportunities in your regions</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5" />
                  <span className="text-zinc-300 font-light">Supply chain vulnerabilities and mitigation strategies</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5" />
                  <span className="text-zinc-300 font-light">Network analysis of your competitive positioning</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5" />
                  <span className="text-zinc-300 font-light">ROI projections for identified opportunities</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm rounded-2xl p-8">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-light text-zinc-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-zinc-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-zinc-700 mb-2">Business Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-zinc-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-zinc-700 mb-2">Current Mining Challenges</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="What are your biggest challenges in African mining operations or investment decisions?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-lg font-light text-lg transition-colors inline-flex items-center justify-center space-x-2 ${
                    isSubmitting
                      ? 'bg-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Schedule Strategic Briefing</span>
                      <Calendar className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-white text-zinc-900 px-4 py-2 text-sm font-light tracking-wide rounded">
                  MIAR
                </div>
              </div>
              <p className="text-zinc-400 font-light">
                PFAS Intelligence Platform - Tracking PFAS contamination from water systems through agricultural irrigation to food supply chains. Protecting AI infrastructure and public health.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-light mb-4">Platform</h4>
              <ul className="space-y-2 text-zinc-400 font-light">
                <li><button onClick={() => handleFooterLink('Network Analysis')} className="hover:text-white transition-colors">Network Analysis</button></li>
                <li><button onClick={() => handleFooterLink('Real-time Intelligence')} className="hover:text-white transition-colors">Real-time Intelligence</button></li>
                <li><button onClick={() => handleFooterLink('Strategic Advisory')} className="hover:text-white transition-colors">Strategic Advisory</button></li>
                <li><button onClick={() => handleFooterLink('API Access')} className="hover:text-white transition-colors">API Access</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-light mb-4">Company</h4>
              <ul className="space-y-2 text-zinc-400 font-light">
                <li><button onClick={() => handleFooterLink('About Us')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => handleFooterLink('Careers')} className="hover:text-white transition-colors">Careers</button></li>
                <li><button onClick={() => handleFooterLink('Partners')} className="hover:text-white transition-colors">Partners</button></li>
                <li><button onClick={() => handleFooterLink('News')} className="hover:text-white transition-colors">News</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-light mb-4">Contact</h4>
              <div className="space-y-2 text-zinc-400 font-light">
                <button onClick={handleEmailClick} className="flex items-center space-x-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>hello@miar.ai</span>
                </button>
                <button onClick={handlePhoneClick} className="flex items-center space-x-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-zinc-500 font-light">
            <p>&copy; 2024 MIAR. All rights reserved. Built for the global mining industry.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}