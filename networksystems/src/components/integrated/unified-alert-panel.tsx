'use client';

import React, { useState } from 'react';
import { AlertTriangle, Bell, X, ChevronRight, Target, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUnifiedPlatform } from '@/stores/unified-platform-store';
import Link from 'next/link';

export default function UnifiedAlertPanel() {
  const { notifications, dismissNotification, metrics } = useUnifiedPlatform();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeNotifications = notifications.filter(n => {
    // Auto-dismiss old non-critical notifications after 1 hour
    const hoursSince = (Date.now() - new Date(n.timestamp).getTime()) / (1000 * 60 * 60);
    if (n.severity === 'low' || n.severity === 'medium') {
      return hoursSince < 1;
    }
    return true;
  });

  const criticalCount = activeNotifications.filter(n => n.severity === 'critical').length;

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed View - Alert Badge */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="relative bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full p-4 shadow-2xl hover:shadow-rose-500/50 transition-all hover:scale-110"
        >
          <Bell className="w-6 h-6" />
          {activeNotifications.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-white text-rose-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-rose-500">
              {activeNotifications.length}
            </div>
          )}
          {criticalCount > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-3 h-3 animate-pulse"></div>
          )}
        </button>
      )}

      {/* Expanded View - Alert Panel */}
      {isExpanded && (
        <Card className="w-96 max-h-[600px] flex flex-col shadow-2xl border-2 border-zinc-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Live Platform Alerts</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="hover:bg-white/20 rounded p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm">
                <div className="text-xs text-blue-100">Critical</div>
                <div className="text-lg font-bold">{criticalCount}</div>
              </div>
              <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm">
                <div className="text-xs text-blue-100">Decisions</div>
                <div className="text-lg font-bold">{metrics.pendingDecisions}</div>
              </div>
              <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm">
                <div className="text-xs text-blue-100">Exposure</div>
                <div className="text-lg font-bold">${(metrics.totalExposure / 1000000).toFixed(1)}M</div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 rounded-r-lg p-3 ${
                  notification.severity === 'critical'
                    ? 'border-rose-500 bg-rose-50'
                    : notification.severity === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : notification.severity === 'medium'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-blue-500 bg-blue-50'
                } hover:shadow-md transition-shadow cursor-pointer group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.type === 'constraint' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      {notification.type === 'decision' && <Target className="w-4 h-4 text-blue-600" />}
                      {notification.type === 'market' && <DollarSign className="w-4 h-4 text-emerald-600" />}
                      <span className={`text-xs font-bold uppercase ${
                        notification.severity === 'critical' ? 'text-rose-700' :
                        notification.severity === 'high' ? 'text-orange-700' :
                        notification.severity === 'medium' ? 'text-amber-700' :
                        'text-blue-700'
                      }`}>
                        {notification.severity}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <h4 className="font-semibold text-zinc-900 text-sm mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {notification.message}
                    </p>

                    {notification.actionRequired && notification.relatedComponent && (
                      <Link
                        href={notification.relatedComponent === 'decision-center' ? '/decision-center' : `/${notification.relatedComponent}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Take Action
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <X className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer - View All */}
          <div className="border-t p-3">
            <Link href="/decision-center">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                View Decision Center
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
