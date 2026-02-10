/**
 * Standardized PFAS Risk Level Colors and Classifications
 * Used across all dashboards for visual consistency
 */

export const RISK_LEVELS = {
  CRITICAL: {
    label: 'Critical',
    color: 'rose',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-300',
    badgeClass: 'bg-rose-200 text-rose-800',
    threshold: 70, // ng/L or percentile
    description: 'Immediate action required - exceeds EPA advisory limits'
  },
  HIGH: {
    label: 'High',
    color: 'orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    badgeClass: 'bg-orange-200 text-orange-800',
    threshold: 40,
    description: 'Significant risk - requires monitoring and intervention planning'
  },
  MEDIUM: {
    label: 'Medium',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
    badgeClass: 'bg-amber-200 text-amber-800',
    threshold: 20,
    description: 'Moderate risk - continue monitoring'
  },
  LOW: {
    label: 'Low',
    color: 'emerald',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
    badgeClass: 'bg-emerald-200 text-emerald-800',
    threshold: 0,
    description: 'Minimal risk - within acceptable limits'
  }
} as const;

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Get risk level classification from PFAS concentration (ng/L)
 */
export function getRiskLevel(pfasLevel: number): RiskLevel {
  if (pfasLevel >= RISK_LEVELS.CRITICAL.threshold) return 'critical';
  if (pfasLevel >= RISK_LEVELS.HIGH.threshold) return 'high';
  if (pfasLevel >= RISK_LEVELS.MEDIUM.threshold) return 'medium';
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
  operational: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  offline: 'bg-rose-100 text-rose-700',
  pending: 'bg-zinc-100 text-zinc-700'
} as const;

/**
 * Tab/Step colors for pathway visualization
 */
export const PATHWAY_COLORS = {
  sources: 'rose-600',      // Step 1: Source Mapping
  flow: 'blue-600',         // Step 2: Flow Intelligence
  foodSupply: 'amber-600',  // Step 3: Food Supply Chain
  model: 'cyan-600',        // Step 4: Water-to-Food Model
  remediation: 'emerald-600', // Step 5: Remediation ROI
  monitoring: 'purple-600'  // Step 6: Live Monitoring
} as const;
