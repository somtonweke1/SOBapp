# Lazy Loading & Code Splitting Guide

## Overview

This guide explains how to use lazy loading and code splitting in the MIAR platform to improve performance and reduce bundle sizes.

## Quick Start

### Using Pre-configured Lazy Components

```typescript
import { LazyComponents } from '@/lib/lazy-load';

export default function MyPage() {
  return (
    <div>
      <h1>Network Analysis</h1>

      {/* This component is lazy-loaded automatically */}
      <LazyComponents.Network3D data={networkData} />
    </div>
  );
}
```

### Creating Custom Lazy Components

```typescript
import { lazy3D, lazyChart, lazyMap } from '@/lib/lazy-load';

// Lazy load a 3D component
const My3DComponent = lazy3D(() => import('./my-3d-component'));

// Lazy load a chart
const MyChart = lazyChart(() => import('./my-chart'));

// Lazy load a map
const MyMap = lazyMap(() => import('./my-map'));

export default function Dashboard() {
  return (
    <div>
      <My3DComponent />
      <MyChart />
      <MyMap />
    </div>
  );
}
```

## When to Use Lazy Loading

### ✅ Always Lazy Load

1. **3D Visualizations** (Three.js components)
   - Large bundle size (~500KB+)
   - Browser-only APIs
   - Heavy computational load

2. **Map Components** (MapLibre, Mapbox)
   - Large dependencies (~300KB+)
   - Browser-only rendering
   - External tile loading

3. **Heavy Charts** (Complex D3 visualizations)
   - Large rendering libraries
   - Complex calculations
   - Below-the-fold content

4. **Modal/Dialog Content**
   - Only shown on user interaction
   - Can be loaded on-demand
   - Reduces initial bundle

5. **Admin/Dashboard Pages**
   - Not critical for initial load
   - Feature-rich components
   - Power user functionality

### ❌ Don't Lazy Load

1. **Above-the-fold Content**
   - Visible immediately on page load
   - Critical for LCP (Largest Contentful Paint)
   - User expects instant display

2. **Small Components** (<10KB)
   - Code splitting overhead not worth it
   - No significant performance gain
   - Adds complexity

3. **Critical User Flow**
   - Auth forms
   - Primary CTAs
   - Navigation components

## Lazy Loading Patterns

### 1. Component-Based Lazy Loading

```typescript
// Heavy component that should be lazy loaded
import { lazy3D } from '@/lib/lazy-load';

const Network3DVisualization = lazy3D(
  () => import('@/components/visualization/network-3d')
);

function AnalysisPage() {
  return (
    <div>
      <h1>Network Analysis</h1>
      <Network3DVisualization data={data} />
    </div>
  );
}
```

### 2. Conditional Lazy Loading

```typescript
import { LazyComponents } from '@/lib/lazy-load';

function Dashboard({ showAdvanced }: { showAdvanced: boolean }) {
  return (
    <div>
      <BasicStats />

      {/* Only load if advanced view is enabled */}
      {showAdvanced && (
        <LazyComponents.TemporalAnalysis data={timeSeriesData} />
      )}
    </div>
  );
}
```

### 3. Tab/Section-Based Lazy Loading

```typescript
import { LazyComponents } from '@/lib/lazy-load';

function AnalysisTabs() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="3d">3D View</TabsTrigger>
          <TabsTrigger value="map">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel />
        </TabsContent>

        <TabsContent value="3d">
          {/* Only loaded when user clicks 3D tab */}
          <LazyComponents.Network3D data={networkData} />
        </TabsContent>

        <TabsContent value="map">
          {/* Only loaded when user clicks Map tab */}
          <LazyComponents.GeoNetworkMap data={geoData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4. Route-Based Lazy Loading

```typescript
// app/dashboard/page.tsx
import { lazyRoute } from '@/lib/lazy-load';

// Lazy load entire route component
const DashboardContent = lazyRoute(
  () => import('@/components/dashboard/dashboard-content'),
  'Dashboard'
);

export default function DashboardPage() {
  return <DashboardContent />;
}
```

### 5. Library-Based Lazy Loading

```typescript
// Lazy load heavy third-party libraries
import { lazyLoad } from '@/lib/lazy-load';

// Lazy load a library on user interaction
function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    // Only load jsPDF when user clicks export
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    // ... export logic

    setIsExporting(false);
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}
```

## Custom Loading States

### Default Loading States

The library provides several loading components:
- `LoadingSpinner` - General spinner
- `LoadingCard` - Card placeholder with skeleton
- `LoadingChart` - Chart placeholder
- `Loading3D` - 3D visualization loader
- `LoadingMap` - Map placeholder
- `LoadingTable` - Table skeleton

### Custom Loading Component

```typescript
import { lazyLoad } from '@/lib/lazy-load';

const CustomLoading = () => (
  <div className="p-8 text-center">
    <p>Loading amazing visualization...</p>
    <ProgressBar />
  </div>
);

const HeavyComponent = lazyLoad(
  () => import('./heavy-component'),
  { loading: CustomLoading }
);
```

## Preloading for Better UX

```typescript
import { LazyComponents, preloadComponent } from '@/lib/lazy-load';

function NavigationMenu() {
  return (
    <nav>
      <Link
        href="/analysis"
        // Preload on hover for instant navigation
        onMouseEnter={() => preloadComponent(LazyComponents.AnalysisPanel)}
      >
        Analysis
      </Link>
    </nav>
  );
}
```

## Measuring Impact

### Before Lazy Loading
```bash
Route (app)                              Size     First Load JS
┌ ○ /                                   5.1 kB         95.2 kB
├ ○ /analysis                          450 kB         540 kB  # ❌ Too large!
└ ○ /dashboard                         280 kB         370 kB  # ❌ Too large!
```

### After Lazy Loading
```bash
Route (app)                              Size     First Load JS
┌ ○ /                                   5.1 kB         95.2 kB  # ✅ Fast
├ ○ /analysis                           38 kB         128 kB  # ✅ Optimized
└ ○ /dashboard                          45 kB         135 kB  # ✅ Optimized
```

## Bundle Analysis

### Analyze Your Bundle

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### What to Look For

1. **Large Chunks** (>200KB)
   - Should be split into smaller chunks
   - Lazy load if not critical

2. **Duplicate Code**
   - Same library in multiple chunks
   - Consider moving to shared chunk

3. **Heavy Dependencies**
   - Three.js, D3, MapLibre should be lazy loaded
   - Check if lighter alternatives exist

## Best Practices

### ✅ Do

1. **Group Related Components**
   ```typescript
   // Good: All 3D components in one lazy chunk
   const Visualization3D = lazy3D(() => import('@/components/3d-visualizations'));
   ```

2. **Use Loading States**
   ```typescript
   // Good: Prevents layout shift
   <Suspense fallback={<LoadingSkeleton />}>
     <LazyComponent />
   </Suspense>
   ```

3. **Preload on Intent**
   ```typescript
   // Good: Load before user needs it
   <button onMouseEnter={() => preload3DChart()}>
     View 3D Chart
   </button>
   ```

4. **Monitor Performance**
   ```typescript
   // Good: Track load times
   measurePerformance('lazy-component-load', async () => {
     await import('./heavy-component');
   });
   ```

### ❌ Don't

1. **Over-Split**
   ```typescript
   // Bad: Too many small chunks
   const Button = lazy(() => import('./button')); // Only 2KB!
   ```

2. **Lazy Load Above Fold**
   ```typescript
   // Bad: Hero image should not be lazy
   const HeroSection = lazy(() => import('./hero'));
   ```

3. **Forget Error Boundaries**
   ```typescript
   // Bad: No error handling
   <LazyComponent /> // What if loading fails?

   // Good: Wrapped in error boundary
   <ErrorBoundary fallback={<ErrorMessage />}>
     <LazyComponent />
   </ErrorBoundary>
   ```

4. **Lazy Load Critical Path**
   ```typescript
   // Bad: Auth provider should not be lazy
   const AuthProvider = lazy(() => import('./auth-provider'));
   ```

## Performance Metrics

### Target Metrics After Lazy Loading

- **First Load JS**: <150KB for most routes
- **Largest Chunk**: <200KB
- **Time to Interactive**: <3s on 3G
- **LCP**: <2.5s
- **CLS**: <0.1

### Monitoring

```typescript
// Track lazy load performance
import { logPerformanceMetric } from '@/lib/logger';

const LazyComponent = dynamic(
  () => import('./component').then((mod) => {
    logPerformanceMetric({
      operation: 'lazy_load_component',
      duration: performance.now(),
    });
    return mod;
  }),
  { loading: LoadingState }
);
```

## Common Patterns

### Heavy Third-Party Libraries

```typescript
// Only load when needed
const exportToPDF = async () => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  // Use libraries
};
```

### Conditional Features

```typescript
function FeatureToggle({ isEnabled }: { isEnabled: boolean }) {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    if (isEnabled && !Component) {
      import('./premium-feature').then((mod) => setComponent(() => mod.default));
    }
  }, [isEnabled]);

  return Component ? <Component /> : null;
}
```

### Progressive Enhancement

```typescript
function EnhancedVisualization() {
  const [enhanced, setEnhanced] = useState(false);

  return (
    <div>
      <BasicVisualization />

      <button onClick={() => setEnhanced(true)}>
        Show Advanced View
      </button>

      {enhanced && <LazyComponents.Network3D />}
    </div>
  );
}
```

## Troubleshooting

### Component Not Loading

1. Check browser console for errors
2. Verify import path is correct
3. Ensure component has default export
4. Check network tab for failed chunks

### Loading State Flashing

```typescript
// Add minimum display time
const [show, setShow] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setShow(true), 300);
  return () => clearTimeout(timer);
}, []);

return show ? <LazyComponent /> : <LoadingState />;
```

### Hydration Errors

```typescript
// Disable SSR for client-only components
const ClientComponent = lazyLoad(
  () => import('./client-component'),
  { ssr: false }  // Disable server-side rendering
);
```

## Summary

1. **Lazy load heavy components**: 3D, maps, charts (>50KB)
2. **Use appropriate loading states**: Prevent layout shift
3. **Preload on user intent**: Hover, focus, route prefetch
4. **Monitor bundle sizes**: Keep initial load <150KB
5. **Group related code**: Avoid over-splitting
6. **Measure impact**: Use bundle analyzer and performance monitoring

---

**Next Steps:**
- Review your current bundle size: `npm run build`
- Identify heavy components: `ANALYZE=true npm run build`
- Implement lazy loading for identified components
- Measure performance improvements
