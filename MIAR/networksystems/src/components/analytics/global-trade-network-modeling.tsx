'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useShippingData, useMarketIntelligence } from '@/hooks/use-live-data';
import {
  Ship,
  Anchor,
  AlertTriangle,
  TrendingUp,
  Navigation,
  Globe,
  Clock,
  MapPin,
  Activity,
  Zap
} from 'lucide-react';

interface TradePort {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  capacity: number;
  utilization: number;
  throughput: number;
  status: 'operational' | 'congested' | 'disrupted';
  commodities: string[];
}

interface ShippingRoute {
  id: string;
  source: string;
  target: string;
  distance: number;
  transitTime: number;
  capacity: number;
  currentLoad: number;
  risk: 'low' | 'medium' | 'high';
  status: 'active' | 'delayed' | 'blocked';
}

interface TradeFlow {
  commodity: string;
  volume: number;
  value: number;
  route: string;
  destination: string;
}

const GlobalTradeNetworkModeling: React.FC = () => {
  const [ports, setPorts] = useState<TradePort[]>([]);
  const [routes, setRoutes] = useState<ShippingRoute[]>([]);
  const [tradeFlows, setTradeFlows] = useState<TradeFlow[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Live data hooks
  const { data: shippingData, lastUpdated: shippingUpdated } = useShippingData();
  const { data: marketIntel } = useMarketIntelligence();

  useEffect(() => {
    const tradePorts: TradePort[] = [
      {
        id: 'durban',
        name: 'Durban Port',
        location: { lat: -29.8587, lng: 31.0218 },
        capacity: 2.9,
        utilization: 87,
        throughput: 65.2,
        status: 'operational',
        commodities: ['Gold', 'Coal', 'Iron Ore']
      },
      {
        id: 'cape_town',
        name: 'Cape Town Port',
        location: { lat: -33.9249, lng: 18.4241 },
        capacity: 1.2,
        utilization: 72,
        throughput: 28.4,
        status: 'operational',
        commodities: ['Diamonds', 'Fruit', 'Wine']
      },
      {
        id: 'lagos',
        name: 'Lagos Port',
        location: { lat: 6.4474, lng: 3.3903 },
        capacity: 1.5,
        utilization: 94,
        throughput: 42.1,
        status: 'congested',
        commodities: ['Oil', 'Cocoa', 'Minerals']
      }
    ];

    const shippingRoutes: ShippingRoute[] = [
      {
        id: 'suez_route',
        source: 'durban',
        target: 'rotterdam',
        distance: 6850,
        transitTime: 18,
        capacity: 45,
        currentLoad: 87,
        risk: 'medium',
        status: 'active'
      },
      {
        id: 'cape_route',
        source: 'cape_town',
        target: 'rotterdam',
        distance: 8200,
        transitTime: 22,
        capacity: 38,
        currentLoad: 65,
        risk: 'low',
        status: 'active'
      }
    ];

    const flows: TradeFlow[] = [
      {
        commodity: 'Iron Ore',
        volume: 125.4,
        value: 8.2,
        route: 'cape_route',
        destination: 'China'
      },
      {
        commodity: 'Gold',
        volume: 0.8,
        value: 62.1,
        route: 'suez_route',
        destination: 'Europe'
      }
    ];

    setPorts(tradePorts);
    setRoutes(shippingRoutes);
    setTradeFlows(flows);

    // Live data is now handled by the useShippingData hook
    // No need for manual intervals
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Global Trade Network Modeling</h2>
              <p className="text-sm text-zinc-500 mt-2 font-light">Physical trade routes and supply chain intelligence</p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-xl font-light text-zinc-900">
                  {shippingData ?
                    shippingData.ports.reduce((acc: number, port: any) => acc + port.cargo_processed, 0).toFixed(1) :
                    '847.3'
                  }M
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Tonnes Processed</div>
                {shippingUpdated && (
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-500">Live</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-emerald-600">
                  {shippingData && shippingData.routes[0] ?
                    (100 - (shippingData.routes[0].transit_time - 18) * 2).toFixed(1) :
                    '94.2'
                  }%
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Route Efficiency</div>
                {shippingData && shippingData.routes[0] && shippingData.routes[0].congestion_level === 'high' && (
                  <div className="text-xs text-amber-500 mt-1">High Congestion</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-blue-600">
                  {shippingData ? shippingData.ports.length : '6'}
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Active Ports</div>
                {shippingUpdated && (
                  <div className="text-xs text-zinc-500 mt-1">
                    Updated {shippingUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-amber-500">
                  {shippingData ?
                    shippingData.ports.filter((port: any) => port.delays > 0).length :
                    '2'
                  }
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Delay Alerts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Shipping Routes Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {routes.map((route, idx) => (
                <div
                  key={route.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRoute === route.id
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-900">{route.source} → {route.target}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        route.status === 'active' ? 'bg-emerald-500' :
                        route.status === 'delayed' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      <span className="text-xs text-zinc-500">{route.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Load:</span>
                      <span className="font-medium ml-1">{route.currentLoad}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Transit:</span>
                      <span className="font-medium ml-1">{route.transitTime}d</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Risk:</span>
                      <span className={`font-medium ml-1 ${
                        route.risk === 'high' ? 'text-rose-600' :
                        route.risk === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{route.risk}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-6 py-4">
            <h3 className="text-lg font-light text-zinc-900">Trade Flows</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tradeFlows.map((flow, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-900">{flow.commodity}</span>
                    <span className="text-sm font-bold text-emerald-600">${flow.value.toFixed(1)}B</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Volume:</span>
                      <span className="font-medium ml-1">{flow.volume}MT</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Destination:</span>
                      <span className="font-medium ml-1">{flow.destination}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="border-b border-zinc-200/50 px-8 py-6">
          <h3 className="text-xl font-extralight text-zinc-900 tracking-tight">Route Intelligence</h3>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-rose-50/50 to-rose-100/30 rounded-xl p-6 border border-rose-200/30">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-light">URGENT</span>
              </div>
              <h4 className="font-light text-zinc-900 mb-2">Suez Canal Delays</h4>
              <p className="text-sm text-zinc-600 mb-4 font-light">8-day backlog detected</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Cost Impact:</span>
                <span className="font-light text-rose-600">+$2.3M</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-xl p-6 border border-amber-200/30">
              <div className="flex items-center justify-between mb-4">
                <Navigation className="h-5 w-5 text-amber-500" />
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-light">OPTIMIZE</span>
              </div>
              <h4 className="font-light text-zinc-900 mb-2">Port Capacity Alert</h4>
              <p className="text-sm text-zinc-600 mb-4 font-light">Shanghai reaching 94% capacity</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Time Saved:</span>
                <span className="font-light text-amber-600">3 days</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-xl p-6 border border-emerald-200/30">
              <div className="flex items-center justify-between mb-4">
                <Ship className="h-5 w-5 text-emerald-500" />
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-light">OPPORTUNITY</span>
              </div>
              <h4 className="font-light text-zinc-900 mb-2">New Route Available</h4>
              <p className="text-sm text-zinc-600 mb-4 font-light">Mozambique port opening Q2 2025</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Annual Savings:</span>
                <span className="font-light text-emerald-600">$45M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTradeNetworkModeling;