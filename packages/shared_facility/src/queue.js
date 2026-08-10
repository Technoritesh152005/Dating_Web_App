const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 24 * 60 * 60, count: 1000 }, // keep recent history for debugging, don't grow Redis unbounded
    removeOnFail: { age: 7 * 24 * 60 * 60 }, // keep failed jobs longer - useful for diagnosing what went wrong
  };
  
  export function createQueue(queueName, redisConnection) {
    return new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  

//   set retry/backoff as default job options at the Queue level, in the one shared factory function — every .add() call across the whole codebase inherits it automatically, no need to repeat config at each of the 7+ call sites (and no risk of one being forgotten):