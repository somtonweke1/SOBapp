import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Server Configuration
 * Error tracking for server-side errors
 */

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out sensitive information
  beforeSend(event) {
    // Don't send events if no DSN is configured
    if (!process.env.SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;

      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
    }

    // Remove database connection strings
    if (event.contexts?.runtime?.DATABASE_URL) {
      delete event.contexts.runtime.DATABASE_URL;
    }

    return event;
  },

  // Add context
  initialScope: {
    tags: {
      environment: process.env.NODE_ENV,
    },
  },
});
