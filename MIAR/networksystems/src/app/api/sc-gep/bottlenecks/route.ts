import { NextRequest, NextResponse } from 'next/server';
import { SCGEPModel, createAfricanMiningSCGEPConfig } from '@/services/sc-gep-model';
import { constraintModeler } from '@/services/constraint-engine/constraint-modeler';
import { ConstraintModel } from '@/services/constraint-engine/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      materials = [],
      technologies = [],
      timeHorizon = 30,
      sensitivity_analysis = false
    } = body;

    // Create model with default configuration
    const config = createAfricanMiningSCGEPConfig();
    
    // Apply custom material constraints if provided
    if (materials.length > 0) {
      config.materials = config.materials.map(material => {
        const customMaterial = materials.find((m: any) => m.id === material.id);
        return customMaterial ? { ...material, ...customMaterial } : material;
      });
    }

    // Apply custom technology constraints if provided
    if (technologies.length > 0) {
      config.technologies = config.technologies.map(tech => {
        const customTech = technologies.find((t: any) => t.id === tech.id);
        return customTech ? { ...tech, ...customTech } : tech;
      });
    }

    config.planningHorizon = timeHorizon;

    const model = new SCGEPModel(config);
    const solution = await model.solve();

    if (!solution.feasibility) {
      return NextResponse.json({
        success: false,
        error: 'Model infeasible with given constraints',
        bottlenecks: null
      }, { status: 400 });
    }

    // Analyze bottlenecks
    const analysis = model.analyzeSupplyChain();

    // Perform sensitivity analysis if requested
    let sensitivityResults = null;
    if (sensitivity_analysis) {
      sensitivityResults = await performSensitivityAnalysis(config, model);
    }

    // Identify critical bottlenecks
    const criticalBottlenecks = analysis.materialBottlenecks.filter(b => b.constraint);
    const spatialBottlenecks = analysis.spatialConstraints.filter(s => s.constraint);

    // Enhance with constraint engine analysis
    const constraintInsights = await enhanceWithConstraintEngine(analysis, criticalBottlenecks);

    return NextResponse.json({
      success: true,
      bottlenecks: {
        material: analysis.materialBottlenecks,
        spatial: analysis.spatialConstraints,
        critical: criticalBottlenecks,
        spatial_critical: spatialBottlenecks
      },
      sensitivity: sensitivityResults,
      recommendations: generateBottleneckRecommendations(analysis),
      constraintInsights, // New: Advanced constraint-based insights
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        model_convergence: solution.convergence,
        solve_time: solution.solveTime
      }
    });

  } catch (error) {
    console.error('Bottleneck Analysis API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze bottlenecks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function performSensitivityAnalysis(config: any, baseModel: SCGEPModel) {
  const sensitivityResults: {
    material_supply: Record<string, any>;
    lead_times: Record<string, any>;
    land_availability: Record<string, any>;
  } = {
    material_supply: {},
    lead_times: {},
    land_availability: {}
  };

  // Material supply sensitivity (±20%)
  for (const material of config.materials) {
    const originalSupply = material.primarySupply;
    
    for (const variation of [-0.2, -0.1, 0.1, 0.2]) {
      const newSupply = originalSupply * (1 + variation);
      const modifiedConfig = { ...config };
      const materialIndex = modifiedConfig.materials.findIndex((m: any) => m.id === material.id);
      modifiedConfig.materials[materialIndex] = { ...material, primarySupply: newSupply };
      
      const testModel = new SCGEPModel(modifiedConfig);
      const solution = await testModel.solve();
      
      if (solution.feasibility) {
        const analysis = testModel.analyzeSupplyChain();
        const baseSolution = baseModel.getSolution();
        sensitivityResults.material_supply[`${material.id}_${variation > 0 ? 'increase' : 'decrease'}_${Math.abs(variation * 100)}%`] = {
          objective_change: baseSolution ? solution.objectiveValue - baseSolution.objectiveValue : 0,
          bottleneck_impact: analysis.materialBottlenecks.find(b => b.material === material.name)?.utilization
        };
      }
    }
  }

  return sensitivityResults;
}

/**
 * Enhance bottleneck analysis with constraint engine insights
 */
async function enhanceWithConstraintEngine(analysis: any, criticalBottlenecks: any[]) {
  try {
    // Initialize constraint modeler if needed
    initializeBottleneckConstraints(criticalBottlenecks);

    const insights = {
      dependencyGraph: null as any,
      cascadingImpacts: [] as any[],
      optimalMitigations: [] as any[],
      riskAssessment: {} as any
    };

    // Build dependency graph for bottlenecks
    const activeConstraints = constraintModeler.getActiveConstraints();
    if (activeConstraints.length > 0) {
      insights.dependencyGraph = constraintModeler.buildDependencyGraph(
        activeConstraints.map(c => c.id)
      );

      // Analyze cascading impacts
      for (const constraint of activeConstraints) {
        const totalImpact = constraintModeler.quantifyTotalImpact(constraint.id);

        insights.cascadingImpacts.push({
          material: constraint.name,
          severity: constraint.severity,
          directImpact: constraint.impact.financial.expected,
          cascadingImpact: totalImpact.financial.expected,
          impactMultiplier: totalImpact.financial.expected / constraint.impact.financial.expected,
          affectedDownstream: constraint.downstreamImpacts.length,
          riskScore: totalImpact.risk.riskScore
        });

        // Find optimal mitigations
        const mitigations = constraintModeler.findOptimalMitigation(constraint.id);
        if (mitigations.length > 0) {
          insights.optimalMitigations.push({
            material: constraint.name,
            topMitigation: {
              name: mitigations[0].name,
              description: mitigations[0].description,
              cost: mitigations[0].cost,
              benefit: mitigations[0].npvImpact,
              roi: mitigations[0].npvImpact / mitigations[0].cost,
              feasibility: mitigations[0].feasibility,
              implementationTime: mitigations[0].implementationTime
            },
            alternatives: mitigations.slice(1, 3).map(m => ({
              name: m.name,
              cost: m.cost,
              benefit: m.npvImpact,
              roi: m.npvImpact / m.cost
            }))
          });
        }
      }

      // Overall risk assessment
      const totalFinancialRisk = insights.cascadingImpacts.reduce(
        (sum, impact) => sum + impact.cascadingImpact,
        0
      );
      const averageRiskScore = insights.cascadingImpacts.reduce(
        (sum, impact) => sum + impact.riskScore,
        0
      ) / insights.cascadingImpacts.length;

      insights.riskAssessment = {
        totalFinancialExposure: totalFinancialRisk,
        averageRiskScore,
        criticalPathLength: insights.dependencyGraph.nodes.reduce(
          (max: number, node: any) => Math.max(max, node.level),
          0
        ) + 1,
        systemicRiskLevel: averageRiskScore > 0.6 ? 'critical' : averageRiskScore > 0.4 ? 'high' : 'medium'
      };
    }

    return insights;
  } catch (error) {
    console.error('Constraint engine enhancement error:', error);
    return null;
  }
}

/**
 * Initialize bottleneck constraints in constraint modeler
 */
function initializeBottleneckConstraints(criticalBottlenecks: any[]) {
  // Clear existing constraints if any
  const existing = constraintModeler.getActiveConstraints();
  if (existing.length > 0) return; // Already initialized

  // Create constraints for critical bottlenecks
  for (const bottleneck of criticalBottlenecks) {
    const severity = bottleneck.utilization > 95 ? 'critical' : bottleneck.utilization > 85 ? 'major' : 'moderate';
    const materialName = bottleneck.material.toLowerCase();

    const constraint: ConstraintModel = {
      id: `bottleneck_${materialName}`,
      type: 'resource',
      name: `${bottleneck.material} Supply Constraint`,
      description: `Critical supply bottleneck in ${bottleneck.material} with ${bottleneck.utilization.toFixed(0)}% utilization`,
      status: 'active',
      severity: severity as 'critical' | 'major' | 'moderate' | 'minor',
      impactArea: ['supply_chain', 'production', 'costs'],
      dependencies: [],
      downstreamImpacts: materialName === 'cobalt' ? ['battery_production'] : materialName === 'lithium' ? ['battery_production'] : [],
      impact: {
        financial: {
          min: estimateMinImpact(bottleneck),
          max: estimateMaxImpact(bottleneck),
          expected: estimateExpectedImpact(bottleneck),
          currency: 'USD'
        },
        operational: {
          delay: Math.ceil(bottleneck.utilization / 2),
          throughputReduction: (bottleneck.utilization - 70) / 100
        },
        risk: {
          probability: bottleneck.utilization / 100,
          consequence: 0.75,
          riskScore: (bottleneck.utilization / 100) * 0.75
        }
      },
      mitigationOptions: generateMitigationOptions(bottleneck),
      timeframe: {
        start: new Date(),
        end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      metadata: { utilization: bottleneck.utilization }
    };

    constraintModeler.addConstraint(constraint);
  }
}

function estimateMinImpact(bottleneck: any): number {
  return bottleneck.utilization * 5000000; // $5M per % utilization
}

function estimateMaxImpact(bottleneck: any): number {
  return bottleneck.utilization * 12000000; // $12M per % utilization
}

function estimateExpectedImpact(bottleneck: any): number {
  return bottleneck.utilization * 8000000; // $8M per % utilization
}

function generateMitigationOptions(bottleneck: any): any[] {
  const materialName = bottleneck.material.toLowerCase();
  const options = [];

  // Universal mitigation: Increase supply
  options.push({
    id: `${materialName}_increase_supply`,
    name: `Increase ${bottleneck.material} Supply`,
    description: `Expand primary supply sources and production capacity`,
    type: 'preventive' as const,
    cost: 25000000 + bottleneck.utilization * 300000,
    timeToImplement: 180 * 24,
    implementationTime: 180,
    effectiveness: 0.6,
    npvImpact: estimateExpectedImpact(bottleneck) * 0.6,
    riskReduction: 0.45,
    feasibility: 0.75,
    dependencies: []
  });

  // Material-specific mitigations
  if (materialName === 'cobalt' || materialName === 'lithium') {
    options.push({
      id: `${materialName}_recycling`,
      name: `${bottleneck.material} Recycling Program`,
      description: `Implement closed-loop recycling to reduce primary supply dependency`,
      type: 'preventive' as const,
      cost: 50000000,
      timeToImplement: 365 * 24,
      implementationTime: 365,
      effectiveness: 0.5,
      npvImpact: estimateExpectedImpact(bottleneck) * 0.4,
      riskReduction: 0.35,
      feasibility: 0.8,
      dependencies: []
    });

    options.push({
      id: `${materialName}_substitution`,
      name: `Material Substitution Research`,
      description: `Invest in alternative materials and battery chemistries`,
      type: 'preventive' as const,
      cost: 100000000,
      timeToImplement: 730 * 24,
      implementationTime: 730,
      effectiveness: 0.7,
      npvImpact: estimateExpectedImpact(bottleneck) * 0.7,
      riskReduction: 0.6,
      feasibility: 0.6,
      dependencies: []
    });
  }

  // Geographic diversification
  options.push({
    id: `${materialName}_diversification`,
    name: `Geographic Diversification`,
    description: `Establish supply agreements with multiple regions`,
    type: 'corrective' as const,
    cost: 15000000,
    timeToImplement: 120 * 24,
    implementationTime: 120,
    effectiveness: 0.5,
    npvImpact: estimateExpectedImpact(bottleneck) * 0.35,
    riskReduction: 0.3,
    feasibility: 0.85,
    dependencies: []
  });

  return options;
}

function generateBottleneckRecommendations(analysis: any) {
  const recommendations = [];

  // Material bottleneck recommendations
  const criticalMaterials = analysis.materialBottlenecks.filter((b: any) => b.constraint);
  if (criticalMaterials.length > 0) {
    recommendations.push({
      type: 'material_diversification',
      priority: 'high',
      title: 'Material Supply Diversification',
      description: `Critical bottlenecks detected in ${criticalMaterials.map((m: any) => m.material).join(', ')}`,
      actions: [
        'Establish alternative supply sources',
        'Increase recycling rates',
        'Invest in material substitution technologies',
        'Build strategic material reserves'
      ],
      estimated_impact: 'Reduce supply chain risk by 40-60%'
    });
  }

  // Spatial constraint recommendations
  const criticalSpatial = analysis.spatialConstraints.filter((s: any) => s.constraint);
  if (criticalSpatial.length > 0) {
    recommendations.push({
      type: 'spatial_optimization',
      priority: 'medium',
      title: 'Land Use Optimization',
      description: `Land constraints detected in ${criticalSpatial.map((s: any) => `${s.zone} (${s.technology})`).join(', ')}`,
      actions: [
        'Optimize technology mix for land efficiency',
        'Consider offshore alternatives',
        'Implement vertical integration strategies',
        'Explore shared infrastructure options'
      ],
      estimated_impact: 'Improve land utilization by 25-35%'
    });
  }

  // Technology delay recommendations
  if (analysis.technologyDelays && analysis.technologyDelays.length > 0) {
    recommendations.push({
      type: 'lead_time_management',
      priority: 'high',
      title: 'Lead Time Management',
      description: 'Technology deployment delays identified',
      actions: [
        'Pre-order critical components',
        'Establish local manufacturing partnerships',
        'Implement modular deployment strategies',
        'Create contingency plans for delays'
      ],
      estimated_impact: 'Reduce deployment delays by 30-50%'
    });
  }

  return recommendations;
}
