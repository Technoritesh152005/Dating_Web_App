// Centralizing queue names avoids typo bugs (e.g. api enqueues to
// "send-email" but worker listens on "send-emails" - silent, hard-to-debug
// mismatch). Both sides import from here instead of hardcoding strings.
// Real queues (verification-check, match-notification, image-resize, etc.)
// get added here starting Level 3.

export const QUEUE_NAMES = {
    HEALTH_CHECK: 'health-check', // Level 0 placeholder only
    VERIFICATION_STATUS :'verification-check',
    MATCH_NOTIFICATION: 'match-notification',
  EMBEDDING_UPDATE: 'embedding-update', // Level 7 - recompute bio embedding on profile create/update
  FEED_REFILL: 'feed-refill', // Level 7.5 - precompute one user's candidate batch into Redis
  FEED_SCHEDULER: 'feed-scheduler',
  ICEBREAKER_GENERATION: 'icebreaker-generation',
  LOACTION_SHARE_CLEANUP:'location-share-cleanup'
  };