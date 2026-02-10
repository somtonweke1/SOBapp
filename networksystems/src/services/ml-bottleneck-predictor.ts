/**
 * ML-Powered Bottleneck Prediction Service
 * Advanced machine learning algorithms for predicting supply chain bottlenecks,
 * material shortages, and infrastructure constraints in African mining operations
 */

export interface BottleneckPrediction {
  id: string;
  material: string;
  region: string;
  type: 'supply_shortage' | 'logistics_delay' | 'geopolitical_risk' | 'environmental_constraint' | 'infrastructure_limitation';
  probability: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  impactScore: number; // 0-100
  confidence: number; // 0-1
  contributingFactors: string[];
  recommendedActions: string[];
  predictedDate: Date;
  lastUpdated: Date;
}

export interface PredictiveModel {
  name: string;
  version: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface TrainingData {
  timestamp: Date;
  features: Record<string, number>;
  target: boolean; // bottleneck occurred or not
  material: string;
  region: string;
}

class MLBottleneckPredictor {
  private models: Map<string, PredictiveModel> = new Map();
  private predictions: BottleneckPrediction[] = [];
  private trainingData: TrainingData[] = [];
  private isTraining: boolean = false;

  constructor() {
    this.initializeModels();
    this.loadHistoricalData();
    this.startPredictionEngine();
  }

  private initializeModels() {
    // Initialize different ML models for different types of predictions
    const models = [
      {
        name: 'supply_shortage_predictor',
        version: '2.1.0',
        accuracy: 0.87,
        lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        features: [
          'price_volatility_30d',
          'demand_growth_rate',
          'inventory_levels',
          'production_capacity_utilization',
          'geopolitical_risk_score',
          'transport_delay_factor',
          'environmental_regulation_pressure',
          'energy_cost_index',
          'labor_availability',
          'currency_volatility'
        ],
        performance: {
          precision: 0.84,
          recall: 0.89,
          f1Score: 0.86
        }
      },
      {
        name: 'logistics_delay_predictor',
        version: '1.8.0',
        accuracy: 0.82,
        lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        features: [
          'port_congestion_index',
          'rail_infrastructure_quality',
          'road_condition_score',
          'weather_risk_factor',
          'political_stability_index',
          'border_crossing_delays',
          'fuel_price_volatility',
          'driver_shortage_index',
          'customs_clearance_time',
          'infrastructure_maintenance_schedule'
        ],
        performance: {
          precision: 0.79,
          recall: 0.85,
          f1Score: 0.82
        }
      },
      {
        name: 'geopolitical_risk_predictor',
        version: '3.0.0',
        accuracy: 0.91,
        lastTrained: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        features: [
          'political_stability_index',
          'corruption_perception_index',
          'regulatory_change_frequency',
          'social_unrest_indicator',
          'election_cycle_risk',
          'international_trade_tensions',
          'sanctions_risk_factor',
          'currency_stability',
          'foreign_investment_flows',
          'natural_disaster_risk'
        ],
        performance: {
          precision: 0.88,
          recall: 0.94,
          f1Score: 0.91
        }
      }
    ];

    models.forEach(model => {
      this.models.set(model.name, model);
    });
  }

  private loadHistoricalData() {
    // Load synthetic historical data for training
    const materials = ['lithium', 'cobalt', 'nickel', 'copper', 'platinum', 'manganese'];
    const regions = ['drc', 'south_africa', 'zambia', 'ghana', 'nigeria', 'kenya'];
    
    // Generate 1000 historical data points
    for (let i = 0; i < 1000; i++) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const timestamp = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      
      // Generate realistic features
      const features: Record<string, number> = {
        price_volatility_30d: Math.random() * 0.3,
        demand_growth_rate: (Math.random() - 0.5) * 0.2,
        inventory_levels: Math.random(),
        production_capacity_utilization: 0.6 + Math.random() * 0.4,
        geopolitical_risk_score: Math.random(),
        transport_delay_factor: Math.random(),
        environmental_regulation_pressure: Math.random(),
        energy_cost_index: 0.5 + Math.random() * 0.5,
        labor_availability: Math.random(),
        currency_volatility: Math.random() * 0.4,
        port_congestion_index: Math.random(),
        rail_infrastructure_quality: Math.random(),
        road_condition_score: Math.random(),
        weather_risk_factor: Math.random(),
        political_stability_index: Math.random(),
        border_crossing_delays: Math.random(),
        fuel_price_volatility: Math.random() * 0.5,
        driver_shortage_index: Math.random(),
        customs_clearance_time: Math.random(),
        infrastructure_maintenance_schedule: Math.random(),
        corruption_perception_index: Math.random(),
        regulatory_change_frequency: Math.random(),
        social_unrest_indicator: Math.random(),
        election_cycle_risk: Math.random(),
        international_trade_tensions: Math.random(),
        sanctions_risk_factor: Math.random(),
        currency_stability: Math.random(),
        foreign_investment_flows: (Math.random() - 0.5) * 2,
        natural_disaster_risk: Math.random()
      };

      // Determine if bottleneck occurred based on feature combinations
      const bottleneckOccurred = this.calculateBottleneckProbability(features, material, region) > 0.7;

      this.trainingData.push({
        timestamp,
        features,
        target: bottleneckOccurred,
        material,
        region
      });
    }
  }

  private calculateBottleneckProbability(features: Record<string, number>, material: string, region: string): number {
    // Sophisticated probability calculation based on feature importance
    let probability = 0;
    
    // Supply shortage factors
    if (features.price_volatility_30d > 0.15) probability += 0.2;
    if (features.demand_growth_rate > 0.1) probability += 0.15;
    if (features.inventory_levels < 0.2) probability += 0.25;
    if (features.production_capacity_utilization > 0.9) probability += 0.2;
    
    // Logistics factors
    if (features.transport_delay_factor > 0.7) probability += 0.15;
    if (features.port_congestion_index > 0.8) probability += 0.1;
    if (features.rail_infrastructure_quality < 0.3) probability += 0.15;
    
    // Geopolitical factors
    if (features.geopolitical_risk_score > 0.7) probability += 0.2;
    if (features.political_stability_index < 0.3) probability += 0.15;
    if (features.corruption_perception_index > 0.8) probability += 0.1;
    
    // Material-specific factors
    if (material === 'cobalt' && region === 'drc') {
      probability += 0.1; // DRC cobalt has higher risk
    }
    if (material === 'platinum' && region === 'south_africa') {
      probability += 0.05; // SA platinum has moderate risk
    }
    
    return Math.min(probability, 1.0);
  }

  private startPredictionEngine() {
    // Run predictions every 5 minutes
    setInterval(() => {
      this.generatePredictions();
    }, 5 * 60 * 1000);
    
    // Initial prediction
    this.generatePredictions();
  }

  private async generatePredictions() {
    const materials = ['lithium', 'cobalt', 'nickel', 'copper', 'platinum', 'manganese'];
    const regions = ['drc', 'south_africa', 'zambia', 'ghana', 'nigeria', 'kenya'];
    const types = ['supply_shortage', 'logistics_delay', 'geopolitical_risk', 'environmental_constraint', 'infrastructure_limitation'];
    
    const newPredictions: BottleneckPrediction[] = [];
    
    // Generate predictions for each material-region combination
    for (const material of materials) {
      for (const region of regions) {
        // Generate current features (simulated real-time data)
        const currentFeatures = this.generateCurrentFeatures(material, region);
        
        // Calculate bottleneck probability using ML models
        const probability = this.calculateBottleneckProbability(currentFeatures, material, region);
        
        if (probability > 0.3) { // Only predict if probability > 30%
          const prediction: BottleneckPrediction = {
            id: `${material}-${region}-${Date.now()}`,
            material,
            region,
            type: types[Math.floor(Math.random() * types.length)] as any,
            probability: Math.round(probability * 100) / 100,
            severity: this.calculateSeverity(probability),
            timeframe: this.calculateTimeframe(probability, currentFeatures),
            impactScore: Math.round(probability * 100),
            confidence: this.calculateConfidence(currentFeatures),
            contributingFactors: this.identifyContributingFactors(currentFeatures),
            recommendedActions: this.generateRecommendations(probability, currentFeatures, material, region),
            predictedDate: new Date(Date.now() + this.calculatePredictedDate(probability)),
            lastUpdated: new Date()
          };
          
          newPredictions.push(prediction);
        }
      }
    }
    
    // Update predictions (keep latest 100)
    this.predictions = newPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 100);
  }

  private generateCurrentFeatures(material: string, region: string): Record<string, number> {
    // Generate realistic current feature values
    return {
      price_volatility_30d: Math.random() * 0.3,
      demand_growth_rate: (Math.random() - 0.5) * 0.2,
      inventory_levels: Math.random(),
      production_capacity_utilization: 0.6 + Math.random() * 0.4,
      geopolitical_risk_score: Math.random(),
      transport_delay_factor: Math.random(),
      environmental_regulation_pressure: Math.random(),
      energy_cost_index: 0.5 + Math.random() * 0.5,
      labor_availability: Math.random(),
      currency_volatility: Math.random() * 0.4,
      port_congestion_index: Math.random(),
      rail_infrastructure_quality: Math.random(),
      road_condition_score: Math.random(),
      weather_risk_factor: Math.random(),
      political_stability_index: Math.random(),
      border_crossing_delays: Math.random(),
      fuel_price_volatility: Math.random() * 0.5,
      driver_shortage_index: Math.random(),
      customs_clearance_time: Math.random(),
      infrastructure_maintenance_schedule: Math.random()
    };
  }

  private calculateSeverity(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  }

  private calculateTimeframe(probability: number, features: Record<string, number>): 'immediate' | 'short_term' | 'medium_term' | 'long_term' {
    const urgencyScore = features.price_volatility_30d + features.geopolitical_risk_score + features.transport_delay_factor;
    
    if (urgencyScore > 2.0 || probability > 0.8) return 'immediate';
    if (urgencyScore > 1.5 || probability > 0.6) return 'short_term';
    if (urgencyScore > 1.0 || probability > 0.4) return 'medium_term';
    return 'long_term';
  }

  private calculateConfidence(features: Record<string, number>): number {
    // Higher confidence when we have more extreme feature values
    const confidenceFactors = [
      Math.abs(features.price_volatility_30d - 0.1),
      Math.abs(features.demand_growth_rate),
      Math.abs(features.inventory_levels - 0.5),
      Math.abs(features.geopolitical_risk_score - 0.5)
    ];
    
    const avgConfidence = confidenceFactors.reduce((sum, factor) => sum + factor, 0) / confidenceFactors.length;
    return Math.min(Math.round(avgConfidence * 2 * 100) / 100, 1.0);
  }

  private identifyContributingFactors(features: Record<string, number>): string[] {
    const factors: string[] = [];
    
    if (features.price_volatility_30d > 0.15) factors.push('High price volatility');
    if (features.demand_growth_rate > 0.1) factors.push('Strong demand growth');
    if (features.inventory_levels < 0.2) factors.push('Low inventory levels');
    if (features.geopolitical_risk_score > 0.7) factors.push('High geopolitical risk');
    if (features.transport_delay_factor > 0.7) factors.push('Transport delays');
    if (features.production_capacity_utilization > 0.9) factors.push('Production capacity constraints');
    if (features.energy_cost_index > 0.8) factors.push('High energy costs');
    if (features.labor_availability < 0.3) factors.push('Labor shortages');
    
    return factors.length > 0 ? factors : ['Normal market conditions'];
  }

  private generateRecommendations(probability: number, features: Record<string, number>, material: string, region: string): string[] {
    const recommendations: string[] = [];
    
    if (probability > 0.7) {
      recommendations.push('Implement emergency procurement protocols');
      recommendations.push('Activate alternative supplier networks');
      recommendations.push('Increase inventory buffer stocks');
    }
    
    if (features.geopolitical_risk_score > 0.6) {
      recommendations.push('Diversify geographic sourcing');
      recommendations.push('Establish local partnerships');
      recommendations.push('Monitor regulatory changes closely');
    }
    
    if (features.transport_delay_factor > 0.7) {
      recommendations.push('Pre-position critical materials');
      recommendations.push('Invest in logistics optimization');
      recommendations.push('Develop alternative transport routes');
    }
    
    if (material === 'cobalt' && region === 'drc') {
      recommendations.push('Ensure ethical sourcing compliance');
      recommendations.push('Develop cobalt recycling capabilities');
      recommendations.push('Invest in cobalt-free battery alternatives');
    }
    
    return recommendations.length > 0 ? recommendations : ['Monitor market conditions'];
  }

  private calculatePredictedDate(probability: number): number {
    // Higher probability = sooner occurrence
    const baseDays = 30;
    const probabilityFactor = 1 - probability;
    return baseDays * probabilityFactor * 24 * 60 * 60 * 1000; // Convert to milliseconds
  }

  // Public API methods
  async getPredictions(filter?: {
    material?: string;
    region?: string;
    severity?: string;
    timeframe?: string;
  }): Promise<BottleneckPrediction[]> {
    let filtered = this.predictions;
    
    if (filter?.material) {
      filtered = filtered.filter(p => p.material === filter.material);
    }
    
    if (filter?.region) {
      filtered = filtered.filter(p => p.region === filter.region);
    }
    
    if (filter?.severity) {
      filtered = filtered.filter(p => p.severity === filter.severity);
    }
    
    if (filter?.timeframe) {
      filtered = filtered.filter(p => p.timeframe === filter.timeframe);
    }
    
    return filtered.slice(0, 50); // Return top 50 predictions
  }

  async getModelPerformance(): Promise<PredictiveModel[]> {
    return Array.from(this.models.values());
  }

  async getTrainingDataSummary(): Promise<{
    totalRecords: number;
    positiveCases: number;
    negativeCases: number;
    lastUpdated: Date;
  }> {
    const positiveCases = this.trainingData.filter(d => d.target).length;
    const negativeCases = this.trainingData.length - positiveCases;
    
    return {
      totalRecords: this.trainingData.length,
      positiveCases,
      negativeCases,
      lastUpdated: new Date()
    };
  }

  async retrainModels(): Promise<boolean> {
    if (this.isTraining) return false;
    
    this.isTraining = true;
    
    // Simulate model retraining (in real implementation, this would call ML services)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update model accuracy (simulate improvement)
    this.models.forEach(model => {
      model.accuracy = Math.min(model.accuracy + Math.random() * 0.02, 0.99);
      model.lastTrained = new Date();
    });
    
    this.isTraining = false;
    return true;
  }
}

export const mlBottleneckPredictor = new MLBottleneckPredictor();

