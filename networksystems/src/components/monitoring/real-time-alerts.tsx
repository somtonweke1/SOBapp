'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, BarChart3 } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  priority: number;
  metadata?: any;
}

export default function RealTimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'unacknowledged'>('all');

  // Simulate real-time alerts
  useEffect(() => {
    const generateAlert = (): Alert => {
      const alertTypes = [
        {
          type: 'critical' as const,
          titles: ['Equipment Failure', 'Safety Violation', 'Environmental Breach', 'Production Stoppage'],
          sources: ['CRUSHER-001', 'CONVEYOR-003', 'TRUCK-047', 'MILL-002'],
          priority: 1
        },
        {
          type: 'warning' as const,
          titles: ['Maintenance Due', 'Performance Degradation', 'Resource Shortage', 'Weather Alert'],
          sources: ['Asset Monitor', 'Production System', 'Supply Chain', 'Weather Service'],
          priority: 2
        },
        {
          type: 'info' as const,
          titles: ['Status Update', 'Scheduled Maintenance', 'Report Generated', 'System Backup'],
          sources: ['System', 'Maintenance Scheduler', 'Report Generator', 'Backup Service'],
          priority: 3
        }
      ];

      const category = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const title = category.titles[Math.floor(Math.random() * category.titles.length)];
      const source = category.sources[Math.floor(Math.random() * category.sources.length)];

      return {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: category.type,
        title,
        message: generateAlertMessage(category.type, title, source),
        timestamp: new Date().toISOString(),
        source,
        acknowledged: false,
        priority: category.priority,
        metadata: generateMetadata(category.type, source)
      };
    };

    const generateAlertMessage = (type: string, title: string, source: string): string => {
      const messages = {
        critical: [
          `${source} has experienced a critical failure requiring immediate attention.`,
          `Emergency shutdown triggered at ${source}. Operations halted.`,
          `Critical safety threshold exceeded at ${source}. Evacuating area.`
        ],
        warning: [
          `${source} performance degrading. Maintenance recommended within 24 hours.`,
          `Resource levels at ${source} approaching critical threshold.`,
          `Scheduled maintenance for ${source} due in 48 hours.`
        ],
        info: [
          `${source} operating within normal parameters.`,
          `Routine status update from ${source}.`,
          `Scheduled operation completed at ${source}.`
        ]
      };
      return messages[type as keyof typeof messages][Math.floor(Math.random() * 3)];
    };

    const generateMetadata = (type: string, source: string) => {
      if (type === 'critical') {
        return {
          estimatedDowntime: '2-4 hours',
          financialImpact: '$' + (Math.random() * 100000 + 50000).toFixed(0),
          affectedSystems: Math.floor(Math.random() * 5) + 1,
          emergencyContacts: ['Emergency Response Team', 'Site Manager', 'Safety Officer']
        };
      }
      return {
        severity: Math.floor(Math.random() * 10) + 1,
        autoResolved: Math.random() > 0.7
      };
    };

    // Initial alerts
    const initialAlerts = Array.from({ length: 8 }, () => ({
      ...generateAlert(),
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      acknowledged: Math.random() > 0.6
    }));
    setAlerts(initialAlerts);

    // Real-time alert generation
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 5 seconds
        setAlerts(prev => [generateAlert(), ...prev.slice(0, 49)]); // Keep max 50 alerts
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      switch (filter) {
        case 'critical':
          return alert.type === 'critical';
        case 'warning':
          return alert.type === 'warning';
        case 'unacknowledged':
          return !alert.acknowledged;
        default:
          return true;
      }
    }).sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      return a.priority - b.priority || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const getAlertColor = (type: string, acknowledged: boolean) => {
    if (acknowledged) return 'border-gray-300 bg-gray-50';

    switch (type) {
      case 'critical': return 'border-rose-500 bg-rose-50';
      case 'warning': return 'border-amber-500 bg-amber-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      case 'success': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length;
  const warningCount = alerts.filter(a => a.type === 'warning' && !a.acknowledged).length;

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-rose-50 border-rose-200">
          <div className="flex items-center">
            <div className="text-2xl mr-2">🚨</div>
            <div>
              <div className="text-lg font-semibold text-rose-700">{criticalCount}</div>
              <div className="text-sm text-rose-600">Critical</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-amber-600" />
            <div>
              <div className="text-lg font-semibold text-amber-700">{warningCount}</div>
              <div className="text-sm text-amber-600">Warnings</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            <div>
              <div className="text-lg font-semibold text-blue-700">{alerts.length}</div>
              <div className="text-sm text-blue-600">Total Alerts</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
            <div>
              <div className="text-lg font-semibold text-green-700">{alerts.filter(a => a.acknowledged).length}</div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-4">
        {['all', 'critical', 'warning', 'unacknowledged'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f as any)}
            className="capitalize"
          >
            {f === 'unacknowledged' ? 'Unresolved' : f}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {getFilteredAlerts().map(alert => (
          <Card
            key={alert.id}
            className={`p-4 border-l-4 ${getAlertColor(alert.type, alert.acknowledged)} ${!alert.acknowledged ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-lg">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-semibold ${alert.acknowledged ? 'text-gray-600' : 'text-gray-900'}`}>
                      {alert.title}
                    </h4>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{alert.source}</span>
                    {!alert.acknowledged && (
                      <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded">ACTIVE</span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${alert.acknowledged ? 'text-gray-500' : 'text-gray-700'}`}>
                    {alert.message}
                  </p>
                  {alert.metadata && alert.type === 'critical' && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                      <div>Impact: {alert.metadata.financialImpact} • Downtime: {alert.metadata.estimatedDowntime}</div>
                      <div>Affected Systems: {alert.metadata.affectedSystems}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-2">{formatTimestamp(alert.timestamp)}</div>
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-xs"
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {getFilteredAlerts().length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <div className="text-2xl mb-2">🎉</div>
          <div>No {filter === 'all' ? '' : filter} alerts at this time</div>
        </Card>
      )}
    </div>
  );
}