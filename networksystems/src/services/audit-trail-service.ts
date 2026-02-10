/**
 * Audit Trail Service
 *
 * INSTITUTIONAL-GRADE audit logging for regulatory compliance
 * - SEC requires full audit trails for investment decisions
 * - GDPR compliance for data access tracking
 * - SOC 2 Type II compliance requirements
 *
 * All user actions, data access, and system events are logged with:
 * - Timestamp (UTC)
 * - User ID and session info
 * - Action type and details
 * - IP address and user agent
 * - Data accessed (what reports, what commodities)
 * - Export/download events
 * - API calls made
 */

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  sessionId: string;
  action: AuditAction;
  category: 'data_access' | 'export' | 'api_call' | 'authentication' | 'configuration' | 'alert';
  resourceType: string; // 'commodity_data', 'esg_report', 'pdf_export', etc.
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  dataSnapshot?: any; // What data was accessed (for compliance)
}

export type AuditAction =
  | 'view_commodity_prices'
  | 'view_esg_report'
  | 'export_pdf'
  | 'export_csv'
  | 'api_call'
  | 'login'
  | 'logout'
  | 'create_scenario'
  | 'delete_scenario'
  | 'view_alert'
  | 'configure_alert'
  | 'view_historical_data'
  | 'download_report';

export interface AuditQuery {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  action?: AuditAction;
  category?: string;
  resourceType?: string;
  success?: boolean;
}

export interface ComplianceReport {
  period: { start: Date; end: Date };
  totalEvents: number;
  userActivity: {
    userId: string;
    userEmail: string;
    totalActions: number;
    dataAccessed: string[];
    exportsGenerated: number;
    lastActive: Date;
  }[];
  criticalEvents: AuditLogEntry[];
  dataExports: {
    date: Date;
    user: string;
    reportType: string;
    commodities: string[];
  }[];
}

class AuditTrailService {
  private static instance: AuditTrailService;
  private logs: AuditLogEntry[] = [];
  private readonly MAX_LOGS = 100000; // Keep last 100k events in memory
  private readonly CRITICAL_ACTIONS = [
    'export_pdf',
    'export_csv',
    'download_report',
    'api_call'
  ];

  static getInstance(): AuditTrailService {
    if (!AuditTrailService.instance) {
      AuditTrailService.instance = new AuditTrailService();
    }
    return AuditTrailService.instance;
  }

  constructor() {
    this.loadLogsFromStorage();
    this.setupAutoSave();
  }

  /**
   * Log an action - ALWAYS call this for any user action
   */
  log(params: {
    userId: string;
    userEmail: string;
    sessionId: string;
    action: AuditAction;
    category: AuditLogEntry['category'];
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
    dataSnapshot?: any;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: params.userId,
      userEmail: params.userEmail,
      sessionId: params.sessionId,
      action: params.action,
      category: params.category,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      success: params.success !== false,
      errorMessage: params.errorMessage,
      dataSnapshot: params.dataSnapshot
    };

    this.logs.push(entry);

    // Trim if exceeds max
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Log critical actions to console for monitoring
    if (this.CRITICAL_ACTIONS.includes(params.action)) {
      console.log('[AUDIT - CRITICAL]', {
        timestamp: entry.timestamp.toISOString(),
        user: entry.userEmail,
        action: entry.action,
        resource: entry.resourceType
      });
    }

    return entry;
  }

  /**
   * Log commodity data access
   */
  logCommodityAccess(params: {
    userId: string;
    userEmail: string;
    sessionId: string;
    commodities: string[];
    priceData: Record<string, any>;
  }): void {
    this.log({
      userId: params.userId,
      userEmail: params.userEmail,
      sessionId: params.sessionId,
      action: 'view_commodity_prices',
      category: 'data_access',
      resourceType: 'commodity_data',
      details: {
        commodities: params.commodities,
        count: params.commodities.length
      },
      dataSnapshot: {
        timestamp: new Date().toISOString(),
        commodities: params.commodities,
        prices: Object.keys(params.priceData).map(key => ({
          commodity: key,
          price: params.priceData[key].price || params.priceData[key].current,
          source: params.priceData[key].source
        }))
      }
    });
  }

  /**
   * Log ESG report access
   */
  logESGReportAccess(params: {
    userId: string;
    userEmail: string;
    sessionId: string;
    country: string;
    material: string;
    esgData: any;
  }): void {
    this.log({
      userId: params.userId,
      userEmail: params.userEmail,
      sessionId: params.sessionId,
      action: 'view_esg_report',
      category: 'data_access',
      resourceType: 'esg_report',
      resourceId: `${params.country}_${params.material}`,
      details: {
        country: params.country,
        material: params.material,
        dataSources: params.esgData.dataSources || []
      },
      dataSnapshot: {
        timestamp: new Date().toISOString(),
        country: params.country,
        material: params.material,
        childLaborRisk: params.esgData.childLaborRisk,
        corruptionScore: params.esgData.corruptionScore,
        sources: params.esgData.dataSources
      }
    });
  }

  /**
   * Log PDF export (CRITICAL for compliance)
   */
  logPDFExport(params: {
    userId: string;
    userEmail: string;
    sessionId: string;
    reportType: 'executive' | 'detailed';
    commodities: string[];
    dataSources: string[];
  }): void {
    this.log({
      userId: params.userId,
      userEmail: params.userEmail,
      sessionId: params.sessionId,
      action: 'export_pdf',
      category: 'export',
      resourceType: 'pdf_export',
      details: {
        reportType: params.reportType,
        commodities: params.commodities,
        commodityCount: params.commodities.length,
        dataSources: params.dataSources
      },
      dataSnapshot: {
        timestamp: new Date().toISOString(),
        reportType: params.reportType,
        commodities: params.commodities,
        intent: 'regulatory_filing_or_client_presentation'
      }
    });
  }

  /**
   * Log API calls
   */
  logAPICall(params: {
    userId: string;
    userEmail: string;
    sessionId: string;
    endpoint: string;
    method: string;
    parameters: Record<string, any>;
    responseStatus: number;
  }): void {
    this.log({
      userId: params.userId,
      userEmail: params.userEmail,
      sessionId: params.sessionId,
      action: 'api_call',
      category: 'api_call',
      resourceType: 'api_endpoint',
      resourceId: params.endpoint,
      details: {
        endpoint: params.endpoint,
        method: params.method,
        parameters: params.parameters,
        responseStatus: params.responseStatus
      },
      success: params.responseStatus >= 200 && params.responseStatus < 300
    });
  }

  /**
   * Query audit logs
   */
  query(params: AuditQuery): AuditLogEntry[] {
    let results = [...this.logs];

    if (params.userId) {
      results = results.filter(log => log.userId === params.userId);
    }
    if (params.startDate) {
      results = results.filter(log => log.timestamp >= params.startDate!);
    }
    if (params.endDate) {
      results = results.filter(log => log.timestamp <= params.endDate!);
    }
    if (params.action) {
      results = results.filter(log => log.action === params.action);
    }
    if (params.category) {
      results = results.filter(log => log.category === params.category);
    }
    if (params.resourceType) {
      results = results.filter(log => log.resourceType === params.resourceType);
    }
    if (params.success !== undefined) {
      results = results.filter(log => log.success === params.success);
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(period: { start: Date; end: Date }): ComplianceReport {
    const logs = this.query({ startDate: period.start, endDate: period.end });

    // Group by user
    const userActivity: Record<string, {
      userId: string;
      userEmail: string;
      actions: AuditLogEntry[];
    }> = {};

    logs.forEach(log => {
      if (!userActivity[log.userId]) {
        userActivity[log.userId] = {
          userId: log.userId,
          userEmail: log.userEmail,
          actions: []
        };
      }
      userActivity[log.userId].actions.push(log);
    });

    const userActivitySummary = Object.values(userActivity).map(user => {
      const dataAccessed = new Set<string>();
      let exportsGenerated = 0;

      user.actions.forEach(action => {
        if (action.category === 'data_access') {
          dataAccessed.add(action.resourceType);
        }
        if (action.category === 'export') {
          exportsGenerated++;
        }
      });

      return {
        userId: user.userId,
        userEmail: user.userEmail,
        totalActions: user.actions.length,
        dataAccessed: Array.from(dataAccessed),
        exportsGenerated,
        lastActive: user.actions.sort((a, b) =>
          b.timestamp.getTime() - a.timestamp.getTime()
        )[0].timestamp
      };
    });

    // Critical events
    const criticalEvents = logs.filter(log =>
      this.CRITICAL_ACTIONS.includes(log.action)
    );

    // Data exports
    const dataExports = logs
      .filter(log => log.category === 'export')
      .map(log => ({
        date: log.timestamp,
        user: log.userEmail,
        reportType: log.details.reportType || 'unknown',
        commodities: log.details.commodities || []
      }));

    return {
      period,
      totalEvents: logs.length,
      userActivity: userActivitySummary,
      criticalEvents,
      dataExports
    };
  }

  /**
   * Export audit logs as CSV (for regulators)
   */
  exportAsCSV(params?: AuditQuery): string {
    const logs = params ? this.query(params) : this.logs;

    const headers = [
      'Timestamp (UTC)',
      'User ID',
      'User Email',
      'Action',
      'Category',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'Success',
      'Details'
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.userId,
      log.userEmail,
      log.action,
      log.category,
      log.resourceType,
      log.resourceId || '',
      log.ipAddress,
      log.success ? 'Yes' : 'No',
      JSON.stringify(log.details)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get audit summary
   */
  getSummary(days: number = 30): {
    totalEvents: number;
    uniqueUsers: number;
    dataAccessEvents: number;
    exportEvents: number;
    apiCalls: number;
    criticalEvents: number;
    recentActivity: AuditLogEntry[];
  } {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentLogs = this.query({ startDate: since });

    const uniqueUsers = new Set(recentLogs.map(log => log.userId)).size;

    return {
      totalEvents: recentLogs.length,
      uniqueUsers,
      dataAccessEvents: recentLogs.filter(log => log.category === 'data_access').length,
      exportEvents: recentLogs.filter(log => log.category === 'export').length,
      apiCalls: recentLogs.filter(log => log.category === 'api_call').length,
      criticalEvents: recentLogs.filter(log =>
        this.CRITICAL_ACTIONS.includes(log.action)
      ).length,
      recentActivity: recentLogs.slice(0, 10)
    };
  }

  /**
   * Load logs from localStorage (persistence)
   */
  private loadLogsFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('miar_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveLogsToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Keep last 1000 logs in localStorage
      const logsToSave = this.logs.slice(-1000);
      localStorage.setItem('miar_audit_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving audit logs:', error);
    }
  }

  /**
   * Auto-save every 5 minutes
   */
  private setupAutoSave(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.saveLogsToStorage();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Clear old logs (retention policy)
   */
  clearOldLogs(daysToKeep: number = 365): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    this.saveLogsToStorage();
  }
}

export default AuditTrailService;
