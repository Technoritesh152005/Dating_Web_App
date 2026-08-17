import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'node:crypto'
const REQ_VAR = ['DATABASE_URL','REDIS_URL']

// Minimum requirements for JWT secret
const MIN_JWT_SECRET_LENGTH = 32
const SUPPORTED_SECRET_VERSIONS = ['v1', 'v2']

function loadDotEnvFromNearestParent(){
let currentDir = process.cwd()

while (true){
const envPath = path.join(currentDir, '.env')

if (fs.existsSync(envPath)){
dotenv.config({ path: envPath })
return
}

const parentDir = path.dirname(currentDir)
if (parentDir === currentDir){
return
}

currentDir = parentDir
}
}

// Validates JWT secret strength and supports rotation via versioned secrets
function validateAndResolveJwtSecret(serviceName) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
        console.error(`${serviceName}: JWT_SECRET is required`)
        process.exit(1)
    }

    // Check length requirement (entropy)
    if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
        console.error(`${serviceName}: JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long for security`)
        process.exit(1)
    }

    // Check for sufficient entropy (not all same characters)
    const uniqueChars = new Set(jwtSecret).size
    if (uniqueChars < 16) {
        console.error(`${serviceName}: JWT_SECRET has insufficient entropy. Use a cryptographically random value.`)
        process.exit(1)
    }

    // Support for secret rotation: JWT_SECRET can be a comma-separated list of versioned secrets
    // Format: "v1:secret1,v2:secret2" - the first is the active signing key
    const secrets = jwtSecret.split(',').map(s => s.trim()).filter(Boolean)
    const parsedSecrets = {}
    for (const secretEntry of secrets) {
        const [version, ...rest] = secretEntry.split(':')
        const secretValue = rest.join(':')
        if (!version || !secretValue) {
            console.error(`${serviceName}: Invalid JWT_SECRET format. Expected "v1:secret,v2:secret2"`)
            process.exit(1)
        }
        if (!SUPPORTED_SECRET_VERSIONS.includes(version)) {
            console.error(`${serviceName}: Unsupported JWT secret version ${version}. Supported: ${SUPPORTED_SECRET_VERSIONS.join(', ')}`)
            process.exit(1)
        }
        parsedSecrets[version] = secretValue
    }

    // Return the active secret (v1 is preferred for signing) and all versions for verification
    const activeSecret = parsedSecrets['v1'] || Object.values(parsedSecrets)[0]
    return {
        activeSecret,
        allSecrets: parsedSecrets,
    }
}

// when the app starts it checks once whether the env variabe of db and redis r available
export function loadConfig(serviceName){
loadDotEnvFromNearestParent()

    // in this array check each filter whether they r present in .env
const missing = REQ_VAR.filter((key) => !process.env[key] )

if (missing.length >0){
    console.error(`${serviceName} Missing env variable ${missing}`)
process.exit(1)
}

const { activeSecret, allSecrets } = validateAndResolveJwtSecret(serviceName)

return {
nodeEnv : process.env.NODE_ENV ||'development',
databaseUrl : process.env.DATABASE_URL,
redisUrl : process.env.REDIS_URL,
apiPort: Number(process.env.API_PORT) || 4000,
realtimePort: Number(process.env.REALTIME_PORT) || 4001,
jwtSecret: activeSecret,
jwtSecrets: allSecrets,
googleClientId:process.env.GOOGLE_CLIENT_ID,
corsOrigin: process.env.CORS_ORIGIN
}
}
