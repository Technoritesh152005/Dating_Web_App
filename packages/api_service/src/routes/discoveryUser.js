import {
  removeuserPreference,
  filterOutSeen,
  createQueue,
  buildCandidateFeedWithRelaxation,
} from "@dating-app/shared";
import { QUEUE_NAMES } from "@dating-app/shared/src/queueNames.js";
import { generatePresignedReadUrl } from "@dating-app/shared/src/storage.js";
import { Prisma } from "@prisma/client";
const PAGE_SIZE = 20; // pagination: never return the whole pool in one response

const STRONG_MATCH_SIMILARITY = 0.75;
const GOOD_MATCH_SIMILARITY = 0.6;
const REFIL_THRESHOLD = 10;
const VALID_EXPLORE_MODES = [
  "SHORT_TERM",
  "LONG_TERM",
  "CASUAL_DATING",
  "SERIOUS_RELATIONSHIP",
  "FRIENDSHIP",
  "NEW_CONNECTIONS",
  "OPEN_TO_ANYTHING",
  "NOT_SURE_YET",
  "JUST_CHAT",
  "COFFEE_DATE",
  "ADVENTURE_BUDDY",
  "TRAVEL_BUDDY",
  "GAMING_BUDDY",
  "FREE_TONIGHT",
];

function feedListKey(userId) {
  return `feed:${userId}`;
}

export function registerDiscoveryRoutes(app) {
  // this return a filtered pool of filtered candidate acc to user prefernce

  // first we send raw sql where we filter and select user based on index and filter in database level only
  // Step 1: raw SQL finds WHICH profile IDs qualify (uses indexes, fast,
  //           even with millions of rows - this is the DB-level filtering
  //           we designed for).
  app.get(
    "/discovery/feed",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const page = Math.max(1, Number(request.query.page || 1));
      const ownProfile = await app.db.profile.findUnique({
        where: { userId: request.userId },
      });
      if (!ownProfile) {
        return reply
          .code(404)
          .send({ error: "Create Your profile before discovering others" });
      }
      const listKey = feedListKey(request.userId);

      // Step 1: First check or pop a batch from precomputed list.. i.e only 20
      let candIds = await app.redis.lpop(listKey, PAGE_SIZE);
      let relaxed = false;

      // from the candidate we got from pref based we now filter it out using bloom filter
      if (candIds && candIds.length > 0) {
        candIds = await filterOutSeen(request.userId, candIds, app.redis);
      }

      // if the remaining feed list profile is leess than threshold after filtering then we create a new feed where we put in bg queue where bg worker processes it
      const remainingProfiles = await app.redis.llen(listKey);
      if (remainingProfiles < REFIL_THRESHOLD) {
        const refillQueue = createQueue(
          QUEUE_NAMES.FEED_REFILL,
          app.redis.duplicate(),
        );
        refillQueue
          .add("reactive-refill", {
            userId: request.userId,
            requestId: request.id,
          }, { jobId: `feed-refill-${request.userId}` })
          .catch((err) => request.log.error(err));
      }

      // now u reached here means u dont habe candidate pool in list redis
      if (!candIds || candIds.length === 0) {
        // once u have a profile u need to extract the prefernce
        const resolvedPrefs = await removeuserPreference(
          app.db,
          request.userId,
          ownProfile,
        );
        const result = await buildCandidateFeedWithRelaxation(app.db, {
          userId: request.userId,
          ownProfile,
          prefs: resolvedPrefs,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        candIds = result.candidates.map((c) => c.id);
        relaxed = result.relaxed;
      }

      if (candIds.length === 0) {
        return reply.send({ profiles: [], hasMore: false, relaxed });
      }

      // u get here all profiles
      const fullProfiles = await app.db.profile.findMany({
        where: { id: { in: candIds } },
        include: { photos: { orderBy: { position: "asc" } } },
      });

      const candidateUserIds = fullProfiles.map((profile) => profile.userId)
      const blockedRecords = await app.db.block.findMany({
        where: {
          OR: [
            { blockerId: request.userId, blockedId: { in: candidateUserIds } },
            { blockerId: { in: candidateUserIds }, blockedId: request.userId },
          ],
        },
        select: { blockerId: true, blockedId: true },
      })
      const blockedUserIds = new Set()
      for (const block of blockedRecords) {
        blockedUserIds.add(block.blockerId === request.userId ? block.blockedId : block.blockerId)
      }
      const recentSwipes = await app.db.swipe.findMany({
        where: {
          fromUserId: request.userId,
          toUserId: { in: candidateUserIds },
          OR: [
            { action: { in: ['LIKE', 'FIRE_LIKE'] } },
            { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { toUserId: true },
      })
      const swipedUserIds = new Set(recentSwipes.map((swipe) => swipe.toUserId))

      //getting personal  embeeding also
      const ownEmbeddingRows = await app.db.$queryRaw`
        SELECT "bioEmbedding"::text AS embedding
        FROM profiles
        WHERE id = ${ownProfile.id}
        `;
      console.log(ownEmbeddingRows);

      const ownEmbeddingText = ownEmbeddingRows[0]?.embedding ?? null;
      const compatibilityByProfileId = new Map();

      //if u have your own embedding text then only u can compare ur embedding with others
      if (ownEmbeddingText) {
        const similarityRows = await app.db.$queryRaw`
            SELECT p.id ,
            1-(p."bioEmbedding" <=> ${ownEmbeddingText}::vector) AS similarity
            FROM profiles p
            WHERE p.id IN (${Prisma.join(candIds)})
            AND p."bioEmbedding" IS NOT NULL
            `;

        for (const row of similarityRows) {
          const similarity = Number(row.similarity);

          if (similarity >= STRONG_MATCH_SIMILARITY) {
            compatibilityByProfileId.set(row.id, "STRONG");
          } else if (similarity >= GOOD_MATCH_SIMILARITY) {
            compatibilityByProfileId.set(row.id, "GOOD");
          }
        }
      }

      //   it maps the profile id to profile and helps user to get
      const profileById = new Map(fullProfiles.map((p) => [p.id, p]));

      const orderedProfiles = candIds
        .map((id) => profileById.get(id))
        .filter(Boolean) // in case a profile got deleted between step 1 and step 2
        .filter((profile) =>
          ['VERIFIED', 'UNDER_REVIEW'].includes(profile.verificationStatus) &&
          !profile.safetyFlagged &&
          !blockedUserIds.has(profile.userId) &&
          !swipedUserIds.has(profile.userId)
        )
        .map((profile) => {
            //if compatibility score exist for the user then put in profile else not
          const safeProfile = sanitizeForOtherUsers(profile);
          const compatibilityLabel = compatibilityByProfileId.get(profile.id);

          return compatibilityLabel
            ? { ...safeProfile, compatibilityLabel }
            : safeProfile;
        });

      for (const profile of orderedProfiles) {
        profile.photos = await Promise.all(
          profile.photos.map(async (photo) => ({
            ...photo,
            url: await generatePresignedReadUrl(photo.key),
          })),
        );
      }

      return reply.send({
        profiles: orderedProfiles,
        page,
        hasMore: candIds.length === PAGE_SIZE,
        relaxed,
      });
    },
  );

  app.get(
    "/discovery/explore",
    { preHandler: [app.authenticate, app.requireVerification] },
    async (request, reply) => {
      const mode = String(request.query.mode || "").toUpperCase();

      if (!VALID_EXPLORE_MODES.includes(mode)) {
        return reply
          .code(400)
          .send({
            error: `Invalid Explore mode. Use one of: ${VALID_EXPLORE_MODES.join(", ")}`,
          });
      }

      // Find preferences that include this mode
      const preferences = await app.db.preference.findMany({
        where: { lookingFor: { has: mode } },
        select: { userId: true },
      });

      const matchingUserIds = preferences
        .map((p) => p.userId)
        .filter((id) => id !== request.userId);

      if (matchingUserIds.length === 0) {
        return reply.send({ mode, profiles: [] });
      }

      // exclude users the requester has already swiped on
      const swipes = await app.db.swipe.findMany({
        where: {
          fromUserId: request.userId,
          toUserId: { in: matchingUserIds },
        },
        select: { toUserId: true },
      });

      // exclude any users involved in a block with the requester
      const blockedRecords = await app.db.block.findMany({
        where: {
          OR: [{ blockerId: request.userId }, { blockedId: request.userId }],
        },
        select: { blockerId: true, blockedId: true },
      });

      const excludedUserIds = new Set([
        request.userId,
        ...swipes.map((s) => s.toUserId),
      ]);
      for (const b of blockedRecords) {
        if (b.blockerId) excludedUserIds.add(b.blockerId);
        if (b.blockedId) excludedUserIds.add(b.blockedId);
      }

      const allowedUserIds = matchingUserIds.filter(
        (id) => !excludedUserIds.has(id),
      );
      if (allowedUserIds.length === 0) {
        return reply.send({ mode, profiles: [] });
      }

      const profiles = await app.db.profile.findMany({
        where: {
          userId: { in: allowedUserIds },
          verificationStatus: { in: ["VERIFIED", "UNDER_REVIEW"] },
        },
        include: { photos: { orderBy: { position: "asc" } } },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });

      const safeProfiles = await Promise.all(
        profiles.map(async (profile) => {
          const safe = sanitizeForOtherUsers(profile);
          safe.photos = await Promise.all(
            (profile.photos || []).map(async (photo) => ({
              ...photo,
              url: await generatePresignedReadUrl(photo.key),
            })),
          );
          return safe;
        }),
      );

      return reply.send({ mode, profiles: safeProfiles });
    },
  );
}

// Never leak fields other users shouldn't see - even though this data lives
// in the Profile table, not everything on it belongs in a response to a
// stranger. This is the enforcement point for the "opt-in, hidden by
// default" religion/caste rule from our schema design.
function sanitizeForOtherUsers(profile) {
  const {
    religion,
    caste,
    showReligionCaste,
    latitude,
    longitude,
    ...safeFields
  } = profile;

  return {
    ...safeFields,
    // Only include religion/caste in the response if the profile OWNER
    // opted in to showing it - this is enforced again here, not just in
    // the SQL filter, as defense in depth (the filter only controls WHO
    // shows up in results; this controls WHAT gets shown about them).
    ...(showReligionCaste ? { religion, caste } : {}),
  };
}
