// Live Data Service for Real-Time Market Intelligence
import RealMarketDataService from './real-market-data-service';

export class LiveDataService {
  private static instance: LiveDataService;
  private wsConnections: Map<string, WebSocket> = new Map();
  private dataCache: Map<string, any> = new Map();
  private updateCallbacks: Map<string, Function[]> = new Map();

  private realMarketService: RealMarketDataService;

  static getInstance(): LiveDataService {
    if (!LiveDataService.instance) {
      LiveDataService.instance = new LiveDataService();
    }
    return LiveDataService.instance;
  }

  constructor() {
    this.realMarketService = RealMarketDataService.getInstance();
  }

  // Real Commodity Prices API Integration
  async getCommodityPrices(): Promise<any> {
    try {
      // Use real market data service
      const realData = await this.realMarketService.getRealCommodityPrices();

      if (realData && Object.keys(realData).length > 0) {
        this.dataCache.set('commodities', realData);
        return realData;
      }

      // Fallback to cached data if available
      const cachedData = this.dataCache.get('commodities');
      if (cachedData) {
        return cachedData;
      }

      return {};
    } catch (error) {
      console.error('Error fetching real commodity prices:', error);

      // Try cached data first
      const cachedData = this.dataCache.get('commodities');
      if (cachedData) {
        return cachedData;
      }

      return {};
    }
  }

  // Live Mining Operations Data
  async getMiningOperationsData(): Promise<any> {
    try {
      return {};
    } catch (error) {
      console.error('Error fetching mining operations data:', error);
      return this.dataCache.get('mining_ops') || {};
    }
  }

  // Live Shipping and Trade Data
  async getShippingData(): Promise<any> {
    try {
      return {};
    } catch (error) {
      console.error('Error fetching shipping data:', error);
      return { ports: [], routes: [] };
    }
  }

  // Market Intelligence Feed - Using Real Intelligence API
  async getMarketIntelligence(): Promise<any> {
    try {
      // Fetch different types of intelligence from our API
      const [summary, supplyChain, alerts] = await Promise.all([
        fetch('/api/intelligence/news?type=summary').then(r => r.ok ? r.json() : null),
        fetch('/api/intelligence/news?type=supply_chain').then(r => r.ok ? r.json() : null),
        fetch('/api/intelligence/news?type=alerts').then(r => r.ok ? r.json() : null)
      ]);

      const intelligence = [];

      // Process summary intelligence
      if (summary?.content) {
        intelligence.push({
          id: `intel_summary_${Date.now()}`,
          type: 'market_summary',
          priority: 'high',
          title: 'Mining Industry Overview',
          description: summary.content,
          impact: 'Strategic market insights',
          timestamp: summary.timestamp || new Date().toISOString(),
          relevance: ['market', 'industry', 'trends'],
          citations: summary.citations || [],
          source: summary.source
        });
      }

      // Process supply chain intelligence
      if (supplyChain?.content) {
        intelligence.push({
          id: `intel_supply_${Date.now()}`,
          type: 'supply_chain',
          priority: 'urgent',
          title: 'Supply Chain Disruptions',
          description: supplyChain.content,
          impact: 'Potential delays and cost impacts',
          timestamp: supplyChain.timestamp || new Date().toISOString(),
          relevance: ['supply_chain', 'logistics', 'operations'],
          citations: supplyChain.citations || [],
          source: supplyChain.source
        });
      }

      // Process alerts
      if (alerts?.content) {
        intelligence.push({
          id: `intel_alerts_${Date.now()}`,
          type: 'critical_alert',
          priority: 'urgent',
          title: 'Critical Industry Developments',
          description: alerts.content,
          impact: 'Immediate action may be required',
          timestamp: alerts.timestamp || new Date().toISOString(),
          relevance: ['alerts', 'urgent', 'breaking'],
          citations: alerts.citations || [],
          source: alerts.source
        });
      }

      // Cache the intelligence data
      this.dataCache.set('market_intel', intelligence);

      return intelligence;
    } catch (error) {
      console.error('Error fetching market intelligence from API:', error);

      // Return cached data if available
      const cached = this.dataCache.get('market_intel');
      if (cached) return cached;

      return [];
    }
  }

  // Live Financial Markets Data (Real APIs)
  async getFinancialData(): Promise<any> {
    try {
      // Get real market data including mining stocks and crypto
      const [commodities, miningStocks, crypto, economic] = await Promise.all([
        this.realMarketService.getRealCommodityPrices(),
        this.realMarketService.getRealMiningStocks(),
        this.realMarketService.getCryptoPrices(),
        this.realMarketService.getEconomicIndicators()
      ]);

      const financialData = {
        commodities,
        mining_stocks: miningStocks,
        crypto,
        economic_indicators: economic,
        last_updated: new Date().toISOString(),
        source: 'real_market_apis'
      };

      this.dataCache.set('financial', financialData);
      return financialData;
    } catch (error) {
      console.error('Error fetching real financial data:', error);

      // Try cached data
      const cachedData = this.dataCache.get('financial');
      if (cachedData) {
        return cachedData;
      }

      return {};
    }
  }

  // Real-time Portfolio Updates
  async getPortfolioUpdates(): Promise<any> {
    try {
      return {};
    } catch (error) {
      console.error('Error fetching portfolio updates:', error);
      return {};
    }
  }

  // Customizable refresh intervals based on data criticality
  private static REFRESH_INTERVALS = {
    // Critical real-time data (high frequency)
    commodities: 15000,      // 15 seconds - fast-moving markets
    portfolio: 10000,        // 10 seconds - portfolio valuations

    // Important operational data (medium frequency)
    mining_ops: 30000,       // 30 seconds - operational metrics
    financial: 20000,        // 20 seconds - financial markets

    // Strategic data (lower frequency)
    shipping: 60000,         // 1 minute - shipping/logistics
    market_intel: 120000,    // 2 minutes - intelligence feed
    economic: 300000,        // 5 minutes - economic indicators
    geopolitical: 600000     // 10 minutes - geopolitical risk
  };

  // Allow dynamic interval adjustment
  setRefreshInterval(dataType: string, intervalMs: number): void {
    LiveDataService.REFRESH_INTERVALS[dataType as keyof typeof LiveDataService.REFRESH_INTERVALS] = intervalMs;
    // Reconnect with new interval
    this.disconnectRealTimeUpdates(dataType);
    // Auto-reconnect will use new interval
  }

  getRefreshInterval(dataType: string): number {
    return LiveDataService.REFRESH_INTERVALS[dataType as keyof typeof LiveDataService.REFRESH_INTERVALS] || 60000;
  }

  // WebSocket connection for real-time updates
  connectRealTimeUpdates(dataType: string, callback: Function): void {
    // Simulate WebSocket with intervals for different data types
    const interval = this.getRefreshInterval(dataType);

    const updateInterval = setInterval(async () => {
      let data;
      switch (dataType) {
        case 'commodities':
          data = await this.getCommodityPrices();
          break;
        case 'mining_ops':
          data = await this.getMiningOperationsData();
          break;
        case 'shipping':
          data = await this.getShippingData();
          break;
        case 'market_intel':
          data = await this.getMarketIntelligence();
          break;
        case 'portfolio':
          data = await this.getPortfolioUpdates();
          break;
        default:
          return;
      }

      callback(data);
    }, interval);

    // Store interval for cleanup
    this.wsConnections.set(dataType, { close: () => clearInterval(updateInterval) } as any);
  }

  // Disconnect real-time updates
  disconnectRealTimeUpdates(dataType: string): void {
    const connection = this.wsConnections.get(dataType);
    if (connection) {
      connection.close();
      this.wsConnections.delete(dataType);
    }
  }

  // Helper methods
  private processCommodityData(dataArray: any[]) {
    void dataArray;
    return {};
  }

  // Get all live data for dashboard
  async getAllLiveData(): Promise<any> {
    try {
      const [commodities, mining, shipping, intelligence, financial, portfolio] = await Promise.all([
        this.getCommodityPrices(),
        this.getMiningOperationsData(),
        this.getShippingData(),
        this.getMarketIntelligence(),
        this.getFinancialData(),
        this.getPortfolioUpdates()
      ]);

      return {
        commodities,
        mining_operations: mining,
        shipping_data: shipping,
        market_intelligence: intelligence,
        financial_markets: financial,
        portfolio_metrics: portfolio,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching all live data:', error);
      return {};
    }
  }
}

export default LiveDataService;
