/**
 * Notification & Alert Service
 * Real-time alerts for price movements, supply chain disruptions, and geopolitical events
 */

export interface Alert {
  id: string;
  type: 'price' | 'supply_chain' | 'geopolitical' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'price_change' | 'threshold' | 'pattern' | 'event';
  enabled: boolean;
  conditions: {
    commodity?: string;
    threshold?: number;
    comparison?: 'greater_than' | 'less_than' | 'equals' | 'percent_change';
    timeframe?: number; // minutes
  };
  actions: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  userId: string;
}

export class NotificationService {
  private static alerts: Alert[] = [];
  private static alertRules: AlertRule[] = [];
  private static listeners: ((alerts: Alert[]) => void)[] = [];

  /**
   * Initialize with default alert rules
   */
  static initialize() {
    // Default alert rules
    this.alertRules = [
      {
        id: 'price_change_5pct',
        name: 'Price Change Alert (>5%)',
        type: 'price_change',
        enabled: true,
        conditions: {
          threshold: 5,
          comparison: 'percent_change',
          timeframe: 1440 // 24 hours
        },
        actions: {
          email: true,
          push: true
        },
        userId: 'default'
      },
      {
        id: 'critical_geopolitical',
        name: 'Critical Geopolitical Event',
        type: 'event',
        enabled: true,
        conditions: {},
        actions: {
          email: true,
          push: true,
          sms: true
        },
        userId: 'default'
      }
    ];
  }

  /**
   * Check price changes and create alerts
   */
  static checkPriceAlerts(commodityData: Record<string, any>) {
    Object.entries(commodityData).forEach(([commodity, data]) => {
      const change = Math.abs(data.daily_change || 0);

      // Check if any rule applies
      const applicableRules = this.alertRules.filter(
        rule => rule.enabled && rule.type === 'price_change'
      );

      applicableRules.forEach(rule => {
        if (change >= (rule.conditions.threshold || 5)) {
          const severity = this.determineSeverity(change);

          this.createAlert({
            type: 'price',
            severity,
            title: `${commodity.toUpperCase()} Price Alert`,
            message: `${commodity.toUpperCase()} moved ${data.daily_change >= 0 ? '+' : ''}${data.daily_change.toFixed(2)}% in the last 24 hours. Current price: $${data.current}`,
            metadata: {
              commodity,
              change: data.daily_change,
              currentPrice: data.current,
              source: data.source
            }
          });
        }
      });
    });
  }

  /**
   * Check supply chain bottlenecks and create alerts
   */
  static checkSupplyChainAlerts(bottlenecks: any[]) {
    bottlenecks.forEach(bottleneck => {
      if (bottleneck.constraint && bottleneck.utilization > 90) {
        this.createAlert({
          type: 'supply_chain',
          severity: 'high',
          title: `Supply Chain Bottleneck: ${bottleneck.material}`,
          message: `${bottleneck.material} is at ${bottleneck.utilization.toFixed(1)}% capacity utilization. ${bottleneck.impact}`,
          metadata: {
            material: bottleneck.material,
            utilization: bottleneck.utilization,
            impact: bottleneck.impact
          }
        });
      }
    });
  }

  /**
   * Check geopolitical risks and create alerts
   */
  static checkGeopoliticalAlerts(risks: Record<string, any>) {
    Object.entries(risks).forEach(([country, risk]) => {
      // Check for critical alerts
      if (risk.alerts && Array.isArray(risk.alerts)) {
        risk.alerts.forEach((alert: any) => {
          if (alert.severity === 'critical' || alert.severity === 'high') {
            this.createAlert({
              type: 'geopolitical',
              severity: alert.severity,
              title: `${country}: ${alert.category}`,
              message: alert.description,
              metadata: {
                country,
                category: alert.category,
                riskScore: risk.overallRisk
              }
            });
          }
        });
      }

      // Check for deteriorating trends
      if (risk.trend?.shortTerm === 'deteriorating' && risk.overallRisk > 70) {
        this.createAlert({
          type: 'geopolitical',
          severity: 'medium',
          title: `Risk Trend Alert: ${country}`,
          message: `Geopolitical risk in ${country} is deteriorating. Current risk score: ${risk.overallRisk.toFixed(0)}/100`,
          metadata: {
            country,
            riskScore: risk.overallRisk,
            trend: risk.trend
          }
        });
      }
    });
  }

  /**
   * Create new alert
   */
  static createAlert(params: Omit<Alert, 'id' | 'timestamp' | 'read'>) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      timestamp: new Date(),
      read: false
    };

    // Check for duplicates (same title within last 5 minutes)
    const isDuplicate = this.alerts.some(
      a => a.title === alert.title &&
           (alert.timestamp.getTime() - a.timestamp.getTime()) < 300000
    );

    if (!isDuplicate) {
      this.alerts.unshift(alert);

      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(0, 100);
      }

      // Notify listeners
      this.notifyListeners();

      // Trigger actions (email, push, sms)
      this.triggerAlertActions(alert);
    }
  }

  /**
   * Get all alerts
   */
  static getAlerts(): Alert[] {
    return this.alerts;
  }

  /**
   * Get unread alerts
   */
  static getUnreadAlerts(): Alert[] {
    return this.alerts.filter(a => !a.read);
  }

  /**
   * Get alerts by severity
   */
  static getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Mark alert as read
   */
  static markAsRead(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all alerts as read
   */
  static markAllAsRead() {
    this.alerts.forEach(a => a.read = true);
    this.notifyListeners();
  }

  /**
   * Clear all alerts
   */
  static clearAlerts() {
    this.alerts = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to alert updates
   */
  static subscribe(callback: (alerts: Alert[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Get alert rules
   */
  static getAlertRules(): AlertRule[] {
    return this.alertRules;
  }

  /**
   * Add or update alert rule
   */
  static setAlertRule(rule: AlertRule) {
    const index = this.alertRules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      this.alertRules[index] = rule;
    } else {
      this.alertRules.push(rule);
    }
  }

  /**
   * Delete alert rule
   */
  static deleteAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId);
  }

  /**
   * Determine severity based on change magnitude
   */
  private static determineSeverity(change: number): Alert['severity'] {
    const absChange = Math.abs(change);
    if (absChange >= 15) return 'critical';
    if (absChange >= 10) return 'high';
    if (absChange >= 5) return 'medium';
    return 'low';
  }

  /**
   * Notify all listeners
   */
  private static notifyListeners() {
    this.listeners.forEach(listener => listener(this.alerts));
  }

  /**
   * Trigger alert actions (email, push, sms)
   */
  private static async triggerAlertActions(alert: Alert) {
    // Find applicable rules
    const rules = this.alertRules.filter(r => r.enabled);

    for (const rule of rules) {
      // Email notification
      if (rule.actions.email) {
        await this.sendEmailAlert(alert);
      }

      // Push notification (browser)
      if (rule.actions.push) {
        await this.sendPushNotification(alert);
      }

      // SMS (future implementation)
      if (rule.actions.sms) {
        // await this.sendSMSAlert(alert);
      }
    }
  }

  /**
   * Send email alert
   */
  private static async sendEmailAlert(alert: Alert) {
    try {
      // Call email API
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          message: alert.message,
          timestamp: alert.timestamp,
          metadata: alert.metadata
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send browser push notification
   */
  private static async sendPushNotification(alert: Alert) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/miar-logo.png',
        badge: '/miar-badge.png',
        tag: alert.id,
        requireInteraction: alert.severity === 'critical'
      });

      notification.onclick = () => {
        window.focus();
        if (alert.actionUrl) {
          window.location.href = alert.actionUrl;
        }
      };
    }
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Initialize service
NotificationService.initialize();

export default NotificationService;
