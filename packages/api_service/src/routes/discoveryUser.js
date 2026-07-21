import { buildCandidatePool, removeuserPreference } from '../services/discoveryFeed.js'
const PAGE_SIZE = 20; // pagination: never return the whole pool in one response

export function registerDiscoveryRoutes(app) {

    // this return a filtered pool of filtered candidate acc to user prefernce

    // first we send raw sql where we filter and select user based on index and filter in database level only
    // Step 1: raw SQL finds WHICH profile IDs qualify (uses indexes, fast,
    //           even with millions of rows - this is the DB-level filtering
    //           we designed for).
    app.get('/discovery/feed', { preHandler: app.authenticate }, async (request, reply) => {

        const page = Math.max(1, Number(request.query.page || 1))
        const ownProfile = await app.db.profile.findUnique({
            where: { userId: request.userId }
        })
        if (!ownProfile) {
            return reply.code(404).send({ error: 'Create Your profile before discovering others' })
        }

        // once u have a profile u need to extract the prefernce
        const resolvedPrefs = await removeuserPreference(app.db, request.userId, ownProfile)

        // now build the candidate Pool
        const candidatePool = await buildCandidatePool(app.db, {
            userId: request.userId,
            ownProfile,
            prefs,
            page,
            pageSize: PAGE_SIZE,
        })

        if (candidatePool.length === 0) {
            return reply.send({ profiles: [], page, hasMore: false })
        }

        //u get here all ids
        const candidateIds = new candidatePool.map((e) => e.id)
        // this stores element of user profile id in array

        // u get here all profiles 
        const fullProfiles = await app.db.profile.findMany({
            where: { id: { in: candidateIds } },
            include: { photos: { orderBy: { position: 'asc' } } },
        });

        //   it maps the profile id to profile and helps user to get 
        const profileById = new Map(fullProfiles.map((p) => [p.id, p]));

        const orderedProfiles = candidateIds
            .map((id) => profileById.get(id))
            .filter(Boolean) // in case a profile got deleted between step 1 and step 2
            .map((profile) => sanitizeForOtherUsers(profile));

        return reply.send({
            profiles: orderedProfiles,
            page,
            hasMore: candidateRows.length === PAGE_SIZE, // if we got a full page, there's likely more
        })
    })
}

// Never leak fields other users shouldn't see - even though this data lives
// in the Profile table, not everything on it belongs in a response to a
// stranger. This is the enforcement point for the "opt-in, hidden by
// default" religion/caste rule from our schema design.
function sanitizeForOtherUsers(profile) {
    const { religion, caste, showReligionCaste, latitude, longitude, ...safeFields } = profile;

    return {
        ...safeFields,
        // Only include religion/caste in the response if the profile OWNER
        // opted in to showing it - this is enforced again here, not just in
        // the SQL filter, as defense in depth (the filter only controls WHO
        // shows up in results; this controls WHAT gets shown about them).
        ...(showReligionCaste ? { religion, caste } : {}),
    };
}