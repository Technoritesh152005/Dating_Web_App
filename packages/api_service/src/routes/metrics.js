import { getCounter, QUEUE_NAMES } from '@dating-app/shared'
import { Queue } from 'bullmq'

export function registerMetricsHook(app) {
    app.addHook('onResponse', async (request, reply) => {
      await app.redis.incr('metrics:http_requests_total').catch(() => {}); // metrics collection itself must never break a real request
      if (reply.statusCode >= 500) {
        await app.redis.incr('metrics:http_errors_total').catch(() => {});
      }
    });
  }

export function registerMetricsRoutes(app) {

    app.get('/metrics', async (request, reply) => {

        const requestTotal = await getCounter(app.redis, 'http_request_total');
        const errorsTotal = await getCounter(app.redis, 'http_errors_total')

        const queueDepthLines = await Promise.all(
            Object.values(QUEUE_NAMES).map((queueName) => {
                // for each queue names we will get their metrics
                // u r not creating a new queue just using existing queue to get their metrics count
                const queue = new Queue(queueName, { connection: app.redis.duplicate() })
                const counts = await queue.getJobCounts('waiting', 'active', 'failed', 'delayed')
                await queue.close()
                return [
                    `queue_jobs_waiting{queue="${queueName}"} ${counts.waiting}`,
                    `queue_jobs_active{queue="${queueName}"} ${counts.active}`,
                    `queue_jobs_failed{queue="${queueName}"} ${counts.failed}`,
                    `queue_jobs_delayed{queue="${queueName}"} ${counts.delayed}`,
                ].join('\n');
            })
        )

        const body = [

            '# HELP http_requests_total Total HTTP requests handled',
            '# TYPE http_requests_total counter',
            `http_requests_total ${requestsTotal}`,
            '',
            '# HELP http_errors_total Total HTTP requests that returned 5xx',
            '# TYPE http_errors_total counter',
            `http_errors_total ${errorsTotal}`,
            '',
            '# HELP queue_jobs_waiting Jobs waiting to be processed, per queue',
            '# TYPE queue_jobs_waiting gauge',
            '# HELP queue_jobs_active Jobs currently being processed, per queue',
            '# TYPE queue_jobs_active gauge',
            '# HELP queue_jobs_failed Jobs that exhausted all retry attempts, per queue',
            '# TYPE queue_jobs_failed gauge',
            '# HELP queue_jobs_delayed Jobs scheduled for future processing, per queue',
            '# TYPE queue_jobs_delayed gauge',
            ...queueDepthLines,
        ].join('\n')

        reply.header('Content-Type', 'text/plain; version=0.0.4');
        return reply.send(body);
    })
}