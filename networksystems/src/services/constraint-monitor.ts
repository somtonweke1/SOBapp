/**
 * Real-Time Constraint Monitor
 *
 * Continuously monitors external data sources for constraint changes
 * and triggers automatic scenario reruns when thresholds are breached.
 *
 * This is the "nervous system" that makes MIAR indispensable.
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
   * Detect commodity price threshold breaches
   */
  private async detectCommodityPriceChanges(): Promise<ConstraintChangeEvent[]> {
    const events: ConstraintChangeEvent[] = [];

    // Example: Cobalt price spike detection
    const mockPriceChange = {
      material: 'cobalt',
      oldPrice: 55000,
      newPrice: 72000,
      percentChange: ((72000 - 55000) / 55000) * 100
    };

    if (Math.abs(mockPriceChange.percentChange) > 20) {
      events.push({
        id: `price_change_${Date.now()}`,
        timestamp: new Date(),
        constraintId: 'constraint_cobalt_supply',
        changeType: 'threshold_breach',
        severity: 'high',
        details: {
          metric: 'cobalt_spot_price',
          oldValue: mockPriceChange.oldPrice,
          newValue: mockPriceChange.newPrice,
          percentChange: mockPriceChange.percentChange,
          threshold: 20
        },
        affectedAssets: ['drc_cobalt_operations', 'ev_battery_supply_chain'],
        estimatedImpact: {
          financial: 8500000, // $8.5M impact
          operational: '23% increase in procurement costs, potential supply chain delays'
        },
        requiresAction: true,
        suggestedActions: [
          'Lock in cobalt futures contracts at current rates',
          'Activate alternative supplier agreements',
          'Adjust production schedule to minimize cobalt usage'
        ]
      });
    }

    return events;
  }

  /**
   * Detect port status changes (closures, delays)
   */
  private async detectPortStatusChanges(): Promise<ConstraintChangeEvent[]> {
    const events: ConstraintChangeEvent[] = [];

    // Example: Port closure detection
    const mockPortClosure = {
      port: 'Port of Houston',
      status: 'maintenance_closure',
      duration: 8, // weeks
      affectedRoutes: ['gulf_coast_lng', 'mid_atlantic_gas']
    };

    if (mockPortClosure.duration > 4) {
      events.push({
        id: `port_closure_${Date.now()}`,
        timestamp: new Date(),
        constraintId: 'constraint_logistics_houston',
        changeType: 'new_constraint',
        severity: 'critical',
        details: {
          metric: 'port_availability',
          oldValue: 100,
          newValue: 0,
          percentChange: -100,
          threshold: 50
        },
        affectedAssets: ['houston_lng_terminal', 'gulf_coast_pipeline'],
        estimatedImpact: {
          financial: 12100000, // $12.1M over 8 weeks
          operational: '35% reduction in LNG export capacity, rerouting required'
        },
        requiresAction: true,
        suggestedActions: [
          'Reroute to Port of Corpus Christi (+$2.1M logistics cost)',
          'Accelerate Q2 production to compensate (+$8.3M revenue opportunity)',
          'Negotiate temporary storage at alternative terminals'
        ]
      });
    }

    return events;
  }

  /**
   * Detect geopolitical risk changes
   */
  private async detectGeopoliticalRiskChanges(): Promise<ConstraintChangeEvent[]> {
    const events: ConstraintChangeEvent[] = [];

    // Example: DRC political instability
    const mockRiskIncrease = {
      region: 'DRC (Democratic Republic of Congo)',
      riskType: 'political_instability',
      oldScore: 4.2,
      newScore: 7.8,
      confidence: 0.82
    };

    if (mockRiskIncrease.newScore - mockRiskIncrease.oldScore > 2.0) {
      events.push({
        id: `geopolitical_risk_${Date.now()}`,
        timestamp: new Date(),
        constraintId: 'constraint_drc_cobalt_supply',
        changeType: 'threshold_breach',
        severity: 'critical',
        details: {
          metric: 'geopolitical_risk_score',
          oldValue: mockRiskIncrease.oldScore,
          newValue: mockRiskIncrease.newScore,
          percentChange: ((mockRiskIncrease.newScore - mockRiskIncrease.oldScore) / mockRiskIncrease.oldScore) * 100,
          threshold: 2.0
        },
        affectedAssets: ['drc_cobalt_mines', 'global_ev_battery_supply'],
        estimatedImpact: {
          financial: 47300000, // $47.3M exposure
          operational: 'Potential 60% disruption to global cobalt supply, cascading EV production delays'
        },
        requiresAction: true,
        suggestedActions: [
          'Diversify cobalt sourcing to Australia/Indonesia (+18% cost but 85% risk reduction)',
          'Build 6-month strategic cobalt reserve (+$12M inventory cost)',
          'Hedge cobalt price exposure via futures contracts'
        ]
      });
    }

    return events;
  }

  /**
   * Detect production status changes
   */
  private async detectProductionChanges(): Promise<ConstraintChangeEvent[]> {
    const events: ConstraintChangeEvent[] = [];

    // Example: Unexpected production drop
    const mockProductionDrop = {
      facility: 'Jwaneng Diamond Mine',
      oldOutput: 12500, // carats/day
      newOutput: 8200,
      percentChange: ((8200 - 12500) / 12500) * 100
    };

    if (Math.abs(mockProductionDrop.percentChange) > 25) {
      events.push({
        id: `production_drop_${Date.now()}`,
        timestamp: new Date(),
        constraintId: 'constraint_jwaneng_production',
        changeType: 'threshold_breach',
        severity: 'high',
        details: {
          metric: 'daily_production',
          oldValue: mockProductionDrop.oldOutput,
          newValue: mockProductionDrop.newOutput,
          percentChange: mockProductionDrop.percentChange,
          threshold: 25
        },
        affectedAssets: ['jwaneng_mine', 'debswana_revenue'],
        estimatedImpact: {
          financial: 3200000, // $3.2M daily revenue loss
          operational: '34% production shortfall, likely equipment failure or ore grade drop'
        },
        requiresAction: true,
        suggestedActions: [
          'Deploy maintenance crew for emergency equipment repair',
          'Redirect processing capacity to higher-grade ore stockpiles',
          'Adjust Q2 production targets and customer delivery schedules'
        ]
      });
    }

    return events;
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
