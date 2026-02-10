'use client';

import React from 'react';
import { AlertTriangle, Target, Database, TrendingUp, Activity, Zap } from 'lucide-react';
import { useUnifiedPlatform } from '@/stores/unified-platform-store';
import Link from 'next/link';

export default function PlatformMetricsBar() {
  const { metrics, isLiveMonitoring } = useUnifiedPlatform();

  return (
    <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl shadow-xl shadow-zinc-200/20 p-6 mb-6">
      <div className="flex items-center justify-between">
        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-zinc-200/50 shadow-sm">
            <Activity className={`w-4 h-4 ${isLiveMonitoring ? 'text-emerald-600 animate-pulse' : 'text-zinc-400'}`} />
            <span className="text-sm font-light text-zinc-900">
              {isLiveMonitoring ? 'Live Monitoring' : 'Monitoring Paused'}
            </span>
          </div>
        </div>

        {/* Platform Metrics */}
        <div className="flex items-center gap-3">
          {/* Critical Alerts */}
          {metrics.criticalAlerts > 0 && (
            <Link
              href="/decision-center"
              className="group flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-xl hover:border-rose-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="p-2 bg-rose-50/50 rounded-lg group-hover:bg-rose-100/50 transition-colors">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <div className="text-xs font-light text-zinc-600 uppercase tracking-wide">Critical Alerts</div>
                <div className="text-2xl font-extralight text-rose-600">{metrics.criticalAlerts}</div>
              </div>
            </Link>
          )}

          {/* Pending Decisions */}
          {metrics.pendingDecisions > 0 && (
            <Link
              href="/decision-center"
              className="group flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="p-2 bg-blue-50/50 rounded-lg group-hover:bg-blue-100/50 transition-colors">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-light text-zinc-600 uppercase tracking-wide">Decisions Pending</div>
                <div className="text-2xl font-extralight text-blue-600">{metrics.pendingDecisions}</div>
              </div>
            </Link>
          )}

          {/* Total Exposure */}
          {metrics.totalExposure > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-xl shadow-sm">
              <div className="p-2 bg-amber-50/50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-light text-zinc-600 uppercase tracking-wide">Total Exposure</div>
                <div className="text-2xl font-extralight text-amber-600">
                  ${(metrics.totalExposure / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          )}

          {/* Datasets Loaded */}
          {metrics.datasetsLoaded > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-xl shadow-sm">
              <div className="p-2 bg-emerald-50/50 rounded-lg">
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-light text-zinc-600 uppercase tracking-wide">Datasets Loaded</div>
                <div className="text-2xl font-extralight text-emerald-600">{metrics.datasetsLoaded}</div>
              </div>
            </div>
          )}

          {/* Constraints Monitored */}
          {metrics.constraintsMonitored > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-zinc-200/50 rounded-xl shadow-sm">
              <div className="p-2 bg-blue-50/50 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-light text-zinc-600 uppercase tracking-wide">Active Constraints</div>
                <div className="text-2xl font-extralight text-blue-600">{metrics.constraintsMonitored}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
