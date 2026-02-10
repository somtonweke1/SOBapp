/**
 * Compliance Report Generator
 * Generates formatted reports from scan results
 */

import { ComplianceScanReport } from './entity-list-scanner-service';

export interface ReportOptions {
  format: 'html' | 'json';
  includeFullDetails: boolean;
}

class ComplianceReportGenerator {

  /**
   * Generate report in specified format
   */
  public generateReport(
    scanReport: ComplianceScanReport,
    options: ReportOptions = { format: 'html', includeFullDetails: true }
  ): string {
    if (options.format === 'json') {
      return JSON.stringify(scanReport, null, 2);
    }

    return this.generateHTMLReport(scanReport, options.includeFullDetails);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: ComplianceScanReport, fullDetails: boolean): string {
    const riskLevelColor = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const riskColor = riskLevelColor[report.summary.overallRiskLevel];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIS Entity List Compliance Report - ${report.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #18181b;
      background: #fafafa;
      padding: 40px 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 60px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #18181b; padding-bottom: 30px; margin-bottom: 40px; }
    .logo { font-size: 12px; font-weight: 600; letter-spacing: 2px; color: #18181b; margin-bottom: 20px; }
    h1 { font-size: 32px; font-weight: 300; margin-bottom: 10px; }
    .meta { color: #71717a; font-size: 14px; }
    .risk-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: ${riskColor};
      color: white;
      margin-top: 10px;
    }
    .summary {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
    }
    .summary h2 { font-size: 20px; font-weight: 400; margin-bottom: 20px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; }
    .stat { text-align: center; padding: 20px; background: white; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: 300; color: #18181b; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-top: 5px; }
    .section { margin: 40px 0; }
    .section h2 { font-size: 24px; font-weight: 300; margin-bottom: 20px; border-left: 4px solid #ef4444; padding-left: 15px; }
    .supplier-card {
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      background: white;
    }
    .supplier-card.critical { border-left: 4px solid #dc2626; }
    .supplier-card.high { border-left: 4px solid #ef4444; }
    .supplier-card.medium { border-left: 4px solid #f59e0b; }
    .supplier-card.low { border-left: 4px solid #10b981; }
    .supplier-card.clear { border-left: 4px solid #71717a; }
    .supplier-header { display: flex; justify-between; align-items: start; margin-bottom: 15px; }
    .supplier-name { font-size: 18px; font-weight: 400; }
    .risk-score {
      font-size: 28px;
      font-weight: 300;
      color: #ef4444;
    }
    .flags { margin: 15px 0; }
    .flag {
      display: inline-block;
      padding: 4px 12px;
      background: #fef2f2;
      color: #991b1b;
      border-radius: 4px;
      font-size: 12px;
      margin: 4px 4px 4px 0;
    }
    .recommendations { margin-top: 15px; }
    .recommendation {
      padding: 10px;
      background: #fef9c3;
      border-left: 3px solid #ca8a04;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .alternatives {
      background: #f0fdf4;
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
    }
    .alternative-item {
      padding: 10px;
      background: white;
      border: 1px solid #bbf7d0;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e4e4e7;
      text-align: center;
      color: #71717a;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SOBapp</div>
      <h1>BIS Entity List Compliance Report</h1>
      <div class="meta">${report.companyName} • ${new Date(report.scanDate).toLocaleDateString()}</div>
      <div class="risk-badge">Overall Risk: ${report.summary.overallRiskLevel.toUpperCase()}</div>
    </div>

    <div class="summary">
      <h2>Executive Summary</h2>
      <p>Analysis of <strong>${report.summary.totalSuppliers} suppliers</strong> identified <strong>${report.summary.criticalSuppliers + report.summary.highRiskSuppliers} suppliers with significant BIS entity list exposure</strong>, including ${report.summary.criticalSuppliers} requiring immediate action.</p>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${report.summary.totalSuppliers}</div>
          <div class="stat-label">Suppliers Analyzed</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #dc2626;">${report.summary.criticalSuppliers + report.summary.highRiskSuppliers}</div>
          <div class="stat-label">Flagged for Risk</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #dc2626;">${report.summary.criticalSuppliers}</div>
          <div class="stat-label">Critical Priority</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #dc2626;">${report.summary.estimatedExposure}</div>
          <div class="stat-label">Estimated Exposure</div>
        </div>
      </div>
    </div>

    ${report.summary.criticalSuppliers + report.summary.highRiskSuppliers > 0 ? `
    <div class="section">
      <h2>Flagged Suppliers (${report.summary.criticalSuppliers + report.summary.highRiskSuppliers})</h2>
      ${report.results
        .filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high')
        .map(result => `
        <div class="supplier-card ${result.riskLevel}">
          <div class="supplier-header">
            <div>
              <div class="supplier-name">${result.supplier.originalName}</div>
              <div class="meta">${result.supplier.location || 'Location unknown'}</div>
            </div>
            <div class="risk-score">${result.riskScore.toFixed(1)}</div>
          </div>

          ${result.flags.length > 0 ? `
          <div class="flags">
            ${result.flags.map(flag => `<span class="flag">${flag}</span>`).join('')}
          </div>
          ` : ''}

          ${result.recommendations.length > 0 && fullDetails ? `
          <div class="recommendations">
            ${result.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
          </div>
          ` : ''}

          ${result.matches.length > 0 && fullDetails ? `
          <div class="alternatives">
            <strong>Matched Entity:</strong> ${result.matches[0].matchedName}
            <br/>
            <small>Match Type: ${result.matches[0].matchType} | Confidence: ${(result.matches[0].confidence * 100).toFixed(0)}%</small>
            ${result.matches[0].relationshipPath ? `<br/><small>Path: ${result.matches[0].relationshipPath.join(' → ')}</small>` : ''}
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${report.alternatives.length > 0 && fullDetails ? `
    <div class="section">
      <h2>Alternative Suppliers</h2>
      ${report.alternatives.map(alt => `
        <div class="supplier-card">
          <div class="supplier-name" style="color: #dc2626;">❌ ${alt.flaggedSupplier}</div>
          <div class="alternatives">
            <strong>Compliant Alternatives:</strong>
            ${alt.alternatives.map(a => `
              <div class="alternative-item">
                <strong>✓ ${a.name}</strong> - ${a.location} | Cost: ${a.costDelta} | Lead Time: ${a.leadTime}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="section">
      <h2>Strategic Recommendations</h2>
      ${report.recommendations.map((rec, idx) => `
        <div class="recommendation">
          <strong>${idx + 1}.</strong> ${rec}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p><strong>SOBapp - Supply Chain Risk Intelligence</strong></p>
      <p>Johns Hopkins University Supply Chain Intelligence Lab</p>
      <p style="margin-top: 10px;">Report ID: ${report.scanId}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate simple text summary
   */
  public generateTextSummary(report: ComplianceScanReport): string {
    return `
BIS ENTITY LIST COMPLIANCE REPORT
${report.companyName}
${new Date(report.scanDate).toLocaleDateString()}

SUMMARY:
- Total Suppliers Analyzed: ${report.summary.totalSuppliers}
- Clear: ${report.summary.clearSuppliers}
- Critical Risk: ${report.summary.criticalSuppliers}
- High Risk: ${report.summary.highRiskSuppliers}
- Medium Risk: ${report.summary.mediumRiskSuppliers}
- Overall Risk: ${report.summary.overallRiskLevel.toUpperCase()} (${report.summary.overallRiskScore}/10)
- Estimated Exposure: ${report.summary.estimatedExposure}

${report.summary.criticalSuppliers > 0 ? `CRITICAL SUPPLIERS:\n${report.results
  .filter(r => r.riskLevel === 'critical')
  .map(r => `- ${r.supplier.originalName} (Risk: ${r.riskScore.toFixed(1)}/10)`)
  .join('\n')}\n` : ''}

TOP RECOMMENDATIONS:
${report.recommendations.slice(0, 5).map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}

Report ID: ${report.scanId}
    `.trim();
  }
}

// Singleton instance
let reportGeneratorInstance: ComplianceReportGenerator | null = null;

export function getReportGenerator(): ComplianceReportGenerator {
  if (!reportGeneratorInstance) {
    reportGeneratorInstance = new ComplianceReportGenerator();
  }
  return reportGeneratorInstance;
}

export default ComplianceReportGenerator;
