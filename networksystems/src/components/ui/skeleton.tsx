/**
 * Skeleton Loading States
 * WCAG compliant loading indicators with glassmorphism aesthetic
 */

import { cn } from '@/lib/utils';
import { AriaHelpers } from '@/lib/accessibility';

/**
 * Base skeleton component
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-zinc-200/50 backdrop-blur-sm',
        className
      )}
      {...AriaHelpers.loading(true)}
      {...props}
    />
  );
}

/**
 * Skeleton variants for different content types
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)} {...AriaHelpers.loading(true)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-4/5' : 'w-full' // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton (matches glassmorphism design)
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-zinc-200/50',
        className
      )}
      {...AriaHelpers.loading(true)}
    >
      {/* Icon placeholder */}
      <Skeleton className="w-12 h-12 rounded-lg mb-6" />

      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-4" />

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Table skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200/50 p-6',
        className
      )}
      {...AriaHelpers.loading(true)}
    >
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-12" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart skeleton
 */
export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200/50 p-6',
        className
      )}
      {...AriaHelpers.loading(true)}
    >
      {/* Title */}
      <Skeleton className="h-6 w-1/3 mb-6" />

      {/* Chart area */}
      <div className="space-y-4">
        {/* Y-axis labels and bars */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" /> {/* Y-axis label */}
            <Skeleton
              className="h-8"
              style={{ width: `${Math.random() * 50 + 30}%` }} // Random bar widths
            />
          </div>
        ))}

        {/* X-axis */}
        <div className="flex justify-between pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({
  size = 'medium',
  className,
}: {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
      {...AriaHelpers.loading(true)}
    />
  );
}

/**
 * Button skeleton
 */
export function SkeletonButton({
  size = 'medium',
  className,
}: {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizeClasses = {
    small: 'h-8 w-20',
    medium: 'h-10 w-24',
    large: 'h-12 w-32',
  };

  return (
    <Skeleton
      className={cn('rounded-lg', sizeClasses[size], className)}
      {...AriaHelpers.loading(true)}
    />
  );
}

/**
 * Dashboard metric skeleton
 */
export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-zinc-200/50',
        className
      )}
      {...AriaHelpers.loading(true)}
    >
      {/* Label */}
      <Skeleton className="h-4 w-1/2 mb-3" />

      {/* Value */}
      <Skeleton className="h-8 w-3/4 mb-2" />

      {/* Change indicator */}
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

/**
 * List item skeleton
 */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-4 py-3', className)}
      {...AriaHelpers.loading(true)}
    >
      <SkeletonAvatar size="medium" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/**
 * Form skeleton
 */
export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-200/50',
        className
      )}
      {...AriaHelpers.loading(true)}
    >
      {/* Title */}
      <Skeleton className="h-7 w-1/3 mb-6" />

      {/* Form fields */}
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" /> {/* Label */}
            <Skeleton className="h-12 w-full" /> {/* Input */}
          </div>
        ))}
      </div>

      {/* Submit button */}
      <SkeletonButton size="large" className="mt-6 w-full" />
    </div>
  );
}

/**
 * Network visualization skeleton
 */
export function SkeletonNetwork({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 p-6 min-h-[400px] flex items-center justify-center',
        className
      )}
      {...AriaHelpers.loading(true)}
    >
      <div className="text-center space-y-4">
        {/* Spinning loader */}
        <div className="mx-auto w-16 h-16 border-4 border-zinc-200 border-t-emerald-600 rounded-full animate-spin" />

        {/* Loading text */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}

/**
 * Page skeleton (full page loading)
 */
export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-8', className)}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Content grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/**
 * Progressive disclosure skeleton
 * Shows incremental loading with staggered animation
 */
export function SkeletonProgressive({
  items = 3,
  delay = 150,
  className,
}: {
  items?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)} {...AriaHelpers.loading(true)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            animationDelay: `${i * delay}ms`,
          }}
        >
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton with custom content
 */
export function SkeletonCustom({
  children,
  isLoading,
  skeleton,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
}) {
  return isLoading ? <>{skeleton}</> : <>{children}</>;
}

/**
 * Accessible loading announcement
 */
export function SkeletonAnnouncement({ message = 'Loading content...' }: { message?: string }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

/**
 * Export all skeleton components
 */
export const Skeletons = {
  Base: Skeleton,
  Text: SkeletonText,
  Card: SkeletonCard,
  Table: SkeletonTable,
  Chart: SkeletonChart,
  Avatar: SkeletonAvatar,
  Button: SkeletonButton,
  Metric: SkeletonMetric,
  ListItem: SkeletonListItem,
  Form: SkeletonForm,
  Network: SkeletonNetwork,
  Page: SkeletonPage,
  Progressive: SkeletonProgressive,
  Custom: SkeletonCustom,
  Announcement: SkeletonAnnouncement,
};

export default Skeleton;
