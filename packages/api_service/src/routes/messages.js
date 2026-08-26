import { createQueue } from '@dating-app/shared/src/queue.js';
import { QUEUE_NAMES } from '@dating-app/shared/src/queueNames.js';

const PAGE_SIZE = 50;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id) {
  return UUID_REGEX.test(id);
}

export function registerGetMessageRoutes(app) {
  app.get(
    "/matches/:matchId/messages",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const { matchId } = request.params;
      const before = request.query.before; //fetches all message older than this msg

      // validate matchId format
      if (!matchId || !isValidUuid(matchId)) {
        return reply.code(400).send({ error: "Invalid match ID" });
      }

      // check wheter logged in user and match user id are same
      const match = await app.db.match.findUnique({
        where: { id: matchId },
      });
      if (!match)
        return reply
          .code(404)
          .send({ error: "No Match Found. You cant get the message" });

      if (match.userAId !== request.userId && match.userBId !== request.userId)
        return reply
          .code(403)
          .send({ error: "You are not part of this match" });

      let cursor_date = null;
      if (before) {
        if (!isValidUuid(before)) {
          return reply.code(400).send({ error: "Invalid cursor message ID" });
        }
        // validate that the cursor message belongs to this match
        const cursorMessage = await app.db.message.findUnique({
          where: { id: before },
        });
        if (!cursorMessage || cursorMessage.matchId !== matchId) {
          return reply.code(400).send({ error: "Invalid cursor message" });
        }
        // extract timestamp from oldest message
        cursor_date = cursorMessage.createdAt;
      }

      // now get all message before timestamp
      const messages = await app.db.message.findMany({
        where: {
          matchId,
          ...(cursor_date && { createdAt: { lt: cursor_date } }),
        },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
      });

      return reply.code(200).send({
        messages: messages.reverse(),
        hasMore: messages.length === PAGE_SIZE,
      });
    },
  );

  app.get(
    "/matches/:matchId/scam-warning",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const { matchId } = request.params;

      if (!isValidUuid(matchId)) {
        return reply
          .code(400)
          .send({ error: "Invalid matchId Format. Pagal banata hai kya?" });
      }

      const match = await app.db.match.findUnique({
        where: {
          id: matchId,
        },
        include: { scamRiskFlag: true },
      });

      if (
        !match ||
        (match.userAId !== request.userId && match.userBId !== request.userId)
      ) {
        return reply.code(404).send({
          error:
            "Match Id not found / User not authenticated to view this match",
        });
      }

      //this checks if anyone dismmised before anything
      const dismissed =
        match.userAId === request.userId
          ? match?.scamRiskFlag?.dismissedByUserA
          : match?.scamRiskFlag?.dismissedByUserB;

      if (dismissed || !match.scamRiskFlag) {
        return reply.send({ warning: null });
      }

      return reply.send({
        warning: {
          risk: match.scamRiskFlag.risk,
          confidence: match.scamRiskFlag.confidence,
          signals: match.scamRiskFlag.signals,
        },
      });
    },
  );

  app.get(
    "/matches/:matchId/scam-consent",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const { matchId } = request.params;
      if (!isValidUuid(matchId)) {
        return reply.code(400).send({ error: "Invalid match ID" });
      }

      const match = await app.db.match.findUnique({
        where: { id: matchId },
        select: {
          userAId: true,
          userBId: true,
          scamAnalysisConsentA: true,
          scamAnalysisConsentB: true,
        },
      });

      if (!match || (match.userAId !== request.userId && match.userBId !== request.userId)) {
        return reply.code(404).send({ error: "Match not found" });
      }

      const consent = match.userAId === request.userId
        ? match.scamAnalysisConsentA
        : match.scamAnalysisConsentB;

      return reply.send({ consent, bothConsented: match.scamAnalysisConsentA === true && match.scamAnalysisConsentB === true });
    },
  );

  app.post(
    "/matches/:matchId/scam-consent",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const { matchId } = request.params;
      const { consent } = request.body ?? {};
      if (!isValidUuid(matchId) || typeof consent !== "boolean") {
        return reply.code(400).send({ error: "Valid match ID and consent are required" });
      }

      const match = await app.db.match.findUnique({
        where: { id: matchId },
        select: { userAId: true, userBId: true },
      });

      if (!match || (match.userAId !== request.userId && match.userBId !== request.userId)) {
        return reply.code(404).send({ error: "Match not found" });
      }

      const data = match.userAId === request.userId
        ? { scamAnalysisConsentA: consent, scamAnalysisConsentAtA: new Date() }
        : { scamAnalysisConsentB: consent, scamAnalysisConsentAtB: new Date() };

      const updatedMatch = await app.db.match.update({
        where: { id: matchId },
        data,
        select: {
          scamAnalysisConsentA: true,
          scamAnalysisConsentB: true,
        },
      });

      if (updatedMatch.scamAnalysisConsentA === true && updatedMatch.scamAnalysisConsentB === true) {
        const scamQueue = createQueue(QUEUE_NAMES.SCAM_ANALYSIS, app.redis.duplicate());
        scamQueue.add(
          'analyze-conversation',
          { matchId },
          { jobId: `scam-${matchId}-${Math.floor(Date.now() / 60_000)}` },
        ).catch((error) => request.log.error({ error, matchId }, 'Failed to queue scam analysis after consent'));
      }
      return reply.send({ ok: true, consent });
    },
  );

  //this stores the data that who dismiss the warning they got from scam detection
  app.post(
    "/matches/:matchId/scam-warning/dismiss",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const { matchId } = request.params;

      if (!isValidUuid(matchId)) {
        return reply.code(400).send({ error: "Invalid match ID" });
      }

      const match = await app.db.match.findUnique({
        where: { id: matchId },
        select: { userAId: true, userBId: true },
      });

      if (
        !match ||
        (match.userAId !== request.userId && match.userBId !== request.userId)
      ) {
        return reply.code(404).send({ error: "Match not found" });
      }

      await app.db.scamRiskFlag.updateMany({
        where: { matchId },
        data:
          match.userAId === request.userId
            ? { dismissedByUserA: true }
            : { dismissedByUserB: true },
      });

      return reply.send({ ok: true });
    },
  );
}
// these gets the message in desc time of timestamp
