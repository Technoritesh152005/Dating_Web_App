// Profile upload routes
// for profile based update routes a middleware is required means all must be login that is app.authenticate

import { Prisma } from "@prisma/client";
import { QUEUE_NAMES } from "@dating-app/shared/src/queueNames.js";
import { createQueue } from "@dating-app/shared/src/queue.js";
import { buildEmbeddingInput } from "@dating-app/shared/src/buildEmbeddingInput.js";
import { generatePresignedReadUrl } from "@dating-app/shared/src/storage.js";

const VALID_GENDER = [
  "MALE",
  "FEMALE",
  "NON_BINARY",
  "OTHER",
  "PREFERED_NOT_TO_SAY",
];
const VALID_PROFESSION = [
  "STUDENT",
  "ENGINEER",
  "DOCTOR",
  "BUSINESS",
  "GOVERNMENT",
  "ARTIST",
  "OTHER",
];
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "support",
  "help",
  "melodis",
  "official",
  "moderator",
]);
const PROFILE_CACHE_TTL_SECONDS = 60;

//helper function
function normalizeUsername(value) {
  if (value == null) return null;

  const username = String(value).trim().toLowerCase();

  if (!USERNAME_REGEX.test(username)) {
    throw new Error(
      "Username must be 3-20 characters long using lowercase letters , numbers , or undersocres",
    );
  }

  if (RESERVED_USERNAMES.has(username)) {
    throw new Error("This username is reserved");
  }

  return username;
}

export function registerProfileRoutes(app) {
  app.put(
    "/profile",
    {
      preHandler: app.authenticate,
      config: {
        authenticated: true,
        rateLimit: { max: 10, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      const {
        displayName,
        dateOfBirth,
        gender,
        bio,
        interests,
        profession,
        religion,
        caste,
        showReligionCaste,
        latitude,
        longitude,
        username,
      } = request.body ?? {};

      if (!displayName || !dateOfBirth || !gender || !profession) {
        return reply.code(400).send({
          error: "displayName, dateOfBirth, gender and profession are required",
        });
      }
      if (!VALID_GENDER.includes(gender)) {
        return reply
          .code(400)
          .send({ error: `Gender must be one of: ${VALID_GENDER.join(", ")}` });
      }
      if (!VALID_PROFESSION.includes(profession)) {
        return reply.code(400).send({
          error: `Profession must be one of: ${VALID_PROFESSION.join(", ")}`,
        });
      }

      const parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime())) {
        return reply
          .code(400)
          .send({ error: "dateOfBirth must be a valid date" });
      }

      const ageCalculate = calculateAge(parsedDateOfBirth);
      if (ageCalculate < 18) {
        return reply
          .code(400)
          .send({ error: "You must be 18 or Older than it to use the app" });
      }

      if (
        (latitude != null && (latitude < -90 || latitude > 90)) ||
        (longitude != null && (longitude < -180 || longitude > 180))
      ) {
        return reply.code(400).send({ error: "Invalid latitude or longitude" });
      }

      // prisma has a method known upsert/
      // if record exist update else create
      let normalizedUsername;
      try {
        normalizedUsername = normalizeUsername(username);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }

      const usernameData =
        username === undefined ? {} : { username: normalizedUsername };

      let profile;
      try {
        profile = await app.db.profile.upsert({
          // search whether user exist
          where: { userId: request.userId },
          // if exist update
          update: {
            displayName,
            dateOfBirth: parsedDateOfBirth,
            gender,
            bio: bio ?? "",
            interests: interests ?? [],
            profession,
            religion: religion ?? null,
            caste: caste ?? null,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            ...usernameData,
          },
          create: {
            userId: request.userId,
            displayName,
            dateOfBirth: parsedDateOfBirth,
            gender,
            bio: bio ?? "",
            interests: interests ?? [],
            profession,
            religion: religion ?? null,
            caste: caste ?? null,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            username: normalizedUsername,
          },
        });
      } catch (error) {
        if (error.code === "P2002") {
          return reply
            .code(409)
            .send({ error: "That username is already taken" });
        }

        throw error;
      }

      // postgres is not avalilable to imlicitly sync the postgis geography column. so we do it explicitly
      if (latitude != null && longitude != null) {
        // Use Prisma.sql tagged template for safe parameter binding (prevents SQL injection)
        await app.db.$executeRaw(Prisma.sql`
            UPDATE profiles
            SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}) , 4326)::geography
            WHERE id = ${profile.id}
            `);
      }
      /* delete the stale copy of profile data cached in redis */
      await app.redis.del(profileRedisKey(request.userId));
      await app.redis.del(`feed:${request.userId}`);

      // now once u created a profile we will create its embedding input
      const embeddingInput = await buildEmbeddingInput({
        bio: profile.bio,
        interests: profile.interests,
      });
      const embeddingQueue = createQueue(
        QUEUE_NAMES.EMBEDDING_UPDATE,
        app.redis.duplicate(),
      );
      // adding each request uniue id hich helps to keep in async or sync with the request
      await embeddingQueue.add("update-embedding", {
        profileId: profile.id,
        embeddingInput,
        requestId: request.id,
      });

      const feedRefillQueue = createQueue(
        QUEUE_NAMES.FEED_REFILL,
        app.redis.duplicate(),
      );
      await feedRefillQueue.add(
        "profile-saved-refill",
        {
          userId: request.userId,
          requestId: request.id,
        },
        { jobId: `feed-refill-${request.userId}` },
      );
      return reply.code(201).send(profile);
    },
  );

  app.get(
    "/profile/me",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const cachedData = await app.redis.get(profileRedisKey(request.userId));

      if (cachedData) {
        const cachedProfile = JSON.parse(cachedData);
        cachedProfile.photos = await signPhotoUrls(cachedProfile.photos);
        reply.header("X-Cache", "HIT");
        return reply.send(cachedProfile);
      }
      const profile = await app.db.profile.findUnique({
        where: {
          userId: request.userId,
        },
        include: {
          photos: { orderBy: { position: "asc" } },
        },
      });

      if (!profile) {
        return reply.code(404).send({ error: "Profile not Created" });
      }

      // setting the data in cache memory
      await app.redis.set(
        profileRedisKey(request.userId),
        JSON.stringify(profile),
        "EX",
        PROFILE_CACHE_TTL_SECONDS,
      );
      reply.header("X-Cache", "MISS");
      return reply.send({
        ...profile,
        photos: await signPhotoUrls(profile.photos),
      });
    },
  );

  // Save the location after the verified user grants browser permission.
  app.put(
    "/profile/location",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { latitude, longitude } = request.body ?? {};

      const lat = Number(latitude);
      const lon = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        return reply
          .code(400)
          .send({ error: "Valid latitude and longitude is required" });
      }

      //this creates a  only long and latitue coordinate just to display the points
      const profile = await app.db.profile.update({
        where: {
          userId: request.userId,
        },
        data: {
          latitude: lat,
          longitude: lon,
        },
      });
      // thissaves gesopatila based location which helps to retrieve data under a particular range
      await app.db.$executeRaw(Prisma.sql`
            UPDATE profiles
            SET location = ST_SetSRID(
            ST_MakePoint(${lon}, ${lat}),
            4326
            )::geography
            WHERE id = ${profile.id}
            `);

      await app.redis.del(profileRedisKey(request.userId));

      return reply.send({
        ok: true,
        latitude: lat,
        longitude: lon,
      });
    },
  );
}

function calculateAge(dob) {
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function profileRedisKey(userid) {
  return `cache:profile::me:${userid}`;
}

async function signPhotoUrls(photos = []) {
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      url: await generatePresignedReadUrl(photo.key),
    })),
  );
}
