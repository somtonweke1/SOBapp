import { NextRequest, NextResponse } from 'next/server';
import { SCGEPModel, createAfricanMiningSCGEPConfig as createLegacyAfricanConfig, SupplyChainConstraints } from '@/services/sc-gep-model';
import { createAfricanMiningSCGEPConfig, ScenarioType, EnhancedSCGEPConfig } from '@/services/sc-gep-enhanced';
import SCGEPSolver from '@/services/sc-gep-solver';
import { AdvancedSCGEPSolver } from '@/services/sc-gep-advanced-solver';
import { getSolutionCacheService } from '@/services/solution-cache-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
        const {
          scenario = 'baseline',
          region = 'africa',
          constraints = {},
          analysis_type = 'full',
          use_enhanced = true,
          optimization_method = 'standard',
          warm_start_scenario = null,
          multi_scenario = false,
          scenarios_list = [],
          use_cache = true
        } = body;

    const cacheService = getSolutionCacheService();
    const startTime = Date.now();

    if (use_enhanced) {
      // Use enhanced SC-GEP model with African mining configuration
      const scenarioType = scenario as ScenarioType;
      const config: EnhancedSCGEPConfig = createAfricanMiningSCGEPConfig(scenarioType);

      // Apply any custom constraints
      if (Object.keys(constraints).length > 0) {
        Object.assign(config, constraints);
      }

      // Multi-scenario optimization
      if (multi_scenario && scenarios_list.length > 0) {
        const advancedSolver = new AdvancedSCGEPSolver(config);
        const scenarioResults = await advancedSolver.solveMultiScenario(scenarios_list as ScenarioType[]);

        const results: Record<string, any> = {};
        scenarioResults.forEach((solution, scenario) => {
          results[scenario] = {
            objectiveValue: solution.objectiveValue,
            feasibility: solution.feasibility,
            solveTime: solution.solveTime,
            iterations: solution.iterations,
            convergence: solution.convergence,
            costs: solution.costs,
            metrics: solution.metrics
          };
        });

        return NextResponse.json({
          success: true,
          multi_scenario: true,
          results,
          metadata: {
            scenarios: scenarios_list,
            region,
            timestamp: new Date().toISOString(),
            modelVersion: '3.0.0-advanced',
          }
        });
      }

      // Advanced solver with warm start and optimization methods
      let solver;
      if (optimization_method === 'advanced') {
        solver = new AdvancedSCGEPSolver(config);
        const solution = await solver.solveWithWarmStart(warm_start_scenario as ScenarioType | undefined);

        const optimizationMetrics = solver.getOptimizationMetrics();
        let bottleneckAnalysis = null;

        if (analysis_type === 'full' || analysis_type === 'bottlenecks') {
          const enhancedAnalysis = await solver.analyzeBottlenecksWithSensitivity();
          bottleneckAnalysis = {
            ...enhancedAnalysis.bottlenecks,
            sensitivity: Object.fromEntries(enhancedAnalysis.sensitivity),
            criticalPath: enhancedAnalysis.criticalPath
          };
        }

        return NextResponse.json({
          success: true,
          solution: {
            objectiveValue: solution.objectiveValue,
            feasibility: solution.feasibility,
            solveTime: solution.solveTime,
            iterations: solution.iterations,
            convergence: solution.convergence,
            costs: solution.costs,
            metrics: solution.metrics
          },
          bottleneckAnalysis,
          optimizationMetrics,
          metadata: {
            scenario: scenarioType,
            region,
            optimization_method: 'advanced',
            warm_start_used: !!warm_start_scenario,
            timestamp: new Date().toISOString(),
            modelVersion: '3.0.0-advanced',
          }
        });
      }

      // Standard solver with cache support
      solver = new SCGEPSolver(config);

      // Check cache first
      let solution;
      let fromCache = false;

      if (use_cache) {
        const cached = cacheService.get(scenarioType, region);
        if (cached) {
          solution = cached.solution;
          fromCache = true;
        }
      }

      // Compute if not cached
      if (!solution) {
        solution = await solver.solve();

        // Cache the solution
        if (use_cache && solution.feasibility) {
          const computeTime = (Date.now() - startTime) / 1000;
          cacheService.set(scenarioType, region, solution, config, computeTime);
        }
      }

      if (!solution.feasibility) {
        return NextResponse.json({
          success: false,
          error: 'Model is infeasible with given constraints',
          solution: null,
          details: 'Supply chain constraints cannot be satisfied within the planning horizon'
        }, { status: 400 });
      }

      // Perform bottleneck analysis if requested
      let bottleneckAnalysis = null;
      if (analysis_type === 'full' || analysis_type === 'bottlenecks') {
        bottleneckAnalysis = solver.analyzeBottlenecks();
      }

      return NextResponse.json({
        success: true,
        solution: {
          objectiveValue: solution.objectiveValue,
          feasibility: solution.feasibility,
          solveTime: solution.solveTime,
          iterations: solution.iterations,
          convergence: solution.convergence,
          costs: solution.costs,
          metrics: solution.metrics
        },
        bottleneckAnalysis,
        metadata: {
          scenario: scenarioType,
          region,
          fromCache,
          timestamp: new Date().toISOString(),
          modelVersion: '2.0.0-enhanced',
        }
      });
        } else {
          // Use legacy SC-GEP model
          const baseConfig = createLegacyAfricanConfig();
          const customConstraints: Partial<SupplyChainConstraints> = {
            ...baseConfig,
            ...constraints
          };

      const model = new SCGEPModel(customConstraints as SupplyChainConstraints);
      const solution = await model.solve();

      if (!solution.feasibility) {
        return NextResponse.json({
          success: false,
          error: 'Model is infeasible with given constraints',
          solution: null
        }, { status: 400 });
      }

      let analysis = null;
      if (analysis_type === 'full' || analysis_type === 'analysis') {
        analysis = model.analyzeSupplyChain();
      }

      return NextResponse.json({
        success: true,
        solution: {
          objectiveValue: solution.objectiveValue,
          feasibility: solution.feasibility,
          solveTime: solution.solveTime,
          iterations: solution.iterations,
          convergence: solution.convergence
        },
        analysis,
        metadata: {
          scenario,
          timestamp: new Date().toISOString(),
          modelVersion: '1.0.0'
        }
      });
    }

  } catch (error) {
    console.error('SC-GEP API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'default';
    
    // Return default configuration for the specified scenario
    const config = createLegacyAfricanConfig();
    
    return NextResponse.json({
      success: true,
      configuration: config,
      scenarios: {
        default: 'Standard African mining supply chain constraints',
        high_demand: 'High demand growth scenario with material bottlenecks',
        constrained_supply: 'Limited material supply from geopolitical constraints',
        rapid_expansion: 'Aggressive renewable energy deployment scenario'
      },
      metadata: {
        scenario,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('SC-GEP Config API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve configuration'
    }, { status: 500 });
  }
}
