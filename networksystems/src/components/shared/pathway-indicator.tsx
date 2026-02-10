'use client';

import React from 'react';
import { MapPin, Droplet, Network, Waves, TrendingUp, Activity, ChevronRight } from 'lucide-react';

type PathwayStep = 'sources' | 'flow' | 'portfolio' | 'model' | 'remediation' | 'monitoring';

interface PathwayIndicatorProps {
  currentStep: PathwayStep;
  className?: string;
  onStepChange?: (step: PathwayStep) => void;
}

const PATHWAY_STEPS = [
  {
    id: 'sources' as const,
    label: 'Signals',
    icon: MapPin,
    color: 'rose',
    description: 'Detect property distress signals'
  },
  {
    id: 'flow' as const,
    label: 'Audit Flow',
    icon: Droplet,
    color: 'blue',
    description: 'Trace water bill discrepancies'
  },
  {
    id: 'portfolio' as const,
    label: 'Portfolio',
    icon: Network,
    color: 'amber',
    description: 'Assess portfolio exposure'
  },
  {
    id: 'model' as const,
    label: 'Stress Model',
    icon: Waves,
    color: 'cyan',
    description: 'Model DSCR sensitivity'
  },
  {
    id: 'remediation' as const,
    label: 'Deal Shield',
    icon: TrendingUp,
    color: 'emerald',
    description: 'Structure fundable deals'
  },
  {
    id: 'monitoring' as const,
    label: 'Monitor',
    icon: Activity,
    color: 'purple',
    description: 'Track ongoing performance'
  }
];

// Color mapping for Tailwind (must be complete class names for JIT compiler)
const colorClasses = {
  rose: {
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-200',
    text: 'text-rose-700'
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-200',
    text: 'text-blue-700'
  },
  amber: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-200',
    text: 'text-amber-700'
  },
  cyan: {
    bg: 'bg-cyan-600',
    bgLight: 'bg-cyan-200',
    text: 'text-cyan-700'
  },
  emerald: {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-200',
    text: 'text-emerald-700'
  },
  purple: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-200',
    text: 'text-purple-700'
  }
};

/**
 * Pathway Indicator Component
 * Shows user's current position in the 6-step infrastructure audit pathway
 * Interactive - click on any step to navigate to that dashboard
 */
export default function PathwayIndicator({ currentStep, className = '', onStepChange }: PathwayIndicatorProps) {
  const currentIndex = PATHWAY_STEPS.findIndex(step => step.id === currentStep);
  const currentStepData = PATHWAY_STEPS[currentIndex];
  const currentColors = colorClasses[currentStepData.color as keyof typeof colorClasses];

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-lg border border-zinc-200/50 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${currentColors.bg} flex items-center justify-center`}>
            <currentStepData.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-light">Step {currentIndex + 1} of 6</div>
            <div className="text-sm font-medium text-zinc-900">{currentStepData.description}</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {PATHWAY_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const stepColors = colorClasses[step.color as keyof typeof colorClasses];

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle - Now Clickable */}
              <button
                onClick={() => onStepChange?.(step.id)}
                className={`
                  flex items-center justify-center rounded-full transition-all
                  ${isCurrent ? `w-8 h-8 ${stepColors.bg}` : 'w-6 h-6 hover:scale-110'}
                  ${isPast ? stepColors.bgLight : ''}
                  ${isFuture ? 'bg-zinc-200' : ''}
                  ${onStepChange ? 'cursor-pointer hover:shadow-md' : ''}
                `}
                title={`${index + 1}. ${step.label}: ${step.description}`}
                disabled={!onStepChange}
              >
                <Icon
                  className={`
                    ${isCurrent ? 'w-4 h-4 text-white' : 'w-3 h-3'}
                    ${isPast ? stepColors.text : ''}
                    ${isFuture ? 'text-zinc-400' : ''}
                  `}
                />
              </button>

              {/* Arrow */}
              {index < PATHWAY_STEPS.length - 1 && (
                <ChevronRight
                  className={`
                    w-3 h-3
                    ${isPast ? 'text-zinc-400' : 'text-zinc-300'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mini labels with clickable Next button */}
      <div className="mt-3 pt-3 border-t border-zinc-200/50 flex items-center justify-between text-xs">
        <div className="text-zinc-600 font-light">
          <span className="font-medium text-zinc-900">Current:</span> {currentStepData.label}
        </div>
        {currentIndex < PATHWAY_STEPS.length - 1 && (
          <button
            onClick={() => onStepChange?.(PATHWAY_STEPS[currentIndex + 1].id)}
            className="text-zinc-500 font-light hover:text-zinc-900 transition-colors flex items-center gap-1"
            disabled={!onStepChange}
          >
            <span className="font-medium">Next:</span> {PATHWAY_STEPS[currentIndex + 1].label}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
