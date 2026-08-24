const VALID_GENDERS= ['MALE','FEMALE','NON_BINARY','OTHER']
const VALID_PROFESSIONS= ['STUDENT', 'ENGINEER', 'DOCTOR', 'BUSINESS', 'GOVERNMENT', 'ARTIST', 'OTHER'];
const VALID_LOOKING_FOR = [
  'SHORT_TERM',
  'LONG_TERM',
  'CASUAL_DATING',
  'SERIOUS_RELATIONSHIP',
  'FRIENDSHIP',
  'NEW_CONNECTIONS',
  'OPEN_TO_ANYTHING',
  'NOT_SURE_YET',
  'JUST_CHAT',
  'COFFEE_DATE',
  'ADVENTURE_BUDDY',
  'TRAVEL_BUDDY',
  'GAMING_BUDDY',
  'FREE_TONIGHT',
];
export function registerPreferencesRoutes(app){

    app.put('/preferences', {preHandler:app.authenticate, config:{ authenticated: true }}, async(request,reply)=>{

        const {
            minAge,
            maxAge,
            maxDistanceKm,
            genderPreference,
            professionFilter,
            religionFilter,
            casteFilter,
            lookingFor
        }= request.body?? {}

        if (minAge != null && maxAge != null && minAge > maxAge) {
            return reply.code(400).send({ error: 'minAge cannot be greater than maxAge' });
          }
          if (genderPreference && !genderPreference.every((g) => VALID_GENDERS.includes(g))) {
            return reply.code(400).send({ error: `genderPreference values must be one of: ${VALID_GENDERS.join(', ')}` });
          }
          if (professionFilter && !professionFilter.every((p) => VALID_PROFESSIONS.includes(p))) {
            return reply.code(400).send({ error: `professionFilter values must be one of: ${VALID_PROFESSIONS.join(', ')}` });
          }
          if(lookingFor && (Array.isArray(loookingFor)) && !loookingFor.every((l) => VALID_LOOKING_FOR.includes(l))){
            return reply.code(400).send({error:
              'Lookingfor value must be: '`${VALID_LOOKING_FOR.join(', ')}`
            })
          }
        //   only whose details r present they appear in data as key value pair
          const data = {
            ...(minAge != null && {minAge}),
            ...(maxAge != null  && { maxAge}),
            ...(maxDistanceKm != null && { maxDistanceKm }),
            ...(genderPreference && { genderPreference }),
            ...(professionFilter && { professionFilter }),
            ...(religionFilter && { religionFilter }),
            ...(casteFilter && { casteFilter }),
             ...(lookingFor && { lookingFor }),
          }

        //   upsert means if record exist update else create
          const prefernce = await app.db.preference.upsert({
            where:{userId : request.userId},
            update: data,
            create:{
                userId: request.userId,
                minAge: minAge ?? 18,
                maxAge: maxAge ?? 99,
                maxDistanceKm: maxDistanceKm ?? 50,
                genderPreference: genderPreference ?? [],
                professionFilter: professionFilter ?? [],
                religionFilter: religionFilter ?? [],
                casteFilter: casteFilter ?? [],  
                lookingFor: lookingFor ?? []
            }

          })

          return reply.send(prefernce)
    })

    app.get('/preferences',{preHandler:app.authenticate},async(request , reply)=>{

      const prefernce = await app.db.preference.findUnique({
        where:{userId: request.userId}
      })

      if(!prefernce){
        return reply.send({usingDefaults:true})
      }
      return reply.send(prefernce)
    })
}