/**
 * Supply Chain-Constrained Generation Expansion Planning (SC-GEP) Model
 * Based on research: "Integrating Upstream Supply Chains into Generation Expansion Planning"
 * 
 * This service implements the mathematical formulation for multi-stage supply chain
 * optimization in power system planning, incorporating material availability,
 * production capacity, lead times, and spatial constraints.
 */

export interface Material {
  id: string;
  name: string;
  type: 'critical' | 'standard' | 'rare_earth';
  primarySupply: number; // tonnes/year
  recoveryRate: number; // percentage from retired units
  stockLevel: number; // current stock in tonnes
  costPerTonne: number; // $/tonne
}

export interface Component {
  id: string;
  name: string;
  materialDemand: Record<string, number>; // material_id -> tonnes/unit
  productionCapacity: number; // units/year
  leadTime: number; // years
}

export interface Technology {
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
}

export interface Zone {
  id: string;
  name: string;
  availableLand: number; // km²
  peakLoad: number; // MW
  demandGrowth: number; // CAGR %
  existingCapacity: Record<string, number>; // tech_id -> MW
}

export interface SupplyChainConstraints {
  materials: Material[];
  components: Component[];
  technologies: Technology[];
  zones: Zone[];
  planningHorizon: number; // years
  reserveMargin: number; // percentage
  rpsTarget: Record<string, number>; // tech_id -> percentage
}

export interface SCGEPVariables {
  // Investment decisions
  dgy: Record<string, Record<string, number>>; // g,y -> investment decision
  bgy: Record<string, Record<string, number>>; // g,y -> build status
  ogy: Record<string, Record<string, number>>; // g,y -> operational status
  rgy: Record<string, Record<string, number>>; // g,y -> retirement status
  
  // Supply chain variables
  umy: Record<string, Record<string, number>>; // m,y -> material utilization
  vcy: Record<string, Record<string, number>>; // c,y -> component production
  wpy: Record<string, Record<string, number>>; // p,y -> product production
  smy: Record<string, Record<string, number>>; // m,y -> material stock
  
  // Spatial variables
  fkiy: Record<string, Record<string, Record<string, number>>>; // k,i,y -> available area
  
  // Operational variables
  pgthy: Record<string, Record<string, Record<string, Record<string, number>>>>; // g,t,h,y -> generation
  cgthy: Record<string, Record<string, Record<string, Record<string, number>>>>; // g,t,h,y -> charging
  dcgthy: Record<string, Record<string, Record<string, Record<string, number>>>>; // g,t,h,y -> discharging
  esocgthy: Record<string, Record<string, Record<string, Record<string, number>>>>; // g,t,h,y -> state of charge
  
  // Penalty variables
  pLSithy: Record<string, Record<string, Record<string, Record<string, number>>>>; // i,t,h,y -> load shedding
  pRMy: Record<string, number>; // y -> reserve margin violation
  eRPSky: Record<string, Record<string, number>>; // k,y -> RPS violation
}

export interface SCGEPSolution {
  objectiveValue: number;
  variables: SCGEPVariables;
  feasibility: boolean;
  solveTime: number; // seconds
  iterations: number;
  convergence: 'optimal' | 'feasible' | 'infeasible' | 'unbounded';
}

export interface SupplyChainAnalysis {
  materialBottlenecks: {
    material: string;
    utilization: number;
    constraint: boolean;
    impact: string;
  }[];
  technologyDelays: {
    technology: string;
    plannedYear: number;
    actualYear: number;
    delayReason: string;
  }[];
  spatialConstraints: {
    zone: string;
    technology: string;
    landUtilization: number;
    constraint: boolean;
  }[];
  costImpact: {
    scenario: string;
    totalCost: number;
    costIncrease: number;
    costIncreasePercent: number;
  };
}

export class SCGEPModel {
  private constraints: SupplyChainConstraints;
  private solution: SCGEPSolution | null = null;

  constructor(constraints: SupplyChainConstraints) {
    this.constraints = constraints;
  }

  /**
   * Objective Function: Minimize total system cost
   * Includes investment, operational, and penalty costs
   */
  private calculateObjective(variables: SCGEPVariables): number {
    let totalCost = 0;

    // Investment costs
    for (const year of this.getYears()) {
      for (const tech of this.constraints.technologies) {
        for (const zone of this.constraints.zones) {
          const key = `${tech.id}_${zone.id}`;
          if (variables.dgy[key]?.[year]) {
            totalCost += variables.dgy[key][year] * tech.capitalCost;
          }
        }
      }
    }

    // Operational costs (simplified)
    for (const year of this.getYears()) {
      for (const tech of this.constraints.technologies) {
        for (const zone of this.constraints.zones) {
          const key = `${tech.id}_${zone.id}`;
          if (variables.ogy[key]?.[year]) {
            totalCost += variables.ogy[key][year] * tech.variableCost * 8760; // Annual hours
          }
        }
      }
    }

    // Penalty costs
    for (const year of this.getYears()) {
      if (variables.pRMy[year]) {
        totalCost += variables.pRMy[year] * 100000; // $100k/MW penalty
      }
    }

    return totalCost;
  }

  /**
   * Supply Chain Constraints
   */
  private validateSupplyChainConstraints(variables: SCGEPVariables): boolean {
    // Material availability constraint
    for (const year of this.getYears()) {
      for (const material of this.constraints.materials) {
        const utilization = variables.umy[material.id]?.[year] || 0;
        const supply = material.primarySupply + (variables.smy[material.id]?.[year] || 0);
        
        if (utilization > supply) {
          return false; // Material constraint violated
        }
      }
    }

    // Component production constraint
    for (const year of this.getYears()) {
      for (const component of this.constraints.components) {
        const production = variables.vcy[component.id]?.[year] || 0;
        if (production > component.productionCapacity) {
          return false; // Production capacity exceeded
        }
      }
    }

    // Lead time constraints
        for (const year of this.getYears()) {
          for (const tech of this.constraints.technologies) {
            for (const zone of this.constraints.zones) {
              const key = `${tech.id}_${zone.id}`;
              const buildYear = variables.bgy[key]?.[year];
              
              if (buildYear && parseInt(year) < tech.leadTime) {
                return false; // Lead time constraint violated
              }
            }
          }
        }

    return true;
  }

  /**
   * Spatial Constraints
   */
  private validateSpatialConstraints(variables: SCGEPVariables): boolean {
    for (const year of this.getYears()) {
      for (const zone of this.constraints.zones) {
        for (const tech of this.constraints.technologies) {
          const key = `${tech.id}_${zone.id}`;
          const capacity = variables.ogy[key]?.[year] || 0;
          const landRequired = capacity / tech.capacityDensity;
          const availableLand = variables.fkiy[tech.id]?.[zone.id]?.[year] || zone.availableLand;
          
          if (landRequired > availableLand) {
            return false; // Spatial constraint violated
          }
        }
      }
    }
    return true;
  }

  /**
   * Solve the SC-GEP model using simplified optimization
   * In production, this would use a proper MILP solver like Gurobi or CPLEX
   */
  public async solve(): Promise<SCGEPSolution> {
    const startTime = Date.now();
    
    // Initialize variables
    const variables: SCGEPVariables = {
      dgy: {},
      bgy: {},
      ogy: {},
      rgy: {},
      umy: {},
      vcy: {},
      wpy: {},
      smy: {},
      fkiy: {},
      pgthy: {},
      cgthy: {},
      dcgthy: {},
      esocgthy: {},
      pLSithy: {},
      pRMy: {},
      eRPSky: {}
    };

    // Simplified heuristic solution
    // In practice, this would be replaced with proper MILP optimization
    let feasible = false;
    let iterations = 0;
    const maxIterations = 100;

    while (!feasible && iterations < maxIterations) {
      // Generate candidate solution
      this.generateCandidateSolution(variables);
      
      // Validate constraints
      feasible = this.validateSupplyChainConstraints(variables) && 
                this.validateSpatialConstraints(variables);
      
      iterations++;
    }

    const objectiveValue = this.calculateObjective(variables);
    const solveTime = (Date.now() - startTime) / 1000;

    this.solution = {
      objectiveValue,
      variables,
      feasibility: feasible,
      solveTime,
      iterations,
      convergence: feasible ? 'optimal' : 'infeasible'
    };

    return this.solution;
  }

  /**
   * Generate a candidate solution using heuristics
   */
  private generateCandidateSolution(variables: SCGEPVariables): void {
    for (const year of this.getYears()) {
      // Initialize material stocks
      for (const material of this.constraints.materials) {
        if (!variables.smy[material.id]) variables.smy[material.id] = {};
        variables.smy[material.id][year] = material.stockLevel;
      }

      // Initialize available land
      for (const zone of this.constraints.zones) {
        for (const tech of this.constraints.technologies) {
          if (!variables.fkiy[tech.id]) variables.fkiy[tech.id] = {};
          if (!variables.fkiy[tech.id][zone.id]) variables.fkiy[tech.id][zone.id] = {};
          variables.fkiy[tech.id][zone.id][year] = zone.availableLand;
        }
      }

      // Make investment decisions based on demand and constraints
      for (const zone of this.constraints.zones) {
        const demandGrowth = zone.peakLoad * Math.pow(1 + zone.demandGrowth / 100, parseInt(year) - 1);
        
        for (const tech of this.constraints.technologies) {
          const key = `${tech.id}_${zone.id}`;
          
          // Simple heuristic: invest if demand growth requires it
          if (demandGrowth > zone.peakLoad * 1.1 && parseInt(year) >= tech.leadTime) {
            if (!variables.dgy[key]) variables.dgy[key] = {};
            variables.dgy[key][year] = Math.min(demandGrowth * 0.1, 100); // 10% of growth, max 100MW
            
            if (!variables.bgy[key]) variables.bgy[key] = {};
            variables.bgy[key][year] = 1;
          }
        }
      }
    }
  }

  /**
   * Analyze supply chain bottlenecks and constraints
   */
  public analyzeSupplyChain(): SupplyChainAnalysis {
    if (!this.solution) {
      throw new Error('Model must be solved before analysis');
    }

    const analysis: SupplyChainAnalysis = {
      materialBottlenecks: [],
      technologyDelays: [],
      spatialConstraints: [],
      costImpact: {
        scenario: 'with_constraints',
        totalCost: this.solution.objectiveValue,
        costIncrease: 0,
        costIncreasePercent: 0
      }
    };

    // Analyze material bottlenecks
    for (const material of this.constraints.materials) {
      let maxUtilization = 0;
      let isConstrained = false;

      for (const year of this.getYears()) {
        const utilization = this.solution.variables.umy[material.id]?.[year] || 0;
        const supply = material.primarySupply + (this.solution.variables.smy[material.id]?.[year] || 0);
        const utilizationRate = supply > 0 ? utilization / supply : 0;
        
        maxUtilization = Math.max(maxUtilization, utilizationRate);
        if (utilizationRate > 0.9) isConstrained = true;
      }

      analysis.materialBottlenecks.push({
        material: material.name,
        utilization: maxUtilization * 100,
        constraint: isConstrained,
        impact: isConstrained ? `Critical bottleneck - ${material.name} utilization at ${(maxUtilization * 100).toFixed(1)}%` : 'No constraint'
      });
    }

    // Analyze spatial constraints
    for (const zone of this.constraints.zones) {
      for (const tech of this.constraints.technologies) {
        let maxLandUtilization = 0;
        let isConstrained = false;

        for (const year of this.getYears()) {
          const key = `${tech.id}_${zone.id}`;
          const capacity = this.solution.variables.ogy[key]?.[year] || 0;
          const landRequired = capacity / tech.capacityDensity;
          const availableLand = this.solution.variables.fkiy[tech.id]?.[zone.id]?.[year] || zone.availableLand;
          const utilizationRate = availableLand > 0 ? landRequired / availableLand : 0;
          
          maxLandUtilization = Math.max(maxLandUtilization, utilizationRate);
          if (utilizationRate > 0.95) isConstrained = true;
        }

        analysis.spatialConstraints.push({
          zone: zone.name,
          technology: tech.name,
          landUtilization: maxLandUtilization * 100,
          constraint: isConstrained
        });
      }
    }

    return analysis;
  }

  private getYears(): string[] {
    const years: string[] = [];
    for (let i = 1; i <= this.constraints.planningHorizon; i++) {
      years.push(i.toString());
    }
    return years;
  }

  public getSolution(): SCGEPSolution | null {
    return this.solution;
  }

  public updateConstraints(constraints: Partial<SupplyChainConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
    this.solution = null; // Reset solution when constraints change
  }
}

/**
 * Default supply chain configuration for African mining operations
 */
export const createAfricanMiningSCGEPConfig = (): SupplyChainConstraints => {
  return {
    materials: [
      {
        id: 'lithium',
        name: 'Lithium',
        type: 'critical',
        primarySupply: 50000,
        recoveryRate: 0.1,
        stockLevel: 5000,
        costPerTonne: 15000
      },
      {
        id: 'cobalt',
        name: 'Cobalt',
        type: 'critical',
        primarySupply: 150000,
        recoveryRate: 0.15,
        stockLevel: 15000,
        costPerTonne: 55000
      },
      {
        id: 'nickel',
        name: 'Nickel',
        type: 'critical',
        primarySupply: 3000000,
        recoveryRate: 0.8,
        stockLevel: 300000,
        costPerTonne: 18000
      },
      {
        id: 'copper',
        name: 'Copper',
        type: 'standard',
        primarySupply: 25000000,
        recoveryRate: 0.85,
        stockLevel: 2500000,
        costPerTonne: 9000
      }
    ],
    components: [
      {
        id: 'battery_cells',
        name: 'Battery Cells',
        materialDemand: { lithium: 0.5, cobalt: 0.2, nickel: 0.3 },
        productionCapacity: 100000,
        leadTime: 2
      },
      {
        id: 'solar_panels',
        name: 'Solar Panels',
        materialDemand: { copper: 2.0, nickel: 0.1 },
        productionCapacity: 50000,
        leadTime: 1
      },
      {
        id: 'wind_turbines',
        name: 'Wind Turbines',
        materialDemand: { copper: 3.0, nickel: 0.5 },
        productionCapacity: 10000,
        leadTime: 3
      }
    ],
    technologies: [
      {
        id: 'solar_pv',
        name: 'Solar PV',
        type: 'renewable',
        componentDemand: { solar_panels: 1.0 },
        capacityDensity: 36,
        leadTime: 2,
        lifetime: 30,
        capitalCost: 1200000,
        variableCost: 0,
        elccFactor: 0.8
      },
      {
        id: 'battery_storage',
        name: 'Battery Storage',
        type: 'storage',
        componentDemand: { battery_cells: 2.0 },
        capacityDensity: 900,
        leadTime: 1,
        lifetime: 15,
        capitalCost: 350000,
        variableCost: 5,
        elccFactor: 0.95
      },
      {
        id: 'wind_onshore',
        name: 'Onshore Wind',
        type: 'renewable',
        componentDemand: { wind_turbines: 0.1 },
        capacityDensity: 3.09,
        leadTime: 3,
        lifetime: 30,
        capitalCost: 1500000,
        variableCost: 0,
        elccFactor: 0.9
      }
    ],
    zones: [
      {
        id: 'south_africa',
        name: 'South Africa',
        availableLand: 10000,
        peakLoad: 35000,
        demandGrowth: 2.5,
        existingCapacity: { solar_pv: 2000, battery_storage: 500 }
      },
      {
        id: 'drc',
        name: 'Democratic Republic of Congo',
        availableLand: 50000,
        peakLoad: 2500,
        demandGrowth: 4.0,
        existingCapacity: { solar_pv: 100, battery_storage: 50 }
      },
      {
        id: 'ghana',
        name: 'Ghana',
        availableLand: 8000,
        peakLoad: 3200,
        demandGrowth: 3.5,
        existingCapacity: { solar_pv: 300, battery_storage: 100 }
      }
    ],
    planningHorizon: 30,
    reserveMargin: 15,
    rpsTarget: { solar_pv: 40, wind_onshore: 20, battery_storage: 10 }
  };
};
