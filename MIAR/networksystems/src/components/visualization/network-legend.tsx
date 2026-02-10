'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function NetworkLegend() {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Legend</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-zinc-600">High Centrality</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-zinc-600">Medium Centrality</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-zinc-400 rounded-full mr-2"></div>
          <span className="text-sm text-zinc-600">Low Centrality</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-red-400 mr-2"></div>
          <span className="text-sm text-zinc-600">Strong Connection</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-yellow-400 mr-2"></div>
          <span className="text-sm text-zinc-600">Weak Connection</span>
        </div>
      </div>
    </Card>
  );
}