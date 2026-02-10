import pino from 'pino';

/**
 * Structured Logging System using Pino
 * Provides consistent, searchable logs across the application
 */

// Create logger instance with appropriate configuration
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Pretty print in development
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),

  // Structured formatting for production
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  }),

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV,
    app: 'miar-platform',
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log API request
 */
export function logApiRequest(req: {
  method: string;
  url: string;
  userId?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
}) {
  const { method, url, userId, statusCode, duration, error } = req;

  if (error) {
    logger.error({
      type: 'api_request',
      method,
      url,
      userId,
      statusCode,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    }, `API Error: ${method} ${url}`);
  } else {
    logger.info({
      type: 'api_request',
      method,
      url,
      userId,
      statusCode,
      duration,
    }, `API Request: ${method} ${url}`);
  }
}

/**
 * Log database query
 */
export function logDatabaseQuery(query: {
  operation: string;
  model: string;
  duration?: number;
  error?: Error;
}) {
  const { operation, model, duration, error } = query;

  if (error) {
    logger.error({
      type: 'database_query',
      operation,
      model,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
      },
    }, `Database Error: ${operation} ${model}`);
  } else {
    logger.debug({
      type: 'database_query',
      operation,
      model,
      duration,
    }, `Database Query: ${operation} ${model}`);
  }
}

/**
 * Log authentication event
 */
export function logAuthEvent(event: {
  action: 'login' | 'logout' | 'register' | 'password_reset';
  userId?: string;
  email?: string;
  success: boolean;
  error?: Error;
  ipAddress?: string;
}) {
  const { action, userId, email, success, error, ipAddress } = event;

  if (success) {
    logger.info({
      type: 'auth_event',
      action,
      userId,
      email,
      ipAddress,
    }, `Auth Success: ${action}`);
  } else {
    logger.warn({
      type: 'auth_event',
      action,
      userId,
      email,
      ipAddress,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    }, `Auth Failure: ${action}`);
  }
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'rate_limit' | 'unauthorized_access' | 'suspicious_activity' | 'brute_force';
  userId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}) {
  const { type, userId, ipAddress, details } = event;

  logger.warn({
    type: 'security_event',
    eventType: type,
    userId,
    ipAddress,
    ...details,
  }, `Security Event: ${type}`);
}

/**
 * Log performance metric
 */
export function logPerformanceMetric(metric: {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}) {
  const { operation, duration, metadata } = metric;

  logger.info({
    type: 'performance_metric',
    operation,
    duration,
    ...metadata,
  }, `Performance: ${operation} took ${duration}ms`);
}

/**
 * Log error with full context
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  }, error.message);
}

/**
 * Log application startup
 */
export function logStartup(info: {
  port?: number;
  env: string;
  version?: string;
}) {
  logger.info({
    type: 'startup',
    ...info,
  }, `Application started on port ${info.port || 'N/A'}`);
}

/**
 * Log application shutdown
 */
export function logShutdown(reason?: string) {
  logger.info({
    type: 'shutdown',
    reason,
  }, `Application shutting down: ${reason || 'Unknown'}`);
}

export default logger;
