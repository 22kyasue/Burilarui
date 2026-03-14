/**
 * Lightweight error tracker — logs errors to backend and console.
 * Replace with Sentry SDK when ready for production monitoring.
 */

const ERROR_LOG_ENDPOINT = (import.meta.env.VITE_API_BASE_URL || '/api') + '/errors/log';
const MAX_QUEUE_SIZE = 20;
const FLUSH_INTERVAL_MS = 30_000;

interface ErrorEntry {
  message: string;
  source: 'unhandled' | 'promise' | 'api' | 'component';
  stack?: string;
  url?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

const queue: ErrorEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function enqueue(entry: ErrorEntry) {
  queue.push(entry);
  if (queue.length >= MAX_QUEUE_SIZE) {
    flush();
  }
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  try {
    const body = JSON.stringify({ errors: batch });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ERROR_LOG_ENDPOINT, body);
    } else {
      fetch(ERROR_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silently drop — error tracker must never throw
  }
}

export function trackError(
  error: unknown,
  source: ErrorEntry['source'] = 'unhandled',
  meta?: Record<string, unknown>
) {
  const err = error instanceof Error ? error : new Error(String(error));
  const entry: ErrorEntry = {
    message: err.message,
    source,
    stack: err.stack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    meta,
  };
  console.error(`[ErrorTracker:${source}]`, err);
  enqueue(entry);
}

export function initErrorTracking() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, 'unhandled', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, 'promise');
  });

  // Periodic flush
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);

  // Flush on page unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function stopErrorTracking() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flush();
}
