import { google } from 'googleapis';
import { z } from 'zod';

/**
 * POST /payments/verify
 * Body: { purchaseToken: string, productId: string }
 * Requires authenticated user. Verifies the token with Google Play Billing and
 * updates the user's subscriptionTier field.
 */
export const registerPaymentsRoutes = async (app) => {
  const schema = z.object({
    purchaseToken: z.string().min(1),
    productId: z.string().min(1),
  });

  app.post(
    '/payments/verify',
    { config: { authenticated: true } },
    async (request, reply) => {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid payload' });
      }
      const { purchaseToken, productId } = parsed.data;

      // Google Play API client – uses service account credentials from env
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });
      const client = await auth.getClient();
      const androidpublisher = google.androidpublisher({ version: 'v3', auth: client });

      const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
      if (!packageName) {
        return reply.code(500).send({ error: 'Server mis‑configuration: package name missing' });
      }

      try {
        const res = await androidpublisher.purchases.subscriptions.get({
          packageName,
          subscriptionId: productId,
          token: purchaseToken,
        });
        const purchase = res.data;
        // Simple check: ensure the purchase is active and not expired
        const isActive = purchase && purchase.paymentState === 1 && !purchase.cancelReason;
        if (!isActive) {
          return reply.code(400).send({ error: 'Purchase not active' });
        }
        // Update user record – you can store the tier or expiration date
        await app.db.user.update({
          where: { id: request.userId },
          data: { subscriptionTier: productId },
        });
        return reply.send({ success: true });
      } catch (err) {
        app.log.error({ err }, 'Google Play verification failed');
        return reply.code(502).send({ error: 'Failed to verify purchase' });
      }
    },
  );
};
