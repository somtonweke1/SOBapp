'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface TemporalAnalysisProps {
  data?: any[];
  width?: number;
  height?: number;
  networkHistory?: any[];
  showEvolution?: boolean;
  animationSpeed?: number;
}

const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({
  data = [],
  width = 800,
  height = 400,
  networkHistory = [],
  showEvolution = true,
  animationSpeed = 1000
}) => {
  const generateMockData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      networks: Math.floor(Math.random() * 10) + 5,
      connections: Math.floor(Math.random() * 50) + 25,
      efficiency: Math.random() * 0.3 + 0.7
    }));
  };

  const mockData = data.length > 0 ? data : generateMockData();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Temporal Network Analysis</h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium text-blue-800">Peak Activity</h4>
            <p className="text-2xl font-bold text-blue-600">
              {Math.max(...mockData.map(d => d.networks))}
            </p>
            <p className="text-sm text-blue-600">networks</p>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium text-green-800">Avg Connections</h4>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(mockData.reduce((sum, d) => sum + d.connections, 0) / mockData.length)}
            </p>
            <p className="text-sm text-green-600">per month</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded">
            <h4 className="font-medium text-emerald-800">Avg Efficiency</h4>
            <p className="text-2xl font-bold text-emerald-600">
              {(mockData.reduce((sum, d) => sum + d.efficiency, 0) / mockData.length * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-emerald-600">network efficiency</p>
          </div>
        </div>

        <div className="bg-zinc-50 p-4 rounded" style={{ height: height / 2 }}>
          <h4 className="font-medium mb-4">Network Growth Timeline</h4>
          <div className="flex items-end justify-between h-32">
            {mockData.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="bg-blue-500 rounded-t"
                  style={{
                    width: '20px',
                    height: `${(item.networks / Math.max(...mockData.map(d => d.networks))) * 100}px`,
                    minHeight: '10px'
                  }}
                />
                <span className="text-xs mt-2 text-zinc-600">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 p-4 rounded">
          <h4 className="font-medium mb-4">Trending Patterns</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Network Formation Rate</span>
              <span className="text-sm font-medium text-green-600">↗ +12%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Connection Density</span>
              <span className="text-sm font-medium text-blue-600">→ Stable</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Efficiency Score</span>
              <span className="text-sm font-medium text-emerald-600">↗ +8%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TemporalAnalysis;

// Export for backward compatibility
export { TemporalAnalysis };