/**
 * Error Monitoring and Logging Service
 * Provides centralized error handling, logging, and monitoring
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  API_ERROR = 'api_error',
  DATABASE_ERROR = 'database_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  PARSING_ERROR = 'parsing_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  error: Error | unknown;
  context?: Record<string, any>;
  stackTrace?: string;
  userId?: string;
  requestId?: string;
}

class ErrorMonitoringService {
  private errors: ErrorReport[] = [];
  private maxErrorsStored = 1000;

  /**
   * Log an error with context
   */
  public logError(
    error: Error | unknown,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context?: Record<string, any>
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date(),
      severity,
      category,
      message: error instanceof Error ? error.message : String(error),
      error,
      context,
      stackTrace: error instanceof Error ? error.stack : undefined,
    };

    // Store error (with rotation)
    this.errors.push(errorReport);
    if (this.errors.length > this.maxErrorsStored) {
      this.errors.shift();
    }

    // Log to console with appropriate level
    this.consoleLog(errorReport);

    // In production, send to Sentry or other monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorReport);
    }

    return errorReport;
  }

  /**
   * Log API error
   */
  public logAPIError(
    error: Error | unknown,
    apiName: string,
    endpoint?: string,
    statusCode?: number
  ): ErrorReport {
    return this.logError(
      error,
      statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      ErrorCategory.API_ERROR,
      {
        apiName,
        endpoint,
        statusCode,
      }
    );
  }

  /**
   * Log database error
   */
  public logDatabaseError(
    error: Error | unknown,
    operation: string,
    table?: string
  ): ErrorReport {
    return this.logError(error, ErrorSeverity.HIGH, ErrorCategory.DATABASE_ERROR, {
      operation,
      table,
    });
  }

  /**
   * Log validation error
   */
  public logValidationError(
    message: string,
    field?: string,
    value?: any
  ): ErrorReport {
    return this.logError(
      new Error(message),
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION_ERROR,
      {
        field,
        value,
      }
    );
  }

  /**
   * Log rate limit error
   */
  public logRateLimitError(
    apiName: string,
    limit?: number,
    resetTime?: Date
  ): ErrorReport {
    return this.logError(
      new Error(`Rate limit exceeded for ${apiName}`),
      ErrorSeverity.MEDIUM,
      ErrorCategory.RATE_LIMIT_ERROR,
      {
        apiName,
        limit,
        resetTime,
      }
    );
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(count: number = 100): ErrorReport[] {
    return this.errors.slice(-count);
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.errors.filter((err) => err.severity === severity);
  }

  /**
   * Get errors by category
   */
  public getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errors.filter((err) => err.category === category);
  }

  /**
   * Get error statistics
   */
  public getStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    lastHour: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return {
      total: this.errors.length,
      bySeverity: this.countBySeverity(),
      byCategory: this.countByCategory(),
      lastHour: this.errors.filter((err) => err.timestamp > oneHourAgo).length,
    };
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Console log with appropriate level
   */
  private consoleLog(errorReport: ErrorReport): void {
    const prefix = this.getSeverityEmoji(errorReport.severity);
    const message = `${prefix} [${errorReport.category}] ${errorReport.message}`;

    if (errorReport.severity === ErrorSeverity.CRITICAL || errorReport.severity === ErrorSeverity.HIGH) {
      console.error(message, errorReport.context);
      if (errorReport.stackTrace) {
        console.error(errorReport.stackTrace);
      }
    } else if (errorReport.severity === ErrorSeverity.MEDIUM) {
      console.warn(message, errorReport.context);
    } else {
      console.log(message, errorReport.context);
    }
  }

  /**
   * Send to monitoring service (Sentry, DataDog, etc.)
   */
  private sendToMonitoring(errorReport: ErrorReport): void {
    // In production, implement integration with:
    // - Sentry (already configured in project)
    // - DataDog
    // - CloudWatch
    // - Custom monitoring endpoint

    // For now, just log that we would send to monitoring
    if (process.env.SENTRY_DSN) {
      // Sentry is configured - error will be automatically captured
      // by Next.js Sentry integration
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    const emojis: Record<ErrorSeverity, string> = {
      [ErrorSeverity.LOW]: 'ℹ️',
      [ErrorSeverity.MEDIUM]: '⚠️',
      [ErrorSeverity.HIGH]: '🔴',
      [ErrorSeverity.CRITICAL]: '🚨',
    };
    return emojis[severity];
  }

  /**
   * Count errors by severity
   */
  private countBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    for (const error of this.errors) {
      counts[error.severity]++;
    }

    return counts;
  }

  /**
   * Count errors by category
   */
  private countByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const error of this.errors) {
      counts[error.category] = (counts[error.category] || 0) + 1;
    }

    return counts;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let errorMonitoringInstance: ErrorMonitoringService | null = null;

export function getErrorMonitoring(): ErrorMonitoringService {
  if (!errorMonitoringInstance) {
    errorMonitoringInstance = new ErrorMonitoringService();
  }
  return errorMonitoringInstance;
}

export default ErrorMonitoringService;
