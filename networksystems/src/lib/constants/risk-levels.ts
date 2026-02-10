/**
 * Standardized Infrastructure Audit Risk Level Colors and Classifications
 * Used across all dashboards for visual consistency
 */

export const RISK_LEVELS = {
  CRITICAL: {
    label: 'Critical',
    color: 'rose',
    bgClass: 'bg-rose-950',
    textClass: 'text-rose-200',
    borderClass: 'border-rose-800',
    badgeClass: 'bg-rose-900 text-rose-100',
    threshold: 70, // signal score
    description: 'Immediate action required - severe audit breach detected'
  },
  HIGH: {
    label: 'High',
    color: 'orange',
    bgClass: 'bg-orange-950',
    textClass: 'text-orange-200',
    borderClass: 'border-orange-800',
    badgeClass: 'bg-orange-900 text-orange-100',
    threshold: 40,
    description: 'Significant distress signal - prioritize remediation planning'
  },
  MEDIUM: {
    label: 'Medium',
    color: 'amber',
    bgClass: 'bg-amber-950',
    textClass: 'text-amber-200',
    borderClass: 'border-amber-800',
    badgeClass: 'bg-amber-900 text-amber-100',
    threshold: 20,
    description: 'Moderate risk - continue monitoring'
  },
  LOW: {
    label: 'Low',
    color: 'emerald',
    bgClass: 'bg-emerald-950',
    textClass: 'text-emerald-200',
    borderClass: 'border-emerald-800',
    badgeClass: 'bg-emerald-900 text-emerald-100',
    threshold: 0,
    description: 'Minimal risk - within acceptable limits'
  }
} as const;

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Get risk level classification from audit signal intensity
 */
export function getRiskLevel(signalLevel: number): RiskLevel {
  if (signalLevel >= RISK_LEVELS.CRITICAL.threshold) return 'critical';
  if (signalLevel >= RISK_LEVELS.HIGH.threshold) return 'high';
  if (signalLevel >= RISK_LEVELS.MEDIUM.threshold) return 'medium';
  return 'low';
}

/**
 * Get risk level styling classes
 */
export function getRiskColorClasses(riskLevel: RiskLevel): string {
  const level = RISK_LEVELS[riskLevel.toUpperCase() as keyof typeof RISK_LEVELS];
  return `${level.bgClass} ${level.textClass} ${level.borderClass}`;
}

/**
 * Get risk level badge classes
 */
export function getRiskBadgeClasses(riskLevel: RiskLevel): string {
  const level = RISK_LEVELS[riskLevel.toUpperCase() as keyof typeof RISK_LEVELS];
  return level.badgeClass;
}

/**
 * Operational status colors (for treatment systems, monitoring stations)
 */
export const STATUS_COLORS = {
  operational: 'bg-emerald-950 text-emerald-200',
  maintenance: 'bg-amber-950 text-amber-200',
  offline: 'bg-rose-950 text-rose-200',
  pending: 'bg-slate-900 text-slate-300'
} as const;

/**
 * Tab/Step colors for pathway visualization
 */
export const PATHWAY_COLORS = {
  sources: 'blue-500',       // Step 1: Distress Signals
  flow: 'emerald-500',       // Step 2: Audit Flow
  portfolio: 'amber-500',    // Step 3: Portfolio Exposure
  model: 'cyan-500',         // Step 4: Stress Model
  remediation: 'emerald-500', // Step 5: Deal Shield
  monitoring: 'blue-500'     // Step 6: Live Monitoring
} as const;
