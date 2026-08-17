import {S3Client, PutObjectCommand , GetObjectCommand, DeleteObjectCommand, HeadObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'

function getS3Clinet(){

    const usingR2Credentials = process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    return new S3Client({
        region:process.env.S3_REGION || process.env.AWS_REGION ||'auto',
        endpoint : process.env.S3_ENDPOINT || undefined, //url where ur app send request
       ...(usingR2Credentials && {
        credentials:{
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey : process.env.S3_SECRET_ACCESS_KEY
        }
       })
    })
}
// it sanitize or makes the path name safe
function sanitizePathSegment(value, fieldName) {
    const safeValue = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '')
    if (!safeValue) {
        throw new Error(`${fieldName} is required`)
    }
    return safeValue
}

function requireBucketName() {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is required')
    }
    return process.env.S3_BUCKET_NAME
}


// Geneating presigned Url
// WHY PRESIGNED URLS (this is the important design decision):
// The naive approach is: client sends the file bytes to YOUR api server,
// api server forwards them to S3. That means every photo/selfie upload
// ties up an API server connection for the whole upload duration - at
// scale, with thousands of concurrent uploads, that's a bottleneck and a
// waste of your API server's resources on something that isn't "API work."
//
// Instead: api server just generates a short-lived, single-use signed URL.
// The CLIENT uploads the file bytes directly to S3/R2 using that URL. Your
// API server is only involved for a split second to generate the permission
// slip - never touches the actual file bytes.

export async function generatePresignedUploadUrl ({userId , fileExtension,folder}){

    const client = getS3Clinet()
    const safeFolder = sanitizePathSegment(folder, 'folder')
    const safeExtension = sanitizePathSegment(fileExtension, 'fileExtension').toLowerCase()
    const key = `${safeFolder}/${userId}/${crypto.randomUUID()}.${safeExtension}`;

    // creates an upload req
    const command = new PutObjectCommand({
        Bucket : requireBucketName(),
        Key:key
    })

    // creates cryptographic signed  url 
    const uploadUrl = await getSignedUrl(client , command , {expiresIn : 300})

    const publicUrl = process.env.S3_PUBLIC_URL ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}` : key
    return { uploadUrl, key, publicUrl };
}

// For private objects (like a raw selfie you don't want publicly guessable),
// generate a short-lived READ url instead of relying on a permanently public bucket.
export async function generatePresignedReadUrl(key, expiresInSeconds = 300) {
    const client = getS3Clinet();
    const command = new GetObjectCommand({
      Bucket: requireBucketName(),
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }
  
/* deleteing s3 image  */
export async function deleteObject(key){
    const client = getS3Clinet()
    const command = new DeleteObjectCommand({
        Bucket:requireBucketName(),
        Key: key
    })
    await client.send(command)
}

/* check if object exists in S3 */
export async function objectExists(key) {
    const client = getS3Clinet()
    const command = new HeadObjectCommand({
        Bucket: requireBucketName(),
        Key: key
    })
    try {
        await client.send(command)
        return true
    } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            return false
        }
        throw err
    }
}

/* get object metadata (size, content type) for validation */
export async function getObjectMetadata(key) {
    const client = getS3Clinet()
    const command = new HeadObjectCommand({
        Bucket: requireBucketName(),
        Key: key
    })
    try {
        const response = await client.send(command)
        return {
            ContentLength: response.ContentLength,
            ContentType: response.ContentType,
        }
    } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            return null
        }
        throw err
    }
}
