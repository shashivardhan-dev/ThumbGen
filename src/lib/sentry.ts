import * as Sentry from '@sentry/node';

export function initSentry() {
  if (process.env.SENTRY_DSN && !global.__sentry_initialized) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
    global.__sentry_initialized = true;
  }
}

export default Sentry;
