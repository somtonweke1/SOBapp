'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ServerIcon3D, PlantIcon3D, WaterIcon3D } from '@/components/ui/icon-3d';
import PFASRiskCalculator from './pfas-risk-calculator';

export default function CleanStoryLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
      {/* Premium Header with Glass Morphism */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-light text-zinc-900 tracking-tight">MIAR</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mb-1.5"></div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pfas-scanner">
                <Button variant="outline" size="sm" className="font-light">Free Analysis</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all font-light">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - More Breathing Room */}
      <section className="py-24 lg:py-32 px-6 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/30">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl lg:text-7xl font-extralight text-zinc-900 mb-8 leading-[1.1] tracking-tight">
            The Invisible Contamination<br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Threatening AI and Our Food Supply</span>
          </h1>
          <p className="text-xl lg:text-2xl text-zinc-600 font-light mb-10 max-w-3xl mx-auto leading-relaxed">
            PFAS "forever chemicals" flow from factories through water systems into our crops and food.
            We track the contamination and help stop it, protecting both technological infrastructure and human health.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#pfas-calculator">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all font-light">
                Calculate Your PFAS Risk (Free - 60 Sec)
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#story">
              <Button variant="outline" size="lg" className="text-lg px-10 py-7 font-light border-2 hover:border-blue-600 hover:text-blue-600 transition-all">
                See How PFAS Spreads
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PFAS RISK CALCULATOR - New Section */}
      <section id="pfas-calculator" className="py-20 px-6 bg-gradient-to-br from-blue-50/50 to-white border-y border-blue-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-light mb-4">
              NEW: PFAS Risk Assessment
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-zinc-900 mb-4 tracking-tight">
              Calculate Your PFAS Contamination Risk
              <span className="block text-blue-600 font-light mt-2">In Just 60 Seconds</span>
            </h2>
            <p className="text-xl text-zinc-600 font-light max-w-3xl mx-auto leading-relaxed">
              Get instant analysis of your PFAS exposure: regulatory fines, treatment costs,
              liability risk, and compliance timeline based on EPA 2024 regulations.
            </p>
          </div>

          <PFASRiskCalculator />
        </div>
      </section>

      {/* The 6-Step Story - Improved Spacing & Cards */}
      <section id="story" className="py-24 lg:py-32 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-extralight text-zinc-900 mb-6 tracking-tight">The Full Story</h2>
            <p className="text-xl text-zinc-600 font-light">How invisible contamination became a systemic crisis</p>
          </div>

          <div className="space-y-24">
            {/* Step 1: The Engine of the Future */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="text-xs font-medium text-blue-600 mb-4 tracking-widest uppercase">Step 1</div>
                <h3 className="text-4xl font-extralight text-zinc-900 mb-6 tracking-tight">The Engine of the Future</h3>
                <p className="text-lg text-zinc-600 font-light leading-relaxed">
                  AI is booming. It's writing our emails, driving our cars, discovering new drugs, and powering scientific breakthroughs.
                  It's the engine of the next industrial revolution, and the world is investing trillions to accelerate it.
                </p>
              </div>
              <div className="order-1 lg:order-2 bg-gradient-to-br from-blue-100/50 to-blue-50/30 rounded-3xl p-12 backdrop-blur-sm border border-blue-200/30 shadow-lg overflow-hidden relative min-h-[320px] flex flex-col justify-between">
                {/* AI Compute Grid Visualization */}
                <div className="grid grid-cols-8 gap-2 mb-8">
                  {[...Array(64)].map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm transition-all duration-1000 hover:scale-110 ${
                        i % 7 === 0 || i % 11 === 0
                          ? 'bg-blue-500/50 shadow-sm'
                          : i % 3 === 0
                          ? 'bg-blue-400/25'
                          : 'bg-blue-300/15'
                      }`}
                      style={{
                        animation: `pulse ${2 + (i % 5)}s ease-in-out infinite`,
                        animationDelay: `${(i * 50) % 3000}ms`
                      }}
                    />
                  ))}
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-light text-blue-700/60 uppercase tracking-wider mb-1">AI Infrastructure</div>
                  <div className="text-3xl font-extralight text-blue-800">$3T+ Investment</div>
                  <div className="text-xs font-light text-blue-600/70 mt-1">Global Data Centers</div>
                </div>
              </div>
            </div>

            {/* Step 2: The Engine's Thirst */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="bg-gradient-to-br from-cyan-100/50 to-cyan-50/30 rounded-3xl p-12 backdrop-blur-sm border border-cyan-200/30 shadow-lg relative overflow-hidden min-h-[320px] flex flex-col justify-between">
                {/* Water Flow Visualization */}
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-14 bg-gradient-to-r from-cyan-500/40 to-cyan-400/10 rounded-full relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 via-white/40 to-transparent animate-pulse" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                    </div>
                    <div className="text-xs font-light text-cyan-700 whitespace-nowrap">Cooling Loop A</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-14 bg-gradient-to-r from-cyan-500/45 to-cyan-400/15 rounded-full relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 via-white/40 to-transparent animate-pulse" style={{ animation: 'pulse 2.5s ease-in-out infinite', animationDelay: '0.5s' }} />
                    </div>
                    <div className="text-xs font-light text-cyan-700 whitespace-nowrap">Cooling Loop B</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-14 bg-gradient-to-r from-cyan-500/35 to-cyan-400/12 rounded-full relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 via-white/40 to-transparent animate-pulse" style={{ animation: 'pulse 3s ease-in-out infinite', animationDelay: '1s' }} />
                    </div>
                    <div className="text-xs font-light text-cyan-700 whitespace-nowrap">Cooling Loop C</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-light text-cyan-700/60 uppercase tracking-wider mb-1">Daily Water Usage</div>
                  <div className="text-3xl font-extralight text-cyan-800">15M gallons</div>
                  <div className="text-xs font-light text-cyan-600/70 mt-1">Per AI Training Cluster</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-cyan-600 mb-4 tracking-widest uppercase">Step 2</div>
                <h3 className="text-4xl font-extralight text-zinc-900 mb-6 tracking-tight">The Engine's Thirst</h3>
                <p className="text-lg text-zinc-600 font-light leading-relaxed mb-5">
                  This AI revolution runs in massive data centers that generate incredible heat. To avoid melting down, they need one critical resource: <strong className="text-zinc-900 font-medium">pure water</strong> for cooling.
                </p>
                <p className="text-lg text-zinc-600 font-light leading-relaxed">
                  A single large AI training cluster can consume <strong className="text-zinc-900 font-medium">15 million gallons per day</strong>. Contaminated water corrodes equipment and causes catastrophic failures.
                </p>
              </div>
            </div>

            {/* Step 3: The Poisoned Well */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="text-xs font-medium text-rose-600 mb-4 tracking-widest uppercase">Step 3</div>
                <h3 className="text-4xl font-extralight text-zinc-900 mb-6 tracking-tight">The Poisoned Well</h3>
                <p className="text-lg text-zinc-600 font-light leading-relaxed mb-5">
                  But our water sources are contaminated with "forever chemicals" known as <strong className="text-zinc-900 font-medium">PFAS</strong>.
                  These invisible toxins don't break down. They persist for decades, spreading through groundwater and surface water.
                </p>
                <p className="text-lg text-zinc-600 font-light leading-relaxed">
                  PFAS comes from firefighting foam, industrial discharge, and manufacturing waste. It's everywhere, and it threatens far more than just data centers.
                </p>
              </div>
              <div className="order-1 lg:order-2 bg-gradient-to-br from-rose-100/50 to-rose-50/30 rounded-3xl p-12 backdrop-blur-sm border border-rose-200/30 shadow-lg relative overflow-hidden min-h-[320px] flex flex-col justify-between">
                {/* PFAS Molecular Spread Visualization */}
                <div className="relative w-full flex-1 flex items-center justify-center mb-8">
                  {/* Central contamination source */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-rose-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-rose-500/40 rounded-full shadow-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-rose-600/60 rounded-full" />

                  {/* Spreading contamination particles with rings */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const distance = 90;
                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-4 h-4 bg-rose-500/50 rounded-full shadow-md"
                        style={{
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          animation: `pulse ${2 + (i % 3)}s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-light text-rose-700/60 uppercase tracking-wider mb-1">Forever Chemicals</div>
                  <div className="text-3xl font-extralight text-rose-800">Persistent</div>
                  <div className="text-xs font-light text-rose-600/70 mt-1">Spreads Through Groundwater</div>
                </div>
              </div>
            </div>

            {/* Step 4: The Hidden Pathway */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="bg-gradient-to-br from-amber-100/50 to-amber-50/30 rounded-3xl p-12 backdrop-blur-sm border border-amber-200/30 shadow-lg relative overflow-hidden min-h-[320px] flex flex-col justify-between">
                {/* Food Chain Pathway Visualization */}
                <div className="space-y-5 mb-8">
                  <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
                      <div className="w-3 h-3 rounded-full bg-amber-600/60 animate-pulse" />
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-amber-400/40 to-transparent rounded-full" />
                    <div className="text-sm font-light text-amber-700 bg-amber-50/50 px-3 py-1 rounded-full">Water</div>
                  </div>
                  <div className="flex items-center gap-4 ml-6 group">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/25 border-2 border-amber-500/45 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
                      <div className="w-4 h-4 rounded-full bg-amber-600/70 animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-amber-400/40 to-transparent rounded-full" />
                    <div className="text-sm font-light text-amber-700 bg-amber-50/50 px-3 py-1 rounded-full">Crops</div>
                  </div>
                  <div className="flex items-center gap-4 ml-12 group">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/30 border-2 border-amber-500/50 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
                      <div className="w-5 h-5 rounded-full bg-amber-600/80 animate-pulse" style={{ animationDelay: '0.6s' }} />
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-amber-400/40 to-transparent rounded-full" />
                    <div className="text-sm font-light text-amber-700 bg-amber-50/50 px-3 py-1 rounded-full">Livestock</div>
                  </div>
                  <div className="flex items-center gap-4 ml-18 group">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/40 border-2 border-amber-500/60 flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                      <div className="w-7 h-7 rounded-full bg-amber-600 animate-pulse" style={{ animationDelay: '0.9s' }} />
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-amber-400/40 to-transparent rounded-full" />
                    <div className="text-sm font-light text-amber-700 bg-amber-50/50 px-3 py-1 rounded-full">Food Supply</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-light text-amber-700/60 uppercase tracking-wider mb-1">Contamination Pathway</div>
                  <div className="text-3xl font-extralight text-amber-800">Bio-accumulation</div>
                  <div className="text-xs font-light text-amber-600/70 mt-1">Concentration Increases at Each Step</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-amber-600 mb-4 tracking-widest uppercase">Step 4</div>
                <h3 className="text-4xl font-extralight text-zinc-900 mb-6 tracking-tight">The Hidden Pathway</h3>
                <p className="text-lg text-zinc-600 font-light leading-relaxed mb-5">
                  PFAS doesn't just stay in water. It flows through irrigation systems into crops. It concentrates in livestock. It enters food processing facilities.
                </p>
                <p className="text-lg text-zinc-600 font-light leading-relaxed">
                  <strong className="text-zinc-900 font-medium">The primary human exposure isn't from drinking water, it's from the food on your plate.</strong> We've traced contamination from industrial sites through farms to grocery stores.
                </p>
              </div>
            </div>

            {/* Step 5: The Systemic Risk */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="text-xs font-medium text-purple-600 mb-4 tracking-widest uppercase">Step 5</div>
                <h3 className="text-4xl font-extralight text-zinc-900 mb-6 tracking-tight">The Systemic Risk</h3>
                <p className="text-lg text-zinc-600 font-light leading-relaxed mb-8">
                  This creates a dual crisis that most people don't see:
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-3"></div>
                    <div>
                      <div className="font-medium text-zinc-900 mb-2 text-lg">Technology Risk</div>
                      <div className="text-zinc-600 font-light leading-relaxed">AI's growth is choked by contaminated cooling water. Data centers can't expand without pure water sources.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0 mt-3"></div>
                    <div>
                      <div className="font-medium text-zinc-900 mb-2 text-lg">Human Health Risk</div>
                      <div className="text-zinc-600 font-light leading-relaxed">Our food system becomes an exposure vector for entire populations. 12M+ people affected.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 bg-gradient-to-br from-purple-100/50 to-purple-50/30 rounded-3xl p-12 backdrop-blur-sm border border-purple-200/30 shadow-lg relative overflow-hidden min-h-[320px] flex flex-col justify-between">
                {/* Dual Crisis Bar Chart Visualization */}
                <div className="space-y-7 mb-8">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-light text-purple-800">Technology Risk</div>
                      <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Critical - 8.5/10</div>
                    </div>
                    <div className="h-10 bg-purple-200/30 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-500/70 to-blue-600/50 rounded-full shadow-lg transition-all duration-1000 hover:scale-x-105" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-light text-purple-800">Health Risk</div>
                      <div className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Severe - 9.2/10</div>
                    </div>
                    <div className="h-10 bg-purple-200/30 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-rose-500/70 to-rose-600/50 rounded-full shadow-lg transition-all duration-1000 hover:scale-x-105" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-light text-purple-800">Economic Impact</div>
                      <div className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">High - 7.8/10</div>
                    </div>
                    <div className="h-10 bg-purple-200/30 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-purple-500/70 to-purple-600/50 rounded-full shadow-lg transition-all duration-1000 hover:scale-x-105" style={{ width: '78%' }} />
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="text-xs font-light text-purple-700/60 uppercase tracking-wider mb-1">Risk Assessment</div>
                  <div className="text-3xl font-extralight text-purple-800">Systemic Crisis</div>
                  <div className="text-xs font-light text-purple-600/70 mt-1">Interconnected Impacts</div>
                </div>
              </div>
            </div>

            {/* Step 6: The Solution */}
            <div className="bg-gradient-to-br from-emerald-50/50 via-emerald-100/30 to-emerald-50/50 rounded-3xl p-12 lg:p-16 backdrop-blur-sm border border-emerald-200/50 shadow-xl">
              <div className="text-center mb-12">
                <div className="text-xs font-medium text-emerald-600 mb-4 tracking-widest uppercase">Step 6</div>
                <h3 className="text-5xl font-extralight text-zinc-900 mb-6 tracking-tight">The Solution: Intelligence & Intervention</h3>
                <p className="text-2xl text-zinc-600 font-light max-w-4xl mx-auto leading-relaxed">
                  We provide both the brain and the strategy to protect AI infrastructure and food supply chains
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <Card className="p-10 bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all group">
                  <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                      <span className="text-2xl font-light text-blue-600">01</span>
                    </div>
                    <h4 className="text-2xl font-light text-zinc-900 mb-4">The Intelligence</h4>
                    <p className="text-zinc-600 font-light leading-relaxed text-lg">
                      We model where PFAS flows through water systems, agricultural irrigation, and food supply chains.
                      Track contamination from source to plate. Predict exposure before it happens.
                    </p>
                  </div>
                </Card>

                <Card className="p-10 bg-white/80 backdrop-blur-sm border-emerald-200/50 shadow-lg hover:shadow-xl transition-all group">
                  <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-4">
                      <span className="text-2xl font-light text-emerald-600">02</span>
                    </div>
                    <h4 className="text-2xl font-light text-zinc-900 mb-4">The Intervention</h4>
                    <p className="text-zinc-600 font-light leading-relaxed text-lg">
                      Deploy systems that guarantee pure water for data centers. Help food companies identify contaminated
                      sources. Enable utilities to protect entire populations.
                    </p>
                  </div>
                </Card>
              </div>

              <div className="text-center mt-12">
                <p className="text-xl text-zinc-700 font-light leading-relaxed">
                  You can't have technological progress without pure water.<br />
                  You can't have public health without containing PFAS in our food system.<br />
                  <span className="text-emerald-700 font-medium">We solve both.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-24 lg:py-32 px-6 bg-gradient-to-br from-zinc-50 to-zinc-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-extralight text-zinc-900 mb-6 tracking-tight">Who We Protect</h2>
            <p className="text-xl text-zinc-600 font-light">Three critical sectors facing PFAS risk</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="p-10 hover:shadow-2xl transition-all border-zinc-200/50 bg-white/80 backdrop-blur-sm group">
              <div className="mb-6">
                <ServerIcon3D className="mb-6" />
                <h3 className="text-2xl font-light text-zinc-900 mb-4">AI & Data Centers</h3>
                <p className="text-zinc-600 font-light leading-relaxed mb-6">
                  Hyperscalers, colocation providers, and semiconductor fabs that need guaranteed pure water for cooling operations.
                </p>
                <div className="text-sm text-zinc-500 font-light">Microsoft, Google, Meta, AWS</div>
              </div>
            </Card>

            <Card className="p-10 hover:shadow-2xl transition-all border-emerald-200/50 bg-white/80 backdrop-blur-sm group">
              <div className="mb-6">
                <PlantIcon3D className="mb-6" />
                <h3 className="text-2xl font-light text-zinc-900 mb-4">Food Supply Chains</h3>
                <p className="text-zinc-600 font-light leading-relaxed mb-6">
                  Agribusinesses, food processors, and commodity traders who need to track contamination from farm to fork.
                </p>
                <div className="text-sm text-zinc-500 font-light">Cargill, Tyson, Dole, Nestlé</div>
              </div>
            </Card>

            <Card className="p-10 hover:shadow-2xl transition-all border-blue-200/50 bg-white/80 backdrop-blur-sm group">
              <div className="mb-6">
                <WaterIcon3D className="mb-6" />
                <h3 className="text-2xl font-light text-zinc-900 mb-4">Municipal Water Utilities</h3>
                <p className="text-zinc-600 font-light leading-relaxed mb-6">
                  6,000+ water systems facing EPA PFAS limits. Need to predict breakthrough and estimate treatment costs.
                </p>
                <div className="text-sm text-zinc-500 font-light">Water utilities, environmental consultants</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Numbers */}
      <section className="py-24 lg:py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-extralight text-zinc-900 mb-6 tracking-tight">The Scale of the Problem</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center">
              <div className="text-6xl lg:text-7xl font-extralight text-blue-600 mb-4">95%</div>
              <div className="text-base text-zinc-600 font-light leading-relaxed">PFAS exposure from food, not water</div>
            </div>
            <div className="text-center">
              <div className="text-6xl lg:text-7xl font-extralight text-emerald-600 mb-4">12M+</div>
              <div className="text-base text-zinc-600 font-light leading-relaxed">People exposed via food pathways</div>
            </div>
            <div className="text-center">
              <div className="text-6xl lg:text-7xl font-extralight text-amber-600 mb-4">$6B</div>
              <div className="text-base text-zinc-600 font-light leading-relaxed">AI infrastructure at risk</div>
            </div>
            <div className="text-center">
              <div className="text-6xl lg:text-7xl font-extralight text-rose-600 mb-4">$2.1B</div>
              <div className="text-base text-zinc-600 font-light leading-relaxed">Annual food industry exposure</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="max-w-5xl mx-auto text-center relative">
          <h2 className="text-5xl lg:text-6xl font-extralight mb-8 tracking-tight">Ready to Track PFAS in Your System?</h2>
          <p className="text-2xl text-blue-100 mb-12 font-light leading-relaxed">
            Start with a free compliance analysis or schedule a platform demo
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/pfas-scanner">
              <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 text-lg px-10 py-7 shadow-2xl hover:shadow-3xl transition-all font-light">
                Run Free Analysis
              </Button>
            </Link>
            <a href="mailto:snweke1@jh.edu">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7 font-light">
                Schedule Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-light text-white">MIAR</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          </div>
          <p className="text-sm font-light mb-6">PFAS Intelligence Platform</p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <Link href="/pfas-flow-intelligence" className="hover:text-white transition-colors font-light">Flow Intelligence</Link>
            <Link href="/pfas-scanner" className="hover:text-white transition-colors font-light">Compliance Scanner</Link>
            <a href="mailto:snweke1@jh.edu" className="hover:text-white transition-colors font-light">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
