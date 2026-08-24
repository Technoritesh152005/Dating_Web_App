// ============================================================================
// DISCOVERY FEED — candidate pool builder.
//
// This is the piece we specifically discussed as "must be DB/index-level,
// never load-everyone-then-filter-in-JS." Every filter below (age, gender,
// distance, profession, religion/caste) is applied INSIDE the SQL query,
// using indexes, so Postgres only ever touches rows that could plausibly
// match - it never scans the full users table.
//
// Why raw SQL here (not Prisma's normal query builder): the geography
// column (Profile.location) is declared `Unsupported(...)` in schema.prisma
// (see Level 1 notes) because Prisma has no native PostGIS type. Distance
// filtering with ST_DWithin has to be raw SQL - there's no way to express
// "within X meters" through Prisma's normal `where` object.

import { Prisma } from '@prisma/client'

const DEFAULT_AGE_PADDING_YEARS = 5
const DEFAULT_MAX_DISTANCE_KM = 50
const MIN_ACCEPTABLE_POOL_SIZE = 5

//this sets the user prefernce or get the preference
export async function removeuserPreference(db, userId, ownProfile) {

    const saved = await db.preference.findUnique(
        {
            where: { userId }
        }
    )

    if (saved) {
        return {
            minAge: saved.minAge,
            maxAge: saved.maxAge,
            maxDistanceKm: saved.maxDistanceKm,
            genderPreference: saved.genderPreference,
            professionFilter: saved.professionFilter,
            religionFilter: saved.religionFilter,
            casteFilter: saved.casteFilter,
        }
    }

    // if no prefernce set
    const ownAge = calculateAge(ownProfile.dateOfBirth)
    return {
        minAge: Math.max(18, ownAge - DEFAULT_AGE_PADDING_YEARS),
        maxAge: ownAge + DEFAULT_AGE_PADDING_YEARS,
        maxDistanceKm: DEFAULT_MAX_DISTANCE_KM,
        genderPreference: [], // empty = show all genders until the user states a preference
        professionFilter: [], // empty = no filter (opt-in extra, per our earlier discussion)
        religionFilter: [],
        casteFilter: [],
    }
}

// this file has no connection with db so they explicitly provide app.db
//it takes out or returns candidate based on user preference and not filter here itself that whom he saw or not
export async function buildCandidatePool(db, { userId, ownProfile, prefs, page = 1, pageSize = 20 }) {

    const offset = (page - 1) * pageSize

    // if user gave any gender then any clause do that set gender to any value the user gave else empty
    const genderClause =
        prefs.genderPreference.length > 0
            ? Prisma.sql`AND p.gender::text = ANY(${prefs.genderPreference}::text[])`
            : Prisma.empty;

    const professionClause =
        prefs.professionFilter.length > 0
            ? Prisma.sql`AND p.profession::text = ANY(${prefs.professionFilter}::text[])`
            : Prisma.empty;

    const religionClause =
        prefs.religionFilter.length > 0
            ? Prisma.sql`AND p."showReligionCaste" = true AND p.religion = ANY(${prefs.religionFilter})`
            : Prisma.empty;

    const casteClause =
        prefs.casteFilter.length > 0
            ? Prisma.sql`AND p."showReligionCaste" = true AND p.caste = ANY(${prefs.casteFilter})`
            : Prisma.empty;

    const distanceClause = ownProfile.latitude != null && ownProfile.longitude != null
        ? Prisma.sql`
          AND p.location IS NOT NULL
          AND ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(${ownProfile.longitude}, ${ownProfile.latitude}), 4326)::geography,
            ${prefs.maxDistanceKm * 1000}
          )
        `
        : Prisma.empty;

    // take the best users who have same embeeding feature
    const ownEmbeddingRows = await db.$queryRaw
        `
         SELECT "bioEmbedding"::text AS embedding FROM profiles WHERE id = ${ownProfile.id}
         `
    const ownEmbeddingText = ownEmbeddingRows[0]?.embedding ?? null;

    const orderClause = ownEmbeddingText
        ? Prisma.sql`ORDER BY p."bioEmbedding" <=> ${ownEmbeddingText}::vector ASC, p."updatedAt" DESC`
        : Prisma.sql`ORDER BY p."updatedAt" DESC`;


    const candidate = await db.$queryRaw
        `
      SELECT p.id, p."userId",
      EXTRACT(YEAR FROM AGE(p."dateOfBirth")) AS age
    FROM profiles p
    WHERE p."userId" != ${userId}
      -- exclude anyone I've already swiped on (in either direction of action)
      AND NOT EXISTS (
        SELECT 1 FROM swipes s
        WHERE s."fromUserId" = ${userId} AND s."toUserId" = p."userId"
         AND (s.action IN ('LIKE', 'FIRE_LIKE') OR s."createdAt" > NOW() - INTERVAL '30 days')
      )
      -- exclude anyone I've blocked, or who has blocked me
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
          WHERE (b."blockerId" = ${userId} AND b."blockedId" = p."userId")
              OR (b."blockerId" = p."userId" AND b."blockedId" = ${userId})
      )
      AND EXTRACT(YEAR FROM AGE(p."dateOfBirth")) BETWEEN ${prefs.minAge} AND ${prefs.maxAge}
      ${genderClause}
      ${professionClause}
      ${religionClause}
      ${casteClause}
      ${distanceClause}
      ${orderClause}
    LIMIT ${pageSize}
    OFFSET ${offset}
      `
console.log(candidate)
    return candidate;
}

export async function buildCandidateFeedWithRelaxation(db, params) {
    const { prefs } = params

    // attemp 1: exactly what the user asked for
    let candidates = await buildCandidatePool(db, params)
    if (candidates.length >= MIN_ACCEPTABLE_POOL_SIZE) {

        return { candidates, relaxed: false, relaxedFields: [] }
    }

    // attempt 2 increasing distance
    for (const multiplier of [2, 4]) {
        const widePrefs = { ...prefs, maxDistanceKm: prefs.maxDistanceKm * multiplier }
        candidates = await buildCandidatePool(db, { ...params, prefs: widePrefs })
        if (candidates.length >= MIN_ACCEPTABLE_POOL_SIZE) {
            return { candidates, relaxed: true, relaxedFields: ['distance'] };
        }
    }

    // Attempt 3: widen age range too.
    const widerAgePrefs = {
        ...prefs,
        maxDistanceKm: prefs.maxDistanceKm * 4,
        minAge: Math.max(18, prefs.minAge - 5),
        maxAge: prefs.maxAge + 5,
    };
    candidates = await buildCandidatePool(db, { ...params, prefs: widerAgePrefs });
    const hasNoOptionalFilters = prefs.professionFilter.length === 0 && prefs.religionFilter.length === 0 && prefs.casteFilter.length === 0;
    if (candidates.length >= MIN_ACCEPTABLE_POOL_SIZE || hasNoOptionalFilters) {
        return { candidates, relaxed: true, relaxedFields: ['distance', 'age'] };
    }

    return { candidates, relaxed: true, relaxedFields: ['distance', 'age'] };
}
function calculateAge(dob) {
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
