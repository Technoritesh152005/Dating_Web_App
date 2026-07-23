// placeholder

import {RekognitionClient , CompareFacesCommand} from '@aws-sdk/client-rekognition'

// WHY S3Object REFERENCES INSTEAD OF DOWNLOADING BYTES:
// Rekognition can read directly from S3 if the IAM identity making the API
// call has s3:GetObject permission on that bucket - so the worker process
// never downloads the selfie/photo itself, never holds image bytes in
// memory, and never re-uploads them anywhere. This is the efficiency point
// flagged earlier: a naive implementation would fetch both images via HTTP,
// base64-encode them, and send the bytes in the API request - slower, more
// memory pressure, and an unnecessary round trip through your own server
// for data that's already sitting in S3.

export async function compareFaces(selfieKey , profilePhotoKey){

    const client = new RekognitionClient({region:process.env.AWS_REGION || 'us-east-1'})
    const bucket = process.env.S3_BUCKET_NAME

    const command = new CompareFacesCommand({
        SourceImage : {S3Object : {Bucket:bucket , Name:selfieKey}},
        TargetImage :{S3Object : {Bucket:bucket , Name:profilePhotoKey}},
        SimilarityThreshold: 0,  // we want the raw score back, not Rekognition's own pass/fail cutoff -
    })

    let result = null
    try{
        result = await client.send(command)
    }catch(error){

        if(error.name = 'InvalidParameterException'){
            return {matchScore : 0 , noFaceDetected:true}
        }
        throw err
    }

    console.log(result)
    const bestMatch = result.FaceMatches?.[0]
    const matchScore = bestMatch ? bestMatch.Similarity / 100 : 0; // Rekognition returns 0-100, we normalize to 0-1

    return { matchScore, noFaceDetected: false };
}