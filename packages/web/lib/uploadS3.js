import { api } from './api'

/* here we try to get the upload url for s3 and then with that upload url we put that image in s3 */

// Allowed file types for upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function presignAndUpload({ file, presignPath, confirmPath, extraConfirmFields = {} }) {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum size is 5MB')
    }

    const fileExtension = file.name.split('.').pop().toLowerCase()

    const { uploadUrl, key, publicUrl } = await api.post(presignPath, { fileExtension })

    /* fetch the given upload url and post */
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
    })

    if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed. Please try again')
    }

    /* confirmPath is another endpoint which tells backend that upload success.. Then backend create a db save record */
    if (confirmPath) {
        await api.post(confirmPath, { key, publicUrl, ...extraConfirmFields })
    }

    return { key, publicUrl }
}