import { logPerformanceMetric } from './logger';

/**
 * Performance Monitoring Utilities
 * Track and log performance metrics across the application
 */

interface PerformanceTimer {
  start: number;
  name: string;
  metadata?: Record<string, any>;
}

const activeTimers = new Map<string, PerformanceTimer>();

/**
 * Start a performance timer
 */
export function startPerformanceTimer(
  name: string,
  metadata?: Record<string, any>
): string {
  const timerId = `${name}_${Date.now()}_${Math.random()}`;

  activeTimers.set(timerId, {
    start: performance.now(),
    name,
    metadata,
  });

  return timerId;
}

/**
 * End a performance timer and log the result
 */
export function endPerformanceTimer(timerId: string): number {
  const timer = activeTimers.get(timerId);

  if (!timer) {
    console.warn(`Performance timer ${timerId} not found`);
    return 0;
  }

  const duration = Math.round(performance.now() - timer.start);

  logPerformanceMetric({
    operation: timer.name,
    duration,
    metadata: timer.metadata,
  });

  activeTimers.delete(timerId);

  return duration;
}

/**
 * Measure the execution time of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);

    logPerformanceMetric({
      operation: name,
      duration,
      metadata,
    });

    return { result, duration };
  } catch (error) {
    const duration = Math.round(performance.now() - start);

    logPerformanceMetric({
      operation: name,
      duration,
      metadata: {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

/**
 * Decorator for measuring function performance
 */
export function measureMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const timerId = startPerformanceTimer(`${target.constructor.name}.${propertyKey}`);

    try {
      const result = await originalMethod.apply(this, args);
      endPerformanceTimer(timerId);
      return result;
    } catch (error) {
      endPerformanceTimer(timerId);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Monitor database query performance
 */
export async function measureDatabaseQuery<T>(
  operation: string,
  model: string,
  query: () => Promise<T>
): Promise<T> {
  const { result, duration } = await measurePerformance(
    `db_${operation}_${model}`,
    query,
    { type: 'database', operation, model }
  );

  // Log slow queries (>1000ms)
  if (duration > 1000) {
    console.warn(`Slow database query detected: ${operation} ${model} took ${duration}ms`);
  }

  return result;
}

/**
 * Monitor API endpoint performance
 */
export async function measureApiEndpoint<T>(
  method: string,
  path: string,
  handler: () => Promise<T>
): Promise<T> {
  const { result, duration } = await measurePerformance(
    `api_${method}_${path}`,
    handler,
    { type: 'api', method, path }
  );

  // Log slow endpoints (>2000ms)
  if (duration > 2000) {
    console.warn(`Slow API endpoint detected: ${method} ${path} took ${duration}ms`);
  }

  return result;
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!navigation) {
    return null;
  }

  return {
    // Page load metrics
    domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
    loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),

    // Network metrics
    dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
    tcp: Math.round(navigation.connectEnd - navigation.connectStart),
    request: Math.round(navigation.responseStart - navigation.requestStart),
    response: Math.round(navigation.responseEnd - navigation.responseStart),

    // Timing
    timeToFirstByte: Math.round(navigation.responseStart - navigation.fetchStart),
  };
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(metric: any) {
  // Log Core Web Vitals
  if (metric.label === 'web-vital') {
    logPerformanceMetric({
      operation: `web_vital_${metric.name}`,
      duration: Math.round(metric.value),
      metadata: {
        id: metric.id,
        label: metric.label,
        rating: metric.rating,
      },
    });
  }
}

/**
 * Memory usage monitoring (Node.js only)
 */
export function getMemoryUsage() {
  if (typeof process === 'undefined') {
    return null;
  }

  const usage = process.memoryUsage();

  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
}
