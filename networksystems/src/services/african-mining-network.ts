// African Mining Network Intelligence - Continental Scale
// Real mining operations, trade routes, and value networks across Africa

export interface AfricanMiningOperation {
  id: string;
  name: string;
  operator: string;
  country: string;
  region: 'west_africa' | 'east_africa' | 'southern_africa' | 'central_africa' | 'north_africa';
  location: {
    lat: number;
    lng: number;
    elevation_m?: number;
  };
  commodities: string[];
  production: {
    primary_commodity: string;
    annual_production: number;
    unit: string;
    grade?: number;
    reserves: number;
  };
  infrastructure: {
    ports: string[];
    rail_connections: string[];
    processing_facilities: string[];
    power_grid: 'connected' | 'isolated' | 'hybrid';
  };
  trade_routes: {
    export_destinations: string[];
    import_sources: string[];
    logistics_cost_per_ton: number;
  };
  economic_impact: {
    gdp_contribution_percent: number;
    employment: number;
    government_revenue_usd_m: number;
  };
  status: 'operational' | 'development' | 'exploration' | 'care_maintenance';
}

export interface NetworkConnection {
  source_id: string;
  target_id: string;
  connection_type: 'supply_chain' | 'logistics' | 'knowledge_transfer' | 'financial' | 'regulatory';
  strength: number; // 0-1
  flow_direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  value_usd_annually?: number;
  description: string;
}

export interface GlobalTradeRoute {
  id: string;
  origin_country: string;
  destination_country: string;
  commodity: string;
  annual_volume_tons: number;
  route_type: 'maritime' | 'rail' | 'road' | 'pipeline';
  key_infrastructure: string[];
  strategic_importance: 'critical' | 'important' | 'supporting';
}

// Real African Mining Operations Database
export const AFRICAN_MINING_OPERATIONS: AfricanMiningOperation[] = [
  // South Africa - Gold & Platinum
  {
    id: 'sa_witwatersrand',
    name: 'Witwatersrand Gold District',
    operator: 'Multiple (AngloGold, Harmony, etc.)',
    country: 'South Africa',
    region: 'southern_africa',
    location: { lat: -26.2041, lng: 27.4194 },
    commodities: ['gold', 'uranium', 'platinum'],
    production: {
      primary_commodity: 'gold',
      annual_production: 100,
      unit: 'tonnes',
      grade: 4.2,
      reserves: 6000
    },
    infrastructure: {
      ports: ['Durban', 'Cape Town'],
      rail_connections: ['Gautrain', 'Spoornet'],
      processing_facilities: ['East Rand', 'West Rand'],
      power_grid: 'connected'
    },
    trade_routes: {
      export_destinations: ['China', 'India', 'UK', 'Switzerland'],
      import_sources: ['Australia', 'Chile'],
      logistics_cost_per_ton: 850
    },
    economic_impact: {
      gdp_contribution_percent: 1.2,
      employment: 93841,
      government_revenue_usd_m: 890
    },
    status: 'operational'
  },

  // Ghana - Gold
  {
    id: 'ghana_ashanti',
    name: 'Ashanti Gold Belt',
    operator: 'Newmont, AngloGold Ashanti',
    country: 'Ghana',
    region: 'west_africa',
    location: { lat: 6.7194, lng: -1.3244 },
    commodities: ['gold', 'silver'],
    production: {
      primary_commodity: 'gold',
      annual_production: 158,
      unit: 'tonnes',
      grade: 2.8,
      reserves: 2800
    },
    infrastructure: {
      ports: ['Tema', 'Takoradi'],
      rail_connections: ['Western Railway'],
      processing_facilities: ['Obuasi', 'Iduapriem'],
      power_grid: 'connected'
    },
    trade_routes: {
      export_destinations: ['Switzerland', 'UAE', 'India', 'China'],
      import_sources: ['South Africa', 'Australia'],
      logistics_cost_per_ton: 720
    },
    economic_impact: {
      gdp_contribution_percent: 5.2,
      employment: 45000,
      government_revenue_usd_m: 1200
    },
    status: 'operational'
  },

  // DRC - Cobalt & Copper
  {
    id: 'drc_katanga',
    name: 'Katanga Copperbelt',
    operator: 'Glencore, CMOC, ERG',
    country: 'Democratic Republic of Congo',
    region: 'central_africa',
    location: { lat: -11.6094, lng: 27.4794 },
    commodities: ['copper', 'cobalt', 'gold'],
    production: {
      primary_commodity: 'cobalt',
      annual_production: 95000,
      unit: 'tonnes',
      grade: 0.32,
      reserves: 3400000
    },
    infrastructure: {
      ports: ['Dar es Salaam', 'Durban', 'Walvis Bay'],
      rail_connections: ['TAZARA', 'CFB'],
      processing_facilities: ['Kolwezi', 'Fungurume'],
      power_grid: 'hybrid'
    },
    trade_routes: {
      export_destinations: ['China', 'Finland', 'Belgium', 'Zambia'],
      import_sources: ['South Africa', 'China'],
      logistics_cost_per_ton: 1850
    },
    economic_impact: {
      gdp_contribution_percent: 23.8,
      employment: 185000,
      government_revenue_usd_m: 2800
    },
    status: 'operational'
  },

  // Zambia - Copper
  {
    id: 'zambia_copperbelt',
    name: 'Zambian Copperbelt',
    operator: 'First Quantum, Vedanta',
    country: 'Zambia',
    region: 'southern_africa',
    location: { lat: -12.5394, lng: 28.0894 },
    commodities: ['copper', 'cobalt', 'gold'],
    production: {
      primary_commodity: 'copper',
      annual_production: 830000,
      unit: 'tonnes',
      grade: 1.8,
      reserves: 19000000
    },
    infrastructure: {
      ports: ['Dar es Salaam', 'Durban'],
      rail_connections: ['TAZARA', 'CFB'],
      processing_facilities: ['Kitwe', 'Chingola', 'Mufulira'],
      power_grid: 'connected'
    },
    trade_routes: {
      export_destinations: ['China', 'Switzerland', 'UAE', 'India'],
      import_sources: ['DRC', 'South Africa'],
      logistics_cost_per_ton: 1200
    },
    economic_impact: {
      gdp_contribution_percent: 12.1,
      employment: 89000,
      government_revenue_usd_m: 1500
    },
    status: 'operational'
  },

  // Botswana - Diamonds
  {
    id: 'botswana_orapa',
    name: 'Orapa Diamond Mine',
    operator: 'De Beers (Debswana)',
    country: 'Botswana',
    region: 'southern_africa',
    location: { lat: -21.3094, lng: 25.3794 },
    commodities: ['diamonds'],
    production: {
      primary_commodity: 'diamonds',
      annual_production: 11.3,
      unit: 'million carats',
      reserves: 86
    },
    infrastructure: {
      ports: ['Walvis Bay', 'Durban'],
      rail_connections: ['Botswana Railway'],
      processing_facilities: ['Gaborone'],
      power_grid: 'connected'
    },
    trade_routes: {
      export_destinations: ['Belgium', 'India', 'Israel', 'UAE'],
      import_sources: ['South Africa'],
      logistics_cost_per_ton: 2400
    },
    economic_impact: {
      gdp_contribution_percent: 18.2,
      employment: 4500,
      government_revenue_usd_m: 2200
    },
    status: 'operational'
  },

  // Morocco - Phosphates
  {
    id: 'morocco_khouribga',
    name: 'Khouribga Phosphate Complex',
    operator: 'OCP Group',
    country: 'Morocco',
    region: 'north_africa',
    location: { lat: 32.8811, lng: -6.9066 },
    commodities: ['phosphates', 'phosphoric_acid'],
    production: {
      primary_commodity: 'phosphates',
      annual_production: 37000000,
      unit: 'tonnes',
      reserves: 50000000000
    },
    infrastructure: {
      ports: ['Casablanca', 'Jorf Lasfar', 'Safi'],
      rail_connections: ['ONCF'],
      processing_facilities: ['Jorf Lasfar', 'Safi'],
      power_grid: 'connected'
    },
    trade_routes: {
      export_destinations: ['India', 'Brazil', 'USA', 'Europe', 'Africa'],
      import_sources: ['Europe', 'Asia'],
      logistics_cost_per_ton: 45
    },
    economic_impact: {
      gdp_contribution_percent: 3.5,
      employment: 23000,
      government_revenue_usd_m: 1800
    },
    status: 'operational'
  },

  // Nigeria - Oil & Gas (for context)
  {
    id: 'nigeria_niger_delta',
    name: 'Niger Delta Oil Complex',
    operator: 'Shell, ExxonMobil, Chevron, Total',
    country: 'Nigeria',
    region: 'west_africa',
    location: { lat: 5.0544, lng: 6.7894 },
    commodities: ['crude_oil', 'natural_gas', 'lpg'],
    production: {
      primary_commodity: 'crude_oil',
      annual_production: 1.8,
      unit: 'million barrels/day',
      reserves: 37000
    },
    infrastructure: {
      ports: ['Lagos', 'Port Harcourt', 'Warri'],
      rail_connections: ['NRC'],
      processing_facilities: ['Kaduna', 'Port Harcourt', 'Warri'],
      power_grid: 'connected'
    },
    trade_routes: {
      export_destinations: ['USA', 'India', 'China', 'Europe'],
      import_sources: ['USA', 'Europe', 'Asia'],
      logistics_cost_per_ton: 25
    },
    economic_impact: {
      gdp_contribution_percent: 8.8,
      employment: 65000,
      government_revenue_usd_m: 28000
    },
    status: 'operational'
  },

  // Tanzania - Gold
  {
    id: 'tanzania_geita',
    name: 'Geita Gold Mine',
    operator: 'Barrick Gold',
    country: 'Tanzania',
    region: 'east_africa',
    location: { lat: -2.8694, lng: 32.2294 },
    commodities: ['gold', 'silver'],
    production: {
      primary_commodity: 'gold',
      annual_production: 18.5,
      unit: 'tonnes',
      grade: 2.1,
      reserves: 180
    },
    infrastructure: {
      ports: ['Dar es Salaam'],
      rail_connections: ['Central Railway'],
      processing_facilities: ['Geita'],
      power_grid: 'hybrid'
    },
    trade_routes: {
      export_destinations: ['UAE', 'Switzerland', 'India'],
      import_sources: ['South Africa', 'Kenya'],
      logistics_cost_per_ton: 980
    },
    economic_impact: {
      gdp_contribution_percent: 1.8,
      employment: 3200,
      government_revenue_usd_m: 145
    },
    status: 'operational'
  }
];

// Network Connections Between Operations
export const NETWORK_CONNECTIONS: NetworkConnection[] = [
  {
    source_id: 'sa_witwatersrand',
    target_id: 'ghana_ashanti',
    connection_type: 'knowledge_transfer',
    strength: 0.75,
    flow_direction: 'bidirectional',
    value_usd_annually: 25000000,
    description: 'Technical expertise exchange, equipment supply, and joint research initiatives'
  },
  {
    source_id: 'drc_katanga',
    target_id: 'zambia_copperbelt',
    connection_type: 'supply_chain',
    strength: 0.9,
    flow_direction: 'bidirectional',
    value_usd_annually: 1200000000,
    description: 'Cross-border copper-cobalt processing and shared logistics infrastructure'
  },
  {
    source_id: 'sa_witwatersrand',
    target_id: 'drc_katanga',
    connection_type: 'logistics',
    strength: 0.65,
    flow_direction: 'source_to_target',
    value_usd_annually: 450000000,
    description: 'South African ports handle 35% of DRC mineral exports, equipment supply'
  },
  {
    source_id: 'botswana_orapa',
    target_id: 'sa_witwatersrand',
    connection_type: 'financial',
    strength: 0.8,
    flow_direction: 'bidirectional',
    value_usd_annually: 850000000,
    description: 'Shared De Beers operations, Johannesburg diamond trading hub'
  },
  {
    source_id: 'morocco_khouribga',
    target_id: 'nigeria_niger_delta',
    connection_type: 'supply_chain',
    strength: 0.4,
    flow_direction: 'source_to_target',
    value_usd_annually: 180000000,
    description: 'Phosphate fertilizers for Nigerian agriculture, energy for processing'
  },
  {
    source_id: 'ghana_ashanti',
    target_id: 'tanzania_geita',
    connection_type: 'knowledge_transfer',
    strength: 0.6,
    flow_direction: 'source_to_target',
    value_usd_annually: 12000000,
    description: 'West African mining expertise transfer to East Africa'
  }
];

// Global Trade Routes from Africa
export const GLOBAL_TRADE_ROUTES: GlobalTradeRoute[] = [
  {
    id: 'africa_china_minerals',
    origin_country: 'Multiple African',
    destination_country: 'China',
    commodity: 'Mixed minerals',
    annual_volume_tons: 95000000,
    route_type: 'maritime',
    key_infrastructure: ['Dar es Salaam', 'Durban', 'Lagos', 'Shanghai', 'Shenzhen'],
    strategic_importance: 'critical'
  },
  {
    id: 'drc_cobalt_global',
    origin_country: 'DRC',
    destination_country: 'Global EV Supply Chain',
    commodity: 'Cobalt',
    annual_volume_tons: 95000,
    route_type: 'maritime',
    key_infrastructure: ['Kolwezi', 'Dar es Salaam', 'Finland', 'China'],
    strategic_importance: 'critical'
  },
  {
    id: 'morocco_phosphate_global',
    origin_country: 'Morocco',
    destination_country: 'Global Food Chain',
    commodity: 'Phosphates',
    annual_volume_tons: 37000000,
    route_type: 'maritime',
    key_infrastructure: ['Jorf Lasfar', 'Global Ports'],
    strategic_importance: 'critical'
  }
];

// Network Analysis Functions
export class AfricanMiningNetwork {
  static calculateNetworkCentrality(operationId: string): {
    betweenness: number;
    closeness: number;
    degree: number;
    importance_score: number;
  } {
    const connections = NETWORK_CONNECTIONS.filter(
      c => c.source_id === operationId || c.target_id === operationId
    );

    const degree = connections.length;
    const totalValue = connections.reduce((sum, c) => sum + (c.value_usd_annually || 0), 0);
    const avgStrength = connections.reduce((sum, c) => sum + c.strength, 0) / connections.length || 0;

    return {
      betweenness: degree * 0.1, // Simplified calculation
      closeness: avgStrength,
      degree,
      importance_score: (totalValue / 1000000000) * avgStrength * degree
    };
  }

  static findOptimalTradeRoutes(fromOperationId: string, commodity: string): {
    route_options: Array<{
      path: string[];
      total_cost: number;
      transit_time_days: number;
      risk_score: number;
    }>;
    recommended_route: string[];
  } {
    // Simplified route optimization
    const operation = AFRICAN_MINING_OPERATIONS.find(op => op.id === fromOperationId);
    if (!operation) return { route_options: [], recommended_route: [] };

    const routes = [
      {
        path: [operation.country, operation.infrastructure.ports[0], 'China'],
        total_cost: operation.trade_routes.logistics_cost_per_ton * 1.2,
        transit_time_days: 35,
        risk_score: 0.3
      },
      {
        path: [operation.country, operation.infrastructure.ports[0], 'Europe'],
        total_cost: operation.trade_routes.logistics_cost_per_ton * 0.8,
        transit_time_days: 28,
        risk_score: 0.2
      }
    ];

    return {
      route_options: routes,
      recommended_route: routes[0].path
    };
  }

  static calculateContinentalImpact(): {
    total_gdp_contribution: number;
    total_employment: number;
    total_government_revenue: number;
    global_market_share: { [commodity: string]: number };
    strategic_minerals_control: number;
  } {
    const totalGDP = AFRICAN_MINING_OPERATIONS.reduce(
      (sum, op) => sum + op.economic_impact.gdp_contribution_percent, 0
    );

    const totalEmployment = AFRICAN_MINING_OPERATIONS.reduce(
      (sum, op) => sum + op.economic_impact.employment, 0
    );

    const totalRevenue = AFRICAN_MINING_OPERATIONS.reduce(
      (sum, op) => sum + op.economic_impact.government_revenue_usd_m, 0
    );

    return {
      total_gdp_contribution: totalGDP,
      total_employment: totalEmployment,
      total_government_revenue: totalRevenue,
      global_market_share: {
        'cobalt': 70,
        'platinum': 80,
        'diamonds': 60,
        'phosphates': 75,
        'gold': 20
      },
      strategic_minerals_control: 68 // Africa controls 68% of critical minerals
    };
  }

  static identifySupplyChainVulnerabilities(): Array<{
    vulnerability: string;
    affected_operations: string[];
    risk_level: 'high' | 'medium' | 'low';
    mitigation_strategies: string[];
    global_impact: string;
  }> {
    return [
      {
        vulnerability: 'Single Point of Failure - Dar es Salaam Port',
        affected_operations: ['drc_katanga', 'zambia_copperbelt', 'tanzania_geita'],
        risk_level: 'high',
        mitigation_strategies: [
          'Diversify to Walvis Bay and Durban ports',
          'Develop Lobito Corridor railway',
          'Invest in inland logistics hubs'
        ],
        global_impact: 'Could disrupt 40% of global cobalt supply and 15% of copper'
      },
      {
        vulnerability: 'Political Instability in DRC',
        affected_operations: ['drc_katanga'],
        risk_level: 'high',
        mitigation_strategies: [
          'Develop alternative cobalt sources in Zambia/Morocco',
          'Strategic stockpiling programs',
          'Diplomatic engagement and stability initiatives'
        ],
        global_impact: 'Critical threat to global EV supply chain - 70% of cobalt at risk'
      }
    ];
  }
}