/**
 * Enhanced Data Sources Service
 * Integrates FRED API for economic indicators and World Bank for geopolitical risk
 */

// ============================================================================
// FRED (Federal Reserve Economic Data) API Integration
// ============================================================================

export interface EconomicIndicator {
  indicator: string;
  value: number;
  unit: string;
  date: Date;
  change: number;
  source: 'fred' | 'worldbank' | 'estimate';
}

export class FREDDataService {
  // Note: FRED requires free API key from https://fred.stlouisfed.org/docs/api/api_key.html
  private static readonly API_KEY = process.env.NEXT_PUBLIC_FRED_API_KEY || 'demo';
  private static readonly BASE_URL = 'https://api.stlouisfed.org/fred';

  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 3600000; // 1 hour

  /**
   * Get key economic indicators affecting mining sector
   */
  static async getEconomicIndicators(): Promise<Record<string, EconomicIndicator>> {
    const cached = this.cache.get('economic_indicators');
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Key indicators for mining sector
      const indicators = {
        'DGS10': { name: 'treasury_10y', unit: '%', description: '10-Year Treasury Rate' },
        'DCOILWTICO': { name: 'oil_wti', unit: 'USD/barrel', description: 'WTI Crude Oil' },
        'DEXUSEU': { name: 'usd_eur', unit: 'rate', description: 'USD/EUR Exchange Rate' },
        'CPILFESL': { name: 'core_cpi', unit: 'index', description: 'Core CPI' },
        'UMCSENT': { name: 'consumer_sentiment', unit: 'index', description: 'Consumer Sentiment' },
        'INDPRO': { name: 'industrial_production', unit: 'index', description: 'Industrial Production' }
      };

      const results: Record<string, EconomicIndicator> = {};

      // Fetch each indicator
      for (const [seriesId, config] of Object.entries(indicators)) {
        try {
          const url = `${this.BASE_URL}/series/observations?series_id=${seriesId}&api_key=${this.API_KEY}&file_type=json&sort_order=desc&limit=2`;

          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();

            if (data.observations && data.observations.length >= 2) {
              const latest = data.observations[0];
              const previous = data.observations[1];

              const currentValue = parseFloat(latest.value);
              const previousValue = parseFloat(previous.value);
              const change = ((currentValue - previousValue) / previousValue) * 100;

              results[config.name] = {
                indicator: config.description,
                value: currentValue,
                unit: config.unit,
                date: new Date(latest.date),
                change: change,
                source: 'fred'
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${seriesId}:`, error);
          // Use fallback data
          results[config.name] = this.getFallbackIndicator(config.name, config.description, config.unit);
        }
      }

      // Add mining-specific indicators
      results['copper_demand_index'] = {
        indicator: 'Copper Demand Index',
        value: 102.3,
        unit: 'index',
        date: new Date(),
        change: 2.1,
        source: 'estimate'
      };

      results['renewable_energy_growth'] = {
        indicator: 'Renewable Energy Growth',
        value: 15.2,
        unit: '%',
        date: new Date(),
        change: 1.8,
        source: 'estimate'
      };

      this.cache.set('economic_indicators', {
        data: results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('FRED API error:', error);
      return this.getFallbackEconomicData();
    }
  }

  private static getFallbackIndicator(name: string, description: string, unit: string): EconomicIndicator {
    const fallbackValues: Record<string, number> = {
      'treasury_10y': 4.25,
      'oil_wti': 82.50,
      'usd_eur': 1.085,
      'core_cpi': 306.5,
      'consumer_sentiment': 68.2,
      'industrial_production': 103.8
    };

    return {
      indicator: description,
      value: fallbackValues[name] || 100,
      unit: unit,
      date: new Date(),
      change: (Math.random() - 0.5) * 2,
      source: 'estimate'
    };
  }

  private static getFallbackEconomicData(): Record<string, EconomicIndicator> {
    return {
      'treasury_10y': this.getFallbackIndicator('treasury_10y', '10-Year Treasury Rate', '%'),
      'oil_wti': this.getFallbackIndicator('oil_wti', 'WTI Crude Oil', 'USD/barrel'),
      'usd_eur': this.getFallbackIndicator('usd_eur', 'USD/EUR Exchange Rate', 'rate'),
      'core_cpi': this.getFallbackIndicator('core_cpi', 'Core CPI', 'index'),
      'consumer_sentiment': this.getFallbackIndicator('consumer_sentiment', 'Consumer Sentiment', 'index'),
      'industrial_production': this.getFallbackIndicator('industrial_production', 'Industrial Production', 'index')
    };
  }
}

// ============================================================================
// World Bank Geopolitical Risk Data
// ============================================================================

export interface GeopoliticalRiskData {
  country: string;
  region: string;
  overallRisk: number; // 0-100
  categories: {
    political: number;
    economic: number;
    security: number;
    regulatory: number;
    infrastructure: number;
  };
  trends: {
    shortTerm: 'improving' | 'stable' | 'deteriorating';
    mediumTerm: 'improving' | 'stable' | 'deteriorating';
  };
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    date: Date;
  }>;
  lastUpdated: Date;
  source: 'worldbank' | 'estimate';
}

export class WorldBankGeopoliticalService {
  // World Bank Governance Indicators API
  private static readonly BASE_URL = 'https://api.worldbank.org/v2';

  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 86400000; // 24 hours (geopolitical data updates slowly)

  /**
   * Get geopolitical risk assessment for mining regions
   */
  static async getGeopoliticalRisk(countryCode: string): Promise<GeopoliticalRiskData> {
    const cacheKey = `geopolitical_${countryCode}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // World Bank Governance Indicators
      // Indicators: Political Stability, Government Effectiveness, Regulatory Quality, Rule of Law, Control of Corruption
      const indicators = ['PV.EST', 'GE.EST', 'RQ.EST', 'RL.EST', 'CC.EST'];

      const url = `${this.BASE_URL}/country/${countryCode}/indicator/${indicators.join(';')}?format=json&date=2023&per_page=100`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
          const indicatorData = data[1];

          // Process World Bank data into risk scores
          const riskData = this.processWorldBankData(countryCode, indicatorData);

          this.cache.set(cacheKey, {
            data: riskData,
            timestamp: Date.now()
          });

          return riskData;
        }
      }

      // If API fails, return estimated data
      return this.getEstimatedRiskData(countryCode);
    } catch (error) {
      console.error(`World Bank API error for ${countryCode}:`, error);
      return this.getEstimatedRiskData(countryCode);
    }
  }

  /**
   * Get risk assessments for all major mining regions
   */
  static async getMiningRegionsRisk(): Promise<Record<string, GeopoliticalRiskData>> {
    const regions = {
      'ZAF': 'South Africa',
      'COD': 'DRC',
      'ZMB': 'Zambia',
      'GHA': 'Ghana',
      'CHL': 'Chile',
      'PER': 'Peru',
      'AUS': 'Australia',
      'CAN': 'Canada'
    };

    const results: Record<string, GeopoliticalRiskData> = {};

    for (const [code, name] of Object.entries(regions)) {
      results[name.toLowerCase().replace(/ /g, '_')] = await this.getGeopoliticalRisk(code);
    }

    return results;
  }

  private static processWorldBankData(countryCode: string, indicatorData: any[]): GeopoliticalRiskData {
    // World Bank indicators range from -2.5 (worst) to 2.5 (best)
    // Convert to 0-100 scale where lower is better (risk scale)

    const convertToRisk = (wbScore: number | null): number => {
      if (wbScore === null) return 50; // Unknown = medium risk
      // Convert -2.5 to 2.5 scale to 0-100 risk scale (inverted)
      return Math.round(((2.5 - wbScore) / 5) * 100);
    };

    const scores = {
      political: 50,
      economic: 50,
      security: 50,
      regulatory: 50,
      infrastructure: 50
    };

    indicatorData.forEach((item: any) => {
      const value = item.value;
      const indicator = item.indicator.id;

      if (indicator === 'PV.EST') scores.political = convertToRisk(value);
      if (indicator === 'GE.EST') scores.economic = convertToRisk(value);
      if (indicator === 'RQ.EST') scores.regulatory = convertToRisk(value);
      if (indicator === 'RL.EST') scores.security = convertToRisk(value);
      if (indicator === 'CC.EST') scores.infrastructure = convertToRisk(value);
    });

    const overallRisk = Math.round(
      (scores.political + scores.economic + scores.security + scores.regulatory + scores.infrastructure) / 5
    );

    return {
      country: countryCode,
      region: this.getRegionName(countryCode),
      overallRisk,
      categories: scores,
      trends: {
        shortTerm: overallRisk > 60 ? 'deteriorating' : overallRisk < 40 ? 'improving' : 'stable',
        mediumTerm: 'stable'
      },
      alerts: this.generateAlerts(countryCode, scores),
      lastUpdated: new Date(),
      source: 'worldbank'
    };
  }

  private static getEstimatedRiskData(countryCode: string): GeopoliticalRiskData {
    // Estimated risk profiles for major mining regions
    const riskProfiles: Record<string, Partial<GeopoliticalRiskData>> = {
      'ZAF': { overallRisk: 55, region: 'Southern Africa' },
      'COD': { overallRisk: 75, region: 'Central Africa' },
      'ZMB': { overallRisk: 45, region: 'Southern Africa' },
      'GHA': { overallRisk: 35, region: 'West Africa' },
      'CHL': { overallRisk: 30, region: 'South America' },
      'PER': { overallRisk: 40, region: 'South America' },
      'AUS': { overallRisk: 15, region: 'Oceania' },
      'CAN': { overallRisk: 12, region: 'North America' }
    };

    const profile = riskProfiles[countryCode] || { overallRisk: 50, region: 'Unknown' };

    return {
      country: countryCode,
      region: profile.region!,
      overallRisk: profile.overallRisk!,
      categories: {
        political: profile.overallRisk! + (Math.random() - 0.5) * 10,
        economic: profile.overallRisk! + (Math.random() - 0.5) * 10,
        security: profile.overallRisk! + (Math.random() - 0.5) * 10,
        regulatory: profile.overallRisk! + (Math.random() - 0.5) * 10,
        infrastructure: profile.overallRisk! + (Math.random() - 0.5) * 10
      },
      trends: {
        shortTerm: profile.overallRisk! > 60 ? 'deteriorating' : profile.overallRisk! < 40 ? 'improving' : 'stable',
        mediumTerm: 'stable'
      },
      alerts: this.generateAlerts(countryCode, {
        political: profile.overallRisk!,
        economic: profile.overallRisk!,
        security: profile.overallRisk!,
        regulatory: profile.overallRisk!,
        infrastructure: profile.overallRisk!
      }),
      lastUpdated: new Date(),
      source: 'estimate'
    };
  }

  private static getRegionName(countryCode: string): string {
    const regions: Record<string, string> = {
      'ZAF': 'Southern Africa',
      'COD': 'Central Africa',
      'ZMB': 'Southern Africa',
      'GHA': 'West Africa',
      'CHL': 'South America',
      'PER': 'South America',
      'AUS': 'Oceania',
      'CAN': 'North America'
    };
    return regions[countryCode] || 'Unknown';
  }

  private static generateAlerts(countryCode: string, scores: Record<string, number>): Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    date: Date;
  }> {
    const alerts = [];

    // Generate alerts based on risk scores
    if (scores.political > 70) {
      alerts.push({
        severity: 'high' as const,
        category: 'political',
        description: 'Political instability risk elevated - monitor election cycles and policy changes',
        date: new Date()
      });
    }

    if (scores.security > 65) {
      alerts.push({
        severity: scores.security > 75 ? 'critical' as const : 'high' as const,
        category: 'security',
        description: 'Security concerns affecting mining operations - review supply chain protection',
        date: new Date()
      });
    }

    if (scores.regulatory > 60) {
      alerts.push({
        severity: 'medium' as const,
        category: 'regulatory',
        description: 'Regulatory environment uncertainty - track licensing and export policy changes',
        date: new Date()
      });
    }

    return alerts;
  }
}

// ============================================================================
// Combined Enhanced Data Service
// ============================================================================

export class EnhancedDataService {
  /**
   * Get comprehensive market and risk intelligence
   */
  static async getComprehensiveIntelligence() {
    const [economic, geopolitical] = await Promise.all([
      FREDDataService.getEconomicIndicators(),
      WorldBankGeopoliticalService.getMiningRegionsRisk()
    ]);

    return {
      economic,
      geopolitical,
      timestamp: new Date(),
      sources: {
        fred: 'Federal Reserve Economic Data',
        worldbank: 'World Bank Governance Indicators'
      }
    };
  }

  /**
   * Calculate supply chain vulnerability index using all data sources
   */
  static calculateSupplyChainVulnerability(
    commodity: string,
    primarySource: string
  ): {
    score: number;
    factors: Record<string, number>;
    recommendation: string;
  } {
    // This would integrate economic indicators and geopolitical risk
    // Placeholder implementation
    const baseRisk = 45;
    const factors = {
      concentration: 65,
      geopolitical: 55,
      economic: 40,
      infrastructure: 50,
      alternatives: 35
    };

    const score = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;

    let recommendation = '';
    if (score > 70) {
      recommendation = 'Critical: Diversify supply sources immediately';
    } else if (score > 50) {
      recommendation = 'Elevated: Monitor closely and develop contingency plans';
    } else {
      recommendation = 'Moderate: Continue routine monitoring';
    }

    return { score, factors, recommendation };
  }
}

export default EnhancedDataService;
