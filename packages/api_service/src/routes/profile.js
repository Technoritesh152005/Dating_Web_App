// Profile upload routes
// for profile based update routes a middleware is required means all must be login that is app.authenticate

const VALID_GENDER = ['MALE', 'FEMALE', 'NON-BINARY', 'OTHER', 'PREFERED NOT TO SAY']
const VALID_PROFESSION = ['STUDENT', 'ENGINEER', 'DOCTOR', 'BUSINESS', 'GOVERNMENT', 'ARTIST', 'OTHER']

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
        if (!profession && !VALID_PROFESSION.includes(profession)) {
            return reply.code(400).send({ error: "Please select profession based on one of them : ${VALID_PROFESSIONS.join(', ')}` }" })
        }

        const ageCalculate = calculateAge(dateOfBirth)
        if (ageCalculate < 18) {
            return reply.code(400).send({ error: 'You must be 18 or Older than it to use the app' })
        }


        // prisma has a method known upsert/
        // if record exist update else create

        const profile = await app.db.profile.upsert({
            // search whether user exist
            where: { userId: request.userId },
            // if exist update
            update: {
                displayName,
                dateOfBirth: new Date(dateOfBirth),
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
                dateOfBirth: new Date(dateOfBirth),
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
            // SetSrid tells its an geographic location
            SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}) , 4326):: geography // geography is a casting which tells convert hthese datatype to geometry point
            WHERE id = ${profile.id}::uuid
            `
        }
        return reply.code(201).send(profile)
    })

    app.get('/profile/me', { preHandler: app.authenticate }, async (request, reply) => {

        const profile = await app.db.profile.findUnique({
            where: {
                userId: request.userId
            },
            include: {
                photos: { orderBy: { position: 'asc' } }
            },
        })

        if (!profile) {
            return reply.code(404).send({ error: "Profile ot Created" })
        }
        return reply.send(profile);

    })
}

function calculateAge(dob) {
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    console.log(ageDate)
    return Math.abs(ageDate.getUTCFullYear - 1970)
}
