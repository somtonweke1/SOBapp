/**
 * Email Service
 * Handles sending compliance reports and notifications
 * Uses nodemailer with SMTP configuration
 */

import nodemailer from 'nodemailer';
import type { ComplianceScanReport } from './entity-list-scanner-service';

export interface EmailConfig {
  from: string;
  replyTo?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Initialize email service with configuration
   */
  public initialize(config: EmailConfig) {
    this.config = config;

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    console.log('✅ Email service initialized');
  }

  /**
   * Initialize from environment variables
   */
  public initializeFromEnv() {
    const config: EmailConfig = {
      from: process.env.SMTP_FROM || 'SOBapp Platform <noreply@miar.platform>',
      replyTo: process.env.SMTP_REPLY_TO,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
    };

    // Don't initialize if credentials are not provided (allow graceful degradation)
    if (!config.smtpUser || !config.smtpPassword) {
      console.warn('⚠️  SMTP credentials not configured. Email service disabled.');
      console.warn('⚠️  Set SMTP_USER and SMTP_PASSWORD environment variables to enable email delivery.');
      return false;
    }

    this.initialize(config);
    return true;
  }

  /**
   * Send a generic email
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('❌ Email service not initialized');
      return false;
    }

    try {
      console.log(`📧 Sending email to: ${options.to}`);

      const info = await this.transporter.sendMail({
        from: this.config.from,
        replyTo: this.config.replyTo,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      console.log(`✅ Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Email send error:', error);
      return false;
    }
  }

  /**
   * Send BIS compliance scan report
   */
  public async sendComplianceReport(
    email: string,
    htmlReport: string,
    scanReport: ComplianceScanReport,
    textSummary?: string
  ): Promise<boolean> {
    const riskEmoji = this.getRiskEmoji(scanReport.summary.overallRiskLevel);
    const subject = `${riskEmoji} BIS Compliance Scan Report - ${scanReport.companyName}`;

    // Create email HTML with report embedded
    const emailHtml = this.createEmailHTML(scanReport, htmlReport);

    // Create plain text version
    const emailText = textSummary || this.createPlainTextSummary(scanReport);

    return await this.sendEmail({
      to: email,
      subject,
      html: emailHtml,
      text: emailText,
      attachments: [
        {
          filename: `compliance-report-${scanReport.scanId}.html`,
          content: htmlReport,
          contentType: 'text/html',
        },
      ],
    });
  }

  /**
   * Create email HTML wrapper
   */
  private createEmailHTML(scanReport: ComplianceScanReport, reportHtml: string): string {
    const riskColor = this.getRiskColor(scanReport.summary.overallRiskLevel);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIS Compliance Scan Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .email-body {
      background: white;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .summary-box {
      background: ${riskColor};
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .stat {
      display: inline-block;
      margin: 10px 20px;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-header">
    <h1>🛡️ BIS Compliance Scan Report</h1>
    <p>${scanReport.companyName}</p>
    <p style="font-size: 14px; opacity: 0.9;">Scan ID: ${scanReport.scanId}</p>
  </div>

  <div class="email-body">
    <h2>Executive Summary</h2>

    <div class="summary-box">
      <div class="stat">
        <div class="stat-label">Total Suppliers</div>
        <div class="stat-value">${scanReport.summary.totalSuppliers}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Critical Risk</div>
        <div class="stat-value">${scanReport.summary.criticalSuppliers}</div>
      </div>
      <div class="stat">
        <div class="stat-label">High Risk</div>
        <div class="stat-value">${scanReport.summary.highRiskSuppliers}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Risk Score</div>
        <div class="stat-value">${scanReport.summary.overallRiskScore}/10</div>
      </div>
    </div>

    <h3>Key Findings</h3>
    <ul>
      ${scanReport.summary.criticalSuppliers > 0 ? `
        <li>🚨 <strong>${scanReport.summary.criticalSuppliers} critical-risk suppliers</strong> require immediate attention</li>
      ` : ''}
      ${scanReport.summary.highRiskSuppliers > 0 ? `
        <li>⚠️ ${scanReport.summary.highRiskSuppliers} high-risk suppliers need review</li>
      ` : ''}
      ${scanReport.summary.mediumRiskSuppliers > 0 ? `
        <li>📊 ${scanReport.summary.mediumRiskSuppliers} medium-risk suppliers flagged</li>
      ` : ''}
      ${scanReport.summary.clearSuppliers > 0 ? `
        <li>✅ ${scanReport.summary.clearSuppliers} suppliers cleared</li>
      ` : ''}
    </ul>

    <h3>Recommendations</h3>
    <ul>
      ${scanReport.recommendations.slice(0, 5).map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <p>
      <strong>Detailed report attached.</strong> Please review the full HTML report for complete analysis,
      ownership structures, and alternative supplier suggestions.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">
        Generated by SOBapp Platform BIS Entity List Scanner<br>
        ${new Date(scanReport.scanDate).toLocaleString()}
      </p>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>IMPORTANT LEGAL DISCLAIMER:</strong> This report is provided for informational purposes only
      and does not constitute legal advice. Consult with qualified legal counsel specializing in export
      controls and trade compliance before making business decisions based on this information.
    </p>
    <p>
      This is an automated email from SOBapp Platform. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Create plain text summary for email
   */
  private createPlainTextSummary(scanReport: ComplianceScanReport): string {
    return `
BIS COMPLIANCE SCAN REPORT
${scanReport.companyName}
Scan ID: ${scanReport.scanId}
Date: ${new Date(scanReport.scanDate).toLocaleString()}

========================================
EXECUTIVE SUMMARY
========================================

Total Suppliers Scanned: ${scanReport.summary.totalSuppliers}
Critical Risk: ${scanReport.summary.criticalSuppliers}
High Risk: ${scanReport.summary.highRiskSuppliers}
Medium Risk: ${scanReport.summary.mediumRiskSuppliers}
Low Risk: ${scanReport.summary.lowRiskSuppliers}
Clear: ${scanReport.summary.clearSuppliers}

Overall Risk Level: ${scanReport.summary.overallRiskLevel.toUpperCase()}
Overall Risk Score: ${scanReport.summary.overallRiskScore}/10
Estimated Exposure: ${scanReport.summary.estimatedExposure}

========================================
RECOMMENDATIONS
========================================

${scanReport.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

========================================

See attached HTML report for full details, ownership analysis, and alternative supplier suggestions.

IMPORTANT LEGAL DISCLAIMER: This report is provided for informational purposes only and does not
constitute legal advice. Consult with qualified legal counsel specializing in export controls and
trade compliance before making business decisions based on this information.

Generated by SOBapp Platform BIS Entity List Scanner
    `.trim();
  }

  /**
   * Get emoji for risk level
   */
  private getRiskEmoji(riskLevel: string): string {
    const emojis: Record<string, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: '📊',
      low: '✅',
    };
    return emojis[riskLevel] || '📋';
  }

  /**
   * Get color for risk level
   */
  private getRiskColor(riskLevel: string): string {
    const colors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#16a34a',
    };
    return colors[riskLevel] || '#6b7280';
  }

  /**
   * Verify email service is working
   */
  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Email service not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error);
      return false;
    }
  }

  /**
   * Check if email service is enabled
   */
  public isEnabled(): boolean {
    return this.transporter !== null && this.config !== null;
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
    // Auto-initialize from environment
    emailServiceInstance.initializeFromEnv();
  }
  return emailServiceInstance;
}

export default EmailService;
