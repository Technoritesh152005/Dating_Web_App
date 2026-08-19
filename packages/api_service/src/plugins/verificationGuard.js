export function createVerificationGuard(app, options = {}) {
  // Core dating features require VERIFIED or UNDER_REVIEW
  // PENDING, REJECTED, REVERIFICATION_REQUIRED are blocked
  const allowedStatuses = options.allowedStatuses ?? ['VERIFIED', 'UNDER_REVIEW'];

  // Explicit mapping for clarity - what happens for each status
  const statusHandling = {
    VERIFIED: 'ALLOWED',
    UNDER_REVIEW: 'ALLOWED',       // User submitted selfie, waiting for result
    PENDING: 'BLOCKED',            // Never submitted verification - needs onboarding
    REVERIFICATION_REQUIRED: 'BLOCKED', // Primary photo changed after verification
    REJECTED: 'BLOCKED',           // Verification failed - can retry via onboarding
    NO_PROFILE: 'BLOCKED'          // Profile doesn't exist yet
  };

  return async function verificationGuard(request, reply) {
    // Skip for unauthenticated requests (handled by app.authenticate)
    if (!request.userId) {
      return reply.code(401).send({ error: 'Access Token Not Found/ Not Authenticated' });
    }

    const profile = await app.db.profile.findUnique({
      where: { userId: request.userId },
      select: { verificationStatus: true }
    });

    const status = profile?.verificationStatus ?? 'NO_PROFILE';
    const handling = statusHandling[status] ?? 'BLOCKED';

    if (handling === 'BLOCKED') {
      return reply.code(403).send({
        error: 'VERIFICATION_REQUIRED',
        verificationStatus: status,
        message: getVerificationRequiredMessage(status)
      });
    }

    // Attach for downstream use
    request.verificationStatus = status;
  };
}

function getVerificationRequiredMessage(status) {
  switch (status) {
    case 'PENDING':
      return 'Complete your profile and verify your identity to use this feature';
    case 'REVERIFICATION_REQUIRED':
      return 'Your primary photo was changed. Please verify again with a new selfie';
    case 'REJECTED':
      return 'Your verification was rejected. Please try again with a clearer selfie';
    case 'UNDER_REVIEW':
      return 'Your verification is under review. Please wait for the result';
    case 'NO_PROFILE':
      return 'Create your profile before using this feature';
    default:
      return 'Account verification required to use this feature';
  }
}