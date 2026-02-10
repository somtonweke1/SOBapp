/**
 * Production Monitoring & Alerts System
 *
 * Comprehensive monitoring for health checks, performance metrics,
 * error tracking, and alerting capabilities.
 */

import logger from './logger';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: CheckStatus;
    api: CheckStatus;
    cache: CheckStatus;
    external: CheckStatus;
  };
  timestamp: string;
  uptime: number;
  version: string;
}

export interface CheckStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: string;
  tags?: Record<string, string>;
}

export interface AlertConfig {
  name: string;
  condition: (metrics: PerformanceMetric[]) => boolean;
  severity: 'critical' | 'warning' | 'info';
  threshold: number;
  window: number; // Time window in seconds
  cooldown: number; // Cooldown period in seconds
}

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  metrics?: PerformanceMetric[];
  resolved?: boolean;
  resolvedAt?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const METRICS_RETENTION = 1000 * 60 * 60; // 1 hour
const ALERT_COOLDOWN = 1000 * 60 * 15; // 15 minutes

// Alert thresholds
const THRESHOLDS = {
  API_LATENCY_WARNING: 1000, // 1 second
  API_LATENCY_CRITICAL: 3000, // 3 seconds
  ERROR_RATE_WARNING: 0.05, // 5%
  ERROR_RATE_CRITICAL: 0.15, // 15%
  CPU_WARNING: 70, // 70%
  CPU_CRITICAL: 90, // 90%
  MEMORY_WARNING: 80, // 80%
  MEMORY_CRITICAL: 95, // 95%
  DATABASE_LATENCY_WARNING: 500, // 500ms
  DATABASE_LATENCY_CRITICAL: 2000, // 2 seconds
} as const;

// =============================================================================
// Monitoring State
// =============================================================================

class MonitoringSystem {
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private startTime: number = Date.now();

  // -------------------------------------------------------------------------
  // Health Checks
  // -------------------------------------------------------------------------

  async runHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkAPI(),
      this.checkCache(),
      this.checkExternalServices(),
    ]);

    const [database, api, cache, external] = checks.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { status: 'down' as const, error: 'Check failed' }
    );

    const overallStatus = this.determineOverallStatus([
      database,
      api,
      cache,
      external,
    ]);

    return {
      status: overallStatus,
      checks: { database, api, cache, external },
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      const start = Date.now();

      // Import Prisma client dynamically to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      try {
        await Promise.race([
          prisma.$queryRaw`SELECT 1`,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), HEALTH_CHECK_TIMEOUT)
          ),
        ]);

        const latency = Date.now() - start;

        await prisma.$disconnect();

        return {
          status: latency < THRESHOLDS.DATABASE_LATENCY_WARNING ? 'up' : 'degraded',
          latency,
          details: { response_time_ms: latency },
        };
      } finally {
        await prisma.$disconnect();
      }
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkAPI(): Promise<CheckStatus> {
    try {
      const start = Date.now();

      // Check if Next.js API is responding
      const response = await Promise.race([
        fetch('http://localhost:3000/api/health', { method: 'HEAD' }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), HEALTH_CHECK_TIMEOUT)
        ),
      ]);

      const latency = Date.now() - start;

      return {
        status: response.ok && latency < THRESHOLDS.API_LATENCY_WARNING ? 'up' : 'degraded',
        latency,
        details: { status_code: response.status },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkCache(): Promise<CheckStatus> {
    try {
      const start = Date.now();

      // Import cache dynamically
      const { getCache, setCache } = await import('./cache');

      const testKey = '__health_check__';
      const testValue = Date.now();

      await setCache(testKey, testValue, 10);
      const retrieved = await getCache(testKey);

      const latency = Date.now() - start;

      if (retrieved === testValue) {
        return {
          status: 'up',
          latency,
          details: { cache_hit: true },
        };
      }

      return {
        status: 'degraded',
        latency,
        details: { cache_hit: false },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkExternalServices(): Promise<CheckStatus> {
    try {
      // Check if external APIs are configured
      const hasApiKeys =
        !!process.env.ALPHA_VANTAGE_API_KEY ||
        !!process.env.TWELVE_DATA_API_KEY ||
        !!process.env.PERPLEXITY_API_KEY;

      if (!hasApiKeys) {
        return {
          status: 'degraded',
          details: { message: 'No API keys configured' },
        };
      }

      return {
        status: 'up',
        details: { configured: true },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private determineOverallStatus(
    checks: CheckStatus[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const hasDown = checks.some((check) => check.status === 'down');
    const hasDegraded = checks.some((check) => check.status === 'degraded');

    if (hasDown) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  // -------------------------------------------------------------------------
  // Performance Metrics
  // -------------------------------------------------------------------------

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(fullMetric);
    this.cleanOldMetrics();

    // Check alert conditions
    this.checkAlerts();

    // Log critical metrics
    if (metric.name.includes('error') || metric.value > 1000) {
      logger.info({ metric: fullMetric }, 'Performance metric recorded');
    }
  }

  getMetrics(
    name?: string,
    since?: Date
  ): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    if (since) {
      const sinceTime = since.getTime();
      filtered = filtered.filter(
        (m) => new Date(m.timestamp).getTime() >= sinceTime
      );
    }

    return filtered;
  }

  getAggregatedMetrics(
    name: string,
    window: number = 300 // 5 minutes
  ): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const since = new Date(Date.now() - window * 1000);
    const metrics = this.getMetrics(name, since);

    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, p50: 0, p95: 0, p99: 0 };
    }

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }

  private percentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private cleanOldMetrics(): void {
    const cutoff = Date.now() - METRICS_RETENTION;
    this.metrics = this.metrics.filter(
      (m) => new Date(m.timestamp).getTime() > cutoff
    );
  }

  // -------------------------------------------------------------------------
  // Alert System
  // -------------------------------------------------------------------------

  private checkAlerts(): void {
    const alertConfigs: AlertConfig[] = [
      {
        name: 'high_api_latency',
        condition: (metrics) => {
          const apiMetrics = metrics.filter((m) => m.name === 'api_latency');
          if (apiMetrics.length === 0) return false;
          const avg =
            apiMetrics.reduce((sum, m) => sum + m.value, 0) /
            apiMetrics.length;
          return avg > THRESHOLDS.API_LATENCY_WARNING;
        },
        severity: 'warning',
        threshold: THRESHOLDS.API_LATENCY_WARNING,
        window: 300,
        cooldown: ALERT_COOLDOWN,
      },
      {
        name: 'critical_api_latency',
        condition: (metrics) => {
          const apiMetrics = metrics.filter((m) => m.name === 'api_latency');
          if (apiMetrics.length === 0) return false;
          const avg =
            apiMetrics.reduce((sum, m) => sum + m.value, 0) /
            apiMetrics.length;
          return avg > THRESHOLDS.API_LATENCY_CRITICAL;
        },
        severity: 'critical',
        threshold: THRESHOLDS.API_LATENCY_CRITICAL,
        window: 300,
        cooldown: ALERT_COOLDOWN,
      },
      {
        name: 'high_error_rate',
        condition: (metrics) => {
          const totalRequests = metrics.filter(
            (m) => m.name === 'api_request'
          ).length;
          const errorRequests = metrics.filter(
            (m) => m.name === 'api_error'
          ).length;
          if (totalRequests === 0) return false;
          return errorRequests / totalRequests > THRESHOLDS.ERROR_RATE_WARNING;
        },
        severity: 'warning',
        threshold: THRESHOLDS.ERROR_RATE_WARNING,
        window: 300,
        cooldown: ALERT_COOLDOWN,
      },
      {
        name: 'critical_error_rate',
        condition: (metrics) => {
          const totalRequests = metrics.filter(
            (m) => m.name === 'api_request'
          ).length;
          const errorRequests = metrics.filter(
            (m) => m.name === 'api_error'
          ).length;
          if (totalRequests === 0) return false;
          return errorRequests / totalRequests > THRESHOLDS.ERROR_RATE_CRITICAL;
        },
        severity: 'critical',
        threshold: THRESHOLDS.ERROR_RATE_CRITICAL,
        window: 300,
        cooldown: ALERT_COOLDOWN,
      },
      {
        name: 'slow_database',
        condition: (metrics) => {
          const dbMetrics = metrics.filter((m) => m.name === 'db_query_time');
          if (dbMetrics.length === 0) return false;
          const avg =
            dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length;
          return avg > THRESHOLDS.DATABASE_LATENCY_WARNING;
        },
        severity: 'warning',
        threshold: THRESHOLDS.DATABASE_LATENCY_WARNING,
        window: 300,
        cooldown: ALERT_COOLDOWN,
      },
    ];

    for (const config of alertConfigs) {
      this.evaluateAlert(config);
    }
  }

  private evaluateAlert(config: AlertConfig): void {
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(config.name);
    if (lastAlert && Date.now() - lastAlert < config.cooldown) {
      return;
    }

    // Get metrics in window
    const windowStart = new Date(Date.now() - config.window * 1000);
    const recentMetrics = this.getMetrics(undefined, windowStart);

    // Evaluate condition
    if (config.condition(recentMetrics)) {
      this.triggerAlert({
        id: `${config.name}_${Date.now()}`,
        name: config.name,
        severity: config.severity,
        message: `Alert: ${config.name} - threshold ${config.threshold} exceeded`,
        timestamp: new Date().toISOString(),
        metrics: recentMetrics.slice(-10), // Include last 10 metrics
      });

      this.lastAlertTime.set(config.name, Date.now());
    }
  }

  private triggerAlert(alert: Alert): void {
    this.alerts.push(alert);

    // Log alert
    if (alert.severity === 'critical') {
      logger.error({ alert }, 'Alert triggered');
    } else {
      logger.warn({ alert }, 'Alert triggered');
    }

    // Send notifications
    this.sendAlertNotification(alert);
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Send to Slack if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
            attachments: [
              {
                color: alert.severity === 'critical' ? 'danger' : 'warning',
                fields: [
                  {
                    title: 'Alert Name',
                    value: alert.name,
                    short: true,
                  },
                  {
                    title: 'Severity',
                    value: alert.severity,
                    short: true,
                  },
                  {
                    title: 'Timestamp',
                    value: alert.timestamp,
                    short: false,
                  },
                ],
              },
            ],
          }),
        });
      }

      // Send to Sentry if configured
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureMessage(`Alert: ${alert.name}`, {
          level: alert.severity === 'critical' ? 'error' : 'warning',
          extra: { alert },
        });
      }
    } catch (error) {
      logger.error({ error, alert }, 'Failed to send alert notification');
    }
  }

  getAlerts(
    severity?: 'critical' | 'warning' | 'info',
    unresolved?: boolean
  ): Alert[] {
    let filtered = this.alerts;

    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }

    if (unresolved !== undefined) {
      filtered = filtered.filter((a) => !a.resolved === unresolved);
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      logger.info({ alert }, 'Alert resolved');
    }
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  getSystemStats(): {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    metricsCount: number;
    alertsCount: number;
  } {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.filter((a) => !a.resolved).length,
    };
  }

  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.lastAlertTime.clear();
  }
}

// =============================================================================
// Exports
// =============================================================================

export const monitoring = new MonitoringSystem();

// Convenience functions
export const recordMetric = (metric: Omit<PerformanceMetric, 'timestamp'>) =>
  monitoring.recordMetric(metric);

export const runHealthCheck = () => monitoring.runHealthCheck();

export const getMetrics = (name?: string, since?: Date) =>
  monitoring.getMetrics(name, since);

export const getAggregatedMetrics = (name: string, window?: number) =>
  monitoring.getAggregatedMetrics(name, window);

export const getAlerts = (
  severity?: 'critical' | 'warning' | 'info',
  unresolved?: boolean
) => monitoring.getAlerts(severity, unresolved);

export const resolveAlert = (alertId: string) =>
  monitoring.resolveAlert(alertId);

export const getSystemStats = () => monitoring.getSystemStats();
