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
export function buildCandidatePool(db, { userId, ownProfile, prefs, page, pageSize }) {

    const offset = (page - 1) * pageSize

    // if user gave any gender then any clause do that set gender to any value the user gave else empty
    const genderClause =
        prefs.genderPreference.length > 0
            ? Prisma.sql`AND p.gender = ANY(${prefs.genderPreference})`
            : Prisma.empty;

    const professionClause =
        prefs.professionFilter.length > 0
            ? Prisma.sql`AND p.profession = ANY(${prefs.professionFilter})`
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
      // this says dont take rofile which dont have locn
          AND p.location IS NOT NULL
          AND ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(${ownProfile.longitude}, ${ownProfile.latitude}), 4326)::geography,
            ${prefs.maxDistanceKm * 1000}
          )
        `
        : Prisma.empty;

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
    ORDER BY p."updatedAt" DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
      `

    return candidate;
}
function calculateAge(dob) {
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
