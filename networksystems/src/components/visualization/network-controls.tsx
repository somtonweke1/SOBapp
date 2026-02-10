'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function NetworkControls() {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Network Controls</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Layout Algorithm
          </label>
          <select className="w-full p-2 border border-zinc-300 rounded-md">
            <option>Force Directed</option>
            <option>Hierarchical</option>
            <option>Circular</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Node Size
          </label>
          <input type="range" className="w-full" min="5" max="50" defaultValue="20" />
        </div>
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Reset View
          </button>
          <button className="flex-1 px-3 py-2 border border-zinc-300 text-zinc-700 rounded text-sm hover:bg-zinc-50">
            Export
          </button>
        </div>
      </div>
    </Card>
  );
}