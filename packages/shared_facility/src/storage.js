import {S3Client, PutObjectCommand , GetObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'

function getS3Clinet(){

    return new S3Client({
        region:process.env.S3_REGION || 'auto',
        endpoint : process.env.S3_ENDPOINT || undefined, //url where ur app send request
        credentials:{
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
    })
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

export async function assignPresignedUploadUrl ({userId , fileExtension,folder}){

    const client = getS3Clinet()
    const key = `${folder}/${userId}/${crypto.randomUUID()}.${fileExtension}`;

    console.log(key)

    // creates an upload req
    const command = new PutObjectCommand({
        Bucket : process.env.S3_BUCKET_NAME,
        Key:key
    })

    // creates cryptographic signed  url 
    const uploadUrl = await getSignedUrl(client , command , {expiresIn : 300})

    const publicUrl = process.env.S3_PUBLIC_URL ? `${process.env.S3_PUBLIC_URL}/${key} ` : key
    return { uploadUrl, key, publicUrl };
}

// For private objects (like a raw selfie you don't want publicly guessable),
// generate a short-lived READ url instead of relying on a permanently public bucket.
export async function generatePresignedReadUrl(key, expiresInSeconds = 300) {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }
  