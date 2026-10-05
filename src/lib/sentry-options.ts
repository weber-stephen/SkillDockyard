import * as Sentry from "@sentry/nextjs";

export const sentryOptions: Parameters<typeof Sentry.init>[0] = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  // Keep performance tracing off while the global privacy/cookie posture is
  // under counsel review. Error reporting remains scrubbed below.
  tracesSampleRate: 0,
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.headers;
    }
    if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
    return event;
  }
};
