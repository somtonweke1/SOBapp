/**
 * Historical Data Service
 * Track and analyze historical trends for commodities, supply chains, and risks
 */

interface DataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

interface HistoricalSeries {
  id: string;
  type: 'commodity_price' | 'supply_chain_metric' | 'risk_score' | 'economic_indicator';
  name: string;
  data: DataPoint[];
  unit: string;
}

interface TrendAnalysis {
  trend: 'upward' | 'downward' | 'stable' | 'volatile';
  change: number;
  percentChange: number;
  volatility: number;
  prediction?: number;
  confidence?: number;
}

export class HistoricalDataService {
  private static storage = new Map<string, HistoricalSeries>();
  private static readonly MAX_DATA_POINTS = 10000; // Keep last 10k points per series
  private static readonly STORAGE_KEY = 'miar_historical_data';

  /**
   * Initialize service and load from localStorage
   */
  static initialize() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          Object.entries(data).forEach(([key, series]: [string, any]) => {
            // Convert string dates back to Date objects
            series.data = series.data.map((dp: any) => ({
              ...dp,
              timestamp: new Date(dp.timestamp)
            }));
            this.storage.set(key, series);
          });
        } catch (error) {
          console.error('Failed to load historical data:', error);
        }
      }
    }
  }

  /**
   * Record commodity price data point
   */
  static recordCommodityPrice(commodity: string, price: number, metadata?: Record<string, any>) {
    const seriesId = `commodity_${commodity}`;
    this.addDataPoint(seriesId, {
      id: seriesId,
      type: 'commodity_price',
      name: commodity,
      unit: 'USD',
      data: []
    }, price, metadata);
  }

  /**
   * Record supply chain metric
   */
  static recordSupplyChainMetric(metric: string, value: number, metadata?: Record<string, any>) {
    const seriesId = `supply_chain_${metric}`;
    this.addDataPoint(seriesId, {
      id: seriesId,
      type: 'supply_chain_metric',
      name: metric,
      unit: 'index',
      data: []
    }, value, metadata);
  }

  /**
   * Record risk score
   */
  static recordRiskScore(country: string, score: number, metadata?: Record<string, any>) {
    const seriesId = `risk_${country}`;
    this.addDataPoint(seriesId, {
      id: seriesId,
      type: 'risk_score',
      name: country,
      unit: 'score',
      data: []
    }, score, metadata);
  }

  /**
   * Record economic indicator
   */
  static recordEconomicIndicator(indicator: string, value: number, metadata?: Record<string, any>) {
    const seriesId = `economic_${indicator}`;
    this.addDataPoint(seriesId, {
      id: seriesId,
      type: 'economic_indicator',
      name: indicator,
      unit: metadata?.unit || 'index',
      data: []
    }, value, metadata);
  }

  /**
   * Get historical data for a series
   */
  static getHistoricalData(seriesId: string, timeframe?: { start: Date; end: Date }): HistoricalSeries | null {
    const series = this.storage.get(seriesId);
    if (!series) return null;

    if (timeframe) {
      return {
        ...series,
        data: series.data.filter(
          dp => dp.timestamp >= timeframe.start && dp.timestamp <= timeframe.end
        )
      };
    }

    return series;
  }

  /**
   * Get all commodity price history
   */
  static getAllCommodityHistory(timeframe?: { start: Date; end: Date }): Record<string, HistoricalSeries> {
    const result: Record<string, HistoricalSeries> = {};

    this.storage.forEach((series, key) => {
      if (series.type === 'commodity_price') {
        const data = timeframe
          ? series.data.filter(dp => dp.timestamp >= timeframe.start && dp.timestamp <= timeframe.end)
          : series.data;

        result[series.name] = { ...series, data };
      }
    });

    return result;
  }

  /**
   * Analyze trend for a series
   */
  static analyzeTrend(seriesId: string, lookbackDays: number = 30): TrendAnalysis | null {
    const series = this.storage.get(seriesId);
    if (!series || series.data.length < 2) return null;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const recentData = series.data
      .filter(dp => dp.timestamp >= lookbackDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (recentData.length < 2) return null;

    const firstValue = recentData[0].value;
    const lastValue = recentData[recentData.length - 1].value;
    const change = lastValue - firstValue;
    const percentChange = (change / firstValue) * 100;

    // Calculate volatility (standard deviation)
    const values = recentData.map(dp => dp.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);

    // Determine trend
    let trend: TrendAnalysis['trend'];
    const volatilityThreshold = mean * 0.05; // 5% of mean

    if (volatility > volatilityThreshold) {
      trend = 'volatile';
    } else if (percentChange > 2) {
      trend = 'upward';
    } else if (percentChange < -2) {
      trend = 'downward';
    } else {
      trend = 'stable';
    }

    // Simple linear regression for prediction
    const prediction = this.predictNextValue(recentData);

    return {
      trend,
      change,
      percentChange,
      volatility,
      prediction: prediction.value,
      confidence: prediction.confidence
    };
  }

  /**
   * Get data for charting (last N points)
   */
  static getChartData(seriesId: string, limit: number = 100): { x: Date; y: number }[] {
    const series = this.storage.get(seriesId);
    if (!series) return [];

    return series.data
      .slice(-limit)
      .map(dp => ({ x: dp.timestamp, y: dp.value }));
  }

  /**
   * Get multiple series for comparison
   */
  static getComparisonData(seriesIds: string[], limit: number = 100): Record<string, { x: Date; y: number }[]> {
    const result: Record<string, { x: Date; y: number }[]> = {};

    seriesIds.forEach(id => {
      const data = this.getChartData(id, limit);
      if (data.length > 0) {
        result[id] = data;
      }
    });

    return result;
  }

  /**
   * Calculate correlation between two series
   */
  static calculateCorrelation(seriesId1: string, seriesId2: string): number | null {
    const series1 = this.storage.get(seriesId1);
    const series2 = this.storage.get(seriesId2);

    if (!series1 || !series2) return null;

    // Align data points by timestamp (get common timestamps)
    const timestamps1 = new Set(series1.data.map(dp => dp.timestamp.getTime()));
    const alignedData2 = series2.data.filter(dp => timestamps1.has(dp.timestamp.getTime()));

    if (alignedData2.length < 2) return null;

    const values1 = series1.data.map(dp => dp.value);
    const values2 = alignedData2.map(dp => dp.value);

    return this.pearsonCorrelation(values1, values2);
  }

  /**
   * Export historical data as CSV
   */
  static exportToCSV(seriesId: string): string {
    const series = this.storage.get(seriesId);
    if (!series) return '';

    const header = `Timestamp,${series.name},${series.unit}\n`;
    const rows = series.data.map(dp =>
      `${dp.timestamp.toISOString()},${dp.value},${dp.metadata ? JSON.stringify(dp.metadata) : ''}`
    ).join('\n');

    return header + rows;
  }

  /**
   * Clear old data (keep last N days)
   */
  static clearOldData(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.storage.forEach((series, key) => {
      series.data = series.data.filter(dp => dp.timestamp >= cutoffDate);
      this.storage.set(key, series);
    });

    this.persist();
  }

  /**
   * Get summary statistics
   */
  static getSummaryStats(seriesId: string): {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    count: number;
  } | null {
    const series = this.storage.get(seriesId);
    if (!series || series.data.length === 0) return null;

    const values = series.data.map(dp => dp.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const median = count % 2 === 0
      ? (values[count / 2 - 1] + values[count / 2]) / 2
      : values[Math.floor(count / 2)];

    return {
      min: values[0],
      max: values[count - 1],
      mean,
      median,
      stdDev,
      count
    };
  }

  /**
   * Private: Add data point to series
   */
  private static addDataPoint(
    seriesId: string,
    seriesTemplate: HistoricalSeries,
    value: number,
    metadata?: Record<string, any>
  ) {
    let series = this.storage.get(seriesId);

    if (!series) {
      series = { ...seriesTemplate };
    }

    series.data.push({
      timestamp: new Date(),
      value,
      metadata
    });

    // Limit data points
    if (series.data.length > this.MAX_DATA_POINTS) {
      series.data = series.data.slice(-this.MAX_DATA_POINTS);
    }

    this.storage.set(seriesId, series);
    this.persist();
  }

  /**
   * Private: Simple linear regression prediction
   */
  private static predictNextValue(data: DataPoint[]): { value: number; confidence: number } {
    const n = data.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = data.map(dp => dp.value);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextX = n;
    const prediction = slope * nextX + intercept;

    // Calculate R² for confidence
    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssPredicted = xValues.reduce((sum, x, i) => {
      const predicted = slope * x + intercept;
      return sum + Math.pow(yValues[i] - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssPredicted / ssTotal);
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    return { value: prediction, confidence };
  }

  /**
   * Private: Pearson correlation coefficient
   */
  private static pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Private: Persist to localStorage
   */
  private static persist() {
    if (typeof window !== 'undefined') {
      const data: Record<string, any> = {};
      this.storage.forEach((series, key) => {
        data[key] = series;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  HistoricalDataService.initialize();
}

export default HistoricalDataService;
