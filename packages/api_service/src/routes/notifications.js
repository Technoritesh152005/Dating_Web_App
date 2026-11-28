import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

export const registerNotificationRoutes: FastifyPluginAsync = async (app) => {
  // Expect a JSON body { token: string }
  const schema = z.object({ token: z.string().min(1) });

  app.post('/notifications/register', { config: { authenticated: true } }, async (request, reply) => {
    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    const { token } = parse.data;
    // Store the token in the user record (one token per user for simplicity)
    await app.db.user.update({
      where: { id: request.userId },
      data: { fcmToken: token },
    });
    return reply.send({ success: true });
  });
};
