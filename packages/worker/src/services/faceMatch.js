// placeholder

import { RekognitionClient, CompareFacesCommand, DetectFacesCommand } from '@aws-sdk/client-rekognition'
import { generatePresignedReadUrl } from '@dating-app/shared'

export async function compareFaces(selfieKey , profilePhotoKey){

    const client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1',
        ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            }
            : !process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
                ? {
                    credentials: {
                        accessKeyId: process.env.S3_ACCESS_KEY_ID,
                        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
                    },
                }
                : {}),
    })

    const loadImage = async (key) => {
        const response = await fetch(await generatePresignedReadUrl(key))
        if (!response.ok) {
            throw new Error(`Unable to read verification image: ${response.status}`)
        }
        return Buffer.from(await response.arrayBuffer())
    }

    const [selfieBytes, profilePhotoBytes] = await Promise.all([
        loadImage(selfieKey),
        loadImage(profilePhotoKey),
    ])

    const faceCheck = async (bytes) => {
        const response = await client.send(new DetectFacesCommand({
            Image: { Bytes: bytes },
            Attributes: ['DEFAULT'],
        }))
        const faces = response.FaceDetails ?? []
        return faces.length === 1 && (faces[0].Confidence ?? 0) >= 90
    }

    const [validSelfie, validProfilePhoto] = await Promise.all([
        faceCheck(selfieBytes),
        faceCheck(profilePhotoBytes),
    ])

    if (!validSelfie || !validProfilePhoto) {
        return { matchScore: 0, noFaceDetected: true }
    }

    const command = new CompareFacesCommand({
        SourceImage: { Bytes: selfieBytes },
        TargetImage: { Bytes: profilePhotoBytes },
        SimilarityThreshold: 80,
    })

    let result = null
    try{
        result = await client.send(command)
    }catch(error){

        if(error.name === 'InvalidParameterException'){
            return {matchScore : 0 , noFaceDetected:true}
        }
        throw error
    }

    const bestMatch = result.FaceMatches?.[0]
    const matchScore = bestMatch ? bestMatch.Similarity / 100 : 0; // Rekognition returns 0-100, we normalize to 0-1

    return { matchScore, noFaceDetected: false };
}