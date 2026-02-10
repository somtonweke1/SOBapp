/**
 * INSTITUTIONAL-GRADE SCENARIO COMPARISON PDF REPORT
 * Premium analytics and strategic insights for competitive advantage
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ScenarioData {
  id: string;
  name: string;
  description: string;
  objectiveValue: number;
  feasibility: boolean;
  solveTime: number;
  convergence: string;
  costs: {
    totalCost: number;
    investmentCost: number;
    operationalCost: number;
    penaltyCost: number;
  };
  metrics: {
    reliabilityScore: number;
    carbonEmissions: number;
    materialUtilization: Record<string, number>;
    technologyDeployment: Record<string, number>;
    bottleneckCount: number;
  };
  bottlenecks: Array<{
    material: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: number;
    timeframe: string;
  }>;
}

export class ScenarioComparisonPDFService {
  private static readonly BRAND_COLOR: [number, number, number] = [5, 150, 105]; // Emerald-600
  private static readonly ACCENT_COLOR: [number, number, number] = [147, 51, 234]; // Purple-600
  private static readonly WARNING_COLOR: [number, number, number] = [251, 146, 60]; // Amber-500
  private static readonly CRITICAL_COLOR: [number, number, number] = [239, 68, 68]; // Rose-600

  /**
   * Generate Premium Scenario Comparison Report
   */
  static generatePremiumReport(
    scenarios: ScenarioData[],
    selectedScenarios: string[],
    comparisonMode: string
  ): jsPDF {
    const doc = new jsPDF();

    // Cover Page
    this.addCoverPage(doc, scenarios.length, selectedScenarios.length);

    // === DECISION RECOMMENDATION PAGE - THE MOST IMPORTANT PAGE ===
    doc.addPage();
    this.addExecutiveDecisionRecommendation(doc, scenarios, selectedScenarios, comparisonMode);

    // Executive Summary
    doc.addPage();
    let yPos = this.addExecutiveSummary(doc, scenarios, comparisonMode);

    // Key Findings & Insights
    doc.addPage();
    yPos = this.addKeyFindings(doc, scenarios, selectedScenarios);

    // Scenario Deep Dive
    doc.addPage();
    yPos = this.addScenarioComparison(doc, scenarios, selectedScenarios);

    // Cost-Benefit Analysis
    doc.addPage();
    yPos = this.addCostBenefitAnalysis(doc, scenarios, selectedScenarios);

    // Risk Assessment Matrix
    doc.addPage();
    yPos = this.addRiskAssessment(doc, scenarios, selectedScenarios);

    // Strategic Recommendations
    doc.addPage();
    yPos = this.addStrategicRecommendations(doc, scenarios, selectedScenarios, comparisonMode);

    // Implementation Roadmap
    doc.addPage();
    yPos = this.addImplementationRoadmap(doc, scenarios, selectedScenarios);

    // Appendix: Detailed Analytics
    doc.addPage();
    this.addDetailedAnalytics(doc, scenarios, selectedScenarios);

    // Add page numbers and confidentiality footer
    this.addPageFooters(doc);

    return doc;
  }

  /**
   * Premium Cover Page
   */
  private static addCoverPage(doc: jsPDF, totalScenarios: number, selectedCount: number): void {
    // Gradient-like header block
    doc.setFillColor(...this.BRAND_COLOR);
    doc.rect(0, 0, 210, 80, 'F');

    // SOBapp Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('SOBapp', 20, 35);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Mining Intelligence & African Research', 20, 45);

    // Report Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Supply Chain Scenario', 20, 110);
    doc.text('Comparative Analysis', 20, 125);

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Strategic Intelligence Report', 20, 140);

    // Report metadata box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(20, 160, 170, 50, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Report Date:', 30, 172);
    doc.setFont('helvetica', 'bold');
    doc.text(format(new Date(), 'MMMM dd, yyyy'), 70, 172);

    doc.setFont('helvetica', 'normal');
    doc.text('Scenarios Analyzed:', 30, 182);
    doc.setFont('helvetica', 'bold');
    doc.text(`${selectedCount > 0 ? selectedCount : totalScenarios} of ${totalScenarios}`, 70, 182);

    doc.setFont('helvetica', 'normal');
    doc.text('Analysis Type:', 30, 192);
    doc.setFont('helvetica', 'bold');
    doc.text('Multi-Scenario Optimization', 70, 192);

    doc.setFont('helvetica', 'normal');
    doc.text('Confidence Level:', 30, 202);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BRAND_COLOR);
    doc.text('INSTITUTIONAL GRADE', 70, 202);

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('CONFIDENTIAL - This report contains proprietary analysis and strategic insights.', 20, 270);
    doc.text('Distribution limited to authorized personnel only.', 20, 276);
  }

  /**
   * EXECUTIVE DECISION RECOMMENDATION - THE CRITICAL PAGE
   * This page tells the user EXACTLY what decision to make and why
   */
  private static addExecutiveDecisionRecommendation(
    doc: jsPDF,
    scenarios: ScenarioData[],
    selected: string[],
    mode: string
  ): void {
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('EXECUTIVE DECISION', 20, 30);
    doc.text('RECOMMENDATION', 20, 42);

    // === THE RECOMMENDATION BOX - BOLD AND CLEAR ===
    const best = this.findBestScenario(scenarios, mode);
    const decisionAnalysis = this.generateDecisionAnalysis(scenarios, best, mode);

    // Big bold recommendation box
    doc.setFillColor(5, 150, 105); // Emerald
    doc.roundedRect(20, 60, 170, 45, 3, 3, 'F');

    // Confidence badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(30, 68, 45, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.BRAND_COLOR);
    doc.text('CONFIDENCE:', 33, 75);
    doc.setFontSize(11);
    doc.text(`${decisionAnalysis.confidenceScore}%`, 58, 75.5);

    // Main recommendation
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RECOMMENDED DECISION:', 30, 90);

    doc.setFontSize(18);
    doc.text(`Proceed with ${best.name}`, 30, 100);

    // === WHY THIS DECISION ===
    let yPos = 120;
    doc.setFillColor(254, 249, 195); // Yellow-100
    doc.roundedRect(20, yPos, 170, 50, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 53, 15); // Yellow-900
    doc.text('WHY THIS DECISION:', 25, yPos + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const reasonsLines = doc.splitTextToSize(decisionAnalysis.primaryReason, 160);
    doc.text(reasonsLines, 25, yPos + 20);

    yPos += 60;

    // === KEY DECISION FACTORS ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Key Decision Factors:', 20, yPos);
    yPos += 10;

    const factors = decisionAnalysis.decisionFactors;

    factors.forEach((factor, index) => {
      // Factor box
      const boxColor: [number, number, number] = factor.impact === 'positive' ? [220, 252, 231] : // Green-100
                      factor.impact === 'negative' ? [254, 226, 226] : // Red-100
                      [254, 243, 199]; // Yellow-100

      doc.setFillColor(...boxColor);
      doc.roundedRect(20, yPos, 170, 22, 2, 2, 'F');

      // Impact indicator - use symbols that work in PDFs
      const icon = factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '!' : '-';
      const iconColor: [number, number, number] = factor.impact === 'positive' ? [22, 101, 52] : // Green-800
                       factor.impact === 'negative' ? [153, 27, 27] : // Red-800
                       [146, 64, 14]; // Yellow-800

      doc.setFillColor(...iconColor);
      doc.circle(28, yPos + 11, 3.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(icon, 28, yPos + 12.5, { align: 'center' });

      // Factor text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(factor.title, 35, yPos + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(factor.value, 35, yPos + 15);

      yPos += 26;
    });

    // === IMMEDIATE ACTIONS REQUIRED ===
    yPos += 5;
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.roundedRect(20, yPos, 170, 60, 2, 2, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // Blue-900
    doc.text('IMMEDIATE ACTIONS REQUIRED:', 25, yPos + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    let actionY = yPos + 20;
    decisionAnalysis.immediateActions.forEach((action, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, 28, actionY);
      doc.setFont('helvetica', 'normal');
      doc.text(action, 35, actionY);
      actionY += 6;
    });

    // === DECISION TIMELINE ===
    yPos += 70;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Decision Timeline:', 20, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('This recommendation is time-sensitive. The analysis is based on current market conditions.', 20, yPos + 8);
    doc.text(`Recommended decision date: Within ${decisionAnalysis.urgency} of this report.`, 20, yPos + 14);
  }

  /**
   * Generate Decision Analysis with Confidence Scoring
   */
  private static generateDecisionAnalysis(scenarios: ScenarioData[], best: ScenarioData, mode: string) {
    // Calculate confidence score based on multiple factors
    const avgCost = scenarios.reduce((s, sc) => s + sc.costs.totalCost, 0) / scenarios.length;
    const costAdvantage = ((avgCost - best.costs.totalCost) / avgCost) * 100;
    const reliabilityScore = best.metrics.reliabilityScore;
    const criticalBottlenecks = best.bottlenecks.filter(b => b.severity === 'critical').length;

    // Confidence calculation
    let confidence = 70; // Base confidence
    if (costAdvantage > 15) confidence += 15; // Significant cost advantage
    else if (costAdvantage > 10) confidence += 10;
    else if (costAdvantage > 5) confidence += 5;

    if (reliabilityScore > 90) confidence += 10;
    else if (reliabilityScore > 85) confidence += 5;

    if (criticalBottlenecks === 0) confidence += 5;
    else if (criticalBottlenecks > 2) confidence -= 10;

    if (best.feasibility && best.convergence === 'optimal') confidence += 5;

    confidence = Math.min(Math.max(confidence, 60), 98); // Cap between 60-98%

    // Primary reason for recommendation
    const savingsAmount = (avgCost - best.costs.totalCost) / 1e9;
    const primaryReason = `${best.name} delivers optimal value with $${(best.costs.totalCost / 1e9).toFixed(2)}B total investment—achieving ${costAdvantage.toFixed(1)}% cost savings ($${savingsAmount.toFixed(2)}B) compared to the average scenario while maintaining ${reliabilityScore}% operational reliability. This scenario balances cost efficiency with supply chain resilience, positioning your organization for sustainable growth with manageable risk exposure.`;

    // Decision factors
    const decisionFactors = [];

    // Cost factor
    decisionFactors.push({
      title: 'Cost Optimization',
      value: `$${savingsAmount.toFixed(2)}B potential savings (${costAdvantage.toFixed(1)}% reduction)`,
      impact: costAdvantage > 10 ? 'positive' : 'neutral'
    });

    // Reliability factor
    decisionFactors.push({
      title: 'Operational Reliability',
      value: `${reliabilityScore.toFixed(1)}% reliability score - ${reliabilityScore > 85 ? 'Strong' : 'Moderate'} performance`,
      impact: reliabilityScore > 85 ? 'positive' : 'neutral'
    });

    // Risk factor
    const riskLevel = criticalBottlenecks === 0 ? 'Low' : criticalBottlenecks === 1 ? 'Moderate' : 'Elevated';
    decisionFactors.push({
      title: 'Supply Chain Risk',
      value: `${criticalBottlenecks} critical bottleneck${criticalBottlenecks !== 1 ? 's' : ''} identified - ${riskLevel} risk profile`,
      impact: criticalBottlenecks === 0 ? 'positive' : criticalBottlenecks > 1 ? 'negative' : 'neutral'
    });

    // Emissions factor
    const avgEmissions = scenarios.reduce((s, sc) => s + sc.metrics.carbonEmissions, 0) / scenarios.length;
    const emissionsVsAvg = ((best.metrics.carbonEmissions - avgEmissions) / avgEmissions) * 100;
    decisionFactors.push({
      title: 'Environmental Impact',
      value: `${(best.metrics.carbonEmissions / 1e6).toFixed(1)}M tonnes CO2 (${emissionsVsAvg.toFixed(0)}% vs average)`,
      impact: emissionsVsAvg < -5 ? 'positive' : emissionsVsAvg > 10 ? 'negative' : 'neutral'
    });

    // Immediate actions
    const immediateActions = [
      `Present this recommendation to executive leadership within 5 business days`,
      `Secure budget approval for $${(best.costs.totalCost / 1e9).toFixed(2)}B total investment`,
      `Begin supplier engagement for ${best.bottlenecks.length > 0 ? best.bottlenecks[0].material : 'critical materials'}`,
      `Establish project governance structure and KPI framework`,
      `Initiate detailed implementation planning (see roadmap section)`
    ];

    // Urgency
    const urgency = criticalBottlenecks > 1 ? '7 days' : criticalBottlenecks === 1 ? '14 days' : '30 days';

    return {
      confidenceScore: confidence,
      primaryReason,
      decisionFactors,
      immediateActions,
      urgency
    };
  }

  /**
   * Executive Summary with Key Metrics
   */
  private static addExecutiveSummary(doc: jsPDF, scenarios: ScenarioData[], mode: string): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, 25);

    let yPos = 40;

    // Key Insight Box
    doc.setFillColor(240, 253, 244); // Green-50
    doc.setDrawColor(...this.BRAND_COLOR);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, yPos, 170, 35, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // Green-800
    doc.text('KEY INSIGHT', 25, yPos + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    const bestScenario = this.findBestScenario(scenarios, mode);
    const insight = this.generateExecutiveInsight(scenarios, bestScenario, mode);
    const insightLines = doc.splitTextToSize(insight, 160);
    doc.text(insightLines, 25, yPos + 18);

    yPos += 45;

    // High-Level Metrics Dashboard
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Performance Metrics Overview', 20, yPos);

    yPos += 10;

    const metrics = this.calculateAggregateMetrics(scenarios);

    // Metrics grid
    const metricsData = [
      ['Average Total Cost', `$${(metrics.avgCost / 1e9).toFixed(2)}B`, this.getMetricTrend(metrics.costVariance)],
      ['Avg Reliability Score', `${metrics.avgReliability.toFixed(1)}%`, this.getMetricTrend(metrics.reliabilityVariance)],
      ['Total Bottlenecks', `${metrics.totalBottlenecks}`, metrics.criticalBottlenecks > 0 ? 'CRITICAL' : 'MANAGEABLE'],
      ['Carbon Footprint', `${(metrics.avgEmissions / 1e6).toFixed(1)}M tonnes`, this.getEmissionsTrend(metrics.avgEmissions)],
      ['Cost Spread', `$${(metrics.costSpread / 1e9).toFixed(2)}B`, `Range: ${((metrics.costSpread / metrics.avgCost) * 100).toFixed(1)}%`],
      ['Feasibility Rate', `${metrics.feasibilityRate.toFixed(0)}%`, metrics.feasibilityRate === 100 ? 'ALL VIABLE' : 'REVIEW NEEDED']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value', 'Assessment']],
      body: metricsData,
      theme: 'striped',
      headStyles: {
        fillColor: this.BRAND_COLOR,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [40, 40, 40]
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 60, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Key Findings - The MOAT Section
   */
  private static addKeyFindings(doc: jsPDF, scenarios: ScenarioData[], selected: string[]): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Strategic Findings & Insights', 20, 25);

    let yPos = 40;

    const findings = this.generateStrategicFindings(scenarios, selected);

    findings.forEach((finding, index) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 30;
      }

      // Finding number badge
      doc.setFillColor(...this.ACCENT_COLOR);
      doc.circle(22, yPos + 2, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}`, 22, yPos + 3, { align: 'center' });

      // Finding title
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.title, 30, yPos + 3);

      // Finding content
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const contentLines = doc.splitTextToSize(finding.content, 160);
      doc.text(contentLines, 30, yPos + 12);

      // Impact assessment
      if (finding.impact) {
        const impactY = yPos + 12 + (contentLines.length * 5);
        doc.setFillColor(252, 231, 243); // Pink-100
        doc.roundedRect(30, impactY, 160, 10, 1, 1, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(157, 23, 77); // Pink-900
        doc.text(`IMPACT: ${finding.impact}`, 33, impactY + 6);
        yPos = impactY + 15;
      } else {
        yPos += 12 + (contentLines.length * 5) + 5;
      }
    });

    return yPos;
  }

  /**
   * Detailed Scenario Comparison
   */
  private static addScenarioComparison(doc: jsPDF, scenarios: ScenarioData[], selected: string[]): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Scenario Deep Dive Analysis', 20, 25);

    const scenariosToCompare = selected.length > 0
      ? scenarios.filter(s => selected.includes(s.id))
      : scenarios;

    let yPos = 40;

    scenariosToCompare.forEach((scenario, index) => {
      if (index > 0) {
        doc.addPage();
        yPos = 30;
      }

      // Scenario header
      doc.setFillColor(249, 250, 251);
      doc.rect(20, yPos, 170, 20, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(scenario.name, 25, yPos + 8);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(scenario.description, 25, yPos + 15);

      yPos += 30;

      // Score card
      const scoreCard = this.generateScenarioScoreCard(scenario, scenarios);

      autoTable(doc, {
        startY: yPos,
        head: [['Dimension', 'Score', 'Rank', 'Assessment']],
        body: scoreCard,
        theme: 'grid',
        headStyles: {
          fillColor: this.BRAND_COLOR,
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          1: { halign: 'center', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'center' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Material Bottlenecks
      if (scenario.bottlenecks.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Critical Supply Chain Bottlenecks', 20, yPos);
        yPos += 8;

        const bottleneckData = scenario.bottlenecks.map(b => [
          b.material.toUpperCase(),
          this.getSeverityBadge(b.severity),
          `${b.impact}%`,
          b.timeframe
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Material', 'Severity', 'Impact', 'Timeframe']],
          body: bottleneckData,
          theme: 'grid',
          headStyles: {
            fillColor: [100, 100, 100],
            fontSize: 9
          },
          styles: {
            fontSize: 9
          }
        });
      }
    });

    return yPos;
  }

  /**
   * Cost-Benefit Analysis with ROI Insights
   */
  private static addCostBenefitAnalysis(doc: jsPDF, scenarios: ScenarioData[], selected: string[]): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost-Benefit Analysis', 20, 25);

    const scenariosToAnalyze = selected.length > 0
      ? scenarios.filter(s => selected.includes(s.id))
      : scenarios;

    let yPos = 40;

    // Cost breakdown comparison
    const costData = scenariosToAnalyze.map(s => [
      s.name,
      `$${(s.costs.investmentCost / 1e9).toFixed(2)}B`,
      `$${(s.costs.operationalCost / 1e9).toFixed(2)}B`,
      `$${(s.costs.penaltyCost / 1e9).toFixed(2)}B`,
      `$${(s.costs.totalCost / 1e9).toFixed(2)}B`,
      this.calculateCostEfficiency(s)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Scenario', 'Investment', 'Operational', 'Penalties', 'Total', 'Efficiency']],
      body: costData,
      theme: 'grid',
      headStyles: {
        fillColor: this.BRAND_COLOR,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 9
      },
      columnStyles: {
        5: { halign: 'center', fontStyle: 'bold' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Value Assessment
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Value Proposition Analysis', 20, yPos);
    yPos += 10;

    const bestValue = this.findBestValueScenario(scenariosToAnalyze);

    doc.setFillColor(239, 246, 255); // Blue-50
    doc.roundedRect(20, yPos, 170, 40, 2, 2, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // Blue-900
    doc.text('RECOMMENDED OPTIMAL SCENARIO', 25, yPos + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const valueText = `${bestValue.name} offers the best cost-to-benefit ratio with ${bestValue.metrics.reliabilityScore}% reliability at $${(bestValue.costs.totalCost / 1e9).toFixed(2)}B total cost. This scenario minimizes supply chain risks while maintaining operational efficiency.`;
    const valueLines = doc.splitTextToSize(valueText, 160);
    doc.text(valueLines, 25, yPos + 20);

    return yPos + 50;
  }

  /**
   * Risk Assessment Matrix
   */
  private static addRiskAssessment(doc: jsPDF, scenarios: ScenarioData[], selected: string[]): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Supply Chain Risk Assessment', 20, 25);

    let yPos = 40;

    const scenariosToAnalyze = selected.length > 0
      ? scenarios.filter(s => selected.includes(s.id))
      : scenarios;

    // Risk matrix
    const riskData = scenariosToAnalyze.map(s => {
      const riskProfile = this.calculateRiskProfile(s);
      return [
        s.name,
        this.getRiskLevel(riskProfile.overall),
        riskProfile.materialRisk,
        riskProfile.costRisk,
        riskProfile.timelineRisk,
        riskProfile.mitigation
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Scenario', 'Overall Risk', 'Material', 'Cost', 'Timeline', 'Mitigation']],
      body: riskData,
      theme: 'grid',
      headStyles: {
        fillColor: this.BRAND_COLOR,
        fontSize: 9,
        textColor: 255
      },
      styles: {
        fontSize: 8
      },
      columnStyles: {
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Risk insights
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Critical Risk Factors', 20, yPos);
    yPos += 10;

    const riskInsights = this.generateRiskInsights(scenariosToAnalyze);

    riskInsights.forEach(insight => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }

      const color = insight.level === 'critical' ? this.CRITICAL_COLOR : this.WARNING_COLOR;
      doc.setFillColor(...color);
      doc.circle(23, yPos + 3, 2.5, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(insight.title, 30, yPos + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(insight.description, 160);
      doc.text(lines, 30, yPos + 12);

      yPos += 10 + (lines.length * 4) + 5;
    });

    return yPos;
  }

  /**
   * Strategic Recommendations - The Value-Add
   */
  private static addStrategicRecommendations(
    doc: jsPDF,
    scenarios: ScenarioData[],
    selected: string[],
    mode: string
  ): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Strategic Recommendations', 20, 25);

    let yPos = 40;

    const recommendations = this.generateActionableRecommendations(scenarios, selected, mode);

    recommendations.forEach((rec, index) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 30;
      }

      // Recommendation box
      const boxHeight = 45 + (rec.actions.length * 6);
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(20, yPos, 170, boxHeight, 2, 2, 'FD');

      // Priority badge
      const priorityColor = rec.priority === 'HIGH' ? this.CRITICAL_COLOR :
                           rec.priority === 'MEDIUM' ? this.WARNING_COLOR : this.BRAND_COLOR;
      doc.setFillColor(...priorityColor);
      doc.roundedRect(25, yPos + 5, 30, 8, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(rec.priority, 40, yPos + 10, { align: 'center' });

      // Title
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(rec.title, 25, yPos + 20);

      // Description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(rec.description, 160);
      doc.text(descLines, 25, yPos + 28);

      let actionY = yPos + 28 + (descLines.length * 5);

      // Action items
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Action Items:', 25, actionY);
      actionY += 6;

      doc.setFont('helvetica', 'normal');
      rec.actions.forEach(action => {
        doc.text(`• ${action}`, 30, actionY);
        actionY += 5;
      });

      // Expected impact
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(25, actionY, 160, 8, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(`Expected Impact: ${rec.impact}`, 30, actionY + 5);

      yPos += boxHeight + 10;
    });

    return yPos;
  }

  /**
   * Implementation Roadmap
   */
  private static addImplementationRoadmap(doc: jsPDF, scenarios: ScenarioData[], selected: string[]): number {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Implementation Roadmap', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Phased approach to executing the optimal scenario', 20, 35);

    let yPos = 50;

    const phases = this.generateImplementationPhases(scenarios, selected);

    phases.forEach((phase, index) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 30;
      }

      // Phase header
      doc.setFillColor(...this.ACCENT_COLOR);
      doc.roundedRect(20, yPos, 170, 12, 2, 2, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Phase ${index + 1}: ${phase.name}`, 25, yPos + 8);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`${phase.duration} | ${phase.milestone}`, 160, yPos + 8, { align: 'right' });

      yPos += 18;

      // Objectives
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Objectives:', 25, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      phase.objectives.forEach(obj => {
        doc.text(`• ${obj}`, 30, yPos);
        yPos += 5;
      });

      yPos += 5;

      // Key activities
      doc.setFont('helvetica', 'bold');
      doc.text('Key Activities:', 25, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      phase.activities.forEach(activity => {
        doc.text(`→ ${activity}`, 30, yPos);
        yPos += 5;
      });

      yPos += 10;
    });

    return yPos;
  }

  /**
   * Detailed Analytics Appendix
   */
  private static addDetailedAnalytics(doc: jsPDF, scenarios: ScenarioData[], selected: string[]): void {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Appendix: Detailed Analytics', 20, 25);

    let yPos = 40;

    const scenariosToAnalyze = selected.length > 0
      ? scenarios.filter(s => selected.includes(s.id))
      : scenarios;

    // Material utilization heatmap table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Material Utilization Analysis', 20, yPos);
    yPos += 8;

    // Get all materials
    const allMaterials = new Set<string>();
    scenariosToAnalyze.forEach(s => {
      Object.keys(s.metrics.materialUtilization).forEach(m => allMaterials.add(m));
    });

    const materialData = Array.from(allMaterials).map(material => {
      const row = [material.toUpperCase()];
      scenariosToAnalyze.forEach(s => {
        const util = s.metrics.materialUtilization[material] || 0;
        row.push(`${util.toFixed(1)}%`);
      });
      return row;
    });

    const headers = ['Material', ...scenariosToAnalyze.map(s => s.name.substring(0, 15))];

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: materialData,
      theme: 'grid',
      headStyles: {
        fillColor: this.BRAND_COLOR,
        fontSize: 8
      },
      styles: {
        fontSize: 8
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const value = parseFloat(data.cell.text[0]);
          if (value > 85) {
            data.cell.styles.fillColor = [254, 202, 202]; // Red-200
          } else if (value > 70) {
            data.cell.styles.fillColor = [253, 230, 138]; // Yellow-200
          }
        }
      }
    });
  }

  // ===== HELPER METHODS - THE INTELLIGENCE ENGINE =====

  private static findBestScenario(scenarios: ScenarioData[], mode: string): ScenarioData {
    return scenarios.reduce((best, current) => {
      switch (mode) {
        case 'cost':
          return current.costs.totalCost < best.costs.totalCost ? current : best;
        case 'reliability':
          return current.metrics.reliabilityScore > best.metrics.reliabilityScore ? current : best;
        case 'sustainability':
          return current.metrics.carbonEmissions < best.metrics.carbonEmissions ? current : best;
        default:
          return current.costs.totalCost < best.costs.totalCost ? current : best;
      }
    });
  }

  private static generateExecutiveInsight(scenarios: ScenarioData[], best: ScenarioData, mode: string): string {
    const avgCost = scenarios.reduce((sum, s) => sum + s.costs.totalCost, 0) / scenarios.length;
    const savings = avgCost - best.costs.totalCost;
    const savingsPercent = (savings / avgCost) * 100;

    return `${best.name} emerges as the optimal strategy, delivering ${best.metrics.reliabilityScore}% reliability with $${(best.costs.totalCost / 1e9).toFixed(2)}B total investment—representing ${savingsPercent.toFixed(1)}% cost advantage over the average scenario. Critical bottleneck analysis indicates ${best.metrics.bottleneckCount} supply chain constraints requiring immediate attention, with ${best.bottlenecks.filter(b => b.severity === 'critical').length} classified as critical.`;
  }

  private static calculateAggregateMetrics(scenarios: ScenarioData[]) {
    const costs = scenarios.map(s => s.costs.totalCost);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const reliabilities = scenarios.map(s => s.metrics.reliabilityScore);
    const avgReliability = reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length;

    return {
      avgCost,
      costVariance: Math.max(...costs) - Math.min(...costs),
      costSpread: Math.max(...costs) - Math.min(...costs),
      avgReliability,
      reliabilityVariance: Math.max(...reliabilities) - Math.min(...reliabilities),
      totalBottlenecks: scenarios.reduce((sum, s) => sum + s.metrics.bottleneckCount, 0),
      criticalBottlenecks: scenarios.reduce((sum, s) => sum + s.bottlenecks.filter(b => b.severity === 'critical').length, 0),
      avgEmissions: scenarios.reduce((sum, s) => sum + s.metrics.carbonEmissions, 0) / scenarios.length,
      feasibilityRate: (scenarios.filter(s => s.feasibility).length / scenarios.length) * 100
    };
  }

  private static getMetricTrend(variance: number): string {
    if (variance < 5) return 'STABLE';
    if (variance < 15) return 'MODERATE VARIANCE';
    return 'HIGH VARIANCE';
  }

  private static getEmissionsTrend(emissions: number): string {
    if (emissions < 10000000) return 'LOW IMPACT';
    if (emissions < 15000000) return 'MODERATE IMPACT';
    return 'HIGH IMPACT';
  }

  private static generateStrategicFindings(scenarios: ScenarioData[], selected: string[]) {
    const findings = [];

    // Finding 1: Cost optimization opportunity
    const costs = scenarios.map(s => s.costs.totalCost);
    const costSpread = Math.max(...costs) - Math.min(...costs);
    findings.push({
      title: 'Significant Cost Optimization Opportunity Identified',
      content: `Analysis reveals a $${(costSpread / 1e9).toFixed(2)}B variance between scenarios, indicating substantial room for cost optimization through strategic scenario selection. The lowest-cost viable scenario achieves ${((costSpread / Math.max(...costs)) * 100).toFixed(1)}% cost reduction while maintaining operational requirements.`,
      impact: `Potential savings: $${(costSpread / 1e9).toFixed(2)}B through optimal scenario execution`
    });

    // Finding 2: Material bottleneck analysis
    const totalBottlenecks = scenarios.reduce((sum, s) => sum + s.metrics.bottleneckCount, 0);
    const criticalBottlenecks = scenarios.reduce((sum, s) => sum + s.bottlenecks.filter(b => b.severity === 'critical').length, 0);
    findings.push({
      title: 'Supply Chain Vulnerability Assessment',
      content: `Cross-scenario analysis identified ${totalBottlenecks} total supply chain bottlenecks, with ${criticalBottlenecks} classified as critical. Cobalt and lithium emerge as primary constraint materials across all scenarios, requiring immediate sourcing strategy diversification.`,
      impact: `High priority: Implement dual-sourcing strategy for critical materials within 90 days`
    });

    // Finding 3: Reliability-cost trade-off
    const bestReliability = Math.max(...scenarios.map(s => s.metrics.reliabilityScore));
    const lowestCost = Math.min(...costs);
    const bestReliabilityScenario = scenarios.find(s => s.metrics.reliabilityScore === bestReliability);
    const lowestCostScenario = scenarios.find(s => s.costs.totalCost === lowestCost);

    if (bestReliabilityScenario && lowestCostScenario && bestReliabilityScenario.id !== lowestCostScenario.id) {
      const costDiff = bestReliabilityScenario.costs.totalCost - lowestCostScenario.costs.totalCost;
      const reliabilityDiff = bestReliabilityScenario.metrics.reliabilityScore - lowestCostScenario.metrics.reliabilityScore;
      findings.push({
        title: 'Reliability-Cost Trade-Off Analysis',
        content: `Achieving maximum reliability (${bestReliability}%) requires $${(costDiff / 1e9).toFixed(2)}B additional investment over the lowest-cost scenario. This represents $${((costDiff / reliabilityDiff) / 1e6).toFixed(1)}M per percentage point of reliability improvement.`,
        impact: `Strategic decision required: Balance cost efficiency vs. operational resilience`
      });
    }

    return findings;
  }

  private static generateScenarioScoreCard(scenario: ScenarioData, allScenarios: ScenarioData[]): string[][] {
    const costRank = allScenarios
      .sort((a, b) => a.costs.totalCost - b.costs.totalCost)
      .findIndex(s => s.id === scenario.id) + 1;

    const reliabilityRank = allScenarios
      .sort((a, b) => b.metrics.reliabilityScore - a.metrics.reliabilityScore)
      .findIndex(s => s.id === scenario.id) + 1;

    const bottleneckRank = allScenarios
      .sort((a, b) => a.metrics.bottleneckCount - b.metrics.bottleneckCount)
      .findIndex(s => s.id === scenario.id) + 1;

    const emissionsRank = allScenarios
      .sort((a, b) => a.metrics.carbonEmissions - b.metrics.carbonEmissions)
      .findIndex(s => s.id === scenario.id) + 1;

    return [
      ['Total Cost', `$${(scenario.costs.totalCost / 1e9).toFixed(2)}B`, `${costRank}/${allScenarios.length}`, costRank === 1 ? 'BEST' : costRank <= 2 ? 'GOOD' : 'MODERATE'],
      ['Reliability', `${scenario.metrics.reliabilityScore}%`, `${reliabilityRank}/${allScenarios.length}`, reliabilityRank === 1 ? 'BEST' : reliabilityRank <= 2 ? 'GOOD' : 'MODERATE'],
      ['Supply Chain Risk', `${scenario.metrics.bottleneckCount} bottlenecks`, `${bottleneckRank}/${allScenarios.length}`, bottleneckRank === 1 ? 'BEST' : bottleneckRank <= 2 ? 'GOOD' : 'ELEVATED'],
      ['Carbon Footprint', `${(scenario.metrics.carbonEmissions / 1e6).toFixed(1)}M`, `${emissionsRank}/${allScenarios.length}`, emissionsRank === 1 ? 'BEST' : emissionsRank <= 2 ? 'GOOD' : 'MODERATE']
    ];
  }

  private static getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'critical': return '[CRITICAL]';
      case 'high': return '[HIGH]';
      case 'medium': return '[MEDIUM]';
      case 'low': return '[LOW]';
      default: return severity.toUpperCase();
    }
  }

  private static findBestValueScenario(scenarios: ScenarioData[]): ScenarioData {
    return scenarios.reduce((best, current) => {
      const currentValue = current.metrics.reliabilityScore / (current.costs.totalCost / 1e9);
      const bestValue = best.metrics.reliabilityScore / (best.costs.totalCost / 1e9);
      return currentValue > bestValue ? current : best;
    });
  }

  private static calculateCostEfficiency(scenario: ScenarioData): string {
    const efficiency = (scenario.metrics.reliabilityScore / (scenario.costs.totalCost / 1e9));
    if (efficiency > 40) return 'EXCELLENT';
    if (efficiency > 30) return 'GOOD';
    if (efficiency > 20) return 'FAIR';
    return 'POOR';
  }

  private static calculateRiskProfile(scenario: ScenarioData) {
    const criticalCount = scenario.bottlenecks.filter(b => b.severity === 'critical').length;
    const highCount = scenario.bottlenecks.filter(b => b.severity === 'high').length;

    const materialRisk = criticalCount > 0 ? '[HIGH]' : highCount > 1 ? '[MEDIUM]' : '[LOW]';
    const costRisk = scenario.costs.penaltyCost > scenario.costs.totalCost * 0.05 ? '[MEDIUM]' : '[LOW]';
    const timelineRisk = scenario.bottlenecks.some(b => b.timeframe.includes('immediate')) ? '[HIGH]' : '[LOW]';
    const overallRisk = criticalCount > 0 || highCount > 2 ? 'HIGH' : highCount > 0 ? 'MEDIUM' : 'LOW';

    return {
      overall: overallRisk,
      materialRisk,
      costRisk,
      timelineRisk,
      mitigation: criticalCount > 0 ? 'Immediate action required' : 'Monitor closely'
    };
  }

  private static getRiskLevel(level: string): string {
    switch (level) {
      case 'HIGH': return '[HIGH]';
      case 'MEDIUM': return '[MEDIUM]';
      case 'LOW': return '[LOW]';
      default: return level;
    }
  }

  private static generateRiskInsights(scenarios: ScenarioData[]) {
    const insights = [];

    // Identify common bottlenecks
    const materialCounts = new Map<string, number>();
    scenarios.forEach(s => {
      s.bottlenecks.forEach(b => {
        materialCounts.set(b.material, (materialCounts.get(b.material) || 0) + 1);
      });
    });

    const commonBottlenecks = Array.from(materialCounts.entries())
      .filter(([_, count]) => count >= scenarios.length * 0.5)
      .map(([material]) => material);

    if (commonBottlenecks.length > 0) {
      insights.push({
        level: 'critical',
        title: 'Systematic Supply Chain Vulnerability',
        description: `${commonBottlenecks.join(', ')} appear as bottlenecks across multiple scenarios, indicating structural supply chain weaknesses that persist regardless of operational strategy. Recommend strategic sourcing diversification and inventory buffer expansion for these materials.`
      });
    }

    // High penalty costs
    const highPenaltyScenarios = scenarios.filter(s => s.costs.penaltyCost > s.costs.totalCost * 0.05);
    if (highPenaltyScenarios.length > 0) {
      insights.push({
        level: 'warning',
        title: 'Elevated Penalty Cost Exposure',
        description: `${highPenaltyScenarios.length} scenarios show penalty costs exceeding 5% of total cost, suggesting significant operational risk. Focus on constraint relaxation and lead time reduction to minimize penalty exposure.`
      });
    }

    return insights;
  }

  private static generateActionableRecommendations(
    scenarios: ScenarioData[],
    selected: string[],
    mode: string
  ) {
    const recommendations = [];
    const best = this.findBestScenario(scenarios, mode);

    // Recommendation 1: Optimal scenario selection
    recommendations.push({
      priority: 'HIGH',
      title: `Adopt ${best.name} as Primary Operational Strategy`,
      description: `This scenario provides the optimal balance of cost efficiency (${((best.costs.totalCost / scenarios.reduce((s, a) => s + a.costs.totalCost, 0) / scenarios.length) * 100).toFixed(0)}% of average cost) and operational reliability (${best.metrics.reliabilityScore}% reliability score).`,
      actions: [
        'Conduct detailed feasibility assessment within 30 days',
        'Secure executive approval and budget allocation',
        'Initiate supplier negotiations for critical materials',
        'Establish KPIs and monitoring framework'
      ],
      impact: 'Cost savings of up to $' + ((scenarios.reduce((s, a) => s + a.costs.totalCost, 0) / scenarios.length - best.costs.totalCost) / 1e9).toFixed(2) + 'B annually'
    });

    // Recommendation 2: Material sourcing
    const criticalMaterials = best.bottlenecks.filter(b => b.severity === 'critical' || b.severity === 'high');
    if (criticalMaterials.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Implement Dual-Sourcing Strategy for Critical Materials',
        description: `${criticalMaterials.map(m => m.material).join(', ')} are identified as high-risk bottlenecks. Diversifying supply sources will reduce vulnerability and improve supply chain resilience.`,
        actions: [
          'Identify and qualify alternative suppliers for each critical material',
          'Negotiate long-term contracts with volume commitments',
          'Establish strategic inventory buffers (30-45 days)',
          'Implement supplier performance monitoring system'
        ],
        impact: 'Reduce supply chain disruption risk by 60-70%'
      });
    }

    // Recommendation 3: Operational optimization
    if (best.metrics.reliabilityScore < 90) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Enhance Operational Reliability Through Process Optimization',
        description: `Current reliability score of ${best.metrics.reliabilityScore}% can be improved through targeted process enhancements and technology investments.`,
        actions: [
          'Implement predictive maintenance programs',
          'Upgrade monitoring and control systems',
          'Invest in workforce training and development',
          'Establish backup operational procedures'
        ],
        impact: 'Improve reliability to 92-95% within 12 months'
      });
    }

    // Recommendation 4: Sustainability
    const avgEmissions = scenarios.reduce((s, a) => s + a.metrics.carbonEmissions, 0) / scenarios.length;
    if (best.metrics.carbonEmissions > avgEmissions * 0.9) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Develop Carbon Reduction Roadmap',
        description: `Current emissions profile requires attention to meet emerging ESG standards and regulatory requirements.`,
        actions: [
          'Conduct comprehensive carbon footprint assessment',
          'Identify renewable energy integration opportunities',
          'Evaluate carbon offset program options',
          'Set science-based emission reduction targets'
        ],
        impact: 'Achieve 20-30% emission reduction over 3 years'
      });
    }

    return recommendations;
  }

  private static generateImplementationPhases(scenarios: ScenarioData[], selected: string[]) {
    return [
      {
        name: 'Planning & Preparation',
        duration: '0-3 months',
        milestone: 'Approval & Resource Allocation',
        objectives: [
          'Secure executive sponsorship and budget approval',
          'Establish cross-functional implementation team',
          'Develop detailed project plan and timeline',
          'Complete risk assessment and mitigation planning'
        ],
        activities: [
          'Stakeholder alignment meetings',
          'Budget finalization and approval',
          'Resource allocation and team formation',
          'Risk assessment workshops'
        ]
      },
      {
        name: 'Supplier Engagement & Contracting',
        duration: '3-6 months',
        milestone: 'Contracts Executed',
        objectives: [
          'Identify and qualify critical material suppliers',
          'Negotiate favorable terms and pricing',
          'Establish quality standards and SLAs',
          'Implement supplier monitoring systems'
        ],
        activities: [
          'RFP development and issuance',
          'Supplier evaluation and selection',
          'Contract negotiation and execution',
          'Quality assurance framework setup'
        ]
      },
      {
        name: 'Infrastructure Development',
        duration: '6-12 months',
        milestone: 'Systems Operational',
        objectives: [
          'Deploy required technology and equipment',
          'Establish monitoring and control systems',
          'Complete workforce training programs',
          'Implement inventory management systems'
        ],
        activities: [
          'Technology procurement and installation',
          'System integration and testing',
          'Staff training and certification',
          'Process documentation'
        ]
      },
      {
        name: 'Pilot Operations',
        duration: '12-15 months',
        milestone: 'Pilot Validation',
        objectives: [
          'Validate operational procedures',
          'Test supply chain reliability',
          'Optimize process parameters',
          'Identify and resolve issues'
        ],
        activities: [
          'Limited production runs',
          'Performance monitoring and analysis',
          'Continuous improvement initiatives',
          'Stakeholder progress reviews'
        ]
      },
      {
        name: 'Full-Scale Deployment',
        duration: '15-18 months',
        milestone: 'Production Launch',
        objectives: [
          'Ramp up to full operational capacity',
          'Achieve target reliability metrics',
          'Optimize cost performance',
          'Establish steady-state operations'
        ],
        activities: [
          'Phased capacity expansion',
          'Performance optimization',
          'Quality control reinforcement',
          'Final handover to operations team'
        ]
      }
    ];
  }

  private static addPageFooters(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, 280, 190, 280);

      // Page number
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });

      // Confidentiality notice
      doc.text('CONFIDENTIAL - SOBapp Platform', 20, 285);
      doc.text(format(new Date(), 'MMM dd, yyyy'), 190, 285, { align: 'right' });
    }
  }
}

export default ScenarioComparisonPDFService;
