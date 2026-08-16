// Profile upload routes
// for profile based update routes a middleware is required means all must be login that is app.authenticate

import { QUEUE_NAMES } from "@dating-app/shared/src/queueNames.js"
import { createQueue } from "@dating-app/shared/src/queue.js"
import { buildEmbeddingInput } from "@dating-app/shared/src/buildEmbeddingInput.js"

const VALID_GENDER = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFERED_NOT_TO_SAY']
const VALID_PROFESSION = ['STUDENT', 'ENGINEER', 'DOCTOR', 'BUSINESS', 'GOVERNMENT', 'ARTIST', 'OTHER']
const PROFILE_CACHE_TTL_SECONDS = 60
export function registerProfileRoutes(app) {

    app.put('/profile', { preHandler: app.authenticate }, async (request, reply) => {

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
        } = request.body ?? {}

        if (!displayName || !dateOfBirth || !gender) {
            return reply.code(400).send({ error: "displayname , gender and dateOfbirth is required" })
        }
        if (!VALID_GENDER.includes(gender)) {
            return reply.code(400).send({ error: `Gender must be one of: ${VALID_GENDER.join(', ')}` });

        }
        if (profession && !VALID_PROFESSION.includes(profession)) {
            return reply.code(400).send({ error: "Please select profession based on one of them : ${VALID_PROFESSIONS.join(', ')}` }" })
        }

        const parsedDateOfBirth = new Date(dateOfBirth)
        if (Number.isNaN(parsedDateOfBirth.getTime())) {
            return reply.code(400).send({ error: 'dateOfBirth must be a valid date' })
        }

        const ageCalculate = calculateAge(parsedDateOfBirth)
        if (ageCalculate < 18) {
            return reply.code(400).send({ error: 'You must be 18 or Older than it to use the app' })
        }

        if ((latitude != null && (latitude < -90 || latitude > 90)) || (longitude != null && (longitude < -180 || longitude > 180))) {
            return reply.code(400).send({ error: 'Invalid latitude or longitude' })
        }


        // prisma has a method known upsert/
        // if record exist update else create

        const profile = await app.db.profile.upsert({
            // search whether user exist
            where: { userId: request.userId },
            // if exist update
            update: {
                displayName,
                dateOfBirth: parsedDateOfBirth,
                gender,
                bio: bio ?? '',
                interests: interests ?? [],
                profession: profession ?? 'OTHER',
                religion: religion ?? null,
                caste: caste ?? null,
                showReligionCaste: Boolean(showReligionCaste),
                latitude: latitude ?? null,
                longitude: longitude ?? null,
            },
            create: {
                userId: request.userId,
                displayName,
                dateOfBirth: parsedDateOfBirth,
                gender,
                bio: bio ?? '',
                interests: interests ?? [],
                profession: profession ?? 'OTHER',
                religion: religion ?? null,
                caste: caste ?? null,
                showReligionCaste: Boolean(showReligionCaste),
                latitude: latitude ?? null,
                longitude: longitude ?? null,
            }
        })

        // postgres is not avalilable to imlicitly sync the postgis geography column. so we do it explicitly
        if (latitude != null && longitude != null) {
            await app.db.$executeRaw`
            UPDATE profiles 
            SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}) , 4326)::geography
            WHERE id = ${profile.id}::uuid
            `
        }
        /* delete the stale copy of profile data cached in redis */
        await app.redis.del(profileRedisKey(request.userId))

        // now once u created a profile we will create its embedding input 
        const embeddingInput = await buildEmbeddingInput({ bio: profile.bio, interests: profile.interests })
        const embeddingQueue = createQueue(QUEUE_NAMES.EMBEDDING_UPDATE, app.redis.duplicate())
        // adding each request uniue id hich helps to keep in async or sync with the request
        await embeddingQueue.add('update-embedding', { profileId: profile.id, embeddingInput, requestId: request.id })

        const feedRefillQueue = createQueue(QUEUE_NAMES.FEED_REFILL, app.redis.duplicate());
        await feedRefillQueue.add('profile-saved-refill', { userId: request.userId, requestId: request.id });
        return reply.code(201).send(profile)
    })

    app.get('/profile/me', { preHandler: app.authenticate }, async (request, reply) => {

        const cachedData = await app.redis.get(profileRedisKey(request.userId))

        if (cachedData) {
            reply.header('X-Cache', 'HIT');
            return reply.send(JSON.parse(cachedData));
        }
        const profile = await app.db.profile.findUnique({
            where: {
                userId: request.userId
            },
            include: {
                photos: { orderBy: { position: 'asc' } }
            },
        })

        if (!profile) {
            return reply.code(404).send({ error: "Profile not Created" })
        }

        // setting the data in cache memory
        await app.redis.set(profileRedisKey(request.userId), JSON.stringify(profile), 'EX', PROFILE_CACHE_TTL_SECONDS)
        reply.header('X-Cache', 'MISS');
        return reply.send(profile);

    })
}

function calculateAge(dob) {
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
}

function profileRedisKey(userid) {
    return `cache:profile::me:${userid}`
}
