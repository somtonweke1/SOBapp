'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function AnalysisPanel() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Network Analysis</h2>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900">Centrality Analysis</h3>
          <p className="text-blue-700 text-sm">Analyze node importance using various centrality measures</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900">Network Metrics</h3>
          <p className="text-green-700 text-sm">Calculate network-level statistics and properties</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg">
          <h3 className="font-semibold text-emerald-900">Visualization</h3>
          <p className="text-emerald-700 text-sm">Interactive network visualization and exploration</p>
        </div>
      </div>
    </Card>
  );
}
export default AnalysisPanel;
