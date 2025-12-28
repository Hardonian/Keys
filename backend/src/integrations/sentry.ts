import * as Sentry from '@sentry/node';

export function initSentry(): void {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    beforeSend(event, _hint) {
      // Filter out sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        if (event.request.data) {
          // Remove sensitive fields from request data
          const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
          const cleanData = JSON.parse(JSON.stringify(event.request.data));
          sensitiveFields.forEach((field) => {
            if (cleanData[field]) {
              cleanData[field] = '[REDACTED]';
            }
          });
          event.request.data = cleanData;
        }
      }
      return event;
    },
  });

  console.log('Sentry initialized');
}

export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

export function setUserContext(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email,
  });
}

export function clearUserContext(): void {
  Sentry.setUser(null);
}
