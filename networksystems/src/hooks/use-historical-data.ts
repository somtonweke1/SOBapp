/**
 * React Hook for Historical Data
 * Track and analyze historical trends
 */

import { useState, useEffect } from 'react';
import HistoricalDataService from '@/services/historical-data-service';

export function useHistoricalTracking(commodityData: any) {
  useEffect(() => {
    if (commodityData) {
      Object.entries(commodityData).forEach(([commodity, data]: [string, any]) => {
        if (data.current || data.price) {
          HistoricalDataService.recordCommodityPrice(
            commodity,
            data.current || data.price,
            { source: data.source, volume: data.volume }
          );
        }
      });
    }
  }, [commodityData]);
}

export function useCommodityHistory(commodity: string, timeframeDays: number = 30) {
  const [history, setHistory] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const seriesId = `commodity_${commodity}`;

    // Get historical data
    const historicalData = HistoricalDataService.getHistoricalData(seriesId);
    setHistory(historicalData);

    // Get trend analysis
    const trendAnalysis = HistoricalDataService.analyzeTrend(seriesId, timeframeDays);
    setTrend(trendAnalysis);

    // Get chart data
    const chart = HistoricalDataService.getChartData(seriesId, 100);
    setChartData(chart);
  }, [commodity, timeframeDays]);

  return { history, trend, chartData };
}

export function useHistoricalComparison(commodities: string[]) {
  const [comparisonData, setComparisonData] = useState<Record<string, any>>({});

  useEffect(() => {
    const seriesIds = commodities.map(c => `commodity_${c}`);
    const data = HistoricalDataService.getComparisonData(seriesIds, 100);
    setComparisonData(data);
  }, [commodities]);

  return comparisonData;
}
