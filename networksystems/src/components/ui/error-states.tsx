/**
 * User-Friendly Error States
 * Helpful error messages with recovery actions
 */

'use client';

import { AlertCircle, RefreshCw, Home, ArrowLeft, HelpCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AriaHelpers } from '@/lib/accessibility';
import { FUNCTIONAL_COLORS } from '@/lib/wcag-colors';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Error action button
 */
interface ErrorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

/**
 * Base error state props
 */
interface ErrorStateProps {
  title: string;
  message: string;
  severity?: ErrorSeverity;
  actions?: ErrorAction[];
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Base error state component
 */
export function ErrorState({
  title,
  message,
  severity = 'error',
  actions = [],
  className,
  icon,
}: ErrorStateProps) {
  const severityStyles = {
    error: {
      bg: 'bg-red-50/80',
      border: 'border-red-200',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
    },
    warning: {
      bg: 'bg-amber-50/80',
      border: 'border-amber-200',
      titleColor: 'text-amber-900',
      messageColor: 'text-amber-700',
      icon: <AlertCircle className="w-12 h-12 text-amber-500" />,
    },
    info: {
      bg: 'bg-blue-50/80',
      border: 'border-blue-200',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
      icon: <HelpCircle className="w-12 h-12 text-blue-500" />,
    },
  };

  const styles = severityStyles[severity];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'backdrop-blur-sm rounded-2xl p-8 border text-center',
        styles.bg,
        styles.border,
        className
      )}
    >
      {/* Icon */}
      <div className="flex justify-center mb-4">{icon || styles.icon}</div>

      {/* Title */}
      <h3 className={cn('text-2xl font-light mb-3', styles.titleColor)}>{title}</h3>

      {/* Message */}
      <p className={cn('text-base font-light mb-6 max-w-md mx-auto', styles.messageColor)}>
        {message}
      </p>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-3 justify-center flex-wrap">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-light transition-colors',
                action.variant === 'primary'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50'
              )}
              {...AriaHelpers.disabled(false)}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Network error (failed to load data)
 */
export function NetworkError({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Connection Error"
      message="We couldn't load the data. Please check your internet connection and try again."
      severity="error"
      actions={
        onRetry
          ? [
              {
                label: 'Try Again',
                onClick: onRetry,
                variant: 'primary',
                icon: <RefreshCw className="w-4 h-4" />,
              },
            ]
          : []
      }
      className={className}
    />
  );
}

/**
 * Not found error (404)
 */
export function NotFoundError({
  resourceName = 'page',
  onGoBack,
  onGoHome,
  className,
}: {
  resourceName?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title={`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} Not Found`}
      message={`We couldn't find the ${resourceName} you're looking for. It may have been moved or deleted.`}
      severity="warning"
      actions={[
        ...(onGoBack
          ? [
              {
                label: 'Go Back',
                onClick: onGoBack,
                variant: 'secondary' as const,
                icon: <ArrowLeft className="w-4 h-4" />,
              },
            ]
          : []),
        ...(onGoHome
          ? [
              {
                label: 'Go Home',
                onClick: onGoHome,
                variant: 'primary' as const,
                icon: <Home className="w-4 h-4" />,
              },
            ]
          : []),
      ]}
      className={className}
    />
  );
}

/**
 * Permission error (403)
 */
export function PermissionError({
  message = "You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake.",
  onGoBack,
  onContactSupport,
  className,
}: {
  message?: string;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Access Denied"
      message={message}
      severity="warning"
      actions={[
        ...(onGoBack
          ? [
              {
                label: 'Go Back',
                onClick: onGoBack,
                variant: 'secondary' as const,
                icon: <ArrowLeft className="w-4 h-4" />,
              },
            ]
          : []),
        ...(onContactSupport
          ? [
              {
                label: 'Contact Support',
                onClick: onContactSupport,
                variant: 'primary' as const,
                icon: <Mail className="w-4 h-4" />,
              },
            ]
          : []),
      ]}
      className={className}
    />
  );
}

/**
 * Server error (500)
 */
export function ServerError({
  onRetry,
  onReportIssue,
  className,
}: {
  onRetry?: () => void;
  onReportIssue?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Something Went Wrong"
      message="We encountered an unexpected error. Our team has been notified and is working on a fix."
      severity="error"
      actions={[
        ...(onRetry
          ? [
              {
                label: 'Try Again',
                onClick: onRetry,
                variant: 'primary' as const,
                icon: <RefreshCw className="w-4 h-4" />,
              },
            ]
          : []),
        ...(onReportIssue
          ? [
              {
                label: 'Report Issue',
                onClick: onReportIssue,
                variant: 'secondary' as const,
                icon: <Mail className="w-4 h-4" />,
              },
            ]
          : []),
      ]}
      className={className}
    />
  );
}

/**
 * Empty state (no data)
 */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  className,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <ErrorState
      title={title}
      message={message}
      severity="info"
      icon={icon}
      actions={
        actionLabel && onAction
          ? [
              {
                label: actionLabel,
                onClick: onAction,
                variant: 'primary',
              },
            ]
          : []
      }
      className={className}
    />
  );
}

/**
 * Inline error message (for forms)
 */
export function InlineError({
  message,
  id,
  className,
}: {
  message: string;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn('flex items-center gap-2 text-sm text-red-700 mt-1', className)}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Toast/banner error message
 */
export function ErrorBanner({
  message,
  onDismiss,
  severity = 'error',
  className,
}: {
  message: string;
  onDismiss?: () => void;
  severity?: ErrorSeverity;
  className?: string;
}) {
  const severityStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500',
    },
  };

  const styles = severityStyles[severity];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 rounded-lg border',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className={cn('w-5 h-5', styles.icon)} />
        <span className={cn('text-sm font-light', styles.text)}>{message}</span>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('text-sm font-light hover:underline', styles.text)}
          aria-label="Dismiss error"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

/**
 * Validation error summary (for forms)
 */
export function ValidationErrorSummary({
  errors,
  title = 'Please fix the following errors:',
  className,
}: {
  errors: Array<{ field: string; message: string }>;
  title?: string;
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-900 mb-2">{title}</h4>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading error with retry
 */
export function LoadingError({
  what = 'content',
  onRetry,
  isRetrying,
  className,
}: {
  what?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'bg-white/60 backdrop-blur-sm border border-zinc-200/50 rounded-2xl p-8 text-center',
        className
      )}
    >
      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-xl font-light text-zinc-900 mb-2">Failed to Load {what}</h3>
      <p className="text-sm text-zinc-600 mb-4">
        There was an error loading the {what}. Please try again.
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-light transition-colors',
            isRetrying
              ? 'bg-zinc-400 text-white cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          )}
          {...AriaHelpers.disabled(isRetrying || false)}
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  );
}

/**
 * Timeout error
 */
export function TimeoutError({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Request Timed Out"
      message="The request took too long to complete. This might be due to a slow internet connection or high server load."
      severity="warning"
      actions={
        onRetry
          ? [
              {
                label: 'Try Again',
                onClick: onRetry,
                variant: 'primary',
                icon: <RefreshCw className="w-4 h-4" />,
              },
            ]
          : []
      }
      className={className}
    />
  );
}

/**
 * Rate limit error
 */
export function RateLimitError({
  resetTime,
  className,
}: {
  resetTime?: Date;
  className?: string;
}) {
  const timeUntilReset = resetTime
    ? Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60)
    : null;

  return (
    <ErrorState
      title="Too Many Requests"
      message={
        timeUntilReset
          ? `You've made too many requests. Please wait ${timeUntilReset} minute${
              timeUntilReset > 1 ? 's' : ''
            } before trying again.`
          : "You've made too many requests. Please wait a few minutes before trying again."
      }
      severity="warning"
      className={className}
    />
  );
}

/**
 * Export all error components
 */
export const ErrorStates = {
  Base: ErrorState,
  Network: NetworkError,
  NotFound: NotFoundError,
  Permission: PermissionError,
  Server: ServerError,
  Empty: EmptyState,
  Inline: InlineError,
  Banner: ErrorBanner,
  ValidationSummary: ValidationErrorSummary,
  Loading: LoadingError,
  Timeout: TimeoutError,
  RateLimit: RateLimitError,
};

export default ErrorState;
