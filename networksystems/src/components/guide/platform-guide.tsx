'use client';

import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Network, TrendingUp, Ship, MousePointer, Eye, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlatformGuideProps {
  onClose: () => void;
}

const guideSteps = [
  {
    title: "Welcome to MIAR Platform",
    icon: Network,
    content: (
      <div className="space-y-4">
        <p className="text-zinc-600 leading-relaxed">
          Welcome to the Mining Intelligence & African Research platform. This guide will walk you through
          the key features and help you get the most out of your mining intelligence dashboard.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-medium text-emerald-800 mb-2">What you'll learn:</h4>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• How to navigate between platform modules</li>
            <li>• Understanding the mining network visualization</li>
            <li>• Using portfolio optimization tools</li>
            <li>• Analyzing trade network data</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Platform Navigation",
    icon: MousePointer,
    content: (
      <div className="space-y-4">
        <p className="text-zinc-600 leading-relaxed">
          The platform has three main modules accessible via the top navigation bar:
        </p>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
            <Network className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="font-medium text-zinc-900">Mining Intelligence</div>
              <div className="text-sm text-zinc-600">Interactive map showing African mining networks and operations</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-zinc-900">Portfolio Optimization</div>
              <div className="text-sm text-zinc-600">Advanced analytics for investment portfolio management</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg">
            <Ship className="h-5 w-5 text-cyan-600" />
            <div>
              <div className="font-medium text-zinc-900">Trade Network</div>
              <div className="text-sm text-zinc-600">Global trade flow analysis and supply chain insights</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Mining Intelligence Module",
    icon: Network,
    content: (
      <div className="space-y-4">
        <p className="text-zinc-600 leading-relaxed">
          The Mining Intelligence module provides an interactive map of African mining operations:
        </p>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Eye className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Interactive Map</div>
              <div className="text-sm text-zinc-600">Click on mining locations to see detailed information about operations, production data, and network connections.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Filter className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Smart Filtering</div>
              <div className="text-sm text-zinc-600">Use the commodity filter to focus on specific minerals (Gold, Copper, Platinum, etc.) and see relevant operations.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Network className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Network Analysis</div>
              <div className="text-sm text-zinc-600">Visualize connections between mines, processing facilities, and transportation hubs.</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Portfolio Optimization",
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <p className="text-zinc-600 leading-relaxed">
          Optimize your mining investment portfolio using advanced analytics:
        </p>
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Key Features:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Risk-return analysis for different mining assets</li>
              <li>• Correlation analysis between commodity prices</li>
              <li>• Geographic diversification recommendations</li>
              <li>• ESG (Environmental, Social, Governance) scoring</li>
            </ul>
          </div>
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Portfolio Metrics</div>
              <div className="text-sm text-zinc-600">View real-time portfolio performance, risk metrics, and optimization suggestions.</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Trade Network Analysis",
    icon: Ship,
    content: (
      <div className="space-y-4">
        <p className="text-zinc-600 leading-relaxed">
          Analyze global trade flows and supply chain networks:
        </p>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Ship className="h-5 w-5 text-cyan-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Supply Chain Mapping</div>
              <div className="text-sm text-zinc-600">Track commodity flows from mines to end markets, identifying key bottlenecks and opportunities.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Filter className="h-5 w-5 text-cyan-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Trade Route Analysis</div>
              <div className="text-sm text-zinc-600">Analyze shipping routes, port congestion, and alternative transportation options.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Download className="h-5 w-5 text-cyan-600 mt-0.5" />
            <div>
              <div className="font-medium text-zinc-900">Export Data</div>
              <div className="text-sm text-zinc-600">Download trade flow data and network analysis for further research and reporting.</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Getting Started Tips",
    icon: Eye,
    content: (
      <div className="space-y-4">
        <p className="text-zinc-600 leading-relaxed">
          Here are some tips to help you get the most out of the MIAR platform:
        </p>
        <div className="space-y-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
            <h4 className="font-medium text-zinc-800 mb-3">Quick Start Checklist:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Start with the Mining Intelligence module to explore the map</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Filter by your commodity of interest (Gold, Copper, etc.)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Click on mining locations to see detailed information</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Switch to Portfolio Optimization for investment analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Use Trade Network for supply chain insights</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Need Help?</h4>
            <p className="text-sm text-blue-700">
              Contact your account manager or email{' '}
              <a href="mailto:support@miar.ai" className="underline">support@miar.ai</a>{' '}
              for assistance with advanced features or custom analysis requests.
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export default function PlatformGuide({ onClose }: PlatformGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentGuideStep = guideSteps[currentStep];
  const IconComponent = currentGuideStep.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <IconComponent className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-light text-zinc-900">{currentGuideStep.title}</h2>
                <p className="text-sm text-zinc-500">Step {currentStep + 1} of {guideSteps.length}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-zinc-100 h-1">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentGuideStep.content}
        </div>

        {/* Navigation */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-2">
              {guideSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-emerald-500'
                      : index < currentStep
                        ? 'bg-emerald-300'
                        : 'bg-zinc-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === guideSteps.length - 1 ? (
              <Button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}