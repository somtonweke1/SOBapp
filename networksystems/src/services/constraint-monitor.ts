/**
 * Real-Time Constraint Monitor
 *
 * Continuously monitors external data sources for constraint changes
 * and triggers automatic scenario reruns when thresholds are breached.
 *
 * This is the "nervous system" that makes SOBapp indispensable.
 */

import { ConstraintModel, ConstraintAlert } from './constraint-engine/types';

export interface ConstraintThreshold {
  constraintId: string;
  metric: 'utilization' | 'price' | 'availability' | 'risk_score' | 'probability';
  threshold: number;
  direction: 'increase' | 'decrease' | 'either';
  currentValue: number;
  previousValue: number;
}

export interface ConstraintChangeEvent {
  id: string;
  timestamp: Date;
  constraintId: string;
  changeType: 'threshold_breach' | 'new_constraint' | 'constraint_resolved' | 'cascade_trigger';
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: {
    metric: string;
    oldValue: number;
    newValue: number;
    percentChange: number;
    threshold: number;
  };
  affectedAssets: string[];
  estimatedImpact: {
    financial: number;
    operational: string;
  };
  requiresAction: boolean;
  suggestedActions: string[];
}

export interface MonitoringSource {
  id: string;
  name: string;
  type: 'port_status' | 'commodity_price' | 'geopolitical_risk' | 'weather' | 'production' | 'logistics';
  endpoint: string;
  refreshInterval: number; // milliseconds
  lastChecked: Date | null;
  status: 'active' | 'error' | 'paused';
  errorCount: number;
}

class ConstraintMonitorService {
  private monitoringSources: MonitoringSource[] = [];
  private activeConstraints: Map<string, ConstraintModel> = new Map();
  private thresholds: Map<string, ConstraintThreshold[]> = new Map();
  private changeHistory: ConstraintChangeEvent[] = [];
  private alertCallbacks: Array<(event: ConstraintChangeEvent) => void> = [];

  constructor() {
    this.initializeMonitoringSources();
  }

  /**
   * Initialize monitoring sources for real-time constraint detection
   */
  private initializeMonitoringSources() {
    this.monitoringSources = [
      {
        id: 'port_status_global',
        name: 'Global Port Status Monitor',
        type: 'port_status',
        endpoint: '/api/external/port-status',
        refreshInterval: 3600000, // 1 hour
        lastChecked: null,
        status: 'active',
        errorCount: 0
      },
      {
        id: 'commodity_prices_live',
        name: 'Live Commodity Price Feed',
        type: 'commodity_price',
        endpoint: '/api/live-data?type=commodities',
        refreshInterval: 900000, // 15 minutes
        lastChecked: null,
        status: 'active',
        errorCount: 0
      },
      {
        id: 'geopolitical_risk_feed',
        name: 'Geopolitical Risk Intelligence',
        type: 'geopolitical_risk',
        endpoint: '/api/intelligence/geopolitical',
        refreshInterval: 7200000, // 2 hours
        lastChecked: null,
        status: 'active',
        errorCount: 0
      },
      {
        id: 'weather_logistics',
        name: 'Weather & Logistics Disruptions',
        type: 'weather',
        endpoint: '/api/external/weather-alerts',
        refreshInterval: 1800000, // 30 minutes
        lastChecked: null,
        status: 'active',
        errorCount: 0
      },
      {
        id: 'production_updates',
        name: 'Production Status Updates',
        type: 'production',
        endpoint: '/api/live-data?type=mining',
        refreshInterval: 1800000, // 30 minutes
        lastChecked: null,
        status: 'active',
        errorCount: 0
      }
    ];
  }

  /**
   * Register a constraint for monitoring
   */
  registerConstraint(constraint: ConstraintModel, thresholds?: ConstraintThreshold[]) {
    this.activeConstraints.set(constraint.id, constraint);

    // Set default thresholds if not provided
    const defaultThresholds: ConstraintThreshold[] = thresholds || [
      {
        constraintId: constraint.id,
        metric: 'probability',
        threshold: 0.2, // 20% change in probability
        direction: 'increase',
        currentValue: constraint.impact.risk.probability,
        previousValue: constraint.impact.risk.probability
      },
      {
        constraintId: constraint.id,
        metric: 'risk_score',
        threshold: 1.5, // 1.5 point change in risk score
        direction: 'either',
        currentValue: constraint.impact.risk.riskScore,
        previousValue: constraint.impact.risk.riskScore
      }
    ];

    this.thresholds.set(constraint.id, defaultThresholds);
  }

  /**
   * Check all monitoring sources and detect constraint changes
   */
  async checkForChanges(): Promise<ConstraintChangeEvent[]> {
    const events: ConstraintChangeEvent[] = [];

    for (const source of this.monitoringSources) {
      if (source.status !== 'active') continue;

      try {
        const changes = await this.checkSource(source);
        events.push(...changes);
        source.lastChecked = new Date();
        source.errorCount = 0;
      } catch (error) {
        console.error(`Error checking source ${source.id}:`, error);
        source.errorCount++;
        if (source.errorCount >= 3) {
          source.status = 'error';
        }
      }
    }

    // Store in history
    this.changeHistory.push(...events);

    // Trigger callbacks for critical events
    const criticalEvents = events.filter(e => e.severity === 'critical' || e.requiresAction);
    criticalEvents.forEach(event => {
      this.alertCallbacks.forEach(callback => callback(event));
    });

    return events;
  }

  /**
   * Check a specific monitoring source for constraint changes
   */
  private async checkSource(source: MonitoringSource): Promise<ConstraintChangeEvent[]> {
    const events: ConstraintChangeEvent[] = [];

    // Simulate checking source (in production, this would call real APIs)
    switch (source.type) {
      case 'commodity_price':
        const priceChanges = await this.detectCommodityPriceChanges();
        events.push(...priceChanges);
        break;

      case 'port_status':
        const portChanges = await this.detectPortStatusChanges();
        events.push(...portChanges);
        break;

      case 'geopolitical_risk':
        const riskChanges = await this.detectGeopoliticalRiskChanges();
        events.push(...riskChanges);
        break;

      case 'production':
        const productionChanges = await this.detectProductionChanges();
        events.push(...productionChanges);
        break;
    }

    return events;
  }

  /**
   * Detect commodity price threshold breaches.
   * Real data only: wire to live price feeds; no synthetic events.
   */
  private async detectCommodityPriceChanges(): Promise<ConstraintChangeEvent[]> {
    // TODO: integrate real commodity APIs (e.g. LME, Yahoo Finance); return [] until then
    return [];
  }

  /**
   * Detect port status changes (closures, delays).
   * Real data only: wire to port/LOG APIs; no synthetic events.
   */
  private async detectPortStatusChanges(): Promise<ConstraintChangeEvent[]> {
    // TODO: integrate real port/logistics data; return [] until then
    return [];
  }

  /**
   * Detect geopolitical risk changes.
   * Real data only: wire to risk intelligence; no synthetic events.
   */
  private async detectGeopoliticalRiskChanges(): Promise<ConstraintChangeEvent[]> {
    // TODO: integrate real risk/geopolitical data; return [] until then
    return [];
  }

  /**
   * Detect production status changes.
   * Real data only: wire to production/operational APIs; no synthetic events.
   */
  private async detectProductionChanges(): Promise<ConstraintChangeEvent[]> {
    // TODO: integrate real production/operational data; return [] until then
    return [];
  }

  /**
   * Register callback for constraint alerts
   */
  onAlert(callback: (event: ConstraintChangeEvent) => void) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get recent change history
   */
  getChangeHistory(hours: number = 24): ConstraintChangeEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.changeHistory.filter(event => event.timestamp >= cutoff);
  }

  /**
   * Get active alerts that require action
   */
  getActiveAlerts(): ConstraintChangeEvent[] {
    return this.changeHistory
      .filter(event => event.requiresAction)
      .filter(event => {
        // Only show alerts from last 48 hours
        const hoursSince = (Date.now() - event.timestamp.getTime()) / (1000 * 60 * 60);
        return hoursSince < 48;
      })
      .sort((a, b) => {
        // Sort by severity and estimated impact
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.estimatedImpact.financial - a.estimatedImpact.financial;
      });
  }

  /**
   * Get monitoring source status
   */
  getMonitoringStatus() {
    return {
      sources: this.monitoringSources.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: s.status,
        lastChecked: s.lastChecked,
        errorCount: s.errorCount
      })),
      activeConstraints: this.activeConstraints.size,
      totalAlerts: this.changeHistory.length,
      activeAlerts: this.getActiveAlerts().length
    };
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMinutes: number = 15) {
    console.log(`Starting constraint monitoring (check every ${intervalMinutes} minutes)`);

    // Initial check
    this.checkForChanges();

    // Set up recurring checks
    setInterval(() => {
      this.checkForChanges();
    }, intervalMinutes * 60 * 1000);
  }
}

// Singleton instance
export const constraintMonitor = new ConstraintMonitorService();

export default constraintMonitor;
