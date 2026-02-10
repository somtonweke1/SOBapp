/**
 * Shared utility for consistent severity color styling across the platform
 * Reduces code duplication and ensures consistent UX
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

const SEVERITY_COLOR_MAP: Record<SeverityLevel, string> = {
  critical: 'text-rose-700 bg-rose-50 border-rose-200',
  high: 'text-rose-600 bg-rose-50 border-rose-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const DEFAULT_COLOR = 'text-zinc-600 bg-zinc-50 border-zinc-200';

/**
 * Get Tailwind classes for severity levels
 * @param severity - The severity level
 * @returns Tailwind CSS classes for text, background, and border
 */
export function getSeverityColor(severity: string): string {
  return SEVERITY_COLOR_MAP[severity as SeverityLevel] || DEFAULT_COLOR;
}

/**
 * Get badge color variant for severity levels
 * Optimized for badge components
 */
export function getSeverityBadgeColor(severity: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colorMap: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
    high: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    low: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  };

  return colorMap[severity as SeverityLevel] || {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-300'
  };
}

/**
 * Get icon color for severity levels
 */
export function getSeverityIconColor(severity: string): string {
  const iconColorMap: Record<SeverityLevel, string> = {
    critical: 'text-rose-600',
    high: 'text-rose-500',
    medium: 'text-amber-500',
    low: 'text-emerald-500',
  };

  return iconColorMap[severity as SeverityLevel] || 'text-zinc-500';
}
