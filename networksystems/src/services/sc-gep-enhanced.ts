/**
 * Enhanced SC-GEP Configuration with Supply Chain Constraints
 * Based on the research paper: "Integrating Upstream Supply Chains into Generation Expansion Planning"
 * Supports multiple regions: Maryland/PJM and African Mining supply chains
 */

export type ScenarioType = 'baseline' | 'high_demand' | 'constrained_supply' | 'rapid_expansion';

export interface EnhancedMaterial {
  id: string;
  name: string;
  type: 'critical' | 'standard' | 'rare_earth';
  primarySupply: number; // tonnes/year
  recoveryRate: number; // percentage from retired units
  stockLevel: number; // current stock in tonnes
  costPerTonne: number; // $/tonne
  geopoliticalRisk: 'low' | 'medium' | 'high';
  domesticAvailability: number; // percentage
}

export interface EnhancedTechnology {
  id: string;
  name: string;
  type: 'renewable' | 'storage' | 'thermal' | 'nuclear';
  componentDemand: Record<string, number>; // component_id -> units/MW
  capacityDensity: number; // MW/km²
  leadTime: number; // years
  lifetime: number; // years
  capitalCost: number; // $/MW
  variableCost: number; // $/MWh
  elccFactor: number; // effective load carrying capability
  materialIntensity: number; // tonnes/MW
  manufacturingCapacity: number; // MW/year
}

export interface MarylandZone {
  id: string;
  name: string;
  availableLand: number; // km²
  peakLoad: number; // MW
  demandGrowth: number; // CAGR %
  existingCapacity: Record<string, number>; // tech_id -> MW
  transmissionCapacity: number; // MW
  rpsTarget: number; // percentage
}

export interface EnhancedSCGEPConfig {
  materials: EnhancedMaterial[];
  technologies: EnhancedTechnology[];
  zones: MarylandZone[];
  planningHorizon: number; // years
  reserveMargin: number; // percentage
  rpsTarget: Record<string, number>; // tech_id -> percentage
  scenarioType: ScenarioType;
  region: 'maryland' | 'africa';
  costParameters: {
    voll: number; // $/MWh
    rpsPenalty: number; // $/MWh
    reservePenalty: number; // $/MW-year
  };
  supplyChainConstraints: {
    maxLeadTime: number; // years
    minRecoveryRate: number; // percentage
    maxMaterialUtilization: number; // percentage
  };
}

export function createMarylandSCGEPConfig(scenarioType: ScenarioType): EnhancedSCGEPConfig {
  const baseMaterials: EnhancedMaterial[] = [
    {
      id: 'lithium',
      name: 'Lithium',
      type: 'critical',
      primarySupply: 86000,
      recoveryRate: 0.10,
      stockLevel: 45000,
      costPerTonne: 15000,
      geopoliticalRisk: 'high',
      domesticAvailability: 0.05
    },
    {
      id: 'cobalt',
      name: 'Cobalt',
      type: 'critical',
      primarySupply: 180000,
      recoveryRate: 0.15,
      stockLevel: 25000,
      costPerTonne: 55000,
      geopoliticalRisk: 'high',
      domesticAvailability: 0.01
    },
    {
      id: 'nickel',
      name: 'Nickel',
      type: 'critical',
      primarySupply: 3200000,
      recoveryRate: 0.80,
      stockLevel: 450000,
      costPerTonne: 18000,
      geopoliticalRisk: 'medium',
      domesticAvailability: 0.15
    },
    {
      id: 'silicon',
      name: 'Silicon',
      type: 'standard',
      primarySupply: 8000000,
      recoveryRate: 0.85,
      stockLevel: 1200000,
      costPerTonne: 2500,
      geopoliticalRisk: 'low',
      domesticAvailability: 0.40
    },
    {
      id: 'neodymium',
      name: 'Neodymium',
      type: 'rare_earth',
      primarySupply: 32000,
      recoveryRate: 0.05,
      stockLevel: 8000,
      costPerTonne: 120000,
      geopoliticalRisk: 'high',
      domesticAvailability: 0.02
    }
  ];

  const baseTechnologies: EnhancedTechnology[] = [
    {
      id: 'solar_pv',
      name: 'Solar PV',
      type: 'renewable',
      componentDemand: { solar_panels: 1.0, inverters: 1.0 },
      capacityDensity: 36,
      leadTime: 2,
      lifetime: 30,
      capitalCost: 1200000,
      variableCost: 0,
      elccFactor: 0.80,
      materialIntensity: 15.5,
      manufacturingCapacity: 50000
    },
    {
      id: 'battery_storage',
      name: 'Battery Storage',
      type: 'storage',
      componentDemand: { battery_cells: 2.0, inverters: 1.0 },
      capacityDensity: 900,
      leadTime: 1,
      lifetime: 15,
      capitalCost: 350000,
      variableCost: 5,
      elccFactor: 0.95,
      materialIntensity: 8.2,
      manufacturingCapacity: 25000
    },
    {
      id: 'wind_onshore',
      name: 'Onshore Wind',
      type: 'renewable',
      componentDemand: { wind_turbines: 0.1, gearboxes: 0.1 },
      capacityDensity: 3.09,
      leadTime: 3,
      lifetime: 30,
      capitalCost: 1500000,
      variableCost: 0,
      elccFactor: 0.90,
      materialIntensity: 45.8,
      manufacturingCapacity: 8000
    },
    {
      id: 'wind_offshore',
      name: 'Offshore Wind',
      type: 'renewable',
      componentDemand: { wind_turbines: 0.08, foundations: 0.08 },
      capacityDensity: 5.2,
      leadTime: 4,
      lifetime: 30,
      capitalCost: 2800000,
      variableCost: 0,
      elccFactor: 0.92,
      materialIntensity: 68.4,
      manufacturingCapacity: 3000
    }
  ];

  const marylandZones: MarylandZone[] = [
    {
      id: 'bge',
      name: 'Baltimore Gas & Electric',
      availableLand: 1200,
      peakLoad: 6428,
      demandGrowth: 1.2,
      existingCapacity: { solar_pv: 800, battery_storage: 200, wind_onshore: 150 },
      transmissionCapacity: 8500,
      rpsTarget: 50
    },
    {
      id: 'aps',
      name: 'Allegheny Power Systems',
      availableLand: 800,
      peakLoad: 1554,
      demandGrowth: 2.1,
      existingCapacity: { solar_pv: 300, battery_storage: 100, wind_onshore: 75 },
      transmissionCapacity: 2200,
      rpsTarget: 50
    },
    {
      id: 'dpl',
      name: 'Delmarva Power & Light',
      availableLand: 600,
      peakLoad: 961,
      demandGrowth: 1.8,
      existingCapacity: { solar_pv: 200, battery_storage: 50, wind_onshore: 25 },
      transmissionCapacity: 1400,
      rpsTarget: 50
    },
    {
      id: 'pepco',
      name: 'Potomac Electric Power Company',
      availableLand: 400,
      peakLoad: 2958,
      demandGrowth: 2.5,
      existingCapacity: { solar_pv: 400, battery_storage: 150, wind_onshore: 50 },
      transmissionCapacity: 4200,
      rpsTarget: 50
    }
  ];

  // Apply scenario-specific modifications
  let modifiedMaterials = [...baseMaterials];
  let modifiedTechnologies = [...baseTechnologies];
  let modifiedZones = [...marylandZones];

  switch (scenarioType) {
    case 'high_demand':
      modifiedZones = modifiedZones.map(zone => ({
        ...zone,
        demandGrowth: zone.demandGrowth * 1.5,
        peakLoad: zone.peakLoad * 1.3
      }));
      break;

    case 'constrained_supply':
      modifiedMaterials = modifiedMaterials.map(material => ({
        ...material,
        primarySupply: material.primarySupply * 0.7,
        stockLevel: material.stockLevel * 0.5,
        geopoliticalRisk: 'high' as const
      }));
      break;

    case 'rapid_expansion':
      modifiedTechnologies = modifiedTechnologies.map(tech => ({
        ...tech,
        leadTime: Math.max(0.5, tech.leadTime * 0.7),
        manufacturingCapacity: tech.manufacturingCapacity * 1.5
      }));
      break;
  }

  return {
    materials: modifiedMaterials,
    technologies: modifiedTechnologies,
    zones: modifiedZones,
    planningHorizon: 30,
    reserveMargin: 15,
    rpsTarget: {
      solar_pv: 25,
      wind_onshore: 15,
      wind_offshore: 10,
      battery_storage: 5
    },
    scenarioType,
    region: 'maryland',
    costParameters: {
      voll: 10000, // $/MWh
      rpsPenalty: 60, // $/MWh (Maryland ACP)
      reservePenalty: 263000 // $/MW-year (PJM Net CONE)
    },
    supplyChainConstraints: {
      maxLeadTime: 5, // years
      minRecoveryRate: 0.05, // 5%
      maxMaterialUtilization: 0.95 // 95%
    }
  };
}

export function createAfricanMiningSCGEPConfig(scenarioType: ScenarioType): EnhancedSCGEPConfig {
  const africanMaterials: EnhancedMaterial[] = [
    {
      id: 'lithium',
      name: 'Lithium',
      type: 'critical',
      primarySupply: 45000, // African lithium production
      recoveryRate: 0.12,
      stockLevel: 8000,
      costPerTonne: 18000,
      geopoliticalRisk: 'medium',
      domesticAvailability: 0.25 // Zimbabwe, DRC have lithium deposits
    },
    {
      id: 'cobalt',
      name: 'Cobalt',
      type: 'critical',
      primarySupply: 165000, // DRC produces 70% of world cobalt
      recoveryRate: 0.20,
      stockLevel: 35000,
      costPerTonne: 52000,
      geopoliticalRisk: 'high',
      domesticAvailability: 0.80 // DRC dominates global supply
    },
    {
      id: 'nickel',
      name: 'Nickel',
      type: 'critical',
      primarySupply: 180000, // South Africa, Madagascar
      recoveryRate: 0.75,
      stockLevel: 28000,
      costPerTonne: 22000,
      geopoliticalRisk: 'medium',
      domesticAvailability: 0.15
    },
    {
      id: 'copper',
      name: 'Copper',
      type: 'standard',
      primarySupply: 2100000, // Zambia, DRC, South Africa
      recoveryRate: 0.85,
      stockLevel: 180000,
      costPerTonne: 9500,
      geopoliticalRisk: 'medium',
      domesticAvailability: 0.35
    },
    {
      id: 'platinum',
      name: 'Platinum Group Metals',
      type: 'rare_earth',
      primarySupply: 150000, // South Africa dominates
      recoveryRate: 0.30,
      stockLevel: 25000,
      costPerTonne: 950000,
      geopoliticalRisk: 'medium',
      domesticAvailability: 0.70
    },
    {
      id: 'manganese',
      name: 'Manganese',
      type: 'standard',
      primarySupply: 800000, // South Africa, Gabon
      recoveryRate: 0.80,
      stockLevel: 120000,
      costPerTonne: 1800,
      geopoliticalRisk: 'low',
      domesticAvailability: 0.60
    }
  ];

  const africanTechnologies: EnhancedTechnology[] = [
    {
      id: 'solar_pv',
      name: 'Solar PV',
      type: 'renewable',
      componentDemand: { solar_panels: 1.0, inverters: 1.0 },
      capacityDensity: 40, // Higher density in sunny African conditions
      leadTime: 1.5, // Faster deployment in Africa
      lifetime: 30,
      capitalCost: 900000, // Lower cost due to abundant sunlight
      variableCost: 0,
      elccFactor: 0.85, // Higher capacity factor in Africa
      materialIntensity: 12.0,
      manufacturingCapacity: 30000 // Growing African manufacturing
    },
    {
      id: 'battery_storage',
      name: 'Battery Storage',
      type: 'storage',
      componentDemand: { battery_cells: 2.0, inverters: 1.0 },
      capacityDensity: 900,
      leadTime: 1,
      lifetime: 15,
      capitalCost: 420000, // Higher cost due to material intensity
      variableCost: 8,
      elccFactor: 0.95,
      materialIntensity: 12.5, // High cobalt/lithium content
      manufacturingCapacity: 15000
    },
    {
      id: 'wind_onshore',
      name: 'Onshore Wind',
      type: 'renewable',
      componentDemand: { wind_turbines: 0.1, gearboxes: 0.1 },
      capacityDensity: 2.5, // Lower density due to terrain
      leadTime: 2.5,
      lifetime: 30,
      capitalCost: 1800000, // Higher cost due to logistics
      variableCost: 0,
      elccFactor: 0.35, // Lower capacity factor
      materialIntensity: 55.0, // Higher steel content
      manufacturingCapacity: 5000
    },
    {
      id: 'hydro_small',
      name: 'Small Hydro',
      type: 'renewable',
      componentDemand: { turbines: 0.2, generators: 0.2 },
      capacityDensity: 15,
      leadTime: 3,
      lifetime: 50,
      capitalCost: 2500000,
      variableCost: 0,
      elccFactor: 0.45,
      materialIntensity: 35.0,
      manufacturingCapacity: 2000
    },
    {
      id: 'mining_power',
      name: 'Mining Power Integration',
      type: 'thermal',
      componentDemand: { generators: 1.0, fuel_systems: 1.0 },
      capacityDensity: 200,
      leadTime: 1,
      lifetime: 25,
      capitalCost: 1200000,
      variableCost: 45,
      elccFactor: 0.90,
      materialIntensity: 8.0,
      manufacturingCapacity: 10000
    }
  ];

  const africanZones: MarylandZone[] = [
    {
      id: 'south_africa',
      name: 'South Africa',
      availableLand: 45000, // Large land availability
      peakLoad: 35000,
      demandGrowth: 2.5,
      existingCapacity: { 
        solar_pv: 2500, 
        battery_storage: 800, 
        wind_onshore: 200,
        mining_power: 5000
      },
      transmissionCapacity: 45000,
      rpsTarget: 40
    },
    {
      id: 'drc',
      name: 'Democratic Republic of Congo',
      availableLand: 180000, // Massive land area
      peakLoad: 2500,
      demandGrowth: 8.0, // High growth due to mining expansion
      existingCapacity: { 
        solar_pv: 150, 
        battery_storage: 50, 
        hydro_small: 800,
        mining_power: 1200
      },
      transmissionCapacity: 3500,
      rpsTarget: 30
    },
    {
      id: 'ghana',
      name: 'Ghana',
      availableLand: 12000,
      peakLoad: 3200,
      demandGrowth: 6.5,
      existingCapacity: { 
        solar_pv: 400, 
        battery_storage: 120, 
        wind_onshore: 50,
        mining_power: 800
      },
      transmissionCapacity: 4200,
      rpsTarget: 35
    },
    {
      id: 'zambia',
      name: 'Zambia',
      availableLand: 25000,
      peakLoad: 2100,
      demandGrowth: 5.5,
      existingCapacity: { 
        solar_pv: 300, 
        battery_storage: 80, 
        hydro_small: 1200,
        mining_power: 600
      },
      transmissionCapacity: 2800,
      rpsTarget: 45
    },
    {
      id: 'nigeria',
      name: 'Nigeria',
      availableLand: 28000,
      peakLoad: 12000,
      demandGrowth: 4.8,
      existingCapacity: { 
        solar_pv: 800, 
        battery_storage: 200, 
        wind_onshore: 100,
        mining_power: 2000
      },
      transmissionCapacity: 15000,
      rpsTarget: 25
    },
    {
      id: 'kenya',
      name: 'Kenya',
      availableLand: 10000,
      peakLoad: 1800,
      demandGrowth: 7.2,
      existingCapacity: { 
        solar_pv: 250, 
        battery_storage: 60, 
        wind_onshore: 300,
        hydro_small: 400
      },
      transmissionCapacity: 2400,
      rpsTarget: 50
    }
  ];

  // Apply scenario-specific modifications for African context
  let modifiedMaterials = [...africanMaterials];
  let modifiedTechnologies = [...africanTechnologies];
  let modifiedZones = [...africanZones];

  switch (scenarioType) {
    case 'high_demand':
      modifiedZones = modifiedZones.map(zone => ({
        ...zone,
        demandGrowth: zone.demandGrowth * 1.3, // Mining boom scenario
        peakLoad: zone.peakLoad * 1.4
      }));
      break;

    case 'constrained_supply':
      modifiedMaterials = modifiedMaterials.map(material => ({
        ...material,
        primarySupply: material.primarySupply * 0.6, // Supply chain disruptions
        stockLevel: material.stockLevel * 0.3,
        geopoliticalRisk: 'high' as const
      }));
      // Add mining-specific constraints
      modifiedTechnologies = modifiedTechnologies.map(tech => ({
        ...tech,
        leadTime: tech.leadTime * 1.5, // Longer lead times due to logistics
        manufacturingCapacity: tech.manufacturingCapacity * 0.7
      }));
      break;

    case 'rapid_expansion':
      modifiedTechnologies = modifiedTechnologies.map(tech => ({
        ...tech,
        leadTime: Math.max(0.5, tech.leadTime * 0.6), // Accelerated deployment
        manufacturingCapacity: tech.manufacturingCapacity * 2.0
      }));
      // Increase material availability for rapid expansion
      modifiedMaterials = modifiedMaterials.map(material => ({
        ...material,
        primarySupply: material.primarySupply * 1.3,
        stockLevel: material.stockLevel * 1.5
      }));
      break;
  }

  return {
    materials: modifiedMaterials,
    technologies: modifiedTechnologies,
    zones: modifiedZones,
    planningHorizon: 30,
    reserveMargin: 20, // Higher reserve margin for African grid stability
    rpsTarget: {
      solar_pv: 35,
      wind_onshore: 10,
      hydro_small: 15,
      battery_storage: 8
    },
    scenarioType,
    region: 'africa',
    costParameters: {
      voll: 15000, // Higher VOLL in Africa
      rpsPenalty: 40, // Lower penalty, focus on development
      reservePenalty: 200000 // Adjusted for African context
    },
    supplyChainConstraints: {
      maxLeadTime: 6, // Longer lead times due to logistics
      minRecoveryRate: 0.08, // 8%
      maxMaterialUtilization: 0.90 // 90% - more conservative
    }
  };
}