'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

/**
 * Lazy Loading Utilities
 * Dynamic imports with loading states and error boundaries
 */

/**
 * Loading component variants
 */
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export const LoadingCard = () => (
  <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
    <div className="h-32 bg-muted rounded"></div>
  </div>
);

export const LoadingChart = () => (
  <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
    <div className="h-4 bg-muted rounded w-1/4"></div>
    <div className="h-64 bg-muted rounded"></div>
    <div className="flex gap-4 mt-4">
      <div className="h-4 bg-muted rounded w-1/3"></div>
      <div className="h-4 bg-muted rounded w-1/3"></div>
      <div className="h-4 bg-muted rounded w-1/3"></div>
    </div>
  </div>
);

export const Loading3D = () => (
  <div className="rounded-lg border bg-card p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
    <p className="text-sm text-muted-foreground">Loading 3D visualization...</p>
  </div>
);

export const LoadingMap = () => (
  <div className="rounded-lg border bg-card overflow-hidden min-h-[400px] relative">
    <div className="absolute inset-0 bg-muted animate-pulse"></div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  </div>
);

export const LoadingTable = () => (
  <div className="rounded-lg border bg-card p-6 space-y-3 animate-pulse">
    <div className="h-8 bg-muted rounded w-full"></div>
    <div className="h-12 bg-muted rounded w-full"></div>
    <div className="h-12 bg-muted rounded w-full"></div>
    <div className="h-12 bg-muted rounded w-full"></div>
    <div className="h-12 bg-muted rounded w-full"></div>
  </div>
);

/**
 * Lazy load with custom loading component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  const LoadingComponent = options?.loading || LoadingSpinner;

  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr: options?.ssr !== false,
  });
}

/**
 * Specialized lazy loaders for common component types
 */

// Lazy load 3D visualizations (heavy Three.js components)
export function lazy3D<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazyLoad(importFn, {
    loading: Loading3D,
    ssr: false, // 3D components typically need window/canvas
  });
}

// Lazy load map components (heavy MapLibre/Mapbox)
export function lazyMap<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazyLoad(importFn, {
    loading: LoadingMap,
    ssr: false, // Map components need window and browser APIs
  });
}

// Lazy load charts (Recharts, D3)
export function lazyChart<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazyLoad(importFn, {
    loading: LoadingChart,
    ssr: false, // Charts often use canvas or complex calculations
  });
}

// Lazy load modals/dialogs
export function lazyModal<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazyLoad(importFn, {
    loading: LoadingSpinner,
    ssr: false, // Modals are typically not server-rendered
  });
}

// Lazy load tables with large datasets
export function lazyTable<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazyLoad(importFn, {
    loading: LoadingTable,
    ssr: true, // Tables can be server-rendered
  });
}

/**
 * Wrapper component for manual lazy loading control
 */
export function LazyWrapper({
  children,
  loading = <LoadingSpinner />,
  fallback,
}: {
  children: React.ReactNode;
  loading?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={loading}>
      {children}
    </Suspense>
  );
}

/**
 * Preload component function for critical paths
 */
export function preloadComponent<T extends ComponentType<any>>(
  Component: T & { preload?: () => void }
) {
  if (Component.preload) {
    Component.preload();
  }
}

/**
 * Common lazy-loaded components registry
 * Import these instead of directly importing heavy components
 */
export const LazyComponents = {
  // 3D Visualizations
  Network3D: lazy3D(() => import('@/components/visualization/network-3d')),
  Network3DMap: lazy3D(() => import('@/components/visualization/3d-network-map')),
  SupplyChain3D: lazy3D(() => import('@/components/visualization/3d-supply-chain-network')),

  // Map Components
  GeoNetworkMap: lazyMap(() => import('@/components/visualization/geo-network-map')),
  CriticalMineralsRiskMap: lazyMap(() => import('@/components/live-map/critical-minerals-risk-map')),

  // Charts and Analysis
  NetworkVisualization: lazyChart(() => import('@/components/visualization/network-visualization')),
  TemporalAnalysis: lazyChart(() => import('@/components/visualization/temporal-analysis')),
  CentralityMetrics: lazyChart(() => import('@/components/analysis/centrality-metrics')),

  // Large UI Components
  PlatformGuide: lazyLoad(() => import('@/components/guide/platform-guide')),
  MiningInsights: lazyLoad(() => import('@/components/insights/mining-insights')),

  // Analysis Tools
  AnalysisPanel: lazyLoad(() => import('@/components/analysis/analysis-panel')),
  NetworkStats: lazyLoad(() => import('@/components/analysis/network-stats')),
} as const;

/**
 * Route-based code splitting helper
 * Use this for page-level components
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  pageName?: string
) {
  return dynamic(importFn, {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          {pageName && <p className="text-muted-foreground">Loading {pageName}...</p>}
        </div>
      </div>
    ),
  });
}

/**
 * Bundle splitting strategies
 */
export const CODE_SPLITTING_STRATEGIES = {
  // Route-based splitting (automatic with Next.js app router)
  routeBased: {
    description: 'Each page/route is automatically code-split',
    implementation: 'Built-in with Next.js App Router',
    when: 'Always enabled by default',
  },

  // Component-based splitting
  componentBased: {
    description: 'Heavy components loaded on-demand',
    implementation: 'Use dynamic() or lazy() imports',
    when: 'For 3D visualizations, maps, charts, large UI components',
  },

  // Library-based splitting
  libraryBased: {
    description: 'Heavy libraries loaded separately',
    implementation: 'Dynamic imports for libraries',
    when: 'For Three.js, D3, MapLibre, date-fns, etc.',
  },

  // Data-based splitting
  dataBased: {
    description: 'Large datasets loaded on-demand',
    implementation: 'API routes with pagination/lazy loading',
    when: 'For large JSON files, datasets, translations',
  },
} as const;

/**
 * Performance tips for code splitting
 */
export const PERFORMANCE_TIPS = [
  'Lazy load components below the fold',
  'Preload critical lazy components on hover/focus',
  'Use loading states to prevent layout shift',
  'Group related components in same chunk',
  'Avoid over-splitting (too many small chunks hurt performance)',
  'Monitor chunk sizes with next/bundle-analyzer',
  'Use React.lazy() for client-only components',
  'Combine code splitting with route prefetching',
] as const;

export default lazyLoad;
