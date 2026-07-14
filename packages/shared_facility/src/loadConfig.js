import dotenv from 'dotenv'
const REQ_VAR = ['DATABASE_URL','REDIS_URL']

// when the app starts it checks once whether the env variabe of db and redis r available
export function loadConfig(serviceName){

    // in this array check each filter whether they r present in .env
const missing = REQ_VAR.filter((key) => !process.env[key] )

if (missing.length >0){
    console.error(`${serviceName} Missing env variable ${missing}`)
}
process.exit(1)
}

return {
nodeEnv : process.env.NODE_ENV ||'development'
databaseUrl : process.env.DATABASE_URL
redisUrl : process.env.REDIS_URL
apiPort: Number(process.env.API_PORT) || 4000
realtimePort: Number(process.env.REALTIME_PORT) || 4001,
jwtSecret: process.env.JWT_SECRET 
}