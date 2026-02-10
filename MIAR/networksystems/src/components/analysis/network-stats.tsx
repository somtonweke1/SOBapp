'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function NetworkStats() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Network Statistics</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-zinc-600">Nodes:</span>
          <span className="font-semibold">156</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-600">Edges:</span>
          <span className="font-semibold">1,247</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-600">Density:</span>
          <span className="font-semibold">0.103</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-600">Avg Path Length:</span>
          <span className="font-semibold">3.2</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-600">Clustering:</span>
          <span className="font-semibold">0.45</span>
        </div>
      </div>
    </Card>
  );
}
export default NetworkStats;
