import pino from 'pino';

// One consistent structured logger across api/realtime/worker.
// Structured (JSON) logs matter once you deploy - Railway/Render log
// viewers and any future log aggregation tool can filter/search JSON
// fields (e.g. { service: "worker", jobId: "..." }) far better than
// plain console.log strings.

export function createLogger(serviceName) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
  });
}