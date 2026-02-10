/**
 * Export and Reporting Service for SC-GEP
 *
 * Provides comprehensive export capabilities in multiple formats
 * and automated reporting generation
 */

import { SCGEPSolution, BottleneckAnalysis } from './sc-gep-solver';
import { EnhancedSCGEPConfig, ScenarioType } from './sc-gep-enhanced';

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'pdf' | 'html';
  includeCharts: boolean;
  includeAnalysis: boolean;
  includeRecommendations: boolean;
  compressOutput: boolean;
}

export interface ReportSection {
  title: string;
  content: string;
  data?: any;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

export interface ComprehensiveReport {
  metadata: {
    title: string;
    generatedAt: Date;
    scenario: ScenarioType;
    region: string;
    version: string;
  };
  executiveSummary: string;
  sections: ReportSection[];
  recommendations: string[];
  appendices: Record<string, any>;
}

export class ExportReportingService {
  /**
   * Export solution to JSON format
   */
  public exportToJSON(
    solution: SCGEPSolution,
    config: EnhancedSCGEPConfig,
    bottlenecks?: BottleneckAnalysis,
    pretty: boolean = true
  ): string {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '3.0.0',
      },
      configuration: {
        planningHorizon: config.planningHorizon,
        materials: config.materials.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          primarySupply: m.primarySupply,
          geopoliticalRisk: m.geopoliticalRisk
        })),
        technologies: config.technologies.map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          capitalCost: t.capitalCost,
          leadTime: t.leadTime
        })),
        zones: config.zones.map(z => ({
          id: z.id,
          name: z.name,
          peakLoad: z.peakLoad,
          demandGrowth: z.demandGrowth
        }))
      },
      solution: {
        objectiveValue: solution.objectiveValue,
        feasibility: solution.feasibility,
        solveTime: solution.solveTime,
        iterations: solution.iterations,
        convergence: solution.convergence,
        costs: solution.costs,
        metrics: solution.metrics
      },
      bottleneckAnalysis: bottlenecks || null
    };

    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Export solution to CSV format
   */
  public exportToCSV(
    solution: SCGEPSolution,
    config: EnhancedSCGEPConfig
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('SC-GEP Solution Export');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value');
    lines.push(`Objective Value,$${solution.objectiveValue.toFixed(2)}`);
    lines.push(`Feasibility,${solution.feasibility}`);
    lines.push(`Solve Time,${solution.solveTime.toFixed(2)}s`);
    lines.push(`Iterations,${solution.iterations}`);
    lines.push(`Convergence,${solution.convergence}`);
    lines.push('');

    // Costs breakdown
    lines.push('Cost Breakdown');
    lines.push('Category,Amount');
    lines.push(`Investment,$${solution.costs.investment.toFixed(2)}`);
    lines.push(`Operational,$${solution.costs.operational.toFixed(2)}`);
    lines.push(`Penalties,$${solution.costs.penalties.toFixed(2)}`);
    lines.push('');

    // Metrics
    lines.push('System Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Capacity,${solution.metrics.totalCapacity.toFixed(2)} MW`);
    lines.push(`Renewable Share,${solution.metrics.renewableShare.toFixed(2)}%`);
    lines.push(`Average Lead Time,${solution.metrics.averageLeadTime.toFixed(2)} years`);
    lines.push('');

    // Material utilization
    lines.push('Material Utilization');
    lines.push('Material,Utilization (tonnes)');
    for (const [material, utilization] of Object.entries(solution.metrics.materialUtilization)) {
      lines.push(`${material},${utilization.toFixed(2)}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate comprehensive report
   */
  public generateComprehensiveReport(
    scenario: ScenarioType,
    region: string,
    solution: SCGEPSolution,
    config: EnhancedSCGEPConfig,
    bottlenecks: BottleneckAnalysis
  ): ComprehensiveReport {
    const report: ComprehensiveReport = {
      metadata: {
        title: `SC-GEP Analysis Report: ${scenario} Scenario - ${region}`,
        generatedAt: new Date(),
        scenario,
        region,
        version: '3.0.0'
      },
      executiveSummary: this.generateExecutiveSummary(solution, bottlenecks),
      sections: [],
      recommendations: [],
      appendices: {}
    };

    // Section 1: Solution Overview
    report.sections.push({
      title: 'Solution Overview',
      content: this.generateSolutionOverview(solution),
      data: {
        objectiveValue: solution.objectiveValue,
        feasibility: solution.feasibility,
        convergence: solution.convergence
      }
    });

    // Section 2: Cost Analysis
    report.sections.push({
      title: 'Cost Analysis',
      content: this.generateCostAnalysis(solution.costs),
      data: solution.costs,
      charts: [this.generateCostPieChart(solution.costs)]
    });

    // Section 3: Capacity Planning
    report.sections.push({
      title: 'Capacity Expansion Planning',
      content: this.generateCapacityAnalysis(solution.metrics, config),
      data: solution.metrics,
      charts: [this.generateCapacityBarChart(solution.metrics)]
    });

    // Section 4: Material Supply Chain Analysis
    report.sections.push({
      title: 'Material Supply Chain Analysis',
      content: this.generateMaterialAnalysis(solution.metrics.materialUtilization, config),
      data: solution.metrics.materialUtilization,
      charts: [this.generateMaterialUtilizationChart(solution.metrics.materialUtilization)]
    });

    // Section 5: Bottleneck Analysis
    report.sections.push({
      title: 'Bottleneck Analysis',
      content: this.generateBottleneckAnalysis(bottlenecks),
      data: bottlenecks,
      charts: [this.generateBottleneckChart(bottlenecks)]
    });

    // Section 6: Technology Mix
    report.sections.push({
      title: 'Technology Portfolio',
      content: this.generateTechnologyAnalysis(config),
      data: { technologies: config.technologies }
    });

    // Recommendations
    report.recommendations = this.generateRecommendations(solution, bottlenecks);

    // Appendices
    report.appendices = {
      configuration: config,
      rawData: solution.variables,
      computationDetails: {
        solveTime: solution.solveTime,
        iterations: solution.iterations
      }
    };

    return report;
  }

  /**
   * Export report to HTML
   */
  public exportReportToHTML(report: ComprehensiveReport): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.metadata.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #27272a;
      background: linear-gradient(to br, #fafafa, #f4f4f5);
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 3rem 2rem;
    }
    .header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
    }
    .metadata {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      font-size: 0.9rem;
      opacity: 0.9;
    }
    .content {
      padding: 2rem;
    }
    .executive-summary {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-radius: 8px;
    }
    .section {
      margin-bottom: 3rem;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 2rem;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section h2 {
      color: #10b981;
      font-weight: 400;
      font-size: 1.8rem;
      margin-bottom: 1rem;
    }
    .section-content {
      color: #52525b;
      margin-bottom: 1.5rem;
    }
    .data-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .data-card {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 1rem;
    }
    .data-card-label {
      font-size: 0.875rem;
      color: #71717a;
      margin-bottom: 0.5rem;
    }
    .data-card-value {
      font-size: 1.5rem;
      font-weight: 300;
      color: #18181b;
    }
    .recommendations {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .recommendations h3 {
      color: #92400e;
      margin-bottom: 1rem;
      font-weight: 500;
    }
    .recommendations ul {
      list-style-position: inside;
      color: #78350f;
    }
    .recommendations li {
      margin-bottom: 0.5rem;
    }
    .footer {
      background: #fafafa;
      padding: 2rem;
      text-align: center;
      color: #71717a;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${report.metadata.title}</h1>
      <div class="metadata">
        <span>📅 Generated: ${report.metadata.generatedAt.toLocaleString()}</span>
        <span>🌍 Region: ${report.metadata.region}</span>
        <span>📊 Scenario: ${report.metadata.scenario}</span>
      </div>
    </div>

    <div class="content">
      <div class="executive-summary">
        <h3 style="color: #065f46; margin-bottom: 1rem; font-weight: 500;">Executive Summary</h3>
        <p>${report.executiveSummary}</p>
      </div>

      ${report.sections.map(section => `
        <div class="section">
          <h2>${section.title}</h2>
          <div class="section-content">${section.content}</div>
          ${section.data ? this.renderDataGrid(section.data) : ''}
        </div>
      `).join('')}

      <div class="recommendations">
        <h3>Key Recommendations</h3>
        <ul>
          ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Generated by MIAR SC-GEP Analytics Platform v${report.metadata.version}</p>
    </div>
  </div>
</body>
</html>
    `;

    return html.trim();
  }

  // Helper methods for report generation

  private generateExecutiveSummary(solution: SCGEPSolution, bottlenecks: BottleneckAnalysis): string {
    const criticalBottlenecks = bottlenecks.materialBottlenecks.filter(b => b.criticality === 'critical').length;
    const renewablePercent = solution.metrics.renewableShare.toFixed(1);

    return `This comprehensive analysis reveals an optimal supply chain-constrained generation expansion plan with a total system cost of $${(solution.objectiveValue / 1e9).toFixed(2)}B over the planning horizon. The solution achieves ${renewablePercent}% renewable energy penetration while managing ${criticalBottlenecks} critical material supply bottlenecks. Investment costs account for $${(solution.costs.investment / 1e9).toFixed(2)}B, with operational costs at $${(solution.costs.operational / 1e9).toFixed(2)}B. The optimization converged with ${solution.convergence} status after ${solution.iterations} iterations in ${solution.solveTime.toFixed(2)} seconds. ${bottlenecks.recommendations.length} strategic recommendations have been identified to improve supply chain resilience and cost-effectiveness.`;
  }

  private generateSolutionOverview(solution: SCGEPSolution): string {
    return `The optimization model successfully converged to a ${solution.convergence} solution with an objective value of $${solution.objectiveValue.toFixed(2)}. The model completed ${solution.iterations} iterations in ${solution.solveTime.toFixed(2)} seconds, demonstrating computational efficiency. Solution feasibility was ${solution.feasibility ? 'confirmed' : 'not achieved'}, meeting all supply chain constraints within the specified planning horizon.`;
  }

  private generateCostAnalysis(costs: SCGEPSolution['costs']): string {
    const total = costs.investment + costs.operational + costs.penalties;
    const investmentPct = (costs.investment / total * 100).toFixed(1);
    const operationalPct = (costs.operational / total * 100).toFixed(1);

    return `Total system costs amount to $${total.toFixed(2)}, with investment costs representing ${investmentPct}% ($${costs.investment.toFixed(2)}) and operational costs ${operationalPct}% ($${costs.operational.toFixed(2)}). Penalty costs of $${costs.penalties.toFixed(2)} indicate ${costs.penalties > 0 ? 'some constraint violations' : 'full compliance with all constraints'}.`;
  }

  private generateCapacityAnalysis(metrics: SCGEPSolution['metrics'], config: EnhancedSCGEPConfig): string {
    return `The optimized capacity expansion plan delivers ${metrics.totalCapacity.toFixed(2)} MW of total generation capacity, with renewables comprising ${metrics.renewableShare.toFixed(1)}% of the portfolio. Average project lead time of ${metrics.averageLeadTime.toFixed(1)} years reflects realistic supply chain constraints across ${config.technologies.length} technology types deployed in ${config.zones.length} geographic zones.`;
  }

  private generateMaterialAnalysis(utilization: Record<string, number>, config: EnhancedSCGEPConfig): string {
    const materials = Object.keys(utilization).length;
    const totalUtilization = Object.values(utilization).reduce((sum, u) => sum + u, 0);

    return `Supply chain analysis covers ${materials} critical materials with cumulative utilization of ${totalUtilization.toFixed(2)} tonnes across the planning horizon. Material intensity factors and lead times significantly influence optimal investment timing and technology selection decisions.`;
  }

  private generateBottleneckAnalysis(bottlenecks: BottleneckAnalysis): string {
    const critical = bottlenecks.materialBottlenecks.filter(b => b.criticality === 'critical').length;
    const high = bottlenecks.materialBottlenecks.filter(b => b.criticality === 'high').length;

    return `Bottleneck analysis identified ${critical} critical and ${high} high-severity material constraints. ${bottlenecks.technologyDelays.length} technology deployment delays were detected due to supply chain constraints. ${bottlenecks.spatialConstraints.filter(s => s.constraint).length} spatial constraints require attention for optimal land utilization.`;
  }

  private generateTechnologyAnalysis(config: EnhancedSCGEPConfig): string {
    const renewable = config.technologies.filter(t => t.type === 'renewable').length;
    const storage = config.technologies.filter(t => t.type === 'storage').length;

    return `The technology portfolio includes ${config.technologies.length} distinct technologies: ${renewable} renewable generation technologies, ${storage} storage systems, and ${config.technologies.length - renewable - storage} conventional technologies. Technology selection optimizes capital costs, operational efficiency, and supply chain feasibility.`;
  }

  private generateRecommendations(solution: SCGEPSolution, bottlenecks: BottleneckAnalysis): string[] {
    const recommendations: string[] = [];

    // Based on bottlenecks
    if (bottlenecks.recommendations.length > 0) {
      recommendations.push(...bottlenecks.recommendations.slice(0, 5).map(r => r.description));
    }

    // Based on renewable share
    if (solution.metrics.renewableShare < 80) {
      recommendations.push('Consider increasing renewable energy targets to 85%+ for long-term cost optimization');
    }

    // Based on penalties
    if (solution.costs.penalties > solution.costs.investment * 0.01) {
      recommendations.push('Penalty costs exceed 1% of investment - review constraint feasibility and timeline');
    }

    return recommendations;
  }

  private generateCostPieChart(costs: SCGEPSolution['costs']): ChartData {
    return {
      type: 'pie',
      title: 'Cost Distribution',
      labels: ['Investment', 'Operational', 'Penalties'],
      datasets: [{
        label: 'Costs',
        data: [costs.investment, costs.operational, costs.penalties],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
      }]
    };
  }

  private generateCapacityBarChart(metrics: SCGEPSolution['metrics']): ChartData {
    return {
      type: 'bar',
      title: 'Capacity Metrics',
      labels: ['Total Capacity (MW)', 'Renewable Share (%)', 'Avg Lead Time (years)'],
      datasets: [{
        label: 'Metrics',
        data: [metrics.totalCapacity, metrics.renewableShare, metrics.averageLeadTime],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
      }]
    };
  }

  private generateMaterialUtilizationChart(utilization: Record<string, number>): ChartData {
    return {
      type: 'bar',
      title: 'Material Utilization (tonnes)',
      labels: Object.keys(utilization),
      datasets: [{
        label: 'Utilization',
        data: Object.values(utilization),
        backgroundColor: '#10b981'
      }]
    };
  }

  private generateBottleneckChart(bottlenecks: BottleneckAnalysis): ChartData {
    const data = [
      bottlenecks.materialBottlenecks.filter(b => b.criticality === 'critical').length,
      bottlenecks.materialBottlenecks.filter(b => b.criticality === 'high').length,
      bottlenecks.materialBottlenecks.filter(b => b.criticality === 'medium').length,
      bottlenecks.materialBottlenecks.filter(b => b.criticality === 'low').length
    ];

    return {
      type: 'bar',
      title: 'Bottleneck Severity Distribution',
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Count',
        data,
        backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#10b981']
      }]
    };
  }

  private renderDataGrid(data: any): string {
    if (typeof data !== 'object') return '';

    const entries = Object.entries(data).slice(0, 6); // Limit to 6 entries
    if (entries.length === 0) return '';

    return `
      <div class="data-grid">
        ${entries.map(([key, value]) => `
          <div class="data-card">
            <div class="data-card-label">${this.formatLabel(key)}</div>
            <div class="data-card-value">${this.formatValue(value)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private formatLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value > 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (value > 1000) return value.toFixed(2);
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }
}

export default ExportReportingService;
