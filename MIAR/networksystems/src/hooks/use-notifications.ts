/**
 * React Hook for Notifications
 * Subscribe to alerts and manage notification state
 */

import { useState, useEffect } from 'react';
import NotificationService, { Alert } from '@/services/notification-service';

export function useNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial alerts
    setAlerts(NotificationService.getAlerts());
    setUnreadCount(NotificationService.getUnreadAlerts().length);

    // Subscribe to updates
    const unsubscribe = NotificationService.subscribe((newAlerts) => {
      setAlerts(newAlerts);
      setUnreadCount(newAlerts.filter(a => !a.read).length);
    });

    return unsubscribe;
  }, []);

  const markAsRead = (alertId: string) => {
    NotificationService.markAsRead(alertId);
  };

  const markAllAsRead = () => {
    NotificationService.markAllAsRead();
  };

  const clearAlerts = () => {
    NotificationService.clearAlerts();
  };

  return {
    alerts,
    unreadCount,
    unreadAlerts: alerts.filter(a => !a.read),
    markAsRead,
    markAllAsRead,
    clearAlerts
  };
}

export function useAlertMonitoring(commodityData: any, bottlenecks: any, geopoliticalData: any) {
  useEffect(() => {
    if (commodityData) {
      NotificationService.checkPriceAlerts(commodityData);
    }
  }, [commodityData]);

  useEffect(() => {
    if (bottlenecks && Array.isArray(bottlenecks)) {
      NotificationService.checkSupplyChainAlerts(bottlenecks);
    }
  }, [bottlenecks]);

  useEffect(() => {
    if (geopoliticalData) {
      NotificationService.checkGeopoliticalAlerts(geopoliticalData);
    }
  }, [geopoliticalData]);
}
