/**
 * PDF Export Service
 * Generate executive reports for supply chain analysis
 * WITH AUDIT TRAIL LOGGING FOR SEC COMPLIANCE
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import AuditTrailService from './audit-trail-service';

interface CommodityData {
  name: string;
  current: number;
  daily_change: number;
  volume?: number;
  source: string;
}

interface RiskAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  date: Date;
}

interface ReportData {
  title: string;
  reportDate: Date;
  userName: string;
  userCompany: string;
  commodities: Record<string, CommodityData>;
  riskAlerts: RiskAlert[];
  economicIndicators?: Record<string, any>;
  geopoliticalRisks?: Record<string, any>;
  summary?: string;
}

export class PDFExportService {

  /**
   * Generate Executive Summary Report
   */
  static generateExecutiveReport(data: ReportData): jsPDF {
    const doc = new jsPDF();

    // Header
    this.addHeader(doc, data);

    // Executive Summary
    let yPos = 50;
    if (data.summary) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(data.summary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 6 + 10;
    }

    // Commodity Prices Table
    yPos = this.addCommodityPricesTable(doc, data.commodities, yPos);

    // Risk Alerts Table
    if (data.riskAlerts && data.riskAlerts.length > 0) {
      yPos = this.addRiskAlertsTable(doc, data.riskAlerts, yPos);
    }

    // Footer
    this.addFooter(doc);

    return doc;
  }

  /**
   * Generate Detailed Supply Chain Report
   */
  static generateDetailedReport(data: ReportData): jsPDF {
    const doc = new jsPDF();

    // Header
    this.addHeader(doc, data);

    let yPos = 50;

    // Section 1: Market Overview
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Market Overview', 20, yPos);
    yPos += 10;

    // Commodity prices with trends
    yPos = this.addCommodityPricesTable(doc, data.commodities, yPos);

    // Section 2: Risk Analysis
    if (yPos > 200) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Analysis', 20, yPos);
    yPos += 10;

    yPos = this.addRiskAlertsTable(doc, data.riskAlerts, yPos);

    // Section 3: Economic Indicators
    if (data.economicIndicators && Object.keys(data.economicIndicators).length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Economic Indicators', 20, yPos);
      yPos += 10;

      yPos = this.addEconomicIndicatorsTable(doc, data.economicIndicators, yPos);
    }

    // Section 4: Geopolitical Assessment
    if (data.geopoliticalRisks && Object.keys(data.geopoliticalRisks).length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Geopolitical Risk Assessment', 20, yPos);
      yPos += 10;

      yPos = this.addGeopoliticalTable(doc, data.geopoliticalRisks, yPos);
    }

    // Footer
    this.addFooter(doc);

    return doc;
  }

  /**
   * Add report header
   */
  private static addHeader(doc: jsPDF, data: ReportData) {
    // Company logo area (placeholder)
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(20, 10, 30, 15, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('MIAR', 26, 20);

    // Report title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 60, 20);

    // Report metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${format(data.reportDate, 'MMM dd, yyyy HH:mm')}`, 60, 27);
    doc.text(`For: ${data.userName} | ${data.userCompany}`, 60, 32);

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);
  }

  /**
   * Add commodity prices table
   */
  private static addCommodityPricesTable(doc: jsPDF, commodities: Record<string, CommodityData>, startY: number): number {
    const tableData = Object.entries(commodities).map(([key, data]) => [
      data.name || key.toUpperCase(),
      `$${data.current.toFixed(2)}`,
      this.formatChange(data.daily_change),
      data.volume ? data.volume.toLocaleString() : 'N/A',
      data.source || 'N/A'
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Commodity', 'Current Price', '24h Change', 'Volume', 'Source']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105], // Emerald-600
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        2: {
          cellWidth: 30,
          halign: 'right'
        }
      },
      didParseCell: (data) => {
        // Color code the change column
        if (data.column.index === 2 && data.section === 'body') {
          const change = parseFloat(data.cell.raw as string);
          if (change > 0) {
            data.cell.styles.textColor = [5, 150, 105]; // Green
          } else if (change < 0) {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
      }
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add risk alerts table
   */
  private static addRiskAlertsTable(doc: jsPDF, alerts: RiskAlert[], startY: number): number {
    const tableData = alerts.slice(0, 10).map(alert => [
      this.getSeverityLabel(alert.severity),
      alert.category,
      alert.description.substring(0, 80) + (alert.description.length > 80 ? '...' : ''),
      format(alert.date, 'MMM dd, yyyy')
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Severity', 'Category', 'Description', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 95 },
        3: { cellWidth: 30 }
      },
      didParseCell: (data) => {
        // Color code severity
        if (data.column.index === 0 && data.section === 'body') {
          const severity = data.cell.raw as string;
          if (severity.includes('CRITICAL')) {
            data.cell.styles.textColor = [239, 68, 68]; // Rose-600
            data.cell.styles.fontStyle = 'bold';
          } else if (severity.includes('HIGH')) {
            data.cell.styles.textColor = [251, 146, 60]; // Amber-500
          }
        }
      }
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add economic indicators table
   */
  private static addEconomicIndicatorsTable(doc: jsPDF, indicators: Record<string, any>, startY: number): number {
    const tableData = Object.entries(indicators).map(([key, data]) => [
      data.indicator || key,
      data.value.toFixed(2),
      data.unit,
      this.formatChange(data.change),
      data.source
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Indicator', 'Value', 'Unit', 'Change', 'Source']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      }
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add geopolitical risk table
   */
  private static addGeopoliticalTable(doc: jsPDF, risks: Record<string, any>, startY: number): number {
    const tableData = Object.entries(risks).slice(0, 8).map(([country, data]) => [
      country,
      data.region || 'N/A',
      data.overallRisk?.toFixed(0) || 'N/A',
      data.trend?.shortTerm || 'N/A',
      data.alerts?.length || 0
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Country', 'Region', 'Risk Score', 'Trend', 'Alerts']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      }
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add footer
   */
  private static addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | MIAR Platform - Confidential`,
        105,
        285,
        { align: 'center' }
      );
    }
  }

  /**
   * Format percentage change
   */
  private static formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * Get severity label with emoji
   */
  private static getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🔴 CRITICAL';
      case 'high':
        return '🟠 HIGH';
      case 'medium':
        return '🟡 MEDIUM';
      case 'low':
        return '🟢 LOW';
      default:
        return severity.toUpperCase();
    }
  }

  /**
   * Download PDF WITH AUDIT LOGGING
   */
  static downloadReport(
    doc: jsPDF,
    filename: string,
    userData?: {
      userId: string;
      userEmail: string;
      sessionId: string;
      reportType: 'executive' | 'detailed';
      commodities: string[];
    }
  ) {
    // LOG TO AUDIT TRAIL
    if (userData) {
      const auditService = AuditTrailService.getInstance();
      auditService.logPDFExport({
        userId: userData.userId,
        userEmail: userData.userEmail,
        sessionId: userData.sessionId,
        reportType: userData.reportType,
        commodities: userData.commodities,
        dataSources: [
          'Yahoo Finance (Real-time commodities)',
          'USGS Mineral Summaries 2024',
          'ILO Reports',
          'World Bank Governance Indicators',
          'NewsAPI / Reuters'
        ]
      });
    }

    doc.save(filename);
  }

  /**
   * Get PDF as blob for email attachment
   */
  static getPDFBlob(doc: jsPDF): Blob {
    return doc.output('blob');
  }
}

export default PDFExportService;
