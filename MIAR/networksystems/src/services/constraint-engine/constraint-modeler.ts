/**
 * Constraint Modeler
 * Core engine for modeling and analyzing supply chain constraints
 */

import {
  ConstraintModel,
  ConstraintDependencyGraph,
  ConstraintScenario,
  MitigationAction,
  QuantifiedImpact,
  ConstraintType,
  DigitalTwinState,
  OptimizationResult,
} from './types';

export class ConstraintModeler {
  private constraints: Map<string, ConstraintModel> = new Map();
  private scenarios: Map<string, ConstraintScenario> = new Map();

  /**
   * Add a new constraint to the model
   */
  addConstraint(constraint: ConstraintModel): void {
    this.constraints.set(constraint.id, constraint);
  }

  /**
   * Build dependency graph for constraints
   */
  buildDependencyGraph(constraintIds?: string[]): ConstraintDependencyGraph {
    const constraintsToAnalyze = constraintIds
      ? constraintIds.map(id => this.constraints.get(id)!).filter(Boolean)
      : Array.from(this.constraints.values());

    const graph: ConstraintDependencyGraph = {
      nodes: [],
      edges: [],
    };

    // Build nodes with levels (BFS to determine depth)
    const visited = new Set<string>();
    const queue: Array<{ id: string; level: number }> = [];

    // Start with root constraints (no dependencies)
    constraintsToAnalyze
      .filter(c => c.dependencies.length === 0)
      .forEach(c => {
        queue.push({ id: c.id, level: 0 });
      });

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;

      const constraint = this.constraints.get(id);
      if (!constraint) continue;

      visited.add(id);
      graph.nodes.push({ id, constraint, level });

      // Add downstream constraints to queue
      constraint.downstreamImpacts.forEach(downstreamId => {
        if (!visited.has(downstreamId)) {
          queue.push({ id: downstreamId, level: level + 1 });
        }
      });
    }

    // Build edges
    constraintsToAnalyze.forEach(constraint => {
      constraint.dependencies.forEach(depId => {
        graph.edges.push({
          from: depId,
          to: constraint.id,
          type: 'triggers',
          strength: 1.0,
        });
      });

      constraint.downstreamImpacts.forEach(impactId => {
        graph.edges.push({
          from: constraint.id,
          to: impactId,
          type: 'triggers',
          strength: this.calculateImpactStrength(constraint, impactId),
        });
      });
    });

    return graph;
  }

  /**
   * Calculate the strength of impact between two constraints
   */
  private calculateImpactStrength(from: ConstraintModel, toId: string): number {
    const to = this.constraints.get(toId);
    if (!to) return 0;

    // Impact strength based on:
    // 1. Severity alignment
    // 2. Financial impact correlation
    // 3. Operational overlap

    let strength = 0.5; // base

    // Severity alignment
    const severityScore = {
      critical: 1.0,
      major: 0.75,
      moderate: 0.5,
      minor: 0.25,
    };

    strength += (severityScore[from.severity] + severityScore[to.severity]) / 4;

    // Impact overlap
    const sharedAreas = from.impactArea.filter(area =>
      to.impactArea.includes(area)
    );
    strength += sharedAreas.length * 0.1;

    return Math.min(strength, 1.0);
  }

  /**
   * Quantify total impact of a constraint considering dependencies
   */
  quantifyTotalImpact(constraintId: string): QuantifiedImpact {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) {
      throw new Error(`Constraint ${constraintId} not found`);
    }

    const graph = this.buildDependencyGraph([constraintId]);

    // Aggregate impact from this constraint and all downstream
    const totalImpact: QuantifiedImpact = {
      financial: { min: 0, max: 0, expected: 0, currency: 'USD' },
      operational: {},
      risk: { probability: 1, consequence: 0, riskScore: 0 },
    };

    graph.nodes.forEach(node => {
      const impact = node.constraint.impact;

      // Financial impact (additive with decay factor for downstream)
      const decayFactor = Math.pow(0.8, node.level);
      totalImpact.financial.min += impact.financial.min * decayFactor;
      totalImpact.financial.max += impact.financial.max * decayFactor;
      totalImpact.financial.expected += impact.financial.expected * decayFactor;

      // Operational impact (max of all nodes)
      if (impact.operational.delay) {
        totalImpact.operational.delay = Math.max(
          totalImpact.operational.delay || 0,
          impact.operational.delay
        );
      }

      if (impact.operational.throughputReduction) {
        totalImpact.operational.throughputReduction = Math.max(
          totalImpact.operational.throughputReduction || 0,
          impact.operational.throughputReduction
        );
      }

      // Risk (compound probability)
      totalImpact.risk.probability *= impact.risk.probability;
      totalImpact.risk.consequence = Math.max(
        totalImpact.risk.consequence,
        impact.risk.consequence
      );
    });

    totalImpact.risk.riskScore =
      totalImpact.risk.probability * totalImpact.risk.consequence;

    return totalImpact;
  }

  /**
   * Find optimal mitigation plan for a constraint
   */
  findOptimalMitigation(
    constraintId: string,
    budget?: number
  ): MitigationAction[] {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) {
      throw new Error(`Constraint ${constraintId} not found`);
    }

    // Get all available mitigations
    let mitigations = [...constraint.mitigationOptions];

    // Filter by budget if provided
    if (budget) {
      mitigations = mitigations.filter(m => m.cost <= budget);
    }

    // Sort by ROI (benefit / cost)
    mitigations.sort((a, b) => {
      const roiA = a.npvImpact / (a.cost || 1);
      const roiB = b.npvImpact / (b.cost || 1);
      return roiB - roiA;
    });

    // Use knapsack algorithm for optimal combination
    return this.knapsackMitigation(mitigations, budget);
  }

  /**
   * Knapsack algorithm for optimal mitigation selection
   */
  private knapsackMitigation(
    mitigations: MitigationAction[],
    budget?: number
  ): MitigationAction[] {
    if (!budget) {
      // No budget constraint - return all feasible mitigations
      return mitigations
        .filter(m => m.feasibility >= 0.7)
        .sort((a, b) => b.npvImpact - a.npvImpact);
    }

    const n = mitigations.length;
    const W = Math.floor(budget);
    const dp: number[][] = Array(n + 1)
      .fill(0)
      .map(() => Array(W + 1).fill(0));

    // Build table
    for (let i = 1; i <= n; i++) {
      const mitigation = mitigations[i - 1];
      const cost = Math.floor(mitigation.cost);
      const value = Math.floor(mitigation.npvImpact);

      for (let w = 0; w <= W; w++) {
        if (cost <= w && mitigation.feasibility >= 0.7) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - cost] + value
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    // Backtrack to find selected mitigations
    const selected: MitigationAction[] = [];
    let w = W;

    for (let i = n; i > 0 && w > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        const mitigation = mitigations[i - 1];
        selected.push(mitigation);
        w -= Math.floor(mitigation.cost);
      }
    }

    return selected;
  }

  /**
   * Create a scenario from a set of constraints
   */
  createScenario(
    name: string,
    description: string,
    constraintIds: string[],
    assumptions: Record<string, any> = {}
  ): ConstraintScenario {
    const constraints = constraintIds
      .map(id => this.constraints.get(id))
      .filter(Boolean) as ConstraintModel[];

    // Calculate aggregated impact
    const aggregatedImpact = this.aggregateImpacts(constraints);

    // Find critical path (longest dependency chain)
    const graph = this.buildDependencyGraph(constraintIds);
    const criticalPath = this.findCriticalPath(graph);

    // Find optimal mitigation plan
    const allMitigations = constraints.flatMap(c => c.mitigationOptions);
    const optimalMitigations = this.knapsackMitigation(allMitigations);

    const totalCost = optimalMitigations.reduce((sum, m) => sum + m.cost, 0);
    const expectedBenefit = optimalMitigations.reduce(
      (sum, m) => sum + m.npvImpact,
      0
    );

    const scenario: ConstraintScenario = {
      id: `scenario_${Date.now()}`,
      name,
      description,
      constraints,
      assumptions,
      probability: this.calculateScenarioProbability(constraints),
      aggregatedImpact,
      criticalPath,
      optimalMitigationPlan: {
        actions: optimalMitigations,
        totalCost,
        expectedBenefit,
        roi: totalCost > 0 ? expectedBenefit / totalCost : 0,
        implementationSequence: this.orderMitigationsByDependency(
          optimalMitigations
        ),
      },
      createdAt: new Date(),
    };

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  /**
   * Aggregate impacts from multiple constraints
   */
  private aggregateImpacts(constraints: ConstraintModel[]): QuantifiedImpact {
    return constraints.reduce(
      (total, constraint) => {
        const impact = constraint.impact;

        total.financial.min += impact.financial.min;
        total.financial.max += impact.financial.max;
        total.financial.expected += impact.financial.expected;

        if (impact.operational.delay) {
          total.operational.delay = Math.max(
            total.operational.delay || 0,
            impact.operational.delay
          );
        }

        if (impact.operational.throughputReduction) {
          total.operational.throughputReduction = Math.max(
            total.operational.throughputReduction || 0,
            impact.operational.throughputReduction
          );
        }

        total.risk.probability *= impact.risk.probability;
        total.risk.consequence = Math.max(
          total.risk.consequence,
          impact.risk.consequence
        );

        return total;
      },
      {
        financial: { min: 0, max: 0, expected: 0, currency: 'USD' },
        operational: {},
        risk: { probability: 1, consequence: 0, riskScore: 0 },
      } as QuantifiedImpact
    );
  }

  /**
   * Find critical path in dependency graph (longest path)
   */
  private findCriticalPath(graph: ConstraintDependencyGraph): string[] {
    const paths: string[][] = [];

    // DFS to find all paths
    const dfs = (nodeId: string, path: string[]) => {
      const newPath = [...path, nodeId];

      const outgoingEdges = graph.edges.filter(e => e.from === nodeId);

      if (outgoingEdges.length === 0) {
        paths.push(newPath);
      } else {
        outgoingEdges.forEach(edge => {
          dfs(edge.to, newPath);
        });
      }
    };

    // Start from root nodes
    const rootNodes = graph.nodes.filter(n => n.level === 0);
    rootNodes.forEach(node => dfs(node.id, []));

    // Return longest path
    return paths.reduce(
      (longest, current) =>
        current.length > longest.length ? current : longest,
      []
    );
  }

  /**
   * Calculate scenario probability
   */
  private calculateScenarioProbability(constraints: ConstraintModel[]): number {
    // Joint probability (assuming independence)
    return constraints.reduce(
      (prob, constraint) => prob * constraint.impact.risk.probability,
      1
    );
  }

  /**
   * Order mitigations by dependency
   */
  private orderMitigationsByDependency(
    mitigations: MitigationAction[]
  ): string[] {
    const ordered: string[] = [];
    const remaining = new Set(mitigations.map(m => m.id));

    while (remaining.size > 0) {
      const ready = mitigations.filter(
        m =>
          remaining.has(m.id) &&
          m.dependencies.every(dep => !remaining.has(dep))
      );

      if (ready.length === 0 && remaining.size > 0) {
        // Circular dependency - break it
        const next = Array.from(remaining)[0];
        ordered.push(next);
        remaining.delete(next);
      } else {
        ready.forEach(m => {
          ordered.push(m.id);
          remaining.delete(m.id);
        });
      }
    }

    return ordered;
  }

  /**
   * Simulate digital twin state with constraints
   */
  simulateDigitalTwin(
    baseState: Partial<DigitalTwinState>,
    scenario?: ConstraintScenario
  ): DigitalTwinState {
    const activeConstraints = scenario
      ? scenario.constraints
      : Array.from(this.constraints.values()).filter(
          c => c.status === 'active'
        );

    const constraintGraph = this.buildDependencyGraph(
      activeConstraints.map(c => c.id)
    );

    return {
      mining: baseState.mining || {
        activePits: [],
        currentProduction: 0,
        oreGrade: {},
        equipmentStatus: {},
      },
      processing: baseState.processing || {
        activePlants: [],
        throughput: 0,
        recovery: {},
        inventoryLevels: {},
      },
      logistics: baseState.logistics || {
        activeRoutes: [],
        shipmentStatus: {},
        transportCapacity: 0,
        bottlenecks: [],
      },
      activeConstraints,
      constraintGraph,
      currentScenario: scenario,
      alternativeScenarios: [],
      timestamp: new Date(),
      confidence: 0.85,
    };
  }

  /**
   * Compare multiple scenarios
   */
  compareScenarios(scenarioIds: string[]): {
    scenarios: ConstraintScenario[];
    comparison: {
      metric: string;
      values: Record<string, number>;
      winner: string;
    }[];
  } {
    const scenarios = scenarioIds
      .map(id => this.scenarios.get(id))
      .filter(Boolean) as ConstraintScenario[];

    const comparison = [
      {
        metric: 'Total Expected Impact ($)',
        values: scenarios.reduce(
          (acc, s) => {
            acc[s.id] = s.aggregatedImpact.financial.expected;
            return acc;
          },
          {} as Record<string, number>
        ),
        winner:
          scenarios.sort(
            (a, b) =>
              a.aggregatedImpact.financial.expected -
              b.aggregatedImpact.financial.expected
          )[0]?.id || '',
      },
      {
        metric: 'Risk Score',
        values: scenarios.reduce(
          (acc, s) => {
            acc[s.id] = s.aggregatedImpact.risk.riskScore;
            return acc;
          },
          {} as Record<string, number>
        ),
        winner:
          scenarios.sort(
            (a, b) =>
              a.aggregatedImpact.risk.riskScore -
              b.aggregatedImpact.risk.riskScore
          )[0]?.id || '',
      },
      {
        metric: 'Mitigation ROI',
        values: scenarios.reduce(
          (acc, s) => {
            acc[s.id] = s.optimalMitigationPlan.roi;
            return acc;
          },
          {} as Record<string, number>
        ),
        winner:
          scenarios.sort(
            (a, b) =>
              b.optimalMitigationPlan.roi - a.optimalMitigationPlan.roi
          )[0]?.id || '',
      },
    ];

    return { scenarios, comparison };
  }

  /**
   * Get all constraints of a specific type
   */
  getConstraintsByType(type: ConstraintType): ConstraintModel[] {
    return Array.from(this.constraints.values()).filter(c => c.type === type);
  }

  /**
   * Get active constraints only
   */
  getActiveConstraints(): ConstraintModel[] {
    return Array.from(this.constraints.values()).filter(
      c => c.status === 'active'
    );
  }
}

// Singleton instance
export const constraintModeler = new ConstraintModeler();
