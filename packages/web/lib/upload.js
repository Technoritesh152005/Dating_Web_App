import {api} from './api'

export async function presignAndUpload({file, presignPath , confirmPath , extraConfirmFields={}}){

    const fileExtension = file.name.split('.').pop().toLowerCase()

    const {uploadUrl , key , publicUrl} = await api.post(presignPath , {fileExtension})

    const uploadResponse = await fetch(uploadUrl, {
        method:'PUT',
        headers:{'Content-Type': file.type},
        body:file
    })

    if(!uploadResponse.ok){
        throw new Error('Failed to upload in storage - Please try again')
    }
    //confirm path is given by comp where it is a path to state that upload has been succeeed and do some operation like in path media/photots/confirm store the image metadata in db
    if(confirmPath){
        await api.post(confirmPath, {key,publicUrl,...extraConfirmFields})
    }

    return {key,publicUrl}

}