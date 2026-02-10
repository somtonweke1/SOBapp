/**
 * Unified Platform Store
 *
 * Single source of truth for all platform data
 * Enables real-time data flow between all components
 */

import { create } from 'zustand';
import { constraintMonitor, ConstraintChangeEvent } from '@/services/constraint-monitor';
import { decisionEngine, DecisionFrame } from '@/services/decision-engine';

export interface UploadedDataset {
  id: string;
  name: string;
  type: 'facilities' | 'assets' | 'constraints' | 'materials';
  data: any[];
  uploadedAt: Date;
  processedBy: string[];
}

export interface LiveAlert {
  id: string;
  type: 'constraint' | 'decision' | 'market' | 'risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  relatedComponent?: string;
  data?: any;
}

export interface PlatformMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  pendingDecisions: number;
  totalExposure: number;
  constraintsMonitored: number;
  datasetsLoaded: number;
}

interface UnifiedPlatformState {
  // Data Management
  datasets: UploadedDataset[];
  activeDataset: string | null;

  // Constraint & Decision System
  activeAlerts: ConstraintChangeEvent[];
  pendingDecisions: DecisionFrame[];

  // Live Notifications
  notifications: LiveAlert[];

  // Platform Metrics
  metrics: PlatformMetrics;

  // Cross-component State
  selectedAsset: string | null;
  selectedConstraint: string | null;
  globalFilters: {
    timeRange: string;
    severity: string[];
    regions: string[];
  };

  // Real-time Updates
  lastUpdate: Date | null;
  isLiveMonitoring: boolean;

  // Actions
  addDataset: (dataset: UploadedDataset) => void;
  setActiveDataset: (id: string) => void;
  updateAlerts: (alerts: ConstraintChangeEvent[]) => void;
  updateDecisions: (decisions: DecisionFrame[]) => void;
  addNotification: (notification: LiveAlert) => void;
  dismissNotification: (id: string) => void;
  setSelectedAsset: (assetId: string | null) => void;
  setSelectedConstraint: (constraintId: string | null) => void;
  updateMetrics: () => void;
  startLiveMonitoring: () => void;
  stopLiveMonitoring: () => void;
  clearAll: () => void;
}

export const useUnifiedPlatform = create<UnifiedPlatformState>((set, get) => ({
  // Initial State
  datasets: [],
  activeDataset: null,
  activeAlerts: [],
  pendingDecisions: [],
  notifications: [],
  metrics: {
    totalAlerts: 0,
    criticalAlerts: 0,
    pendingDecisions: 0,
    totalExposure: 0,
    constraintsMonitored: 0,
    datasetsLoaded: 0
  },
  selectedAsset: null,
  selectedConstraint: null,
  globalFilters: {
    timeRange: '24h',
    severity: ['critical', 'high', 'medium', 'low'],
    regions: []
  },
  lastUpdate: null,
  isLiveMonitoring: false,

  // Add uploaded dataset and trigger analysis
  addDataset: (dataset) => {
    set((state) => ({
      datasets: [...state.datasets, dataset],
      activeDataset: dataset.id,
      metrics: {
        ...state.metrics,
        datasetsLoaded: state.metrics.datasetsLoaded + 1
      }
    }));

    // Trigger notification
    get().addNotification({
      id: `dataset_${Date.now()}`,
      type: 'market',
      severity: 'medium',
      title: 'New Dataset Loaded',
      message: `${dataset.name} (${dataset.data.length} records) has been processed and is now available across all analytics`,
      timestamp: new Date(),
      actionRequired: false,
      relatedComponent: 'data-integration'
    });

    get().updateMetrics();
  },

  setActiveDataset: (id) => set({ activeDataset: id }),

  // Update constraint alerts from monitoring service
  updateAlerts: (alerts) => {
    set({ activeAlerts: alerts, lastUpdate: new Date() });

    // Create notifications for critical alerts
    alerts
      .filter(a => a.severity === 'critical' && a.requiresAction)
      .forEach(alert => {
        get().addNotification({
          id: alert.id,
          type: 'constraint',
          severity: alert.severity,
          title: `Critical Constraint: ${alert.details.metric}`,
          message: `${alert.details.percentChange.toFixed(1)}% change detected. Estimated impact: $${(alert.estimatedImpact.financial / 1000000).toFixed(1)}M`,
          timestamp: alert.timestamp,
          actionRequired: true,
          relatedComponent: 'decision-center',
          data: alert
        });
      });

    get().updateMetrics();
  },

  // Update pending decisions from decision engine
  updateDecisions: (decisions) => {
    set({ pendingDecisions: decisions });

    // Create notifications for urgent decisions
    decisions
      .filter(d => d.urgency === 'immediate' || d.urgency === 'urgent')
      .forEach(decision => {
        get().addNotification({
          id: decision.id,
          type: 'decision',
          severity: decision.urgency === 'immediate' ? 'critical' : 'high',
          title: `Decision Required: ${decision.urgency.toUpperCase()}`,
          message: decision.problem,
          timestamp: decision.generatedAt,
          actionRequired: true,
          relatedComponent: 'decision-center',
          data: decision
        });
      });

    get().updateMetrics();
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50) // Keep last 50
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),

  setSelectedAsset: (assetId) => set({ selectedAsset: assetId }),

  setSelectedConstraint: (constraintId) => set({ selectedConstraint: constraintId }),

  // Recalculate platform-wide metrics
  updateMetrics: () => {
    const state = get();
    set({
      metrics: {
        totalAlerts: state.activeAlerts.length,
        criticalAlerts: state.activeAlerts.filter(a => a.severity === 'critical').length,
        pendingDecisions: state.pendingDecisions.length,
        totalExposure: state.activeAlerts.reduce((sum, a) => sum + a.estimatedImpact.financial, 0),
        constraintsMonitored: state.activeAlerts.length,
        datasetsLoaded: state.datasets.length
      }
    });
  },

  // Start real-time monitoring loop
  startLiveMonitoring: () => {
    set({ isLiveMonitoring: true });

    // Initial fetch
    constraintMonitor.checkForChanges().then(events => {
      get().updateAlerts(constraintMonitor.getActiveAlerts());
      get().updateDecisions(decisionEngine.getPendingDecisions());
    });

    // Set up polling (every 30 seconds)
    const intervalId = setInterval(async () => {
      if (get().isLiveMonitoring) {
        const events = await constraintMonitor.checkForChanges();
        get().updateAlerts(constraintMonitor.getActiveAlerts());
        get().updateDecisions(decisionEngine.getPendingDecisions());
      }
    }, 30000);

    // Store interval ID for cleanup
    (window as any).__platformMonitoringInterval = intervalId;
  },

  stopLiveMonitoring: () => {
    set({ isLiveMonitoring: false });

    // Clear interval
    if ((window as any).__platformMonitoringInterval) {
      clearInterval((window as any).__platformMonitoringInterval);
      delete (window as any).__platformMonitoringInterval;
    }
  },

  clearAll: () =>
    set({
      datasets: [],
      activeDataset: null,
      activeAlerts: [],
      pendingDecisions: [],
      notifications: [],
      selectedAsset: null,
      selectedConstraint: null,
      lastUpdate: null
    })
}));

export default useUnifiedPlatform;
