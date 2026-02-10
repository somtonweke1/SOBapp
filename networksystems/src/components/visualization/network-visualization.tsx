'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function NetworkVisualization() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Network Visualization</h2>
      <div className="bg-zinc-100 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <div className="text-4xl mb-2">🕸️</div>
          <p>Interactive network visualization will appear here</p>
          <p className="text-sm mt-2">Upload your network data to get started</p>
        </div>
      </div>
    </Card>
  );
}

export default NetworkVisualization;