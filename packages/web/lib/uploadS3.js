import { api } from './api'

/* here we try to get the upload url for s3 and then with that upload urland we put that image in s3 */
export async function presignAndUpload({ file, presignPath, confirmPath, extraConfirmFields = {} }) {
    const fileExtension = file.name.split('.').pop().toLowerCase()

    const { uploadUrl, key, publicUrl } = await api.post(presignPath, { fileExtension })

    /* fetch the given upload url and post */
    const uploadResponse = await fecth(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
    })

    if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed. Please try again')
    }

    /* confirmPath is another endpoint which tells backend that upload sucess.. Then backend create a db save record */
    if (confirmPath) {
        await api.post(confirmPath, { key, publicUrl, ...extraConfirmFields })
    }

    return { key, publicUrl }
}