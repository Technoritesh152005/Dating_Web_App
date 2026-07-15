// Centralizing queue names avoids typo bugs (e.g. api enqueues to
// "send-email" but worker listens on "send-emails" - silent, hard-to-debug
// mismatch). Both sides import from here instead of hardcoding strings.
// Real queues (verification-check, match-notification, image-resize, etc.)
// get added here starting Level 3.

export const QUEUE_NAMES = {
    HEALTH_CHECK: 'health-check', // Level 0 placeholder only
  };